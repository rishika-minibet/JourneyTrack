import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, Copy, Eye, KeyRound, Layers, MoreHorizontal, Pencil, Plus, RefreshCw, Target } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge, ENVIRONMENT_TYPE_LABELS, EnvironmentBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DropdownMenu, type MenuItem } from '../../components/ui/DropdownMenu';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import {
  EnvironmentDetailsDialog,
  EnvironmentFormDialog,
  useCopyKey,
} from '../../components/projects/EnvironmentDialogs';
import { ProjectNotFound } from './ProjectDetailsPage';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useSyncActiveProject } from '../../hooks/useSyncActiveProject';
import { getEnvironmentsForProject, getProjectInOrganization } from '../../store/selectors';
import type { Environment } from '../../types/account';
import { maskKey, simulateLatency } from '../../lib/browser';
import { formatDate } from '../../utils/format';

type DialogState =
  | { kind: 'create' }
  | { kind: 'rename'; environment: Environment }
  | { kind: 'details'; environmentId: string }
  | { kind: 'revoke'; environment: Environment }
  | { kind: 'regenerate'; environment: Environment }
  | null;

export function EnvironmentsPage() {
  const { projectId = '' } = useParams();
  const { db, organization, environment: activeEnvironment, actions, can } = useWorkspace();
  const notify = useToast();
  const copyKey = useCopyKey();
  const [dialog, setDialog] = useState<DialogState>(null);

  // Resolve the project inside the active organization only, so another organization's
  // environments can never be listed here.
  const project = organization ? getProjectInOrganization(db, organization.id, projectId) : undefined;
  useSyncActiveProject(project);
  if (!organization || !project) return <ProjectNotFound />;

  const environments = getEnvironmentsForProject(db, project.id);
  const canManage = can('environments.manage');
  const canViewKeys = can('environments.viewKeys');
  const canManageKeys = can('environments.manageKeys');
  const close = () => setDialog(null);

  const menuItems = (env: Environment): MenuItem[] => {
    const items: MenuItem[] = [
      { key: 'details', icon: <Eye size={16} />, label: 'View details', onSelect: () => setDialog({ kind: 'details', environmentId: env.id }) },
      {
        key: 'use',
        icon: <Target size={16} />,
        label: 'Use this environment',
        disabled: env.id === activeEnvironment?.id,
        onSelect: () => {
          actions.selectEnvironment(env.id);
          notify(`Now viewing ${project.name} · ${env.name}.`, 'info');
        },
      },
    ];
    if (canViewKeys) {
      items.push({
        key: 'copy',
        icon: <Copy size={16} />,
        label: 'Copy SDK key',
        disabled: env.sdkKey.status === 'revoked',
        onSelect: () => copyKey(env.sdkKey.value),
      });
    }
    if (canManage) {
      items.push({ key: 'rename', icon: <Pencil size={16} />, label: 'Rename', separatorBefore: true, onSelect: () => setDialog({ kind: 'rename', environment: env }) });
    }
    if (canManageKeys) {
      items.push(
        { key: 'regenerate', icon: <RefreshCw size={16} />, label: 'Regenerate key', separatorBefore: !canManage, onSelect: () => setDialog({ kind: 'regenerate', environment: env }) },
        {
          key: 'revoke',
          icon: <Ban size={16} />,
          label: 'Revoke key',
          danger: true,
          disabled: env.sdkKey.status === 'revoked',
          onSelect: () => setDialog({ kind: 'revoke', environment: env }),
        },
      );
    }
    return items;
  };

  const detailsEnvironment = dialog?.kind === 'details' ? environments.find((env) => env.id === dialog.environmentId) : undefined;

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to={`/projects/${project.id}`}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand hover:bg-brand-light"
      >
        <ArrowLeft size={18} />
        {project.name}
      </Link>
      <div className="mt-2 mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Environments</h1>
          <p className="mt-1 text-sm text-muted">
            {organization.name} · {project.name}. Each environment has its own ID, SDK key and isolated data.
          </p>
        </div>
        {canManage && (
          <Button icon={<Plus size={16} />} onClick={() => setDialog({ kind: 'create' })}>
            Create environment
          </Button>
        )}
      </div>

      <Card>
        {environments.length === 0 ? (
          <EmptyState
            icon={<Layers size={20} />}
            title="No environments yet"
            description="Environment setup was skipped. Create DEV and PROD to get mock SDK keys."
            action={
              canManage && (
                <Button icon={<Plus size={16} />} onClick={() => setDialog({ kind: 'create' })}>
                  Create environment
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-line bg-slate-50 text-xs font-medium tracking-wide text-muted uppercase">
                  <th className="px-5 py-3">Environment</th>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Mock SDK key</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {environments.map((env) => (
                  <tr key={env.id} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2">
                        <EnvironmentBadge name={env.name} type={env.type} />
                        <span className="text-muted">{ENVIRONMENT_TYPE_LABELS[env.type]}</span>
                        {env.id === activeEnvironment?.id && <Badge tone="slate">Viewing</Badge>}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">{env.id}</td>
                    <td className="px-5 py-3 text-muted">{formatDate(env.createdAt)}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2">
                        <KeyRound size={14} className="text-muted" />
                        {canViewKeys && (
                          <code className={`font-mono text-xs ${env.sdkKey.status === 'revoked' ? 'text-muted line-through' : 'text-ink'}`}>
                            {maskKey(env.sdkKey.value)}
                          </code>
                        )}
                        <Badge tone={env.sdkKey.status === 'active' ? 'green' : 'rose'}>
                          {env.sdkKey.status === 'active' ? 'Active' : 'Revoked'}
                        </Badge>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <DropdownMenu label={`Actions for ${env.name}`} trigger={<MoreHorizontal size={18} />} items={menuItems(env)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="mt-3 text-xs text-muted">
        SDK keys on this page are mock values for prototyping. They are not secrets and are not generated securely.
      </p>

      <EnvironmentFormDialog
        open={dialog?.kind === 'create' || dialog?.kind === 'rename'}
        project={project}
        environment={dialog?.kind === 'rename' ? dialog.environment : undefined}
        onClose={close}
      />
      <EnvironmentDetailsDialog
        open={dialog?.kind === 'details'}
        environment={detailsEnvironment}
        project={project}
        organization={organization}
        onClose={close}
      />
      <ConfirmDialog
        open={dialog?.kind === 'revoke'}
        title="Revoke SDK key?"
        description={
          dialog?.kind === 'revoke' && (
            <>
              The {dialog.environment.name} key will stop being accepted immediately (in a real deployment). Sites using it
              will stop sending events until you regenerate a key.
            </>
          )
        }
        confirmLabel="Revoke key"
        onCancel={close}
        onConfirm={async () => {
          if (dialog?.kind !== 'revoke') return;
          await simulateLatency(300);
          const result = actions.revokeSdkKey(dialog.environment.id);
          notify(result.ok ? `${dialog.environment.name} key revoked.` : result.error, result.ok ? 'success' : 'error');
          close();
        }}
      />
      <ConfirmDialog
        open={dialog?.kind === 'regenerate'}
        title="Regenerate SDK key?"
        tone="primary"
        description={
          dialog?.kind === 'regenerate' && (
            <>A new mock key will be issued for {dialog.environment.name}. The current key will be replaced and stop working.</>
          )
        }
        confirmLabel="Regenerate key"
        onCancel={close}
        onConfirm={async () => {
          if (dialog?.kind !== 'regenerate') return;
          await simulateLatency(300);
          const result = actions.regenerateSdkKey(dialog.environment.id);
          notify(result.ok ? `New ${dialog.environment.name} key issued.` : result.error, result.ok ? 'success' : 'error');
          close();
        }}
      />
    </div>
  );
}
