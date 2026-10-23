import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, RotateCcw, Settings } from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { Avatar } from '../ui/Avatar';
import { Badge, EnvironmentBadge, RoleBadge } from '../ui/Badge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { DropdownMenu } from '../ui/DropdownMenu';
import { useToast } from '../ui/Toast';

/** Keeps the active organization → project → environment visible on every page. */
export function TopBar() {
  const { organization, project, environment, role } = useWorkspace();

  return (
    <div className="mb-6 flex items-center justify-between gap-3 border-b border-line pb-4">
      <nav aria-label="Current context" className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
        <span className="truncate font-medium text-ink">{organization?.name}</span>
        <ChevronRight size={14} className="shrink-0 text-muted" aria-hidden />
        <span className="truncate text-ink">{project?.name ?? <span className="text-muted">No project</span>}</span>
        <ChevronRight size={14} className="shrink-0 text-muted" aria-hidden />
        {environment ? (
          <EnvironmentBadge name={environment.name} type={environment.type} />
        ) : (
          <span className="text-muted">No environment</span>
        )}
        {role && (
          <span className="ml-2 hidden sm:inline-flex">
            <RoleBadge role={role} />
          </span>
        )}
      </nav>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden lg:inline-flex" title="All data in this prototype is dummy data stored in your browser.">
          <Badge tone="amber">Prototype · mock data</Badge>
        </span>
        <UserMenu />
      </div>
    </div>
  );
}

function UserMenu() {
  const { account, actions } = useWorkspace();
  const navigate = useNavigate();
  const notify = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  if (!account) return null;

  return (
    <>
      <DropdownMenu
        label="Account menu"
        triggerClassName="rounded-full focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        trigger={<Avatar name={account.name} />}
        menuClassName="w-64"
        header={
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{account.name}</p>
            <p className="truncate text-xs text-muted">{account.email}</p>
          </div>
        }
        items={[
          {
            key: 'settings',
            icon: <Settings size={16} />,
            label: 'Organization settings',
            onSelect: () => navigate('/settings/organization'),
          },
          {
            key: 'reset',
            icon: <RotateCcw size={16} />,
            label: 'Reset demo data',
            onSelect: () => setConfirmReset(true),
          },
          {
            key: 'logout',
            icon: <LogOut size={16} />,
            label: 'Log out',
            separatorBefore: true,
            onSelect: () => {
              actions.logout();
              navigate('/login');
            },
          },
        ]}
      />
      <ConfirmDialog
        open={confirmReset}
        title="Reset demo data?"
        description="All organizations, projects, environments, members and invitations you created or changed in this browser will be replaced with the original seed data."
        confirmLabel="Reset data"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          actions.resetDemoData();
          setConfirmReset(false);
          notify('Demo data reset.');
          navigate('/overview');
        }}
      />
    </>
  );
}
