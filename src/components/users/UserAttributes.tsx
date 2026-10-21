import type { ReactNode } from 'react';
import type { User } from '../../types/user';
import { formatDateTime, timeAgo } from '../../utils/format';
import { Card } from '../ui/Card';

function BooleanValue({ value }: { value: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        value ? 'bg-brand-light text-brand-dark' : 'bg-slate-100 text-muted'
      }`}
    >
      {String(value)}
    </span>
  );
}

export function UserAttributes({ user }: { user: User }) {
  const rows: [string, ReactNode][] = [
    ['Account ID', user.accountId],
    ['Country', user.country],
    ['Device Type', user.deviceType],
    ['Email', user.email],
    ['First Seen', <span title={formatDateTime(user.firstSeenAt)}>{timeAgo(user.firstSeenAt)}</span>],
    ['Last Seen', <span title={formatDateTime(user.lastSeenAt)}>{timeAgo(user.lastSeenAt)}</span>],
    ['Name', user.name],
    ['Is Email Verified', <BooleanValue value={user.isEmailVerified} />],
    ['Is Internal User', <BooleanValue value={user.isInternalUser} />],
    ['Is FTD Completed', <BooleanValue value={user.isFtdCompleted} />],
  ];

  return (
    <Card title="User attributes">
      <dl className="px-5 pb-3">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 border-t border-line py-3 text-sm">
            <dt className="text-muted">{label}</dt>
            <dd className="break-all text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
