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
  const normalized = (billingStatus ?? subscriptionStatus).toLowerCase();
  if (normalized === 'active' || normalized === 'authenticated') return 'Active';
  if (normalized === 'paused') return 'Paused';
  if (normalized === 'trial' || subscriptionStatus === 'trial') return 'Trial';
  if (normalized === 'past_due') return 'Past due';
  if (normalized === 'cancelled' || normalized === 'canceled') return 'Cancelled';
  return 'Inactive';
}
