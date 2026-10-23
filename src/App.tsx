import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { PublicOnly, RequireAuth, RequireOrganization } from './components/routing/guards';
import { UsersPage } from './pages/UsersPage';
import { UserDetailsPage } from './pages/UserDetailsPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { OverviewPage } from './pages/OverviewPage';
import { EventsPage } from './pages/EventsPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { ProjectDetailsPage } from './pages/projects/ProjectDetailsPage';
import { EnvironmentsPage } from './pages/projects/EnvironmentsPage';
import { OrganizationSettingsPage } from './pages/settings/OrganizationSettingsPage';
import { MembersPage } from './pages/settings/MembersPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />
      <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />

      <Route
        element={
          <RequireAuth>
            <RequireOrganization>
              <AppLayout />
            </RequireOrganization>
          </RequireAuth>
        }
      >
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:userId" element={<UserDetailsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
        <Route path="/projects/:projectId/environments" element={<EnvironmentsPage />} />
        <Route path="/settings" element={<Navigate to="/settings/organization" replace />} />
        <Route path="/settings/organization" element={<OrganizationSettingsPage />} />
        <Route path="/settings/members" element={<MembersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
}
