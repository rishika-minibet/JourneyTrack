# Data model

## Relationships

```
AccountUser ──< OrganizationMembership >── Organization ──< Project ──< Environment ──< TrackedUser ──< AnalyticsEvent
                        (role per org)            │
                                                  └──< Invitation
```

- **Account users** are people who log in to the JourneyTrack dashboard.
- **Tracked users** are visitors to a customer's website, reported by the SDK through one environment's key. The two are unrelated types (`AccountUser` in `types/account.ts`, `User` in `types/user.ts`) and never share IDs.
- Roles live on the **membership**, not on the account. The same person can be an Admin in one organization and a Member in another.
- Every record has a stable, prefixed ID (`org_`, `proj_`, `env_`, `mem_`, `inv_`, `acct_`, `user_`). Records are always looked up by ID, never by name.

## Types (`src/types/account.ts`)

```ts
type OrganizationRole = 'owner' | 'admin' | 'member';
type AssignableRole = 'admin' | 'member';           // ownership is only transferred, never assigned

interface AccountUser { id; name; email; password /* prototype only */; createdAt }
interface Organization { id; name; slug; websiteUrl?; createdAt }
interface OrganizationMembership { id; organizationId; userId; role; status: 'active' | 'pending'; joinedAt }
interface Invitation { id; organizationId; email; role: AssignableRole; status: 'pending' | 'accepted' | 'canceled';
                       invitedByUserId; createdAt; lastSentAt }
interface Project { id; organizationId; name; websiteUrl?; createdAt }

type EnvironmentType = 'development' | 'staging' | 'production';
interface SdkKey { value /* MOCK */; status: 'active' | 'revoked'; createdAt; revokedAt? }
interface Environment { id; projectId; name; type; createdAt; sdkKey: SdkKey }
```

Tracked data (`types/user.ts`, `types/event.ts`) gained a single field, `environmentId: string`.

## Uniqueness rules (enforced in `AppStore` actions)

| Rule                                  | Scope                  |
| ------------------------------------- | ---------------------- |
| Organization slug                     | Global                 |
| Project name (case-insensitive)       | Per organization       |
| Environment name (case-insensitive)   | Per project            |
| Pending invitation email              | Per organization       |
| Account email                         | Global                 |
| Exactly one Owner                     | Per organization (kept by transfer) |

## Seeded data (`src/data/seed.ts`, `users.ts`, `events.ts`)

**Organizations and projects**

| Organization | Project          | Environments          |
| ------------ | ---------------- | --------------------- |
| Test (`org_test`)   | Website (`proj_test_website`)     | DEV, STAGING, PROD |
| Test (`org_test`)   | Marketing Site (`proj_test_marketing`) | PROD          |
| Test1 (`org_test1`) | Storefront (`proj_test1_storefront`)  | DEV, PROD     |

**Tracked users per environment.** Each user has two sessions (23 events in total). Page-view URLs use the environment's site, for example `https://dev.example.com` for DEV.

| Environment               | Tracked users                                                  |
| ------------------------- | -------------------------------------------------------------- |
| Test · Website · PROD     | user_001–008 (John Smith … James Anderson), from the original data |
| Test · Website · DEV      | user_009, user_010 (original), user_016 Hana Sato (added)      |
| Test · Website · STAGING  | none (demonstrates the empty state)                            |
| Test · Marketing · PROD   | none                                                           |
| Test1 · Storefront · PROD | user_011, user_012 (original), user_013, user_014 (added)      |
| Test1 · Storefront · DEV  | user_015 Noah Fischer (added)                                  |

Organizations, projects and environments you create at runtime have no tracked users, so they show empty states.

**Pending invitations:** `new.hire@journeytrack.dev` (Member of Test) and `analyst@journeytrack.dev` (Admin of Test1).

## Persistence

`src/store/storage.ts` stores the whole `PersistedState` under the `localStorage` key `journeytrack.mock-state` (version 1). It persists:

- the mock session
- each account's last organization, project and environment selection
- every organization, membership, invitation, project, environment and SDK key change

If storage is empty, corrupt or from another version, the app falls back to the seed data. **Reset demo data** in the profile menu does the same on purpose.

Tracked users and events are generated at load time and anchored to "now", so relative times such as "3 minutes ago" stay realistic. They are not persisted.
