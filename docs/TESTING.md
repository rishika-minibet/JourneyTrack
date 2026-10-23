# Testing guide

The project has no automated test suite yet. Use the walkthroughs below for manual verification. Start each one with **Reset demo data** (avatar menu), or clear `localStorage`.

## Automated checks

```bash
npm run typecheck   # strict TypeScript
npm run build       # typecheck + production build
```

## 1. Signup → onboarding → dashboard

1. Go to `/signup` and submit the empty form. Each field shows an error.
2. Enter mismatched passwords. "Passwords do not match." appears. The eye icon shows and hides the password.
3. Create an account. You are redirected to `/onboarding`, and organization details are not requested during signup.
4. **Step 1:** type `Test`. The slug auto-fills to `test` and reports that it is taken. Change the name to `Acme QA`, and the slug becomes `acme-qa`. The slug stays editable.
5. **Step 2:** project `Website`, URL `https://example.com`. An invalid URL is rejected.
6. **Step 3:** DEV and PROD are pre-selected and STAGING is optional. Add a custom environment such as `QA`, or tick "I'll set up environments later".
7. **Step 4:** add several invitation rows with Admin or Member roles. They appear under "Pending invitations". You can **Skip for now** or **Finish setup**.
8. You land on `/overview`. The new environment has no tracked users, and Members lists you as **Owner** with the pending invitations.

## 2. Login and protected routes

- While logged out, `/users` redirects to `/login`.
- Wrong credentials show "Incorrect email or password."
- While logged in, `/login` redirects to `/overview`.
- Log out from the avatar menu.

## 3. Organization switching and isolation

Log in as `owner@journeytrack.dev`.

| Context                     | Users page shows        |
| --------------------------- | ----------------------- |
| Test · Website · PROD       | 8 users (John Smith, Sarah Wilson, …) |
| Test · Website · DEV        | 3 users (Hana Sato, Sophia Martinez, Daniel Lee) |
| Test · Website · STAGING    | Empty state             |
| Test1 · Storefront · PROD   | 4 users (Lucas Rossi, Mia Kowalski, Chloe Thompson, Ryan Patel) |
| Test1 · Storefront · DEV    | 1 user (Noah Fischer)   |

- Switching organization from a user's detail page returns you to `/users`.
- With Test1 active, opening `/users/user_001` (a Test user) shows "User not found in the PROD environment".
- With Test1 active, opening `/projects/proj_test_website/environments` shows "Project not found".
- The Events and Overview pages change with the context in the same way.

## 4. Role experiences

| Log in as                 | Check                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `owner@` in **Test**      | Danger zone visible; can set Ben or Cara to Admin or Member; no Remove button on own row  |
| `owner@` in **Test1**     | Acts as Admin: no danger zone; cannot change Dev Kumar (the Owner); can only invite Members |
| `admin@` in **Test**      | Can edit the organization and manage projects and environments; can manage Cara only      |
| `member@`                 | No create, edit or invite buttons; org form disabled; SDK keys hidden; tracking pages work |

## 5. Projects and environments

- Create a project. The name is required, and "Create default DEV and PROD environments" is ticked by default. The new project becomes active.
- Renaming a project to an existing name is rejected.
- In a project's actions menu: View, Open environments, Set as active, Edit.
- On the environments page: create (duplicate names are rejected), rename, view details, copy key (with a toast), revoke (with confirmation, shown as "Revoked") and regenerate (with confirmation, shown as "Active" with a new key).
- Every environment row shows a unique ID.

## 6. Members and invitations

- Invite a member. Invalid emails, existing members and duplicate pending invitations are rejected.
- **Resend** updates "Last sent" and shows a toast saying no email was sent.
- **Cancel** asks for confirmation and removes the invitation from the list.
- Changing a role shows a toast. **Remove** asks for confirmation.
- Signing up as `new.hire@journeytrack.dev` joins Test as a Member automatically.

## 7. Existing Track User Activity regression

- The `/users` search filters by name, email and account ID.
- Clicking a row (or pressing Enter on it) opens `/users/:id`.
- On the details page, the User details and User attributes cards render, the **Activity feed / Tracked pages** tabs switch, and clicking an event expands its properties.
- **Back** returns to `/users`.

## Verification record

On 2026-10-23, all of the scenarios above were run in headless Chrome against `npm run build` + `vite preview`, using a throwaway Playwright script that was not committed. All 62 checks passed, including mobile width (390 px) with no horizontal page scroll. The only console error was a 404 for `/favicon.ico`; the project does not include a favicon.
