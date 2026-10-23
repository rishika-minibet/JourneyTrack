# JourneyTrack

JourneyTrack is a user-analytics dashboard inspired by Userflow. This repository is the **frontend prototype**: every screen works end to end, but it runs on typed dummy data stored in the browser. There is no backend, no real authentication and no SDK event ingestion yet.

Stack: React 18, TypeScript (strict), Vite, Tailwind CSS v4, React Router 6, Lucide icons.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script              | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the Vite dev server             |
| `npm run typecheck` | Run the TypeScript compiler (`tsc -b`) |
| `npm run build`     | Type-check and build into `dist/`     |
| `npm run preview`   | Serve the production build            |

There is no lint script yet. ESLint has not been added to the project.

## Demo accounts

All seeded accounts use the password `password123`. The login page lists them, and clicking one fills in the form.

| Account                   | Name        | Test   | Test1  |
| ------------------------- | ----------- | ------ | ------ |
| `owner@journeytrack.dev`  | Ava Chen    | Owner  | Admin  |
| `admin@journeytrack.dev`  | Ben Ortiz   | Admin  | Member |
| `member@journeytrack.dev` | Cara Nguyen | Member | Member |
| `dev@journeytrack.dev`    | Dev Kumar   | —      | Owner  |

You can also sign up with a new email, which takes you through onboarding. Signing up with `new.hire@journeytrack.dev` accepts the seeded pending invitation, so that account joins **Test** as a Member and skips onboarding.

To restore the seed data, open the avatar menu and choose **Reset demo data**.

## Routes

| Route                              | Page                                                       | Access              |
| ---------------------------------- | ---------------------------------------------------------- | ------------------- |
| `/signup`, `/login`                | Account signup and login                                   | Logged out only     |
| `/onboarding`                      | Four-step organization setup (also "Create organization") | Logged in           |
| `/overview`                        | Dashboard for the active environment                       | Needs an org        |
| `/users`                           | **Existing** tracked-users list (Track User Activity)      | Needs an org        |
| `/users/:userId`                   | **Existing** user details and activity timeline            | Needs an org        |
| `/events`                          | Event stream for the active environment                    | Needs an org        |
| `/projects`                        | Projects in the active organization                        | Needs an org        |
| `/projects/:projectId`             | Project details                                            | Needs an org        |
| `/projects/:projectId/environments`| Environments and mock SDK keys                             | Needs an org        |
| `/settings/organization`           | General settings and the owner-only danger zone            | Needs an org        |
| `/settings/members`                | Members, roles and pending invitations                     | Needs an org        |

Logged-out visitors are sent to `/login`. Accounts without an organization are sent to `/onboarding`.

## Documentation

- [Architecture](docs/ARCHITECTURE.md): folder layout, state management, how the active context is resolved, and how the existing tracking pages were integrated.
- [Data model](docs/DATA_MODEL.md): entities, relationships, seeded records and persistence.
- [Roles and permissions](docs/PERMISSIONS.md): the permission matrix and the centralized helper.
- [Testing guide](docs/TESTING.md): manual walkthroughs for every flow and what has been verified.
- [Limitations and backend plan](docs/BACKEND_MIGRATION.md): what is mocked and how to replace it.

> **Prototype only.** Passwords are stored in plain text in `localStorage`, SDK keys are fake, and permissions only hide or disable UI. Do not reuse any of this as real security.
