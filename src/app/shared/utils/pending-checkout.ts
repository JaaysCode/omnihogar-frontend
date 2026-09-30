const KEY = 'omnihogar.pendingCheckoutOrderId';

// Remembers the order we just sent to Stripe Checkout, so pressing "Back" there (or a bfcache
// restore of this page) lands on /checkout/result instead of a stale checkout form.
export function rememberPendingCheckout(orderId: string): void {
  try {
    sessionStorage.setItem(KEY, orderId);
  } catch {
    // storage unavailable (SSR, private mode) — the result page is still reachable by URL
  }
}

export function takePendingCheckout(): string | null {
  try {
    const orderId = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return orderId;
  } catch {
    return null;
  }
}
