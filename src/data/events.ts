import type { AnalyticsEvent, EventPropertyValue, EventType } from '../types/event';
import type { User } from '../types/user';
import { users } from './users';
import { TRACKED_SITE_URLS } from './seed';

const DEFAULT_SITE_URL = 'https://example.com';

interface Step {
  type: EventType;
  name: string;
  // Minutes before the end of the session.
  offset: number;
  properties?: Record<string, EventPropertyValue>;
}

const games = [
  { id: 'piggytap', name: 'Piggy Tap' },
  { id: 'gold-rush', name: 'Gold Rush' },
  { id: 'lucky-spin', name: 'Lucky Spin' },
  { id: 'aviator', name: 'Aviator' },
];

function page(baseUrl: string, offset: number, pathname: string, title: string): Step {
  return {
    type: 'page_viewed',
    name: 'Page Viewed',
    offset,
    properties: { pathname, title, url: `${baseUrl}${pathname}` },
  };
}

// A recent session: login, browse, play a game, run a mission, update profile.
function recentSession(seed: number, baseUrl: string): Step[] {
  const game = games[seed % games.length];
  const mission = (seed % 7) + 1;
  return [
    page(baseUrl, 0, '/settings/profile', 'My Profile'),
    { type: 'profile_updated', name: 'Profile Updated', offset: 2, properties: { field: 'display_name' } },
    page(baseUrl, 4, '/settings/profile', 'My Profile'),
    { type: 'mission_completed', name: 'Mission Completed', offset: 9, properties: { missionId: `mission_${mission}`, missionName: `Mission ${mission}`, reward: '50 coins' } },
    { type: 'game_closed', name: 'Game Closed', offset: 10, properties: { gameId: game.id, gameName: game.name, durationSeconds: 540 } },
    { type: 'mission_started', name: 'Mission Started', offset: 17, properties: { missionId: `mission_${mission}`, missionName: `Mission ${mission}` } },
    { type: 'game_opened', name: 'Game Opened', offset: 19, properties: { gameId: game.id, gameName: game.name, pathname: `/game/${game.id}` } },
    page(baseUrl, 20, `/game/${game.id}`, game.name),
    page(baseUrl, 22, '/casino', 'Casino'),
    { type: 'deposit', name: 'Deposit', offset: 25, properties: { amount: 50 + (seed % 5) * 25, currency: 'USD', method: 'card' } },
    page(baseUrl, 26, '/wallet/deposit', 'Deposit'),
    { type: 'login', name: 'Login', offset: 28, properties: { method: 'email' } },
    page(baseUrl, 29, '/login', 'Login'),
  ];
}

// An earlier session the previous day.
function earlierSession(seed: number, baseUrl: string): Step[] {
  const game = games[(seed + 1) % games.length];
  return [
    { type: 'logout', name: 'Logout', offset: 0 },
    { type: 'withdrawal', name: 'Withdrawal', offset: 3, properties: { amount: 20 + (seed % 4) * 10, currency: 'USD', method: 'bank_transfer', status: 'pending' } },
    page(baseUrl, 4, '/wallet/withdraw', 'Withdraw'),
    { type: 'game_closed', name: 'Game Closed', offset: 8, properties: { gameId: game.id, gameName: game.name, durationSeconds: 780 } },
    { type: 'game_opened', name: 'Game Opened', offset: 21, properties: { gameId: game.id, gameName: game.name, pathname: `/game/${game.id}` } },
    page(baseUrl, 22, `/game/${game.id}`, game.name),
    page(baseUrl, 24, '/casino', 'Casino'),
    page(baseUrl, 26, '/', 'Home'),
    { type: 'signup', name: 'Signup', offset: 28, properties: { method: 'email', referrer: 'google' } },
    page(baseUrl, 30, '/signup', 'Sign Up'),
  ];
}

const MINUTE = 60_000;

function buildSession(user: User, end: number, steps: Step[], prefix: string): AnalyticsEvent[] {
  return steps.map((step, index) => ({
    id: `${user.id}_${prefix}_${String(index + 1).padStart(3, '0')}`,
    environmentId: user.environmentId,
    userId: user.id,
    type: step.type,
    name: step.name,
    timestamp: new Date(end - step.offset * MINUTE).toISOString(),
    properties: step.properties,
  }));
}

export const events: AnalyticsEvent[] = users.flatMap((user, seed) => {
  const lastSeen = new Date(user.lastSeenAt).getTime();
  const baseUrl = TRACKED_SITE_URLS[user.environmentId] ?? DEFAULT_SITE_URL;
  return [
    ...buildSession(user, lastSeen, recentSession(seed, baseUrl), 'a'),
    ...buildSession(user, lastSeen - 26 * 60 * MINUTE, earlierSession(seed, baseUrl), 'b'),
  ];
});

const newestFirst = (a: AnalyticsEvent, b: AnalyticsEvent) => b.timestamp.localeCompare(a.timestamp);

export function getEventsForUser(userId: string): AnalyticsEvent[] {
  return events.filter((event) => event.userId === userId).sort(newestFirst);
}

export function getEventsForEnvironment(environmentId: string): AnalyticsEvent[] {
  return events.filter((event) => event.environmentId === environmentId).sort(newestFirst);
}
