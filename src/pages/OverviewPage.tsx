import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Eye, KeyRound, MousePointerClick, Users } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { INDICATOR, summary } from '../components/users/ActivityFeed';
import { NoEnvironmentNotice } from '../components/users/NoEnvironmentNotice';
import { useTrackingData } from '../hooks/useTrackingData';
import { useWorkspace } from '../hooks/useWorkspace';
import { getMembersForOrganization } from '../store/selectors';
import { maskKey } from '../lib/browser';
import { timeAgo } from '../utils/format';

const HOUR = 60 * 60_000;
const DAY = 24 * HOUR;

function Stat({ icon, label, value, hint }: { icon: ReactNode; label: string; value: number; hint: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className="text-brand">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-3xl font-semibold text-ink tabular-nums">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </Card>
  );
}

export function OverviewPage() {
  const { db, organization, project, projects, environment, can } = useWorkspace();
  const { users, events } = useTrackingData();

  const stats = useMemo(() => {
    const now = Date.now();
    const recent = events.filter((event) => now - new Date(event.timestamp).getTime() < DAY);
    const pageViews = recent.filter((event) => event.type === 'page_viewed');
    const counts = new Map<string, number>();
    for (const event of pageViews) {
      const path = String(event.properties?.pathname ?? '/');
      counts.set(path, (counts.get(path) ?? 0) + 1);
    }
    return {
      activeLastHour: users.filter((user) => now - new Date(user.lastSeenAt).getTime() < HOUR).length,
      events24h: recent.length,
      pageViews24h: pageViews.length,
      topPages: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [users, events]);

  if (!organization) return null;
  if (!environment) return <NoEnvironmentNotice title="Overview" />;

  const usersById = new Map(users.map((user) => [user.id, user]));
  const memberCount = getMembersForOrganization(db, organization.id).length;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-1 text-2xl font-semibold text-ink">Overview</h1>
      <p className="mb-6 text-sm text-muted">
        {project?.name} · {environment.name} — dummy data for this environment only.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Users size={16} />} label="Tracked users" value={users.length} hint="All time in this environment" />
        <Stat icon={<MousePointerClick size={16} />} label="Active users" value={stats.activeLastHour} hint="Seen in the last hour" />
        <Stat icon={<Activity size={16} />} label="Events" value={stats.events24h} hint="Last 24 hours" />
        <Stat icon={<Eye size={16} />} label="Page views" value={stats.pageViews24h} hint="Last 24 hours" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <Card title="Recent activity">
          {events.length === 0 ? (
            <p className="px-5 pb-8 text-sm text-muted">No events received in {environment.name} yet.</p>
          ) : (
            <ul>
              {events.slice(0, 8).map((event) => {
                const user = usersById.get(event.userId);
                return (
                  <li key={event.id} className="flex items-center gap-3 border-t border-line px-5 py-3 text-sm">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${INDICATOR[event.type]}`} />
                    <span className="min-w-0 flex-1 truncate">
                      {user ? (
                        <Link to={`/users/${user.id}`} className="font-medium text-ink hover:text-brand">
                          {user.name}
                        </Link>
                      ) : (
                        'Unknown user'
                      )}{' '}
                      <span className="text-muted">
                        {event.name.toLowerCase()}
                        {summary(event) ? ` · ${summary(event)}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted">{timeAgo(event.timestamp)}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t border-line px-5 py-3">
            <Link to="/users" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
              Track user activity <ArrowRight size={14} />
            </Link>
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card title="Top pages (24h)">
            {stats.topPages.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-muted">No page views yet.</p>
            ) : (
              <ol className="px-5 pb-3">
                {stats.topPages.map(([path, count]) => (
                  <li key={path} className="flex justify-between gap-3 border-t border-line py-2.5 text-sm">
                    <span className="truncate font-mono text-xs text-ink">{path}</span>
                    <span className="text-muted tabular-nums">{count}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card title="Workspace">
            <dl className="px-5 pb-3 text-sm">
              <div className="flex justify-between gap-3 border-t border-line py-2.5">
                <dt className="text-muted">Organization</dt>
                <dd className="text-ink">{organization.name}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-line py-2.5">
                <dt className="text-muted">Projects</dt>
                <dd className="text-ink">{projects.length}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-line py-2.5">
                <dt className="text-muted">Members</dt>
                <dd className="text-ink">{memberCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line py-2.5">
                <dt className="flex items-center gap-1.5 text-muted">
                  <KeyRound size={14} /> SDK key
                </dt>
                <dd className="flex items-center gap-2">
                  {can('environments.viewKeys') && (
                    <code className="hidden font-mono text-xs text-muted xl:inline">{maskKey(environment.sdkKey.value)}</code>
                  )}
                  <Badge tone={environment.sdkKey.status === 'active' ? 'green' : 'rose'}>
                    {environment.sdkKey.status === 'active' ? 'Active' : 'Revoked'}
                  </Badge>
                </dd>
              </div>
            </dl>
            {project && (
              <div className="border-t border-line px-5 py-3">
                <Link
                  to={`/projects/${project.id}/environments`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                >
                  Manage environments <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
