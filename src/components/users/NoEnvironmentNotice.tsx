import { Layers } from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { ButtonLink } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

/** Shown by tracking pages when the active project has no environment to read data from. */
export function NoEnvironmentNotice({ title }: { title: string }) {
  const { project, can } = useWorkspace();
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-2xl font-semibold text-ink">{title}</h1>
      <Card>
        <EmptyState
          icon={<Layers size={20} />}
          title={project ? 'No environment selected' : 'No project yet'}
          description={
            project
              ? `${project.name} has no environments. Tracked users and events are stored per environment.`
              : 'Create a project and an environment to start tracking visitors.'
          }
          action={
            can(project ? 'environments.manage' : 'projects.manage') && (
              <ButtonLink to={project ? `/projects/${project.id}/environments` : '/projects?create=1'}>
                {project ? 'Set up environments' : 'Create project'}
              </ButtonLink>
            )
          }
        />
      </Card>
    </div>
  );
}
