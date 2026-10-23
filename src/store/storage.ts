import type {
  AccountUser,
  Environment,
  Invitation,
  Organization,
  OrganizationMembership,
  Project,
} from '../types/account';
import {
  seedAccounts,
  seedEnvironments,
  seedInvitations,
  seedMemberships,
  seedOrganizations,
  seedProjects,
} from '../data/seed';

// Persistence for the mock workspace. Everything that would live in PostgreSQL
// later is in `MockDatabase`; swapping this module for API calls should not
// require changes to pages.

export interface MockDatabase {
  accounts: AccountUser[];
  organizations: Organization[];
  memberships: OrganizationMembership[];
  invitations: Invitation[];
  projects: Project[];
  environments: Environment[];
}

/** The organization/project/environment an account last had selected. */
export interface Selection {
  organizationId?: string;
  projectId?: string;
  environmentId?: string;
}

export interface PersistedState {
  version: typeof STATE_VERSION;
  db: MockDatabase;
  session: { accountId: string | null };
  selections: Record<string, Selection>;
}

const STORAGE_KEY = 'journeytrack.mock-state';
const STATE_VERSION = 1;

export function createSeedState(): PersistedState {
  return {
    version: STATE_VERSION,
    db: {
      accounts: [...seedAccounts],
      organizations: [...seedOrganizations],
      memberships: [...seedMemberships],
      invitations: [...seedInvitations],
      projects: [...seedProjects],
      environments: [...seedEnvironments],
    },
    session: { accountId: null },
    selections: {},
  };
}

function isPersistedState(value: unknown): value is PersistedState {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<PersistedState>;
  return candidate.version === STATE_VERSION && typeof candidate.db === 'object' && typeof candidate.session === 'object';
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isPersistedState(parsed)) return parsed;
    }
  } catch {
    // Storage unavailable or corrupt: fall back to seed data.
  }
  return createSeedState();
}

export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persistence is best-effort in the prototype.
  }
}
