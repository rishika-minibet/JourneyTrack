import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getUserById } from '../data/users';
import { getEventsForUser } from '../data/events';
import { Avatar } from '../components/ui/Avatar';
import { UserDetails } from '../components/users/UserDetails';
import { UserAttributes } from '../components/users/UserAttributes';
import { ActivityFeed } from '../components/users/ActivityFeed';

export function UserDetailsPage() {
  const { userId = '' } = useParams();
  const user = getUserById(userId);

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl">
        <BackLink />
        <p className="mt-6 text-muted">User not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center gap-4">
        <BackLink />
        <Avatar name={user.name} size="lg" />
        <h1 className="min-w-0 truncate text-2xl font-semibold text-ink">{user.name}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <UserDetails user={user} />
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <UserAttributes user={user} />
        </div>
        <div className="lg:col-start-1 lg:row-start-2">
          <ActivityFeed events={getEventsForUser(user.id)} />
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/users"
      className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand hover:bg-brand-light"
    >
      <ArrowLeft size={18} />
      Back
    </Link>
  );
}
