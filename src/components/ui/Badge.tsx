import type { ReactNode } from 'react';
import type { EnvironmentType, OrganizationRole } from '../../types/account';
import { ROLE_LABELS } from '../../lib/permissions';

export type BadgeTone = 'green' | 'slate' | 'amber' | 'rose' | 'sky' | 'violet';

const TONES: Record<BadgeTone, string> = {
  green: 'bg-brand-light text-brand-dark',
  slate: 'bg-slate-100 text-slate-600',
  amber: 'bg-amber-100 text-amber-800',
  rose: 'bg-rose-100 text-rose-700',
  sky: 'bg-sky-100 text-sky-700',
  violet: 'bg-violet-100 text-violet-700',
};

export function Badge({ tone = 'slate', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${TONES[tone]}`}>
      {children}
    </span>
  );
}

const ROLE_TONES: Record<OrganizationRole, BadgeTone> = { owner: 'violet', admin: 'sky', member: 'slate' };

export function RoleBadge({ role }: { role: OrganizationRole }) {
  return <Badge tone={ROLE_TONES[role]}>{ROLE_LABELS[role]}</Badge>;
}

const ENVIRONMENT_TONES: Record<EnvironmentType, BadgeTone> = {
  development: 'sky',
  staging: 'amber',
  production: 'green',
};

export const ENVIRONMENT_TYPE_LABELS: Record<EnvironmentType, string> = {
  development: 'Development',
  staging: 'Staging',
  production: 'Production',
};

export function EnvironmentBadge({ name, type }: { name: string; type: EnvironmentType }) {
  return <Badge tone={ENVIRONMENT_TONES[type]}>{name}</Badge>;
}
