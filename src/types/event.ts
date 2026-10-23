export type EventType =
  | 'page_viewed'
  | 'login'
  | 'logout'
  | 'signup'
  | 'game_opened'
  | 'game_closed'
  | 'mission_started'
  | 'mission_completed'
  | 'profile_updated'
  | 'deposit'
  | 'withdrawal';

export type EventPropertyValue = string | number | boolean;

export interface AnalyticsEvent {
  id: string;
  environmentId: string;
  userId: string;
  type: EventType;
  name: string;
  timestamp: string;
  properties?: Record<string, EventPropertyValue>;
}
