import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  AccountUser,
  AssignableRole,
  Environment,
  EnvironmentType,
  Invitation,
  Organization,
  OrganizationMembership,
  Project,
} from '../types/account';
import { assignableRoles, can, canManageMember, type Permission } from '../lib/permissions';
import { createId, createMockSdkKey } from '../lib/ids';
import { isValidEmail, isValidSlug, isValidUrl, normalizeEmail } from '../lib/validation';
import { createSeedState, loadState, saveState, type PersistedState, type Selection } from './storage';
import {
  findAccountByEmail,
  getMembership,
  getRole,
  isSlugTaken,
} from './selectors';

// Mock "API" for the prototype. Each action validates its input and checks the
// caller's role the way a backend would, then commits to local state. Replacing
// these bodies with HTTP calls should leave the pages untouched.

export type Result<T = void> = { ok: true; value: T } | { ok: false; error: string };

export interface OrganizationDraft {
  name: string;
  slug: string;
  websiteUrl?: string;
}

export interface ProjectDraft {
  name: string;
  websiteUrl?: string;
}

export interface EnvironmentDraft {
  name: string;
  type: EnvironmentType;
}

export interface InvitationDraft {
  email: string;
  role: AssignableRole;
}

export interface OnboardingDraft {
  organization: OrganizationDraft;
  project?: ProjectDraft;
  environments: EnvironmentDraft[];
  invitations: InvitationDraft[];
}

export interface SignupDraft {
  name: string;
  email: string;
  password: string;
}

export interface StoreActions {
  login(email: string, password: string): Result<AccountUser>;
  /** Also returns organizations joined through pending invitations for this email. */
  signup(draft: SignupDraft): Result<{ account: AccountUser; joined: Organization[] }>;
  logout(): void;
  resetDemoData(): void;

  selectOrganization(organizationId: string): void;
  selectProject(projectId: string): void;
  selectEnvironment(environmentId: string): void;

  createOrganization(draft: OnboardingDraft): Result<Organization>;
  updateOrganization(organizationId: string, draft: OrganizationDraft): Result<Organization>;
  transferOwnership(organizationId: string, toMembershipId: string): Result;
  deleteOrganization(organizationId: string): Result;

  createProject(organizationId: string, draft: ProjectDraft, environments: EnvironmentDraft[]): Result<Project>;
  updateProject(projectId: string, draft: ProjectDraft): Result<Project>;

  createEnvironment(projectId: string, draft: EnvironmentDraft): Result<Environment>;
  renameEnvironment(environmentId: string, name: string): Result<Environment>;
  revokeSdkKey(environmentId: string): Result;
  regenerateSdkKey(environmentId: string): Result<string>;

  inviteMember(organizationId: string, draft: InvitationDraft): Result<Invitation>;
  resendInvitation(invitationId: string): Result;
  cancelInvitation(invitationId: string): Result;
  changeMemberRole(membershipId: string, role: AssignableRole): Result;
  removeMember(membershipId: string): Result;
}

interface StoreValue {
  state: PersistedState;
  actions: StoreActions;
}

const StoreContext = createContext<StoreValue | null>(null);

const ok = <T,>(value: T): Result<T> => ({ ok: true, value });
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const now = () => new Date().toISOString();
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

const NOT_ALLOWED = 'Your role does not allow this action.';

function validateOrganization(state: PersistedState, draft: OrganizationDraft, exceptId?: string): string | undefined {
  if (!draft.name.trim()) return 'Organization name is required.';
  if (!isValidSlug(draft.slug)) return 'Slug may contain lowercase letters, numbers and hyphens.';
  if (isSlugTaken(state.db, draft.slug, exceptId)) return `The slug "${draft.slug}" is already taken.`;
  if (draft.websiteUrl && !isValidUrl(draft.websiteUrl)) return 'Website must be a valid URL.';
  return undefined;
}

function validateProject(state: PersistedState, organizationId: string, draft: ProjectDraft, exceptId?: string) {
  if (!draft.name.trim()) return 'Project name is required.';
  if (draft.websiteUrl && !isValidUrl(draft.websiteUrl)) return 'Website must be a valid URL.';
  const duplicate = state.db.projects.some(
    (project) => project.organizationId === organizationId && project.id !== exceptId && sameName(project.name, draft.name),
  );
  return duplicate ? 'A project with this name already exists in this organization.' : undefined;
}

function validateEnvironmentName(state: PersistedState, projectId: string, name: string, exceptId?: string) {
  if (!name.trim()) return 'Environment name is required.';
  if (name.trim().length > 24) return 'Environment name must be 24 characters or fewer.';
  const duplicate = state.db.environments.some(
    (environment) => environment.projectId === projectId && environment.id !== exceptId && sameName(environment.name, name),
  );
  return duplicate ? 'An environment with this name already exists in this project.' : undefined;
}

function buildEnvironment(projectId: string, draft: EnvironmentDraft): Environment {
  const createdAt = now();
  return {
    id: createId('env'),
    projectId,
    name: draft.name.trim().toUpperCase(),
    type: draft.type,
    createdAt,
    sdkKey: { value: createMockSdkKey(draft.type), status: 'active', createdAt },
  };
}

function preferredEnvironment(environments: Environment[]): Environment | undefined {
  return environments.find((environment) => environment.type === 'production') ?? environments[0];
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadState);
  const stateRef = useRef(state);

  const actions = useMemo<StoreActions>(() => {
    const read = () => stateRef.current;
    const commit = (next: PersistedState) => {
      stateRef.current = next;
      saveState(next); // Persist synchronously so a reload right after an action sees it.
      setState(next);
    };

    const currentAccountId = () => read().session.accountId;
    const authorize = (organizationId: string, permission: Permission) =>
      can(getRole(read().db, organizationId, currentAccountId()), permission);

    const updateSelection = (patch: Selection, replace = false) => {
      const s = read();
      const accountId = s.session.accountId;
      if (!accountId) return;
      const previous = replace ? {} : s.selections[accountId] ?? {};
      commit({ ...s, selections: { ...s.selections, [accountId]: { ...previous, ...patch } } });
    };

    const projectOrganization = (projectId: string) => read().db.projects.find((p) => p.id === projectId)?.organizationId;

    const environmentContext = (environmentId: string) => {
      const environment = read().db.environments.find((e) => e.id === environmentId);
      const organizationId = environment ? projectOrganization(environment.projectId) : undefined;
      return environment && organizationId ? { environment, organizationId } : undefined;
    };

    const replaceEnvironment = (updated: Environment) => {
      const s = read();
      commit({
        ...s,
        db: { ...s.db, environments: s.db.environments.map((e) => (e.id === updated.id ? updated : e)) },
      });
    };

    return {
      login(email, password) {
        const s = read();
        const account = findAccountByEmail(s.db, normalizeEmail(email));
        if (!account || account.password !== password) return fail('Incorrect email or password.');
        commit({ ...s, session: { accountId: account.id } });
        return ok(account);
      },

      signup({ name, email, password }) {
        const s = read();
        const normalized = normalizeEmail(email);
        if (!name.trim()) return fail('Full name is required.');
        if (!isValidEmail(normalized)) return fail('Enter a valid email address.');
        if (password.length < 8) return fail('Password must be at least 8 characters.');
        if (findAccountByEmail(s.db, normalized)) return fail('An account with this email already exists.');

        const createdAt = now();
        const account: AccountUser = { id: createId('acct'), name: name.trim(), email: normalized, password, createdAt };

        // Pending invitations for this email are accepted automatically.
        const accepted = s.db.invitations.filter((inv) => inv.email === normalized && inv.status === 'pending');
        const memberships: OrganizationMembership[] = accepted.map((inv) => ({
          id: createId('mem'),
          organizationId: inv.organizationId,
          userId: account.id,
          role: inv.role,
          status: 'active',
          joinedAt: createdAt,
        }));

        commit({
          ...s,
          db: {
            ...s.db,
            accounts: [...s.db.accounts, account],
            memberships: [...s.db.memberships, ...memberships],
            invitations: s.db.invitations.map((inv) =>
              accepted.includes(inv) ? { ...inv, status: 'accepted' } : inv,
            ),
          },
          session: { accountId: account.id },
        });
        const joined = s.db.organizations.filter((org) => memberships.some((m) => m.organizationId === org.id));
        return ok({ account, joined });
      },

      logout() {
        commit({ ...read(), session: { accountId: null } });
      },

      resetDemoData() {
        const seed = createSeedState();
        const accountId = currentAccountId();
        const stillExists = seed.db.accounts.some((account) => account.id === accountId);
        commit({ ...seed, session: { accountId: stillExists ? accountId : null } });
      },

      selectOrganization(organizationId) {
        updateSelection({ organizationId }, true);
      },

      selectProject(projectId) {
        const organizationId = projectOrganization(projectId);
        if (organizationId) updateSelection({ organizationId, projectId }, true);
      },

      selectEnvironment(environmentId) {
        const context = environmentContext(environmentId);
        if (!context) return;
        updateSelection(
          { organizationId: context.organizationId, projectId: context.environment.projectId, environmentId },
          true,
        );
      },

      createOrganization(draft) {
        const s = read();
        const accountId = s.session.accountId;
        const account = s.db.accounts.find((candidate) => candidate.id === accountId);
        if (!account) return fail('You need to be logged in.');
        const orgError = validateOrganization(s, draft.organization);
        if (orgError) return fail(orgError);
        if (draft.project) {
          if (!draft.project.name.trim()) return fail('Project name is required.');
          if (draft.project.websiteUrl && !isValidUrl(draft.project.websiteUrl)) return fail('Project website must be a valid URL.');
        }

        const createdAt = now();
        const organization: Organization = {
          id: createId('org'),
          name: draft.organization.name.trim(),
          slug: draft.organization.slug,
          websiteUrl: draft.organization.websiteUrl,
          createdAt,
        };
        const owner: OrganizationMembership = {
          id: createId('mem'),
          organizationId: organization.id,
          userId: account.id,
          role: 'owner',
          status: 'active',
          joinedAt: createdAt,
        };
        const project: Project | undefined = draft.project && {
          id: createId('proj'),
          organizationId: organization.id,
          name: draft.project.name.trim(),
          websiteUrl: draft.project.websiteUrl,
          createdAt,
        };
        const environments = project ? draft.environments.map((env) => buildEnvironment(project.id, env)) : [];

        const seen = new Set<string>([account.email]);
        const invitations: Invitation[] = [];
        for (const invite of draft.invitations) {
          const email = normalizeEmail(invite.email);
          if (!isValidEmail(email) || seen.has(email)) continue;
          seen.add(email);
          invitations.push({
            id: createId('inv'),
            organizationId: organization.id,
            email,
            role: invite.role,
            status: 'pending',
            invitedByUserId: account.id,
            createdAt,
            lastSentAt: createdAt,
          });
        }

        commit({
          ...s,
          db: {
            ...s.db,
            organizations: [...s.db.organizations, organization],
            memberships: [...s.db.memberships, owner],
            projects: project ? [...s.db.projects, project] : s.db.projects,
            environments: [...s.db.environments, ...environments],
            invitations: [...s.db.invitations, ...invitations],
          },
          selections: {
            ...s.selections,
            [account.id]: {
              organizationId: organization.id,
              projectId: project?.id,
              environmentId: preferredEnvironment(environments)?.id,
            },
          },
        });
        return ok(organization);
      },

      updateOrganization(organizationId, draft) {
        if (!authorize(organizationId, 'organization.update')) return fail(NOT_ALLOWED);
        const s = read();
        const error = validateOrganization(s, draft, organizationId);
        if (error) return fail(error);
        const existing = s.db.organizations.find((org) => org.id === organizationId);
        if (!existing) return fail('Organization not found.');
        const updated: Organization = { ...existing, name: draft.name.trim(), slug: draft.slug, websiteUrl: draft.websiteUrl };
        commit({
          ...s,
          db: { ...s.db, organizations: s.db.organizations.map((org) => (org.id === organizationId ? updated : org)) },
        });
        return ok(updated);
      },

      transferOwnership(organizationId, toMembershipId) {
        if (!authorize(organizationId, 'organization.transferOwnership')) return fail(NOT_ALLOWED);
        const s = read();
        const current = getMembership(s.db, organizationId, s.session.accountId ?? '');
        const target = s.db.memberships.find(
          (m) => m.id === toMembershipId && m.organizationId === organizationId && m.status === 'active',
        );
        if (!current || !target || target.id === current.id) return fail('Choose another active member.');
        commit({
          ...s,
          db: {
            ...s.db,
            memberships: s.db.memberships.map((m) => {
              if (m.id === target.id) return { ...m, role: 'owner' };
              if (m.id === current.id) return { ...m, role: 'admin' };
              return m;
            }),
          },
        });
        return ok(undefined);
      },

      deleteOrganization(organizationId) {
        if (!authorize(organizationId, 'organization.delete')) return fail(NOT_ALLOWED);
        const s = read();
        const projectIds = new Set(s.db.projects.filter((p) => p.organizationId === organizationId).map((p) => p.id));
        commit({
          ...s,
          db: {
            ...s.db,
            organizations: s.db.organizations.filter((org) => org.id !== organizationId),
            memberships: s.db.memberships.filter((m) => m.organizationId !== organizationId),
            invitations: s.db.invitations.filter((inv) => inv.organizationId !== organizationId),
            projects: s.db.projects.filter((p) => !projectIds.has(p.id)),
            environments: s.db.environments.filter((e) => !projectIds.has(e.projectId)),
          },
        });
        return ok(undefined);
      },

      createProject(organizationId, draft, environmentDrafts) {
        if (!authorize(organizationId, 'projects.manage')) return fail(NOT_ALLOWED);
        const s = read();
        const error = validateProject(s, organizationId, draft);
        if (error) return fail(error);
        const project: Project = {
          id: createId('proj'),
          organizationId,
          name: draft.name.trim(),
          websiteUrl: draft.websiteUrl,
          createdAt: now(),
        };
        const environments = environmentDrafts.map((env) => buildEnvironment(project.id, env));
        commit({
          ...s,
          db: { ...s.db, projects: [...s.db.projects, project], environments: [...s.db.environments, ...environments] },
        });
        return ok(project);
      },

      updateProject(projectId, draft) {
        const s = read();
        const existing = s.db.projects.find((p) => p.id === projectId);
        if (!existing) return fail('Project not found.');
        if (!authorize(existing.organizationId, 'projects.manage')) return fail(NOT_ALLOWED);
        const error = validateProject(s, existing.organizationId, draft, projectId);
        if (error) return fail(error);
        const updated: Project = { ...existing, name: draft.name.trim(), websiteUrl: draft.websiteUrl };
        commit({ ...s, db: { ...s.db, projects: s.db.projects.map((p) => (p.id === projectId ? updated : p)) } });
        return ok(updated);
      },

      createEnvironment(projectId, draft) {
        const organizationId = projectOrganization(projectId);
        if (!organizationId) return fail('Project not found.');
        if (!authorize(organizationId, 'environments.manage')) return fail(NOT_ALLOWED);
        const s = read();
        const error = validateEnvironmentName(s, projectId, draft.name);
        if (error) return fail(error);
        const environment = buildEnvironment(projectId, draft);
        commit({ ...s, db: { ...s.db, environments: [...s.db.environments, environment] } });
        return ok(environment);
      },

      renameEnvironment(environmentId, name) {
        const context = environmentContext(environmentId);
        if (!context) return fail('Environment not found.');
        if (!authorize(context.organizationId, 'environments.manage')) return fail(NOT_ALLOWED);
        const error = validateEnvironmentName(read(), context.environment.projectId, name, environmentId);
        if (error) return fail(error);
        const updated = { ...context.environment, name: name.trim().toUpperCase() };
        replaceEnvironment(updated);
        return ok(updated);
      },

      revokeSdkKey(environmentId) {
        const context = environmentContext(environmentId);
        if (!context) return fail('Environment not found.');
        if (!authorize(context.organizationId, 'environments.manageKeys')) return fail(NOT_ALLOWED);
        const { environment } = context;
        replaceEnvironment({ ...environment, sdkKey: { ...environment.sdkKey, status: 'revoked', revokedAt: now() } });
        return ok(undefined);
      },

      regenerateSdkKey(environmentId) {
        const context = environmentContext(environmentId);
        if (!context) return fail('Environment not found.');
        if (!authorize(context.organizationId, 'environments.manageKeys')) return fail(NOT_ALLOWED);
        const value = createMockSdkKey(context.environment.type);
        replaceEnvironment({ ...context.environment, sdkKey: { value, status: 'active', createdAt: now() } });
        return ok(value);
      },

      inviteMember(organizationId, draft) {
        const s = read();
        const actorRole = getRole(s.db, organizationId, s.session.accountId);
        if (!can(actorRole, 'members.invite') || !assignableRoles(actorRole).includes(draft.role)) return fail(NOT_ALLOWED);
        const email = normalizeEmail(draft.email);
        if (!isValidEmail(email)) return fail('Enter a valid email address.');
        const account = findAccountByEmail(s.db, email);
        if (account && getMembership(s.db, organizationId, account.id)) return fail('This person is already a member.');
        const pending = s.db.invitations.some(
          (inv) => inv.organizationId === organizationId && inv.email === email && inv.status === 'pending',
        );
        if (pending) return fail('An invitation is already pending for this email.');
        const createdAt = now();
        const invitation: Invitation = {
          id: createId('inv'),
          organizationId,
          email,
          role: draft.role,
          status: 'pending',
          invitedByUserId: s.session.accountId ?? '',
          createdAt,
          lastSentAt: createdAt,
        };
        commit({ ...s, db: { ...s.db, invitations: [...s.db.invitations, invitation] } });
        return ok(invitation);
      },

      resendInvitation(invitationId) {
        const s = read();
        const invitation = s.db.invitations.find((inv) => inv.id === invitationId && inv.status === 'pending');
        if (!invitation) return fail('Invitation not found.');
        if (!authorize(invitation.organizationId, 'members.invite')) return fail(NOT_ALLOWED);
        commit({
          ...s,
          db: {
            ...s.db,
            invitations: s.db.invitations.map((inv) => (inv.id === invitationId ? { ...inv, lastSentAt: now() } : inv)),
          },
        });
        return ok(undefined);
      },

      cancelInvitation(invitationId) {
        const s = read();
        const invitation = s.db.invitations.find((inv) => inv.id === invitationId && inv.status === 'pending');
        if (!invitation) return fail('Invitation not found.');
        if (!authorize(invitation.organizationId, 'members.invite')) return fail(NOT_ALLOWED);
        commit({
          ...s,
          db: {
            ...s.db,
            invitations: s.db.invitations.map((inv) => (inv.id === invitationId ? { ...inv, status: 'canceled' } : inv)),
          },
        });
        return ok(undefined);
      },

      changeMemberRole(membershipId, role) {
        const s = read();
        const target = s.db.memberships.find((m) => m.id === membershipId);
        if (!target) return fail('Member not found.');
        const actorRole = getRole(s.db, target.organizationId, s.session.accountId);
        const isSelf = target.userId === s.session.accountId;
        if (!canManageMember(actorRole, target.role, isSelf) || !assignableRoles(actorRole).includes(role)) {
          return fail(NOT_ALLOWED);
        }
        commit({
          ...s,
          db: { ...s.db, memberships: s.db.memberships.map((m) => (m.id === membershipId ? { ...m, role } : m)) },
        });
        return ok(undefined);
      },

      removeMember(membershipId) {
        const s = read();
        const target = s.db.memberships.find((m) => m.id === membershipId);
        if (!target) return fail('Member not found.');
        const actorRole = getRole(s.db, target.organizationId, s.session.accountId);
        if (!canManageMember(actorRole, target.role, target.userId === s.session.accountId)) return fail(NOT_ALLOWED);
        commit({ ...s, db: { ...s.db, memberships: s.db.memberships.filter((m) => m.id !== membershipId) } });
        return ok(undefined);
      },
    };
  }, []);

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useAppStore must be used inside <AppStoreProvider>');
  return value;
}

