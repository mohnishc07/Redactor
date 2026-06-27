/**
 * Payment / subscription stubs.
 *
 * This file is intentionally minimal. When you are ready to wire Stripe + Supabase:
 * 1. Replace isPaywallEnabled() with a real feature flag if needed.
 * 2. Replace getSubscriptionStatus() / hasActiveSubscription() with calls to a
 *    Supabase Edge Function or your Stripe customer portal.
 * 3. The UI already consumes these functions, so no component changes are required.
 */

export type SubscriptionStatus = "active" | "inactive" | "loading";

export function isPaywallEnabled(): boolean {
  // Flip to true to enable paywall tags and disable free options.
  return false;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  // TODO: call Supabase / Stripe to fetch the real status.
  return "inactive";
}

export async function hasActiveSubscription(): Promise<boolean> {
  const status = await getSubscriptionStatus();
  return status === "active";
}

export async function createCheckoutSession(): Promise<{ url: string }> {
  // TODO: call your Stripe checkout session endpoint.
  return { url: "#" };
}
