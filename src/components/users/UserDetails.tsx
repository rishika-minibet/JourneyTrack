import { AtSign, Clock, Eye, Hash } from 'lucide-react';
import type { ReactNode } from 'react';
import type { User } from '../../types/user';
import { formatDateTime, timeAgo } from '../../utils/format';
import { Card } from '../ui/Card';

interface DetailProps {
  icon: ReactNode;
  label: string;
  value: string;
  title?: string;
}

function Detail({ icon, label, value, title }: DetailProps) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 text-muted">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm break-all text-ink" title={title}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function UserDetails({ user }: { user: User }) {
  return (
    <Card title="User details">
      <div className="grid gap-5 px-5 pb-5 sm:grid-cols-2">
        <Detail icon={<AtSign size={16} />} label="Email" value={user.email} />
        <Detail icon={<Eye size={16} />} label="Last Seen" value={timeAgo(user.lastSeenAt)} title={formatDateTime(user.lastSeenAt)} />
        <Detail icon={<Hash size={16} />} label="Account ID" value={user.accountId} />
        <Detail icon={<Clock size={16} />} label="Signed Up" value={timeAgo(user.signedUpAt)} title={formatDateTime(user.signedUpAt)} />
      </div>
    </Card>
  );
}
