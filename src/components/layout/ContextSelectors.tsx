import { useId } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronsUpDown, Plus } from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { ROLE_LABELS } from '../../lib/permissions';
import { DropdownMenu } from '../ui/DropdownMenu';
import { selectClasses } from '../ui/Field';

// Detail routes are scoped to one organization/environment; leave them when the context changes.
function useLeaveScopedRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  return (scope: 'organization' | 'project' | 'environment') => {
    const path = location.pathname;
    if (path.startsWith('/users/')) navigate('/users');
    else if (scope !== 'environment' && path.startsWith('/projects/')) navigate('/projects');
  };
}

function OrgMark({ name }: { name: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-sm font-semibold text-white">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function OrganizationSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const { organizations, organization, role, actions } = useWorkspace();
  const navigate = useNavigate();
  const leaveScopedRoute = useLeaveScopedRoute();
  if (!organization) return null;

  return (
    <DropdownMenu
      label={`Organization: ${organization.name}. Switch organization`}
      align="left"
      menuClassName="w-full min-w-56"
      triggerClassName="flex w-full items-center gap-3 rounded-lg border border-line bg-white p-2 text-left hover:bg-slate-50"
      trigger={
        <>
          <OrgMark name={organization.name} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">{organization.name}</span>
            {role && <span className="block text-xs text-muted">{ROLE_LABELS[role]}</span>}
          </span>
          <ChevronsUpDown size={16} className="shrink-0 text-muted" />
        </>
      }
      header={<p className="text-xs font-medium tracking-wide text-muted uppercase">Organizations</p>}
      items={[
        ...organizations.map(({ organization: org, membership }) => ({
          key: org.id,
          checked: org.id === organization.id,
          label: (
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate">{org.name}</span>
              <span className="text-xs text-muted">{ROLE_LABELS[membership.role]}</span>
            </span>
          ),
          onSelect: () => {
            if (org.id === organization.id) return;
            actions.selectOrganization(org.id);
            leaveScopedRoute('organization');
            onNavigate?.();
          },
        })),
        {
          key: 'create',
          separatorBefore: true,
          icon: <Plus size={16} />,
          label: 'Create organization',
          onSelect: () => {
            onNavigate?.();
            navigate('/onboarding?new=1');
          },
        },
      ]}
    />
  );
}

export function ProjectSelector() {
  const { projects, project, actions, can } = useWorkspace();
  const id = useId();
  const location = useLocation();
  const navigate = useNavigate();
  const leaveScopedRoute = useLeaveScopedRoute();

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="px-1 text-xs font-medium tracking-wide text-muted uppercase">
        Project
      </label>
      {project ? (
        <select
          id={id}
          value={project.id}
          onChange={(event) => {
            const nextId = event.target.value;
            actions.selectProject(nextId);
            if (location.pathname.startsWith('/projects/')) {
              navigate(location.pathname.endsWith('/environments') ? `/projects/${nextId}/environments` : `/projects/${nextId}`);
            } else {
              leaveScopedRoute('project');
            }
          }}
          className={selectClasses}
        >
          {projects.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name}
            </option>
          ))}
        </select>
      ) : (
        <p className="px-1 text-sm text-muted">
          No projects yet.{' '}
          {can('projects.manage') && (
            <Link to="/projects?create=1" className="font-medium text-brand hover:underline">
              Create one
            </Link>
          )}
        </p>
      )}
    </div>
  );
}

export function EnvironmentSelector() {
  const { project, environments, environment, actions, can } = useWorkspace();
  const leaveScopedRoute = useLeaveScopedRoute();
  if (!project) return null;

  return (
    <div className="flex flex-col gap-1">
      <span id="environment-selector-label" className="px-1 text-xs font-medium tracking-wide text-muted uppercase">
        Environment
      </span>
      {environments.length === 0 ? (
        <p className="px-1 text-sm text-muted">
          No environments.{' '}
          {can('environments.manage') && (
            <Link to={`/projects/${project.id}/environments`} className="font-medium text-brand hover:underline">
              Set up
            </Link>
          )}
        </p>
      ) : (
        <div role="radiogroup" aria-labelledby="environment-selector-label" className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
          {environments.map((candidate) => {
            const active = candidate.id === environment?.id;
            return (
              <button
                key={candidate.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  if (active) return;
                  actions.selectEnvironment(candidate.id);
                  leaveScopedRoute('environment');
                }}
                className={`min-w-0 flex-1 truncate rounded-md px-2 py-1 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                  active ? 'bg-white text-brand-dark shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                {candidate.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
