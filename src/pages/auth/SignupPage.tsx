import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AtSign, User } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { FormAlert, PasswordField, TextField } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';
import { useAppStore } from '../../store/AppStore';
import { isValidEmail } from '../../lib/validation';
import { simulateLatency } from '../../lib/browser';

interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type SignupErrors = Partial<Record<keyof SignupForm, string>>;

function validate(form: SignupForm): SignupErrors {
  const errors: SignupErrors = {};
  if (!form.name.trim()) errors.name = 'Full name is required.';
  if (!form.email.trim()) errors.email = 'Work email is required.';
  else if (!isValidEmail(form.email)) errors.email = 'Enter a valid email address.';
  if (form.password.length < 8) errors.password = 'Use at least 8 characters.';
  else if (!/[a-zA-Z]/.test(form.password) || !/\d/.test(form.password))
    errors.password = 'Include at least one letter and one number.';
  if (!form.confirmPassword) errors.confirmPassword = 'Confirm your password.';
  else if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

export function SignupPage() {
  const { actions } = useAppStore();
  const navigate = useNavigate();
  const notify = useToast();
  const [form, setForm] = useState<SignupForm>({ name: '', email: '', password: '', confirmPassword: '' });
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const errors = submitted ? validate(form) : {};
  const update = (field: keyof SignupForm) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setFormError(undefined);
    if (Object.keys(validate(form)).length > 0) return;

    setLoading(true);
    await simulateLatency();
    const result = actions.signup({ name: form.name, email: form.email, password: form.password });
    setLoading(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    // An account that was invited earlier joins those organizations immediately.
    const { joined } = result.value;
    if (joined.length > 0) {
      notify(`Welcome! You joined ${joined.map((org) => org.name).join(', ')}.`);
      navigate('/overview', { replace: true });
    } else {
      navigate('/onboarding', { replace: true });
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {formError && <FormAlert>{formError}</FormAlert>}
        <TextField
          label="Full name"
          autoComplete="name"
          icon={<User size={16} />}
          value={form.name}
          onChange={update('name')}
          error={errors.name}
          autoFocus
        />
        <TextField
          label="Work email"
          type="email"
          autoComplete="email"
          icon={<AtSign size={16} />}
          value={form.email}
          onChange={update('email')}
          error={errors.email}
        />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
          hint="At least 8 characters, including a letter and a number."
        />
        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          error={errors.confirmPassword}
        />
        <Button type="submit" loading={loading} className="mt-2">
          Create account
        </Button>
        <p className="text-center text-xs text-muted">You'll set up your organization in the next step.</p>
      </form>
    </AuthLayout>
  );
}
