const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}

/** Accepts http(s) URLs only. An empty string is considered "not provided", not invalid. */
export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.');
  } catch {
    return false;
  }
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Returns an error message for an optional website field, or undefined when valid/empty. */
export function optionalUrlError(value: string): string | undefined {
  if (!value.trim()) return undefined;
  return isValidUrl(value) ? undefined : 'Enter a full URL, e.g. https://example.com';
}

export function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}
