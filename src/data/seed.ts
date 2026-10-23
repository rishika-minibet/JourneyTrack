import type {
  AccountUser,
  Environment,
  Invitation,
  Organization,
  OrganizationMembership,
  Project,
} from '../types/account';
import { minutesAgo } from './time';

// Seeded dashboard workspace. IDs are stable so that tracked users and events
// (./users.ts, ./events.ts) can reference environments explicitly.

const DAY = 60 * 24;

export const ORG_TEST = 'org_test';
export const ORG_TEST1 = 'org_test1';

export const PROJECT_TEST_WEBSITE = 'proj_test_website';
export const PROJECT_TEST_MARKETING = 'proj_test_marketing';
export const PROJECT_TEST1_STOREFRONT = 'proj_test1_storefront';

export const ENV_TEST_WEBSITE_DEV = 'env_test_website_dev';
export const ENV_TEST_WEBSITE_STAGING = 'env_test_website_staging';
export const ENV_TEST_WEBSITE_PROD = 'env_test_website_prod';
export const ENV_TEST_MARKETING_PROD = 'env_test_marketing_prod';
export const ENV_TEST1_STOREFRONT_DEV = 'env_test1_storefront_dev';
export const ENV_TEST1_STOREFRONT_PROD = 'env_test1_storefront_prod';

/** Site each environment's SDK reports from; used to build page-view URLs in the dummy events. */
export const TRACKED_SITE_URLS: Record<string, string> = {
  [ENV_TEST_WEBSITE_DEV]: 'https://dev.example.com',
  [ENV_TEST_WEBSITE_STAGING]: 'https://staging.example.com',
  [ENV_TEST_WEBSITE_PROD]: 'https://example.com',
  [ENV_TEST_MARKETING_PROD]: 'https://marketing.example.com',
  [ENV_TEST1_STOREFRONT_DEV]: 'https://dev.test1-store.example.com',
  [ENV_TEST1_STOREFRONT_PROD]: 'https://test1-store.example.com',
};

export const DEMO_PASSWORD = 'password123';

export const seedAccounts: AccountUser[] = [
  { id: 'acct_ava', name: 'Ava Chen', email: 'owner@journeytrack.dev', password: DEMO_PASSWORD, createdAt: minutesAgo(DAY * 420) },
  { id: 'acct_ben', name: 'Ben Ortiz', email: 'admin@journeytrack.dev', password: DEMO_PASSWORD, createdAt: minutesAgo(DAY * 300) },
  { id: 'acct_cara', name: 'Cara Nguyen', email: 'member@journeytrack.dev', password: DEMO_PASSWORD, createdAt: minutesAgo(DAY * 120) },
  { id: 'acct_dev', name: 'Dev Kumar', email: 'dev@journeytrack.dev', password: DEMO_PASSWORD, createdAt: minutesAgo(DAY * 200) },
];

export const seedOrganizations: Organization[] = [
  { id: ORG_TEST, name: 'Test', slug: 'test', websiteUrl: 'https://example.com', createdAt: minutesAgo(DAY * 410) },
  { id: ORG_TEST1, name: 'Test1', slug: 'test1', websiteUrl: 'https://test1-store.example.com', createdAt: minutesAgo(DAY * 190) },
];

// Roles are per membership: Ava is Owner of Test but Admin of Test1; Ben is Admin of Test but Member of Test1.
export const seedMemberships: OrganizationMembership[] = [
  { id: 'mem_test_ava', organizationId: ORG_TEST, userId: 'acct_ava', role: 'owner', status: 'active', joinedAt: minutesAgo(DAY * 410) },
  { id: 'mem_test_ben', organizationId: ORG_TEST, userId: 'acct_ben', role: 'admin', status: 'active', joinedAt: minutesAgo(DAY * 290) },
  { id: 'mem_test_cara', organizationId: ORG_TEST, userId: 'acct_cara', role: 'member', status: 'active', joinedAt: minutesAgo(DAY * 110) },
  { id: 'mem_test1_dev', organizationId: ORG_TEST1, userId: 'acct_dev', role: 'owner', status: 'active', joinedAt: minutesAgo(DAY * 190) },
  { id: 'mem_test1_ava', organizationId: ORG_TEST1, userId: 'acct_ava', role: 'admin', status: 'active', joinedAt: minutesAgo(DAY * 180) },
  { id: 'mem_test1_ben', organizationId: ORG_TEST1, userId: 'acct_ben', role: 'member', status: 'active', joinedAt: minutesAgo(DAY * 150) },
  { id: 'mem_test1_cara', organizationId: ORG_TEST1, userId: 'acct_cara', role: 'member', status: 'active', joinedAt: minutesAgo(DAY * 60) },
];

export const seedInvitations: Invitation[] = [
  {
    id: 'inv_test_newhire',
    organizationId: ORG_TEST,
    email: 'new.hire@journeytrack.dev',
    role: 'member',
    status: 'pending',
    invitedByUserId: 'acct_ava',
    createdAt: minutesAgo(DAY * 2),
    lastSentAt: minutesAgo(DAY * 2),
  },
  {
    id: 'inv_test1_analyst',
    organizationId: ORG_TEST1,
    email: 'analyst@journeytrack.dev',
    role: 'admin',
    status: 'pending',
    invitedByUserId: 'acct_dev',
    createdAt: minutesAgo(DAY * 5),
    lastSentAt: minutesAgo(DAY * 1),
  },
];

export const seedProjects: Project[] = [
  { id: PROJECT_TEST_WEBSITE, organizationId: ORG_TEST, name: 'Website', websiteUrl: 'https://example.com', createdAt: minutesAgo(DAY * 405) },
  { id: PROJECT_TEST_MARKETING, organizationId: ORG_TEST, name: 'Marketing Site', websiteUrl: 'https://marketing.example.com', createdAt: minutesAgo(DAY * 60) },
  { id: PROJECT_TEST1_STOREFRONT, organizationId: ORG_TEST1, name: 'Storefront', websiteUrl: 'https://test1-store.example.com', createdAt: minutesAgo(DAY * 185) },
];

function seedEnvironment(
  id: string,
  projectId: string,
  name: string,
  type: Environment['type'],
  ageDays: number,
  keyValue: string,
): Environment {
  const createdAt = minutesAgo(DAY * ageDays);
  return { id, projectId, name, type, createdAt, sdkKey: { value: keyValue, status: 'active', createdAt } };
}

export const seedEnvironments: Environment[] = [
  seedEnvironment(ENV_TEST_WEBSITE_DEV, PROJECT_TEST_WEBSITE, 'DEV', 'development', 405, 'jt_mock_dev_4hQ8vK2nW7pX1rT9sB3c'),
  seedEnvironment(ENV_TEST_WEBSITE_STAGING, PROJECT_TEST_WEBSITE, 'STAGING', 'staging', 200, 'jt_mock_stg_9mL2xF6tR1yC8kD4wN7a'),
  seedEnvironment(ENV_TEST_WEBSITE_PROD, PROJECT_TEST_WEBSITE, 'PROD', 'production', 405, 'jt_mock_prd_2bV7nJ5qH0sZ3gE6uY1p'),
  seedEnvironment(ENV_TEST_MARKETING_PROD, PROJECT_TEST_MARKETING, 'PROD', 'production', 60, 'jt_mock_prd_7cW1mA9eK4tP6rL2xQ8f'),
  seedEnvironment(ENV_TEST1_STOREFRONT_DEV, PROJECT_TEST1_STOREFRONT, 'DEV', 'development', 185, 'jt_mock_dev_5gT3pN8wB1vM6hS0kR4j'),
  seedEnvironment(ENV_TEST1_STOREFRONT_PROD, PROJECT_TEST1_STOREFRONT, 'PROD', 'production', 185, 'jt_mock_prd_8eY6rD2aU9cX4nF7iW0l'),
];
