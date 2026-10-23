# Limitations and backend plan

## What is mocked

| Area                | Prototype behaviour                                                      | Real implementation needed                                  |
| ------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| Authentication      | Plain-text passwords in `localStorage`; the session is an account ID     | Hashed passwords, HTTP-only session cookies or tokens, email verification |
| Authorization       | `can()` hides UI, and mock actions re-check it in the browser            | Server-side checks on every endpoint, scoped by membership  |
| Invitations         | Stored as `pending`; no email; accepted automatically on signup with the same email | Signed, expiring invite links; transactional email |
| SDK keys            | Random `jt_mock_…` strings, visible in the browser                       | Secure generation, hashed storage, shown once, rotation with an overlap window |
| Tracked users/events| Static generated data, read-only                                         | Ingestion API → PostgreSQL (or an analytics store), queried per environment |
| Persistence         | A single `localStorage` JSON blob per browser                             | PostgreSQL (Prisma) behind a NestJS API                     |
| Multi-user          | Each browser has its own copy of the data                                 | Shared server state                                         |

## Known limitations

- Data is per browser. Two people on different machines do not see each other's changes.
- Deleting a project or environment is not implemented. Only the whole organization can be deleted.
- "Leave organization" for non-owners is not implemented. An Owner or Admin must remove them.
- Invitation roles cannot be edited after sending. Cancel and re-invite instead.
- Created environments have no tracked data, so they always show empty states.
- No ESLint configuration or automated test suite exists yet.
- No favicon, so the browser logs a 404 for `/favicon.ico`.

## Replacing the mock layer

The prototype is structured so that pages do not need to change:

1. **`src/store/storage.ts`** is the only code that touches `localStorage`. Remove it once the server owns the data.
2. **`src/store/AppStore.tsx` actions** already behave like API calls. Each one validates, authorizes and returns a `Result<T>`. Replace each body with an HTTP request and map server errors to `{ ok: false, error }`. Actions will become async; pages already `await simulateLatency()` before calling them, so they are written for async flows.
3. **`src/store/selectors.ts`** queries become API reads, such as `GET /organizations/:id/projects`. A data-fetching layer like TanStack Query fits here.
4. **`src/hooks/useTrackingData.ts`** is the single entry point for tracked users and events. Point it at `GET /environments/:id/users` and `/events`.
5. **`src/lib/permissions.ts`** can stay as the UI's source of truth. Mirror the same matrix in the backend guards.

## Suggested database tables

These mirror `src/types/account.ts`:

```
accounts(id, name, email UNIQUE, password_hash, created_at)
organizations(id, name, slug UNIQUE, website_url, created_at)
organization_memberships(id, organization_id FK, account_id FK, role, status, joined_at,
                         UNIQUE(organization_id, account_id))
invitations(id, organization_id FK, email, role, status, invited_by FK, token_hash, expires_at, created_at, last_sent_at)
projects(id, organization_id FK, name, website_url, created_at, UNIQUE(organization_id, lower(name)))
environments(id, project_id FK, name, type, created_at, UNIQUE(project_id, lower(name)))
sdk_keys(id, environment_id FK, key_hash, prefix, status, created_at, revoked_at)
tracked_users(id, environment_id FK, external_id, traits JSONB, first_seen_at, last_seen_at)
events(id, environment_id FK, tracked_user_id FK, type, name, properties JSONB, occurred_at)
```

Add a partial unique index so that each organization has exactly one `owner` membership. Every tracking query must filter by `environment_id`, and the API should derive that ID from the SDK key or from the authenticated membership, never from a client-supplied organization name.
