import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Mail, Plus, Trash2 } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { FormAlert, SelectField, TextField, selectClasses } from '../../components/ui/Field';
import { Badge, ENVIRONMENT_TYPE_LABELS, EnvironmentBadge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { useWorkspace } from '../../hooks/useWorkspace';
import type { EnvironmentDraft, InvitationDraft } from '../../store/AppStore';
import { isSlugTaken } from '../../store/selectors';
import type { AssignableRole, EnvironmentType } from '../../types/account';
import { createId, slugify } from '../../lib/ids';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../lib/permissions';
import { emptyToUndefined, isValidEmail, isValidSlug, normalizeEmail, optionalUrlError } from '../../lib/validation';
import { simulateLatency } from '../../lib/browser';

const STEPS = ['Organization', 'Project', 'Environments', 'Invite teammates'] as const;

const DEFAULT_ENVIRONMENTS: (EnvironmentDraft & { defaultSelected: boolean; description: string })[] = [
  { name: 'DEV', type: 'development', defaultSelected: true, description: 'Local and development builds.' },
  { name: 'STAGING', type: 'staging', defaultSelected: false, description: 'Optional pre-release testing.' },
  { name: 'PROD', type: 'production', defaultSelected: true, description: 'Your live website traffic.' },
];

interface InviteRow extends InvitationDraft {
  key: string;
}

const newInviteRow = (): InviteRow => ({ key: createId('row'), email: '', role: 'member' });

export function OnboardingPage() {
  const { db, account, organizations, actions } = useWorkspace();
  const navigate = useNavigate();
  const notify = useToast();
  const hasOrganizations = organizations.length > 0;

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [orgName, setOrgName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [orgWebsite, setOrgWebsite] = useState('');
  // Step 2
  const [projectName, setProjectName] = useState('');
  const [projectWebsite, setProjectWebsite] = useState('');
  // Step 3
  const [selectedDefaults, setSelectedDefaults] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(DEFAULT_ENVIRONMENTS.map((env) => [env.name, env.defaultSelected])),
  );
  const [customEnvironments, setCustomEnvironments] = useState<EnvironmentDraft[]>([]);
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<EnvironmentType>('development');
  const [customError, setCustomError] = useState<string>();
  const [environmentsLater, setEnvironmentsLater] = useState(false);
  // Step 4
  const [invites, setInvites] = useState<InviteRow[]>([newInviteRow()]);
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({});

  const [touched, setTouched] = useState<Record<number, boolean>>({});
  const showErrors = touched[step] ?? false;

  const orgErrors = {
    name: orgName.trim() ? undefined : 'Organization name is required.',
    slug: !slug
      ? 'Slug is required.'
      : !isValidSlug(slug)
        ? 'Use lowercase letters, numbers and single hyphens.'
        : isSlugTaken(db, slug)
          ? `"${slug}" is already taken. Try another slug.`
          : undefined,
    website: optionalUrlError(orgWebsite),
  };
  const projectErrors = {
    name: projectName.trim() ? undefined : 'Project name is required.',
    website: optionalUrlError(projectWebsite),
  };

  const chosenEnvironments: EnvironmentDraft[] = environmentsLater
    ? []
    : [
        ...DEFAULT_ENVIRONMENTS.filter((env) => selectedDefaults[env.name]).map(({ name, type }) => ({ name, type })),
        ...customEnvironments,
      ];

  const hasErrors = (errors: Record<string, string | undefined>) => Object.values(errors).some(Boolean);

  const next = (event?: FormEvent) => {
    event?.preventDefault();
    setTouched((current) => ({ ...current, [step]: true }));
    setError(undefined);
    if (step === 0 && hasErrors(orgErrors)) return;
    if (step === 1 && hasErrors(projectErrors)) return;
    if (step === 2 && !environmentsLater && chosenEnvironments.length === 0) {
      setError('Select at least one environment, or choose "Set up later".');
      return;
    }
    setStep((current) => current + 1);
  };

  const addCustomEnvironment = () => {
    const name = customName.trim().toUpperCase();
    const taken = [...DEFAULT_ENVIRONMENTS.filter((env) => selectedDefaults[env.name]), ...customEnvironments].some(
      (env) => env.name === name,
    );
    if (!name) return setCustomError('Enter a name.');
    if (name.length > 24) return setCustomError('Use 24 characters or fewer.');
    if (taken) return setCustomError('That environment is already in the list.');
    setCustomEnvironments((list) => [...list, { name, type: customType }]);
    setCustomName('');
    setCustomError(undefined);
  };

  const validateInvites = (): InvitationDraft[] | undefined => {
    const errors: Record<string, string> = {};
    const seen = new Set<string>();
    const valid: InvitationDraft[] = [];
    for (const row of invites) {
      const email = normalizeEmail(row.email);
      if (!email) continue;
      if (!isValidEmail(email)) errors[row.key] = 'Enter a valid email address.';
      else if (email === account?.email) errors[row.key] = "You're already the owner.";
      else if (seen.has(email)) errors[row.key] = 'Duplicate email.';
      else valid.push({ email, role: row.role });
      seen.add(email);
    }
    setInviteErrors(errors);
    return Object.keys(errors).length > 0 ? undefined : valid;
  };

  const finish = async (withInvites: boolean) => {
    const invitations = withInvites ? validateInvites() : [];
    if (!invitations) return;
    setSubmitting(true);
    setError(undefined);
    await simulateLatency(600);
    const result = actions.createOrganization({
      organization: { name: orgName, slug, websiteUrl: emptyToUndefined(orgWebsite) },
      project: { name: projectName, websiteUrl: emptyToUndefined(projectWebsite) },
      environments: chosenEnvironments,
      invitations,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      setStep(0);
      return;
    }
    const inviteNote = invitations.length > 0 ? ` ${invitations.length} invitation(s) pending.` : '';
    notify(`${result.value.name} is ready.${inviteNote}`);
    navigate('/overview', { replace: true });
  };

  return (
    <AuthLayout
      width="lg"
      title={hasOrganizations ? 'Create a new organization' : `Welcome${account ? `, ${account.name.split(' ')[0]}` : ''}! Let's set up your workspace`}
      subtitle={
        hasOrganizations ? (
          <Link to="/overview" className="font-medium text-brand hover:underline">
            Cancel and go back
          </Link>
        ) : (
          <>
            Signed in as {account?.email}.{' '}
            <button
              type="button"
              className="font-medium text-brand hover:underline"
              onClick={() => {
                actions.logout();
                navigate('/login');
              }}
            >
              Log out
            </button>
          </>
        )
      }
    >
      <Stepper current={step} />

      {error && (
        <div className="mt-5">
          <FormAlert>{error}</FormAlert>
        </div>
      )}

      {step === 0 && (
        <form onSubmit={next} noValidate className="mt-6 flex flex-col gap-4">
          <TextField
            label="Organization name"
            value={orgName}
            placeholder="Test"
            autoFocus
            onChange={(event) => {
              setOrgName(event.target.value);
              if (!slugEdited) setSlug(slugify(event.target.value));
            }}
            error={showErrors ? orgErrors.name : undefined}
          />
          <TextField
            label="URL slug"
            value={slug}
            placeholder="test"
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(event.target.value.toLowerCase().replace(/\s+/g, '-'));
            }}
            error={slug || showErrors ? orgErrors.slug : undefined}
            hint={<>app.journeytrack.dev/<span className="font-medium text-ink">{slug || 'your-slug'}</span></>}
          />
          <TextField
            label="Company website"
            optional
            type="url"
            placeholder="https://example.com"
            value={orgWebsite}
            onChange={(event) => setOrgWebsite(event.target.value)}
            error={showErrors ? orgErrors.website : undefined}
          />
          <StepActions>
            <Button type="submit">Continue</Button>
          </StepActions>
        </form>
      )}

      {step === 1 && (
        <form onSubmit={next} noValidate className="mt-6 flex flex-col gap-4">
          <p className="text-sm text-muted">
            A project is one website or app you want to track. {orgName.trim() || 'Your organization'} can add more
            projects later.
          </p>
          <TextField
            label="Project name"
            value={projectName}
            placeholder="Website"
            autoFocus
            onChange={(event) => setProjectName(event.target.value)}
            error={showErrors ? projectErrors.name : undefined}
          />
          <TextField
            label="Website URL"
            optional
            type="url"
            placeholder="https://example.com"
            value={projectWebsite}
            onChange={(event) => setProjectWebsite(event.target.value)}
            error={showErrors ? projectErrors.website : undefined}
          />
          <StepActions onBack={() => setStep(0)}>
            <Button type="submit">Continue</Button>
          </StepActions>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={next} noValidate className="mt-6 flex flex-col gap-4">
          <p className="text-sm text-muted">
            Each environment gets its own ID and mock SDK key, so development traffic never mixes with production data.
          </p>
          <fieldset disabled={environmentsLater} className="flex flex-col gap-2 disabled:opacity-50">
            <legend className="sr-only">Default environments</legend>
            {DEFAULT_ENVIRONMENTS.map((env) => (
              <label
                key={env.name}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-line px-4 py-3 hover:bg-slate-50 has-[:checked]:border-brand has-[:checked]:bg-green-50/60"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand"
                  checked={selectedDefaults[env.name] ?? false}
                  onChange={(event) => setSelectedDefaults((current) => ({ ...current, [env.name]: event.target.checked }))}
                />
                <EnvironmentBadge name={env.name} type={env.type} />
                <span className="text-sm text-muted">{env.description}</span>
              </label>
            ))}
            {customEnvironments.map((env) => (
              <div key={env.name} className="flex items-center gap-3 rounded-lg border border-brand bg-green-50/60 px-4 py-3">
                <Check size={16} className="text-brand" />
                <EnvironmentBadge name={env.name} type={env.type} />
                <span className="flex-1 text-sm text-muted">{ENVIRONMENT_TYPE_LABELS[env.type]}</span>
                <button
                  type="button"
                  onClick={() => setCustomEnvironments((list) => list.filter((item) => item.name !== env.name))}
                  className="rounded-lg p-1.5 text-muted hover:bg-white hover:text-rose-600"
                  aria-label={`Remove ${env.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
              <TextField
                label="Additional environment"
                optional
                placeholder="QA"
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addCustomEnvironment();
                  }
                }}
                error={customError}
                fieldClassName="flex-1"
              />
              <SelectField
                label="Type"
                value={customType}
                onChange={(event) => setCustomType(event.target.value as EnvironmentType)}
                fieldClassName="sm:w-40"
              >
                {(Object.keys(ENVIRONMENT_TYPE_LABELS) as EnvironmentType[]).map((type) => (
                  <option key={type} value={type}>
                    {ENVIRONMENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </SelectField>
              <Button variant="secondary" icon={<Plus size={16} />} onClick={addCustomEnvironment} className="sm:mt-7">
                Add
              </Button>
            </div>
          </fieldset>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand"
              checked={environmentsLater}
              onChange={(event) => setEnvironmentsLater(event.target.checked)}
            />
            I'll set up environments later
          </label>

          <StepActions onBack={() => setStep(1)}>
            <Button type="submit">Continue</Button>
          </StepActions>
        </form>
      )}

      {step === 3 && (
        <div className="mt-6 flex flex-col gap-4">
          <p className="text-sm text-muted">
            You'll be the <strong className="text-ink">Owner</strong> of {orgName}. Invite teammates as Admins or Members —
            invitations stay pending until they sign up. No emails are sent in this prototype.
          </p>
          <ul className="flex flex-col gap-3">
            {invites.map((row, index) => (
              <li key={row.key} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <TextField
                  label={`Teammate ${index + 1} email`}
                  type="email"
                  placeholder="teammate@company.com"
                  icon={<Mail size={16} />}
                  value={row.email}
                  onChange={(event) =>
                    setInvites((list) => list.map((item) => (item.key === row.key ? { ...item, email: event.target.value } : item)))
                  }
                  error={inviteErrors[row.key]}
                  fieldClassName="flex-1"
                />
                <div className="flex items-end gap-2 sm:mt-7">
                  <select
                    aria-label={`Teammate ${index + 1} role`}
                    value={row.role}
                    onChange={(event) =>
                      setInvites((list) =>
                        list.map((item) => (item.key === row.key ? { ...item, role: event.target.value as AssignableRole } : item)),
                      )
                    }
                    className={`${selectClasses} sm:w-32`}
                  >
                    {(['admin', 'member'] as const).map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setInvites((list) => (list.length > 1 ? list.filter((item) => item.key !== row.key) : [newInviteRow()]))}
                    className="rounded-lg p-2 text-muted hover:bg-slate-100 hover:text-rose-600"
                    aria-label={`Remove teammate ${index + 1}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div>
            <Button variant="ghost" size="sm" icon={<Plus size={16} />} onClick={() => setInvites((list) => [...list, newInviteRow()])}>
              Add another
            </Button>
          </div>

          <dl className="grid gap-2 rounded-lg bg-slate-50 p-3 text-xs sm:grid-cols-2">
            {(['admin', 'member'] as const).map((role) => (
              <div key={role}>
                <dt className="font-medium text-ink">{ROLE_LABELS[role]}</dt>
                <dd className="text-muted">{ROLE_DESCRIPTIONS[role]}</dd>
              </div>
            ))}
          </dl>

          <PendingPreview invites={invites} />

          <StepActions onBack={() => setStep(2)}>
            <Button variant="secondary" onClick={() => finish(false)} disabled={submitting}>
              Skip for now
            </Button>
            <Button onClick={() => finish(true)} loading={submitting}>
              Finish setup
            </Button>
          </StepActions>
        </div>
      )}
    </AuthLayout>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Onboarding progress">
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} aria-current={active ? 'step' : undefined} className="flex flex-col gap-2">
            <span className={`h-1.5 rounded-full ${done || active ? 'bg-brand' : 'bg-slate-200'}`} />
            <span className={`text-xs ${active ? 'font-semibold text-ink' : 'text-muted'}`}>
              <span className="hidden sm:inline">{index + 1}. </span>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function StepActions({ onBack, children }: { onBack?: () => void; children: ReactNode }) {
  return (
    <div className="mt-4 flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
        )}
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row">{children}</div>
    </div>
  );
}

function PendingPreview({ invites }: { invites: InviteRow[] }) {
  const filled = invites.filter((row) => isValidEmail(row.email));
  if (filled.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">Pending invitations</h3>
      <ul className="divide-y divide-line rounded-lg border border-line">
        {filled.map((row) => (
          <li key={row.key} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <span className="truncate text-ink">{normalizeEmail(row.email)}</span>
            <span className="flex shrink-0 gap-2">
              <Badge tone="slate">{ROLE_LABELS[row.role]}</Badge>
              <Badge tone="amber">Pending</Badge>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
