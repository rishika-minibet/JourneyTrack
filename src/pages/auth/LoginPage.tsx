import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AtSign } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { FormAlert, PasswordField, TextField } from '../../components/ui/Field';
import { useAppStore } from '../../store/AppStore';
import { getOrganizationsForAccount } from '../../store/selectors';
import { DEMO_PASSWORD, seedAccounts, seedMemberships, seedOrganizations } from '../../data/seed';
import { ROLE_LABELS } from '../../lib/permissions';
import { isValidEmail } from '../../lib/validation';
import { simulateLatency } from '../../lib/browser';

interface LoginErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {};
  if (!email.trim()) errors.email = 'Email is required.';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  return errors;
}

// Describes each seeded account's role per organization, e.g. "Owner in Test · Admin in Test1".
function describeDemoAccount(accountId: string): string {
  return seedMemberships
    .filter((membership) => membership.userId === accountId)
    .map((membership) => {
      const org = seedOrganizations.find((candidate) => candidate.id === membership.organizationId);
      return `${ROLE_LABELS[membership.role]} in ${org?.name ?? '?'}`;
    })
    .join(' · ');
}

export function LoginPage() {
  const { state, actions } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const errors = submitted ? validate(email, password) : {};

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setFormError(undefined);
    if (Object.keys(validate(email, password)).length > 0) return;

    setLoading(true);
    await simulateLatency();
    const result = actions.login(email, password);
    setLoading(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    const hasOrganization = getOrganizationsForAccount(state.db, result.value.id).length > 0;
    navigate(hasOrganization ? from ?? '/overview' : '/onboarding', { replace: true });
  };

  return (
    <AuthLayout
      title="Log in to JourneyTrack"
      subtitle={
        <>
          New here?{' '}
          <Link to="/signup" className="font-medium text-brand hover:underline">
            Create an account
          </Link>
        </>
      }
      aside={
        <section className="mt-4 rounded-xl border border-dashed border-line bg-white p-4" aria-labelledby="demo-accounts">
          <h2 id="demo-accounts" className="text-sm font-semibold text-ink">
            Demo accounts
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Password for all: <code className="rounded bg-slate-100 px-1">{DEMO_PASSWORD}</code>. Click to fill.
          </p>
          <ul className="mt-3 flex flex-col gap-1">
            {seedAccounts.map((account) => (
              <li key={account.id}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(DEMO_PASSWORD);
                    setFormError(undefined);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                >
                  <span className="block text-sm font-medium text-ink">
                    {account.name} <span className="font-normal text-muted">· {account.email}</span>
                  </span>
                  <span className="block text-xs text-muted">{describeDemoAccount(account.id)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {formError && <FormAlert>{formError}</FormAlert>}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          icon={<AtSign size={16} />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          autoFocus
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <Button type="submit" loading={loading} className="mt-2">
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
}
