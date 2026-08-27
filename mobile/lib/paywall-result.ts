/**
 * Bridges navigation to /(app)/paywall with the promise-based usePaywallGate().
 * The paywall screen calls resolvePaywallResult when the user purchases, restores, or dismisses.
 */
type Resolver = (purchased: boolean) => void;

let pending: Resolver | null = null;

export function waitForPaywallResult(): Promise<boolean> {
  return new Promise((resolve) => {
    // If a previous wait was abandoned (e.g. crash), resolve it as cancelled.
    if (pending) pending(false);
    pending = resolve;
  });
}

export function resolvePaywallResult(purchased: boolean) {
  if (!pending) return;
  const resolve = pending;
  pending = null;
  resolve(purchased);
}
