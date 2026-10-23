// Dashboard-side entities: the people who log in to JourneyTrack and the
// organizations, projects and environments they manage. These are separate from
// tracked website visitors (see ./user.ts).
//
// AccountUser → OrganizationMembership → Organization → Project → Environment → Events

export type OrganizationRole = 'owner' | 'admin' | 'member';

/** Roles that can be granted through invitations or role changes. Ownership is only transferred. */
export type AssignableRole = Exclude<OrganizationRole, 'owner'>;

export interface AccountUser {
  id: string;
  name: string;
  email: string;
  /** PROTOTYPE ONLY: stored in plain text in localStorage. Never do this with real credentials. */
  password: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  websiteUrl?: string;
  createdAt: string;
}

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  status: 'active' | 'pending';
  joinedAt: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'canceled';

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: AssignableRole;
  status: InvitationStatus;
  invitedByUserId: string;
  createdAt: string;
  lastSentAt: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  websiteUrl?: string;
  createdAt: string;
}

export type EnvironmentType = 'development' | 'staging' | 'production';

export interface SdkKey {
  /** MOCK value — not a real secret. */
  value: string;
  status: 'active' | 'revoked';
  createdAt: string;
  revokedAt?: string;
}

export interface Environment {
  id: string;
  projectId: string;
  name: string;
  type: EnvironmentType;
  createdAt: string;
  sdkKey: SdkKey;
}
