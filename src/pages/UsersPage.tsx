import { useMemo, useState } from 'react';
import { Radar, Search } from 'lucide-react';
import { UserTable } from '../components/users/UserTable';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { useTrackingData } from '../hooks/useTrackingData';
import { useWorkspace } from '../hooks/useWorkspace';
import { NoEnvironmentNotice } from '../components/users/NoEnvironmentNotice';

export function UsersPage() {
  const { project, environment } = useWorkspace();
  const { users } = useTrackingData();
  const [query, setQuery] = useState('');

  const byLastSeen = useMemo(() => [...users].sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt)), [users]);
  const term = query.trim().toLowerCase();
  const filtered = byLastSeen.filter((user) =>
    [user.name, user.email, user.accountId].some((field) => field.toLowerCase().includes(term)),
  );

  if (!environment) return <NoEnvironmentNotice title="Users" />;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-2xl font-semibold text-ink">Users</h1>
      <Card>
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">All users</h2>
            <p className="text-xs text-muted">
              Visitors tracked in {project?.name} · {environment.name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm whitespace-nowrap text-muted">
              {filtered.length} {filtered.length === 1 ? 'user' : 'users'}
            </span>
            <Input
              icon={<Search size={16} />}
              placeholder="Search users..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full sm:w-72"
              aria-label="Search users"
            />
          </div>
        </div>
        {users.length === 0 ? (
          <div className="border-t border-line">
            <EmptyState
              icon={<Radar size={20} />}
              title={`No visitors tracked in ${environment.name} yet`}
              description="Install the SDK with this environment's key to start tracking."
            />
          </div>
        ) : (
          <UserTable users={filtered} />
        )}
      </Card>
    </div>
  );
}
