import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { AnalyticsEvent, EventType } from '../../types/event';
import { formatDate, formatTime, humanizeKey } from '../../utils/format';
import { Card } from '../ui/Card';

const INDICATOR: Record<EventType, string> = {
  page_viewed: 'bg-green-500',
  login: 'bg-sky-500',
  logout: 'bg-slate-400',
  signup: 'bg-violet-500',
  game_opened: 'bg-amber-500',
  game_closed: 'bg-amber-300',
  mission_started: 'bg-teal-400',
  mission_completed: 'bg-teal-600',
  profile_updated: 'bg-indigo-400',
  deposit: 'bg-emerald-600',
  withdrawal: 'bg-rose-400',
};

type Filter = 'all' | 'pages';

// The short secondary text shown next to the event name.
function summary(event: AnalyticsEvent): string | undefined {
  const props = event.properties;
  if (!props) return undefined;
  if (event.type === 'page_viewed') return String(props.pathname);
  if (props.gameName) return String(props.gameName);
  if (props.missionName) return String(props.missionName);
  if (props.amount !== undefined) return `${props.amount} ${props.currency ?? ''}`.trim();
  return undefined;
}

function groupByDate(events: AnalyticsEvent[]): [string, AnalyticsEvent[]][] {
  const groups = new Map<string, AnalyticsEvent[]>();
  for (const event of events) {
    const date = formatDate(event.timestamp);
    groups.set(date, [...(groups.get(date) ?? []), event]);
  }
  return [...groups.entries()];
}

function EventItem({ event, expanded, onToggle }: { event: AnalyticsEvent; expanded: boolean; onToggle: () => void }) {
  const detail = summary(event);
  const properties = Object.entries(event.properties ?? {});

  return (
    <li className="border-t border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={`flex w-full items-center gap-4 px-5 py-3 text-left text-sm hover:bg-slate-50 ${expanded ? 'bg-slate-50' : ''}`}
      >
        <span className="w-16 shrink-0 text-muted tabular-nums">{formatTime(event.timestamp)}</span>
        <span className={`h-2 w-2 shrink-0 rounded-full ${INDICATOR[event.type]}`} />
        <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3">
          <span className="font-medium text-ink">{event.name}</span>
          {detail && <span className="truncate text-muted">{detail}</span>}
        </span>
        <ChevronRight size={16} className={`shrink-0 text-muted transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <dl className="mx-5 mb-3 ml-[6.5rem] rounded-lg border border-line bg-white text-sm max-sm:ml-5">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3 px-4 py-2">
            <dt className="text-muted">Time</dt>
            <dd className="text-ink">{new Date(event.timestamp).toLocaleString('en-US')}</dd>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3 border-t border-line px-4 py-2">
            <dt className="text-muted">Event Type</dt>
            <dd className="font-mono text-xs text-ink">{event.type}</dd>
          </div>
          {properties.map(([key, value]) => (
            <div key={key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3 border-t border-line px-4 py-2">
              <dt className="text-muted">{humanizeKey(key)}</dt>
              <dd className="break-all text-ink">
                {key === 'url' ? (
                  <a href={String(value)} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                    {String(value)}
                  </a>
                ) : (
                  String(value)
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}

export function ActivityFeed({ events }: { events: AnalyticsEvent[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pageViews = events.filter((event) => event.type === 'page_viewed');
  const visible = filter === 'pages' ? pageViews : events;
  const groups = groupByDate(visible);

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'Activity feed', count: events.length },
    { id: 'pages', label: 'Tracked pages', count: pageViews.length },
  ];

  return (
    <Card>
      <div className="flex gap-6 overflow-x-auto border-b border-line px-5 pt-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
              filter === tab.id ? 'border-brand text-brand-dark' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {tab.label} <span className="text-muted">({tab.count})</span>
          </button>
        ))}
      </div>

      {groups.length === 0 && <p className="px-5 py-12 text-center text-sm text-muted">No activity tracked yet.</p>}

      {groups.map(([date, items]) => (
        <div key={date}>
          <h3 className="px-5 pt-5 pb-2 text-xs font-semibold text-ink">{date}</h3>
          <ul>
            {items.map((event) => (
              <EventItem
                key={event.id}
                event={event}
                expanded={expandedId === event.id}
                onToggle={() => setExpandedId(expandedId === event.id ? null : event.id)}
              />
            ))}
          </ul>
        </div>
      ))}
    </Card>
  );
}
