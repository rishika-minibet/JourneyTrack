import type {
  AccountUser,
  Environment,
  EnvironmentType,
  Invitation,
  Organization,
  OrganizationMembership,
  OrganizationRole,
  Project,
} from '../types/account';
import type { MockDatabase, Selection } from './storage';

// Pure queries over the mock database. Every lookup follows explicit ID
// relationships so one organization's data never leaks into another's.

export const ENVIRONMENT_TYPE_ORDER: Record<EnvironmentType, number> = {
  development: 0,
  staging: 1,
  production: 2,
};

export interface OrganizationAccess {
  organization: Organization;
  membership: OrganizationMembership;
}

export interface MemberRecord {
  membership: OrganizationMembership;
  account: AccountUser;
}

export function getAccount(db: MockDatabase, accountId: string | null): AccountUser | undefined {
  return accountId ? db.accounts.find((account) => account.id === accountId) : undefined;
}

export function findAccountByEmail(db: MockDatabase, email: string): AccountUser | undefined {
  return db.accounts.find((account) => account.email === email);
}

export function getOrganizationsForAccount(db: MockDatabase, accountId: string): OrganizationAccess[] {
  return db.memberships
    .filter((membership) => membership.userId === accountId && membership.status === 'active')
    .flatMap((membership) => {
      const organization = db.organizations.find((org) => org.id === membership.organizationId);
      return organization ? [{ organization, membership }] : [];
    })
    .sort((a, b) => a.organization.name.localeCompare(b.organization.name));
}

export function getMembership(
  db: MockDatabase,
  organizationId: string,
  accountId: string,
): OrganizationMembership | undefined {
  return db.memberships.find(
    (membership) =>
      membership.organizationId === organizationId && membership.userId === accountId && membership.status === 'active',
  );
}

export function getRole(db: MockDatabase, organizationId: string, accountId: string | null): OrganizationRole | undefined {
  return accountId ? getMembership(db, organizationId, accountId)?.role : undefined;
}

export function getProjectsForOrganization(db: MockDatabase, organizationId: string): Project[] {
  return db.projects
    .filter((project) => project.organizationId === organizationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getEnvironmentsForProject(db: MockDatabase, projectId: string): Environment[] {
  return db.environments
    .filter((environment) => environment.projectId === projectId)
    .sort(
      (a, b) =>
        ENVIRONMENT_TYPE_ORDER[a.type] - ENVIRONMENT_TYPE_ORDER[b.type] || a.createdAt.localeCompare(b.createdAt),
    );
}

/** A project only if it belongs to the given organization. */
export function getProjectInOrganization(db: MockDatabase, organizationId: string, projectId: string): Project | undefined {
  return db.projects.find((project) => project.id === projectId && project.organizationId === organizationId);
}

export function getMembersForOrganization(db: MockDatabase, organizationId: string): MemberRecord[] {
  return db.memberships
    .filter((membership) => membership.organizationId === organizationId && membership.status === 'active')
    .flatMap((membership) => {
      const account = db.accounts.find((candidate) => candidate.id === membership.userId);
      return account ? [{ membership, account }] : [];
    })
    .sort((a, b) => roleRank(a.membership.role) - roleRank(b.membership.role) || a.account.name.localeCompare(b.account.name));
}

function roleRank(role: OrganizationRole): number {
  return role === 'owner' ? 0 : role === 'admin' ? 1 : 2;
}

export function getPendingInvitations(db: MockDatabase, organizationId: string): Invitation[] {
  return db.invitations
    .filter((invitation) => invitation.organizationId === organizationId && invitation.status === 'pending')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function isSlugTaken(db: MockDatabase, slug: string, exceptOrganizationId?: string): boolean {
  return db.organizations.some((org) => org.slug === slug && org.id !== exceptOrganizationId);
}

export interface ResolvedWorkspace {
  organization?: Organization;
  role?: OrganizationRole;
  project?: Project;
  environment?: Environment;
}

/**
 * Validates a stored selection against the relationships in the database and
 * falls back to sensible defaults (first organization, first project, PROD).
 */
export function resolveWorkspace(db: MockDatabase, accountId: string, selection: Selection): ResolvedWorkspace {
  const organizations = getOrganizationsForAccount(db, accountId);
  const access =
    organizations.find((entry) => entry.organization.id === selection.organizationId) ?? organizations[0];
  if (!access) return {};

  const projects = getProjectsForOrganization(db, access.organization.id);
  const project = projects.find((candidate) => candidate.id === selection.projectId) ?? projects[0];

  const environments = project ? getEnvironmentsForProject(db, project.id) : [];
  const environment =
    environments.find((candidate) => candidate.id === selection.environmentId) ??
    environments.find((candidate) => candidate.type === 'production') ??
    environments[0];

  return { organization: access.organization, role: access.membership.role, project, environment };
}
