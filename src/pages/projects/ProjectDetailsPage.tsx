import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Globe, Layers, Pencil } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge, ENVIRONMENT_TYPE_LABELS, EnvironmentBadge } from '../../components/ui/Badge';
import { Button, ButtonLink } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProjectFormDialog } from '../../components/projects/ProjectFormDialog';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useSyncActiveProject } from '../../hooks/useSyncActiveProject';
import { getEnvironmentsForProject, getProjectInOrganization } from '../../store/selectors';
import { getUsersForEnvironment } from '../../data/users';
import { formatDate } from '../../utils/format';

export function ProjectNotFound() {
  const { organization } = useWorkspace();
  return (
    <div className="mx-auto max-w-6xl">
      <BackToProjects />
      <Card className="mt-4">
        <EmptyState
          icon={<Layers size={20} />}
          title="Project not found"
          description={`This project doesn't exist in ${organization?.name ?? 'this organization'}.`}
        />
      </Card>
    </div>
  );
}

export function BackToProjects() {
  return (
    <Link
      to="/projects"
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand hover:bg-brand-light"
    >
      <ArrowLeft size={18} />
      Projects
    </Link>
  );
}

export function ProjectDetailsPage() {
  const { projectId = '' } = useParams();
  const { db, organization, can } = useWorkspace();
  const [editing, setEditing] = useState(false);

  // Only resolve projects inside the active organization.
  const project = organization ? getProjectInOrganization(db, organization.id, projectId) : undefined;
  useSyncActiveProject(project);
  if (!project) return <ProjectNotFound />;

  const environments = getEnvironmentsForProject(db, project.id);

  return (
    <div className="mx-auto max-w-6xl">
      <BackToProjects />
      <div className="mt-2 mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink">
            {project.name}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted">
            {project.websiteUrl && (
              <a href={project.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">
                <Globe size={14} /> {project.websiteUrl}
              </a>
            )}
            <span>Created {formatDate(project.createdAt)}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can('projects.manage') && (
            <Button variant="secondary" icon={<Pencil size={16} />} onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
          <ButtonLink to={`/projects/${project.id}/environments`} icon={<Layers size={16} />}>
            Environments
          </ButtonLink>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <Card title="Environments">
          {environments.length === 0 ? (
            <EmptyState
              icon={<Layers size={20} />}
              title="No environments yet"
              description="Create DEV and PROD environments to get SDK keys for this project."
              action={
                can('environments.manage') && (
                  <ButtonLink to={`/projects/${project.id}/environments`}>Set up environments</ButtonLink>
                )
              }
            />
          ) : (
            <ul>
              {environments.map((env) => (
                <li key={env.id} className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-3 text-sm">
                  <EnvironmentBadge name={env.name} type={env.type} />
                  <span className="text-muted">{ENVIRONMENT_TYPE_LABELS[env.type]}</span>
                  <span className="ml-auto text-muted">{getUsersForEnvironment(env.id).length} tracked users</span>
                  <Badge tone={env.sdkKey.status === 'active' ? 'green' : 'rose'}>
                    Key {env.sdkKey.status === 'active' ? 'active' : 'revoked'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Details">
          <dl className="px-5 pb-3 text-sm">
            {[
              ['Project ID', <code className="font-mono text-xs">{project.id}</code>],
              ['Organization', organization?.name],
              ['Website', project.websiteUrl ?? '—'],
              ['Environments', environments.length],
              ['Created', formatDate(project.createdAt)],
            ].map(([label, value]) => (
              <div key={String(label)} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 border-t border-line py-2.5">
                <dt className="text-muted">{label}</dt>
                <dd className="break-all text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <ProjectFormDialog open={editing} project={project} onClose={() => setEditing(false)} />
    </div>
  );
}
