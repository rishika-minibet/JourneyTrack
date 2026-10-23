import type { AssignableRole, OrganizationRole } from '../types/account';

// Centralized, typed role → permission mapping. Components ask `can(role, permission)`
// instead of comparing role strings directly.
//
// PROTOTYPE ONLY: these rules just hide/disable UI. Real authorization must be
// enforced by the backend.

export type Permission =
  | 'organization.view'
  | 'organization.update'
  | 'organization.transferOwnership'
  | 'organization.delete'
  | 'members.view'
  | 'members.invite'
  | 'members.manage'
  | 'projects.view'
  | 'projects.manage'
  | 'environments.view'
  | 'environments.manage'
  | 'environments.viewKeys'
  | 'environments.manageKeys'
  | 'tracking.view';

const VIEWER: readonly Permission[] = [
  'organization.view',
  'members.view',
  'projects.view',
  'environments.view',
  'tracking.view',
];

const ADMIN: readonly Permission[] = [
  ...VIEWER,
  'organization.update',
  'members.invite',
  'members.manage',
  'projects.manage',
  'environments.manage',
  'environments.viewKeys',
  'environments.manageKeys',
];

const OWNER: readonly Permission[] = [...ADMIN, 'organization.transferOwnership', 'organization.delete'];

const ROLE_PERMISSIONS: Record<OrganizationRole, ReadonlySet<Permission>> = {
  owner: new Set(OWNER),
  admin: new Set(ADMIN),
  member: new Set(VIEWER),
};

export const ROLE_LABELS: Record<OrganizationRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

export const ROLE_DESCRIPTIONS: Record<OrganizationRole, string> = {
  owner: 'Full access, including ownership transfer and deleting the organization.',
  admin: 'Manages projects, environments, SDK keys and regular members.',
  member: 'Views projects, tracked users, events and user activity.',
};

export function can(role: OrganizationRole | undefined, permission: Permission): boolean {
  return role !== undefined && ROLE_PERMISSIONS[role].has(permission);
}

/** Roles the actor may grant when inviting or changing a member's role. */
export function assignableRoles(actor: OrganizationRole | undefined): AssignableRole[] {
  if (actor === 'owner') return ['admin', 'member'];
  if (actor === 'admin') return ['member'];
  return [];
}

/**
 * Whether `actor` may change the role of, or remove, a member holding `target`.
 * Owners manage admins and members; admins manage regular members only.
 * Nobody manages the owner this way (ownership is transferred instead) or themselves.
 */
export function canManageMember(actor: OrganizationRole | undefined, target: OrganizationRole, isSelf: boolean): boolean {
  if (isSelf || target === 'owner' || !can(actor, 'members.manage')) return false;
  return assignableRoles(actor).includes(target);
}
