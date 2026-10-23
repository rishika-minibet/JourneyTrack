import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWorkspace } from '../../hooks/useWorkspace';

// PROTOTYPE ONLY: route guards based on mock session state, not real auth.

export function RequireAuth({ children }: { children: ReactNode }) {
  const { account } = useWorkspace();
  const location = useLocation();
  if (!account) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

/** Accounts without an organization are sent to onboarding. */
export function RequireOrganization({ children }: { children: ReactNode }) {
  const { organization } = useWorkspace();
  if (!organization) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export function PublicOnly({ children }: { children: ReactNode }) {
  const { account, organization } = useWorkspace();
  if (account) return <Navigate to={organization ? '/overview' : '/onboarding'} replace />;
  return <>{children}</>;
}
