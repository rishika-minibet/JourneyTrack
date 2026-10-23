import { useMemo } from 'react';
import { useAppStore } from '../store/AppStore';
import {
  getAccount,
  getEnvironmentsForProject,
  getOrganizationsForAccount,
  getProjectsForOrganization,
  resolveWorkspace,
} from '../store/selectors';
import { can, type Permission } from '../lib/permissions';

/**
 * The signed-in account and its active organization → project → environment,
 * always validated against the mock database relationships.
 */
export function useWorkspace() {
  const { state, actions } = useAppStore();
  const { db, session, selections } = state;
  const accountId = session.accountId;

  return useMemo(() => {
    const account = getAccount(db, accountId);
    const organizations = account ? getOrganizationsForAccount(db, account.id) : [];
    const resolved = account ? resolveWorkspace(db, account.id, selections[account.id] ?? {}) : {};
    const projects = resolved.organization ? getProjectsForOrganization(db, resolved.organization.id) : [];
    const environments = resolved.project ? getEnvironmentsForProject(db, resolved.project.id) : [];
    const role = resolved.role;

    return {
      db,
      actions,
      account,
      organizations,
      organization: resolved.organization,
      role,
      projects,
      project: resolved.project,
      environments,
      environment: resolved.environment,
      can: (permission: Permission) => can(role, permission),
    };
  }, [db, accountId, selections, actions]);
}

export type Workspace = ReturnType<typeof useWorkspace>;
