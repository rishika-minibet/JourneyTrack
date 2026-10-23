# Roles and permissions

> These are **prototype UI permissions**. They hide or disable controls, and the mock actions re-check them, but everything runs in the browser. The backend must enforce real authorization.

All rules live in [`src/lib/permissions.ts`](../src/lib/permissions.ts). Components never compare role strings directly. They call `can(role, permission)`, or `useWorkspace().can(permission)` for the active organization.

## Permission matrix

| Permission                       | Owner | Admin | Member |
| -------------------------------- | :---: | :---: | :----: |
| `organization.view`              | ✓     | ✓     | ✓      |
| `organization.update`            | ✓     | ✓     |        |
| `organization.transferOwnership` | ✓     |       |        |
| `organization.delete`            | ✓     |       |        |
| `members.view`                   | ✓     | ✓     | ✓      |
| `members.invite`                 | ✓     | ✓     |        |
| `members.manage`                 | ✓     | ✓     |        |
| `projects.view`                  | ✓     | ✓     | ✓      |
| `projects.manage`                | ✓     | ✓     |        |
| `environments.view`              | ✓     | ✓     | ✓      |
| `environments.manage`            | ✓     | ✓     |        |
| `environments.viewKeys`          | ✓     | ✓     |        |
| `environments.manageKeys`        | ✓     | ✓     |        |
| `tracking.view`                  | ✓     | ✓     | ✓      |

## Member management rules

`assignableRoles(actor)` controls which roles an actor can grant:

| Actor  | Can invite or assign |
| ------ | -------------------- |
| Owner  | Admin, Member        |
| Admin  | Member               |
| Member | nothing              |

`canManageMember(actor, targetRole, isSelf)` controls who can change a role or remove a member:

- Nobody can change their own role or remove themselves this way.
- Nobody can change or remove the **Owner**. Ownership moves only through **Transfer ownership**.
- An Owner manages Admins and Members. An Admin manages Members only.

## Owner safeguards

- The Owner row shows "Owner can't be removed" instead of a Remove button.
- **Transfer ownership** (Settings → General → Danger zone) requires choosing another active member and typing the organization slug. The previous owner becomes an Admin.
- **Delete organization** requires typing the organization slug. It removes the organization's projects, environments, memberships and invitations.

## What each role sees

| Area                    | Owner                         | Admin                          | Member                          |
| ----------------------- | ----------------------------- | ------------------------------ | ------------------------------- |
| Overview, Users, Events | Full                          | Full                           | Full                            |
| Projects                | Create, edit                  | Create, edit                   | View only                       |
| Environments            | Create, rename, keys          | Create, rename, keys           | View only; keys hidden          |
| Members                 | Invite Admin/Member, manage all except self | Invite Member, manage Members | View only                       |
| Settings → General      | Edit + danger zone            | Edit                           | Read-only notice                |

## Seeded role combinations

| Account                   | Test   | Test1  |
| ------------------------- | ------ | ------ |
| `owner@journeytrack.dev`  | Owner  | Admin  |
| `admin@journeytrack.dev`  | Admin  | Member |
| `member@journeytrack.dev` | Member | Member |
| `dev@journeytrack.dev`    | —      | Owner  |

Switching organizations with the same account changes the role. For example, Ava sees the danger zone in Test but not in Test1.

## Adding a permission

1. Add the string to the `Permission` union.
2. Add it to the `VIEWER`, `ADMIN` or `OWNER` list. Higher roles inherit lower lists.
3. Gate the UI with `can('new.permission')`, and check it in the matching `AppStore` action.
