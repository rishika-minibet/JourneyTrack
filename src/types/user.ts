// A tracked website visitor, identified by the JourneyTrack SDK.
// Not to be confused with AccountUser (people who log in to the dashboard).
export interface User {
  id: string;
  /** The environment whose SDK key reported this visitor. */
  environmentId: string;
  name: string;
  email: string;
  accountId: string;
  country: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  firstSeenAt: string;
  lastSeenAt: string;
  signedUpAt: string;
  isEmailVerified: boolean;
  isInternalUser: boolean;
  isFtdCompleted: boolean;
}
