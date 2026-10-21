// Dummy data is anchored to "now" so relative times like "3 minutes ago" stay realistic.
const MINUTE = 60_000;

export function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * MINUTE).toISOString();
}
