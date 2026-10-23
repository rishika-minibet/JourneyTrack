import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Copy } from 'lucide-react';
import type { Environment, EnvironmentType, Organization, Project } from '../../types/account';
import { useWorkspace } from '../../hooks/useWorkspace';
import { copyToClipboard, maskKey, simulateLatency } from '../../lib/browser';
import { getEventsForEnvironment } from '../../data/events';
import { getUsersForEnvironment } from '../../data/users';
import { formatDateTime } from '../../utils/format';
import { Badge, ENVIRONMENT_TYPE_LABELS, EnvironmentBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FormAlert, SelectField, TextField } from '../ui/Field';
import { Modal, ModalFooter } from '../ui/Modal';
import { useToast } from '../ui/Toast';

interface EnvironmentFormDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project;
  /** Rename this environment; omit to create a new one. */
  environment?: Environment;
}

export function EnvironmentFormDialog({ open, onClose, project, environment }: EnvironmentFormDialogProps) {
  const { actions } = useWorkspace();
  const notify = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState<EnvironmentType>('development');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(environment?.name ?? '');
    setType(environment?.type ?? 'development');
    setError(undefined);
  }, [open, environment]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Environment name is required.');
      return;
    }
    setSaving(true);
    await simulateLatency(300);
    const result = environment
      ? actions.renameEnvironment(environment.id, name)
      : actions.createEnvironment(project.id, { name, type });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    notify(environment ? `Renamed to ${result.value.name}.` : `${result.value.name} created with a new mock SDK key.`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={environment ? 'Rename environment' : 'Create environment'}
      description={environment ? undefined : `Adds an environment with its own ID and mock SDK key to ${project.name}.`}
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Name"
          value={name}
          placeholder="STAGING"
          autoFocus
          maxLength={24}
          onChange={(event) => setName(event.target.value)}
          error={error}
          hint="Names are shown in uppercase, e.g. DEV, STAGING, PROD."
        />
        {!environment && (
          <SelectField label="Type" value={type} onChange={(event) => setType(event.target.value as EnvironmentType)}>
            {(Object.keys(ENVIRONMENT_TYPE_LABELS) as EnvironmentType[]).map((option) => (
              <option key={option} value={option}>
                {ENVIRONMENT_TYPE_LABELS[option]}
              </option>
            ))}
          </SelectField>
        )}
        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {environment ? 'Save' : 'Create environment'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export function useCopyKey() {
  const notify = useToast();
  return async (value: string) => {
    const copied = await copyToClipboard(value);
    notify(copied ? 'Mock SDK key copied to clipboard.' : 'Could not access the clipboard.', copied ? 'success' : 'error');
  };
}

interface EnvironmentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  environment?: Environment;
  project: Project;
  organization: Organization;
}

export function EnvironmentDetailsDialog({ open, onClose, environment, project, organization }: EnvironmentDetailsDialogProps) {
  const { can } = useWorkspace();
  const copyKey = useCopyKey();
  if (!environment) return null;

  const canViewKeys = can('environments.viewKeys');
  const rows: [string, ReactNode][] = [
    ['Environment ID', <code className="font-mono text-xs">{environment.id}</code>],
    ['Type', ENVIRONMENT_TYPE_LABELS[environment.type]],
    ['Project', `${project.name} (${project.id})`],
    ['Organization', organization.name],
    ['Created', formatDateTime(environment.createdAt)],
    ['Tracked users', getUsersForEnvironment(environment.id).length],
    ['Events', getEventsForEnvironment(environment.id).length],
    [
      'SDK key status',
      <Badge tone={environment.sdkKey.status === 'active' ? 'green' : 'rose'}>
        {environment.sdkKey.status === 'active' ? 'Active' : 'Revoked'}
      </Badge>,
    ],
    ['Key created', formatDateTime(environment.sdkKey.createdAt)],
  ];
  if (environment.sdkKey.revokedAt) rows.push(['Key revoked', formatDateTime(environment.sdkKey.revokedAt)]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`${environment.name} environment`}
      description={<EnvironmentBadge name={environment.name} type={environment.type} />}
    >
      <dl className="text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 border-t border-line py-2.5">
            <dt className="text-muted">{label}</dt>
            <dd className="break-all text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4">
        <h3 className="mb-2 text-sm font-medium text-ink">SDK key</h3>
        {canViewKeys ? (
          <div className="flex items-center gap-2">
            <code
              className={`min-w-0 flex-1 truncate rounded-lg border border-line bg-slate-50 px-3 py-2 font-mono text-xs ${
                environment.sdkKey.status === 'revoked' ? 'text-muted line-through' : 'text-ink'
              }`}
            >
              {environment.sdkKey.value}
            </code>
            <Button
              variant="secondary"
              size="sm"
              icon={<Copy size={14} />}
              onClick={() => copyKey(environment.sdkKey.value)}
              disabled={environment.sdkKey.status === 'revoked'}
            >
              Copy
            </Button>
          </div>
        ) : (
          <FormAlert tone="info">
            SDK keys are visible to Owners and Admins only. <span className="font-mono">{maskKey(environment.sdkKey.value)}</span>
          </FormAlert>
        )}
        <p className="mt-2 text-xs text-muted">
          Mock value for UI prototyping — not a real secret and not accepted by any SDK.
        </p>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}
