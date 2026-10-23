import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, FolderKanban, Layers, MoreHorizontal, Pencil, Plus, Target } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge, EnvironmentBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProjectFormDialog } from '../../components/projects/ProjectFormDialog';
import { useWorkspace } from '../../hooks/useWorkspace';
import { getEnvironmentsForProject } from '../../store/selectors';
import type { Project } from '../../types/account';
import { formatDate } from '../../utils/format';

type DialogState = { mode: 'create' } | { mode: 'edit'; project: Project } | null;

export function ProjectsPage() {
  const { db, organization, project: activeProject, projects, actions, can } = useWorkspace();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialog, setDialog] = useState<DialogState>(null);
  const canManage = can('projects.manage');

  // Deep link: /projects?create=1 opens the create dialog.
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      if (canManage) setDialog({ mode: 'create' });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, canManage]);

  if (!organization) return null;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Projects"
        description={`Websites and apps tracked by ${organization.name}.`}
        actions={
          canManage && (
            <Button icon={<Plus size={16} />} onClick={() => setDialog({ mode: 'create' })}>
              Create project
            </Button>
          )
        }
      />

      <Card>
        {projects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban size={20} />}
            title="No projects yet"
            description={
              canManage
                ? 'Create a project for each website or app you want to track.'
                : 'An Owner or Admin needs to create the first project.'
            }
            action={
              canManage && (
                <Button icon={<Plus size={16} />} onClick={() => setDialog({ mode: 'create' })}>
                  Create project
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-line bg-slate-50 text-xs font-medium tracking-wide text-muted uppercase">
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Website</th>
                  <th className="px-5 py-3">Environments</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const environments = getEnvironmentsForProject(db, project.id);
                  const isActive = project.id === activeProject?.id;
                  return (
                    <tr key={project.id} className="border-b border-line last:border-b-0 hover:bg-green-50/40">
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2">
                          <Link to={`/projects/${project.id}`} className="font-medium text-ink hover:text-brand">
                            {project.name}
                          </Link>
                          {isActive && <Badge tone="green">Active</Badge>}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {project.websiteUrl ? (
                          <a href={project.websiteUrl} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                            {project.websiteUrl.replace(/^https?:\/\//, '')}
                          </a>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2">
                          <span className="text-ink tabular-nums">{environments.length}</span>
                          <span className="flex gap-1">
                            {environments.map((env) => (
                              <EnvironmentBadge key={env.id} name={env.name} type={env.type} />
                            ))}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted">{formatDate(project.createdAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <DropdownMenu
                          label={`Actions for ${project.name}`}
                          trigger={<MoreHorizontal size={18} />}
                          items={[
                            {
                              key: 'view',
                              icon: <Eye size={16} />,
                              label: 'View project',
                              onSelect: () => navigate(`/projects/${project.id}`),
                            },
                            {
                              key: 'envs',
                              icon: <Layers size={16} />,
                              label: 'Open environments',
                              onSelect: () => navigate(`/projects/${project.id}/environments`),
                            },
                            {
                              key: 'select',
                              icon: <Target size={16} />,
                              label: 'Set as active project',
                              disabled: isActive,
                              onSelect: () => actions.selectProject(project.id),
                            },
                            ...(canManage
                              ? [
                                  {
                                    key: 'edit',
                                    icon: <Pencil size={16} />,
                                    label: 'Edit project',
                                    separatorBefore: true,
                                    onSelect: () => setDialog({ mode: 'edit', project }),
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ProjectFormDialog
        open={dialog !== null}
        project={dialog?.mode === 'edit' ? dialog.project : undefined}
        onClose={() => setDialog(null)}
        onSaved={(project) => {
          if (dialog?.mode === 'create') actions.selectProject(project.id);
        }}
      />
    </div>
  );
}
