export type BillingSubSnapshot = {
  subscriptionStatus: string;
  billingSubscription: { status: string; cancelAtPeriodEnd?: boolean } | null;
};

const LIVE_BILLING_STATUSES = ['active', 'authenticated', 'paused'] as const;

export function hasLiveBillingSubscription(data: BillingSubSnapshot | null): boolean {
  if (!data?.billingSubscription) return false;
  const status = data.billingSubscription.status.toLowerCase();
  return (LIVE_BILLING_STATUSES as readonly string[]).includes(status);
}

/** Paid via workspace row only (super-admin grant, legacy) — no billingSubscription row. */
export function hasWorkspaceOnlySubscription(data: BillingSubSnapshot | null): boolean {
  if (!data || data.billingSubscription) return false;
  const ws = data.subscriptionStatus.toLowerCase();
  return ws === 'active' || ws === 'authenticated';
}

export function hasPaidSubscription(data: BillingSubSnapshot | null): boolean {
  return hasLiveBillingSubscription(data) || hasWorkspaceOnlySubscription(data);
}

export function subscriptionStatusLabel(
  subscriptionStatus: string,
  billingStatus?: string
): string {
  const billing = billingStatus?.toLowerCase();
  const ws = subscriptionStatus.toLowerCase();
  // Live billing / paid workspace always wins over leftover trial status
  if (billing === 'active' || billing === 'authenticated' || ws === 'active' || ws === 'authenticated') {
    return 'Active';
  }
  if (billing === 'paused') return 'Paused';
  if (ws === 'trial') return 'Trial';
  if (billing === 'past_due' || ws === 'past_due') return 'Past due';
  if (billing === 'cancelled' || billing === 'canceled' || ws === 'cancelled' || ws === 'canceled') {
    return 'Cancelled';
  }
  return 'Inactive';
}

export type BillingPlanOption = {
  id: string;
  slug: string;
  priceMonthlyPaise?: number | null;
};

export function resolveCheckoutPlan(
  plans: BillingPlanOption[],
  preferredSlug = 'starter'
): BillingPlanOption | null {
  if (!plans.length) return null;
  return (
    plans.find((p) => p.slug === preferredSlug) ??
    plans.find((p) => p.priceMonthlyPaise === 199900) ??
    plans[0]
  );
}
