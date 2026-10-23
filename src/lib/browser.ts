/** Simulated network latency so loading states are visible in the prototype. */
export function simulateLatency(ms = 400): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function maskKey(value: string): string {
  return `${value.slice(0, 12)}${'•'.repeat(12)}${value.slice(-4)}`;
}
