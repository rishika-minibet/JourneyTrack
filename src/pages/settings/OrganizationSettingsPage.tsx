import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Lock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { RoleBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FormAlert, SelectField, TextField } from '../../components/ui/Field';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';
import { SettingsTabs } from '../../components/settings/SettingsTabs';
import { useWorkspace } from '../../hooks/useWorkspace';
import { getMembersForOrganization, getProjectsForOrganization, isSlugTaken } from '../../store/selectors';
import { ROLE_LABELS } from '../../lib/permissions';
import { simulateLatency } from '../../lib/browser';
import { emptyToUndefined, isValidSlug, optionalUrlError } from '../../lib/validation';
import { formatDate } from '../../utils/format';

export function OrganizationSettingsPage() {
  const { db, account, organization, role, actions, can } = useWorkspace();
  const navigate = useNavigate();
  const notify = useToast();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const [transferTo, setTransferTo] = useState('');
  const [confirm, setConfirm] = useState<'transfer' | 'delete' | null>(null);

  // Reset the form when switching organizations or after a save.
  useEffect(() => {
    setName(organization?.name ?? '');
    setSlug(organization?.slug ?? '');
    setWebsiteUrl(organization?.websiteUrl ?? '');
    setSubmitted(false);
    setFormError(undefined);
    setTransferTo('');
  }, [organization]);

  if (!organization || !account) return null;

  const canEdit = can('organization.update');
  const isOwner = can('organization.transferOwnership') || can('organization.delete');
  const members = getMembersForOrganization(db, organization.id);
  const transferCandidates = members.filter((member) => member.account.id !== account.id);
  const transferTarget = transferCandidates.find((member) => member.membership.id === transferTo);
  const dirty = name !== organization.name || slug !== organization.slug || websiteUrl !== (organization.websiteUrl ?? '');

  const errors = {
    name: name.trim() ? undefined : 'Organization name is required.',
    slug: !isValidSlug(slug)
      ? 'Use lowercase letters, numbers and single hyphens.'
      : isSlugTaken(db, slug, organization.id)
        ? `"${slug}" is already taken.`
        : undefined,
    websiteUrl: optionalUrlError(websiteUrl),
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setFormError(undefined);
    if (errors.name || errors.slug || errors.websiteUrl) return;
    setSaving(true);
    await simulateLatency(300);
    const result = actions.updateOrganization(organization.id, { name, slug, websiteUrl: emptyToUndefined(websiteUrl) });
    setSaving(false);
    if (!result.ok) setFormError(result.error);
    else notify('Organization settings saved.');
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Settings" description={`Manage ${organization.name}.`} />
      <SettingsTabs />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <Card title="General">
          <form onSubmit={save} noValidate className="flex flex-col gap-4 px-5 pb-5">
            {!canEdit && (
              <FormAlert tone="info">
                <span className="inline-flex items-center gap-1.5">
                  <Lock size={14} /> Only Owners and Admins can edit organization details.
                </span>
              </FormAlert>
            )}
            {formError && <FormAlert>{formError}</FormAlert>}
            <TextField
              label="Organization name"
              value={name}
              disabled={!canEdit}
              onChange={(event) => setName(event.target.value)}
              error={submitted ? errors.name : undefined}
            />
            <TextField
              label="Organization slug"
              value={slug}
              disabled={!canEdit}
              onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/\s+/g, '-'))}
              error={slug !== organization.slug || submitted ? errors.slug : undefined}
              hint={<>app.journeytrack.dev/{slug}</>}
            />
            <TextField
              label="Website"
              optional
              type="url"
              value={websiteUrl}
              disabled={!canEdit}
              placeholder="https://example.com"
              onChange={(event) => setWebsiteUrl(event.target.value)}
              error={submitted ? errors.websiteUrl : undefined}
            />
            {canEdit && (
              <div className="flex justify-end">
                <Button type="submit" loading={saving} disabled={!dirty}>
                  Save changes
                </Button>
              </div>
            )}
          </form>
        </Card>

        <Card title="Organization info">
          <dl className="px-5 pb-3 text-sm">
            {[
              ['Organization ID', <code className="font-mono text-xs">{organization.id}</code>],
              ['Created', formatDate(organization.createdAt)],
              ['Members', members.length],
              ['Projects', getProjectsForOrganization(db, organization.id).length],
              ['Your role', role ? <RoleBadge role={role} /> : '—'],
            ].map(([label, value]) => (
              <div key={String(label)} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 border-t border-line py-2.5">
                <dt className="text-muted">{label}</dt>
                <dd className="break-all text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      {isOwner && (
        <section className="mt-6 rounded-xl border border-rose-200 bg-white shadow-sm" aria-labelledby="danger-zone">
          <h2 id="danger-zone" className="flex items-center gap-2 px-5 pt-5 pb-3 text-base font-semibold text-rose-700">
            <AlertTriangle size={18} /> Danger zone
          </h2>
          <div className="flex flex-col gap-4 border-t border-rose-100 px-5 py-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-md">
              <h3 className="text-sm font-semibold text-ink">Transfer ownership</h3>
              <p className="text-sm text-muted">
                The new owner gets full control. You will become an Admin of {organization.name}.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <SelectField
                label="New owner"
                value={transferTo}
                onChange={(event) => setTransferTo(event.target.value)}
                fieldClassName="sm:w-64"
                disabled={transferCandidates.length === 0}
              >
                <option value="">{transferCandidates.length ? 'Select a member…' : 'No other members'}</option>
                {transferCandidates.map((member) => (
                  <option key={member.membership.id} value={member.membership.id}>
                    {member.account.name} ({ROLE_LABELS[member.membership.role]})
                  </option>
                ))}
              </SelectField>
              <Button variant="secondary" disabled={!transferTarget} onClick={() => setConfirm('transfer')}>
                Transfer
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-4 border-t border-rose-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-md">
              <h3 className="text-sm font-semibold text-ink">Delete organization</h3>
              <p className="text-sm text-muted">
                Permanently removes {organization.name} with all of its projects, environments, members and invitations.
              </p>
            </div>
            <Button variant="danger" onClick={() => setConfirm('delete')}>
              Delete organization
            </Button>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={confirm === 'transfer'}
        title="Transfer ownership?"
        tone="primary"
        description={
          transferTarget && (
            <>
              <strong className="text-ink">{transferTarget.account.name}</strong> will become the Owner of {organization.name}.
              You will become an Admin and lose access to ownership transfer and deletion.
            </>
          )
        }
        confirmationText={organization.slug}
        confirmLabel="Transfer ownership"
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (!transferTarget) return;
          await simulateLatency(400);
          const result = actions.transferOwnership(organization.id, transferTarget.membership.id);
          setConfirm(null);
          notify(result.ok ? `${transferTarget.account.name} is now the Owner.` : result.error, result.ok ? 'success' : 'error');
        }}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title={`Delete ${organization.name}?`}
        description="This cannot be undone. All projects, environments, SDK keys, memberships and invitations of this organization will be removed from the prototype."
        confirmationText={organization.slug}
        confirmLabel="Delete organization"
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          await simulateLatency(400);
          const result = actions.deleteOrganization(organization.id);
          setConfirm(null);
          if (!result.ok) {
            notify(result.error, 'error');
            return;
          }
          notify(`${organization.name} was deleted.`);
          navigate('/overview', { replace: true });
        }}
      />
    </div>
  );
}
