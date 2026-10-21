import { useState } from 'react';
import { Search } from 'lucide-react';
import { users } from '../data/users';
import { UserTable } from '../components/users/UserTable';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

const byLastSeen = [...users].sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));

export function UsersPage() {
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();
  const filtered = byLastSeen.filter((user) =>
    [user.name, user.email, user.accountId].some((field) => field.toLowerCase().includes(term)),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-2xl font-semibold text-ink">Users</h1>
      <Card>
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">All users</h2>
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
        <UserTable users={filtered} />
      </Card>
    </div>
  );
}
