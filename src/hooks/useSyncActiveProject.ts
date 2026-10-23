import { useEffect } from 'react';
import type { Project } from '../types/account';
import { useWorkspace } from './useWorkspace';

/** Project pages make their project the active one, so the visible context always matches the URL. */
export function useSyncActiveProject(project: Project | undefined) {
  const { project: activeProject, actions } = useWorkspace();
  const projectId = project?.id;
  const activeId = activeProject?.id;

  useEffect(() => {
    if (projectId && projectId !== activeId) actions.selectProject(projectId);
  }, [projectId, activeId, actions]);
}
