import type { AnalyticsEvent, EventPropertyValue, EventType } from '../types/event';
import { users } from './users';

const BASE_URL = 'https://example.com';

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

function page(offset: number, pathname: string, title: string): Step {
  return {
    type: 'page_viewed',
    name: 'Page Viewed',
    offset,
    properties: { pathname, title, url: `${BASE_URL}${pathname}` },
  };
}

// A recent session: login, browse, play a game, run a mission, update profile.
function recentSession(seed: number): Step[] {
  const game = games[seed % games.length];
  const mission = (seed % 7) + 1;
  return [
    page(0, '/settings/profile', 'My Profile'),
    { type: 'profile_updated', name: 'Profile Updated', offset: 2, properties: { field: 'display_name' } },
    page(4, '/settings/profile', 'My Profile'),
    { type: 'mission_completed', name: 'Mission Completed', offset: 9, properties: { missionId: `mission_${mission}`, missionName: `Mission ${mission}`, reward: '50 coins' } },
    { type: 'game_closed', name: 'Game Closed', offset: 10, properties: { gameId: game.id, gameName: game.name, durationSeconds: 540 } },
    { type: 'mission_started', name: 'Mission Started', offset: 17, properties: { missionId: `mission_${mission}`, missionName: `Mission ${mission}` } },
    { type: 'game_opened', name: 'Game Opened', offset: 19, properties: { gameId: game.id, gameName: game.name, pathname: `/game/${game.id}` } },
    page(20, `/game/${game.id}`, game.name),
    page(22, '/casino', 'Casino'),
    { type: 'deposit', name: 'Deposit', offset: 25, properties: { amount: 50 + (seed % 5) * 25, currency: 'USD', method: 'card' } },
    page(26, '/wallet/deposit', 'Deposit'),
    { type: 'login', name: 'Login', offset: 28, properties: { method: 'email' } },
    page(29, '/login', 'Login'),
  ];
}

// An earlier session the previous day.
function earlierSession(seed: number): Step[] {
  const game = games[(seed + 1) % games.length];
  return [
    { type: 'logout', name: 'Logout', offset: 0 },
    { type: 'withdrawal', name: 'Withdrawal', offset: 3, properties: { amount: 20 + (seed % 4) * 10, currency: 'USD', method: 'bank_transfer', status: 'pending' } },
    page(4, '/wallet/withdraw', 'Withdraw'),
    { type: 'game_closed', name: 'Game Closed', offset: 8, properties: { gameId: game.id, gameName: game.name, durationSeconds: 780 } },
    { type: 'game_opened', name: 'Game Opened', offset: 21, properties: { gameId: game.id, gameName: game.name, pathname: `/game/${game.id}` } },
    page(22, `/game/${game.id}`, game.name),
    page(24, '/casino', 'Casino'),
    page(26, '/', 'Home'),
    { type: 'signup', name: 'Signup', offset: 28, properties: { method: 'email', referrer: 'google' } },
    page(30, '/signup', 'Sign Up'),
  ];
}

const MINUTE = 60_000;

function buildSession(userId: string, end: number, steps: Step[], prefix: string): AnalyticsEvent[] {
  return steps.map((step, index) => ({
    id: `${userId}_${prefix}_${String(index + 1).padStart(3, '0')}`,
    userId,
    type: step.type,
    name: step.name,
    timestamp: new Date(end - step.offset * MINUTE).toISOString(),
    properties: step.properties,
  }));
}

export const events: AnalyticsEvent[] = users.flatMap((user, seed) => {
  const lastSeen = new Date(user.lastSeenAt).getTime();
  return [
    ...buildSession(user.id, lastSeen, recentSession(seed), 'a'),
    ...buildSession(user.id, lastSeen - 26 * 60 * MINUTE, earlierSession(seed), 'b'),
  ];
});

export function getEventsForUser(userId: string): AnalyticsEvent[] {
  return events
    .filter((event) => event.userId === userId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
