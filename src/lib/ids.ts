import type { EnvironmentType } from '../types/account';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789';

function randomString(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

/** Unique client-side ID such as `proj_k3J9...`. A backend would assign these. */
export function createId(prefix: string): string {
  return `${prefix}_${randomString(12)}`;
}

const KEY_PREFIX: Record<EnvironmentType, string> = {
  development: 'dev',
  staging: 'stg',
  production: 'prd',
};

/** MOCK SDK key. Not a secret and not generated securely — for UI prototyping only. */
export function createMockSdkKey(type: EnvironmentType): string {
  return `jt_mock_${KEY_PREFIX[type]}_${randomString(20)}`;
}

/** "My Company, Inc." -> "my-company-inc" */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}
