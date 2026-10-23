import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { INDICATOR, summary } from '../components/users/ActivityFeed';
import { NoEnvironmentNotice } from '../components/users/NoEnvironmentNotice';
import { useTrackingData } from '../hooks/useTrackingData';
import { useWorkspace } from '../hooks/useWorkspace';
import { formatDateTime, timeAgo } from '../utils/format';

type Filter = 'all' | 'pages';
const PAGE_SIZE = 50;

export function EventsPage() {
  const { project, environment } = useWorkspace();
  const { users, events } = useTrackingData();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const pageViews = useMemo(() => events.filter((event) => event.type === 'page_viewed'), [events]);

  const term = query.trim().toLowerCase();
  const visible = (filter === 'pages' ? pageViews : events).filter((event) => {
    if (!term) return true;
    const user = usersById.get(event.userId);
    return [event.name, summary(event) ?? '', user?.name ?? '', user?.email ?? ''].some((field) =>
      field.toLowerCase().includes(term),
    );
  });

  if (!environment) return <NoEnvironmentNotice title="Events" />;

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All events', count: events.length },
    { id: 'pages', label: 'Page views', count: pageViews.length },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-2xl font-semibold text-ink">Events</h1>
      <Card>
        <div className="flex flex-col gap-3 px-5 pt-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">Event stream</h2>
            <p className="text-xs text-muted">
              Raw events received from {project?.name} · {environment.name}
            </p>
          </div>
          <Input
            icon={<Search size={16} />}
            placeholder="Search events, pages or users..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(PAGE_SIZE);
            }}
            className="w-full sm:w-80"
            aria-label="Search events"
          />
        </div>

        <div className="mt-3 flex gap-6 overflow-x-auto border-b border-line px-5" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filter === tab.id}
              onClick={() => {
                setFilter(tab.id);
                setLimit(PAGE_SIZE);
              }}
              className={`-mb-px border-b-2 pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
                filter === tab.id ? 'border-brand text-brand-dark' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {tab.label} <span className="text-muted">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-line bg-slate-50 text-xs font-medium tracking-wide text-muted uppercase">
                <th className="px-5 py-3">Event</th>
                <th className="px-5 py-3">Details</th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {visible.slice(0, limit).map((event) => {
                const user = usersById.get(event.userId);
                return (
                  <tr key={event.id} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${INDICATOR[event.type]}`} />
                        <span className="font-medium text-ink">{event.name}</span>
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-5 py-3 text-muted">{summary(event) ?? '—'}</td>
                    <td className="px-5 py-3">
                      {user ? (
                        <Link to={`/users/${user.id}`} className="font-medium text-brand hover:underline">
                          {user.name}
                        </Link>
                      ) : (
                        <span className="text-muted">Unknown</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted" title={formatDateTime(event.timestamp)}>
                      {timeAgo(event.timestamp)}
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-muted">
                    {events.length === 0 ? `No events received in ${environment.name} yet.` : 'No events match your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {visible.length > limit && (
          <div className="border-t border-line px-5 py-3 text-center">
            <Button variant="ghost" size="sm" onClick={() => setLimit((value) => value + PAGE_SIZE)}>
              Show more ({visible.length - limit} remaining)
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
