import { useMemo } from 'react';
import { getUsersForEnvironment } from '../data/users';
import { getEventsForEnvironment } from '../data/events';
import { useWorkspace } from './useWorkspace';

/**
 * Tracked visitors and events for the active environment only. Because the
 * environment is resolved through organization → project → environment, data
 * from one organization or environment can never appear under another.
 */
export function useTrackingData() {
  const { environment } = useWorkspace();
  const environmentId = environment?.id;

  return useMemo(
    () => ({
      environmentId,
      users: environmentId ? getUsersForEnvironment(environmentId) : [],
      events: environmentId ? getEventsForEnvironment(environmentId) : [],
    }),
    [environmentId],
  );
}
