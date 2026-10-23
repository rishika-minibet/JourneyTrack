# Architecture

## Folder layout

```
src/
  App.tsx                    Route table and guards
  main.tsx                   Providers: Router → AppStoreProvider → ToastProvider
  types/
    account.ts               Dashboard entities: AccountUser, Organization, Membership, Invitation, Project, Environment
    user.ts                  Tracked website visitor (existing, now has environmentId)
    event.ts                 Analytics event (existing, now has environmentId)
  data/
    seed.ts                  Seeded workspace with stable IDs (accounts, orgs, memberships, projects, environments, invitations)
    users.ts                 Existing tracked users, each assigned to an environment
    events.ts                Existing generated events, stamped with their user's environment
    time.ts                  Existing "minutes ago" helper
  store/
    storage.ts               MockDatabase shape and localStorage load/save (the only persistence code)
    selectors.ts             Pure, relationship-based queries over the database
    AppStore.tsx             Context provider and the mock "API" actions
  hooks/
    useWorkspace.ts          Signed-in account and the validated active org → project → environment
    useTrackingData.ts       Tracked users and events for the active environment
    useSyncActiveProject.ts  Project pages make their URL project the active one
  lib/
    permissions.ts           Centralized role → permission rules
    ids.ts                   ID, mock SDK key and slug generation
    validation.ts            Email, URL and slug validation
    browser.ts               Simulated latency, clipboard, key masking
  components/
    layout/                  AppLayout, Sidebar, ContextSelectors, TopBar (profile menu), AuthLayout
    routing/guards.tsx       RequireAuth, RequireOrganization, PublicOnly
    ui/                      Shared primitives (see below)
    users/                   Existing tracking components (plus NoEnvironmentNotice)
    projects/                Project and environment dialogs
    settings/                Settings tabs and the invite dialog
  pages/
    UsersPage.tsx, UserDetailsPage.tsx    Existing Track User Activity pages (adapted in place)
    OverviewPage.tsx, EventsPage.tsx
    auth/, onboarding/, projects/, settings/
```

## State management

All mutable prototype state is one `PersistedState` object:

```ts
interface PersistedState {
  version: 1;
  db: MockDatabase;                       // accounts, organizations, memberships, invitations, projects, environments
  session: { accountId: string | null };  // the mock "logged-in" user
  selections: Record<string, Selection>;  // last org/project/environment chosen, per account
}
```

`AppStoreProvider` keeps this object in React state and exposes `{ state, actions }` through `useAppStore()`. The `actions` object works like a client for a backend API:

- Each action **validates** its input, for example duplicate slugs, duplicate project or environment names, and invalid emails or URLs.
- Each action **checks the caller's role** with the same `can()` helper the UI uses, so a hidden button is not the only safeguard.
- Each action returns `Result<T>` (`{ ok: true, value } | { ok: false, error }`), and pages show `error` in a form alert or toast.
- Each action **commits** a new immutable state and writes it to `localStorage` synchronously. That way a page reload immediately after an action still sees the change.

Forms call `simulateLatency()` before an action so that loading states are visible.

Tracked users and events are **not** in the store. They are static modules (`data/users.ts`, `data/events.ts`) that are read-only in the dashboard, the same way they will be read-only in the real product.

## Resolving the active context

Pages never trust the stored selection directly. `resolveWorkspace()` in `store/selectors.ts` resolves it in this order:

1. Take the account's **active memberships**, then the selected organization, or the first one alphabetically.
2. Take that organization's projects, then the selected project, or the oldest one.
3. Take that project's environments, then the selected environment, or else **PROD**, or else the first one.

Every step follows foreign keys from the previous step. A stale or tampered selection, such as an environment ID from another organization, therefore falls back to a valid default and cannot surface foreign data. `useWorkspace()` wraps this logic and is the hook most components use.

Detail routes check scope again:

- `/users/:userId` only shows a user whose `environmentId` matches the active environment.
- `/projects/:projectId/*` uses `getProjectInOrganization(db, activeOrgId, projectId)`, so a project from another organization shows "Project not found."
- When you switch organization or environment while viewing a scoped detail page, the switchers navigate back to the list page.

## Integration with the existing Track User Activity pages

The existing feature (`UsersPage`, `UserDetailsPage`, `UserTable`, `UserRow`, `UserDetails`, `UserAttributes` and `ActivityFeed`) was kept and adapted rather than rebuilt:

| File                     | Change                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `types/user.ts`, `types/event.ts` | Added `environmentId`                                                                     |
| `data/users.ts`          | Existing 12 users assigned to environments; 4 users added so Test1 and DEV have data; `getUsersForEnvironment()` |
| `data/events.ts`         | Events inherit their user's `environmentId`; page URLs use that environment's site; `getEventsForEnvironment()` |
| `pages/UsersPage.tsx`    | Reads users from `useTrackingData()` instead of the global list; shows the context line and an empty state |
| `pages/UserDetailsPage.tsx` | Rejects users from other environments; the layout is unchanged                                  |
| `components/users/ActivityFeed.tsx` | `INDICATOR` and `summary` are now exported so the Events and Overview pages can reuse them |
| `components/ui/Input.tsx`| Optional `invalid` and `trailing` props; the default rendering is unchanged                       |
| `components/layout/*`    | The sidebar gained switchers and new nav items; the layout gained the context top bar             |

Search, row navigation, the "Activity feed / Tracked pages" tabs and expandable timeline events work exactly as before.

In the navigation, the existing **Users** and new **Events** pages sit under a **Track user activity** heading. There is deliberately no separate "Track User Activity" page, because the existing Users → User details flow already provides it.

## UI primitives (`components/ui`)

| Component       | Notes                                                                    |
| --------------- | ------------------------------------------------------------------------ |
| `Card`, `Avatar`, `Input` | Existing                                                       |
| `Button`, `ButtonLink` | Variants: primary, secondary, danger, ghost; supports `loading`   |
| `TextField`, `PasswordField`, `SelectField`, `FormAlert` | Labelled fields with `aria-invalid` and `aria-describedby` |
| `Modal`         | Native `<dialog>`, which gives focus trapping, Escape and backdrop click |
| `ConfirmDialog` | For destructive actions; can require typing a confirmation text          |
| `DropdownMenu`  | Accessible menu with arrow keys, Escape and click outside; used for row actions, the org switcher and the profile menu |
| `Badge`, `RoleBadge`, `EnvironmentBadge` | Colour-coded status chips                          |
| `EmptyState`, `PageHeader`, `Toast` (`useToast`) |                                            |

Styling uses only the existing Tailwind theme tokens in `index.css` (`brand`, `brand-light`, `brand-dark`, `page`, `line`, `ink`, `muted`). No new dependencies were added.
