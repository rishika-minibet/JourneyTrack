export interface User {
  id: string;
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
