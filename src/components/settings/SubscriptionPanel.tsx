/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  Check,
  Contact,
  Crown,
  Loader2,
  Mail,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { pathForSettingsSection } from '../../routes';
import { api, formatCatchError } from '../../lib/api';
import { openRazorpayCheckout } from '../../lib/razorpay';
import { PlanCustomizer } from './PlanCustomizer';

type PlanFeatures = {
  contacts: string;
  teamMembers: string;
  aiAgents: string;
  channels: string;
};

type SubscriptionPlan = {
  id: string;
  planId: string;
  name: string;
  labelColor: string;
  price: number | null;
  priceLabel?: string;
  annualPrice?: number;
  priceMonthlyPaise?: number;
  priceAnnualPaise?: number;
  popular?: boolean;
  borderColor?: string;
  trialDays?: number;
  features: PlanFeatures;
  messagesPerMonth?: number;
  storageGb?: number;
  apiAccess?: boolean;
  customBranding?: boolean;
  prioritySupport?: boolean;
  aiReplies?: number | 'unlimited' | 'custom';
  campaigns?: number | 'unlimited' | 'custom';
  integrations?: number | 'unlimited' | 'custom';
  emailsPerMonth?: number | 'unlimited' | 'custom';
  sortOrder?: number;
};

type TrialInfo = {
  subscriptionStatus: string;
  displayStatus: string;
  isTrial: boolean;
  trialEndsAt: string | null;
  trialDaysLeft: number;
  trialExpired: boolean;
  planName: string | null;
};

type CustomPlanQuote = {
  contacts: number;
  aiAgents: number;
  teamMembers: number;
  channels: number;
  emails: number;
  monthlyTotal: number;
  annualTotal: number;
  currency: string;
  breakdown: Array<{ key: string; label: string; quantity?: number; unitLabel?: string; amount: number }>;
  matchedPlanSlug: string | null;
  matchedPlanName: string | null;
  requiresSales: boolean;
  savedAt: string | null;
};

type PricingRules = {
  currency: string;
  limits: {
    contacts: { min: number; max: number; step: number };
    aiAgents: { min: number; max: number; step: number };
    teamMembers: { min: number; max: number; step: number };
    channels: { min: number; max: number; step: number };
    emails: { min: number; max: number; step: number };
  };
  defaults: {
    contacts: number;
    aiAgents: number;
    teamMembers: number;
    channels: number;
    emails: number;
  };
};

type SubscriptionResponse = {
  subscriptionStatus: string;
  hasPlan: boolean;
  currentPlanSlug: string | null;
  currentPlan: SubscriptionPlan | null;
  trial: TrialInfo;
  plans: SubscriptionPlan[];
  pricingRules: PricingRules;
  customPlan: CustomPlanQuote | null;
};

const statusStyles: Record<string, string> = {
  Trial: 'bg-amber-50 text-amber-800 border-amber-200',
  Active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Past Due': 'bg-orange-50 text-orange-800 border-orange-200',
  Suspended: 'bg-red-50 text-red-800 border-red-200',
};

const tierBadges: Record<string, string> = {
  starter: 'Essential',
  growth: 'Most popular',
  pro: 'Scale',
  enterprise: 'Enterprise',
};

function formatPrice(plan: SubscriptionPlan, billingCycle: 'monthly' | 'annual') {
  if (plan.priceLabel) return plan.priceLabel;
  if (billingCycle === 'annual' && plan.priceAnnualPaise) {
    return `₹${(plan.priceAnnualPaise / 100).toLocaleString('en-IN')}`;
  }
  if (plan.priceMonthlyPaise) {
    return `₹${(plan.priceMonthlyPaise / 100).toLocaleString('en-IN')}`;
  }
  if (plan.price == null) return 'Custom';
  return `$${plan.price}`;
}

function formatPriceSuffix(plan: SubscriptionPlan, billingCycle: 'monthly' | 'annual') {
  if (plan.priceLabel || plan.price == null) return null;
  if (billingCycle === 'annual' && plan.priceAnnualPaise) return '/yr';
  if (plan.priceMonthlyPaise) return '/mo';
  return '/mo';
}

function formatTrialEnd(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatEmailsPerMonth(value: SubscriptionPlan['emailsPerMonth']): string | null {
  if (value == null) return null;
  if (value === 'unlimited') return 'Unlimited';
  if (value === 'custom') return 'Custom';
  return value >= 1000 ? value.toLocaleString() : String(value);
}

function PlanFeatureList({ plan }: { plan: SubscriptionPlan }) {
  const emailsLabel = formatEmailsPerMonth(plan.emailsPerMonth);
  const rows = [
    { icon: Contact, label: 'Contacts', value: plan.features.contacts },
    { icon: Users, label: 'Team members', value: plan.features.teamMembers },
    { icon: Bot, label: 'AI agents', value: plan.features.aiAgents },
    { icon: Zap, label: 'Channels', value: plan.features.channels },
    ...(emailsLabel
      ? [{ icon: Mail, label: 'Emails / mo', value: emailsLabel }]
      : []),
  ];

  return (
    <ul className="mt-4 space-y-2.5 border-t border-slate-200 pt-4">
      {rows.map(({ icon: Icon, label, value }) => (
        <li key={label} className="flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-2 text-gray-500">
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </span>
          <span className="font-semibold text-gray-800">{value}</span>
        </li>
      ))}
      {plan.messagesPerMonth ? (
        <li className="flex items-center justify-between gap-2 text-xs">
          <span className="text-gray-500">Messages / mo</span>
          <span className="font-semibold text-gray-800">
            {plan.messagesPerMonth >= 1000
              ? `${(plan.messagesPerMonth / 1000).toFixed(0)}k`
              : plan.messagesPerMonth}
          </span>
        </li>
      ) : null}
    </ul>
  );
}

export function SubscriptionPanel() {
  const [data, setData] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await api.getSubscription()) as SubscriptionResponse;
      setData(res);
    } catch (err) {
      setError(formatCatchError(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubscribe(planSlug: string, planName: string) {
    setCheckoutPlanId(planSlug);
    setCheckoutError(null);
    try {
      const created = (await api.createBillingSubscription({
        planId: planSlug,
        billingCycle,
      })) as {
        checkoutMode?: 'subscription' | 'order';
        subscriptionId?: string;
        orderId?: string;
        keyId: string;
        amountPaise: number;
      };

      const checkoutBase = {
        key: created.keyId,
        name: 'ConvoSync',
        description: `${planName} (${billingCycle})`,
        theme: { color: '#0284c7' as const },
      };

      const useOrderCheckout = created.checkoutMode === 'order' || Boolean(created.orderId);

      await openRazorpayCheckout({
        ...checkoutBase,
        ...(useOrderCheckout
          ? { order_id: created.orderId, amount: created.amountPaise, currency: 'INR' }
          : { subscription_id: created.subscriptionId }),
        onSuccess: async (response) => {
          if (useOrderCheckout) {
            if (!response.razorpay_order_id || !response.razorpay_signature) {
              throw new Error('Incomplete payment response');
            }
            await api.verifyBillingOrder({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          } else {
            if (!response.razorpay_subscription_id || !response.razorpay_signature) {
              throw new Error('Incomplete subscription payment response');
            }
            await api.verifyBillingSubscription({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
            });
          }
          await load();
        },
      });
    } catch (err) {
      const message = formatCatchError(err);
      if (message !== 'Payment cancelled') {
        setCheckoutError(message);
      }
    } finally {
      setCheckoutPlanId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error ?? 'Could not load subscription'}
      </div>
    );
  }

  const { trial, currentPlan, currentPlanSlug, plans, hasPlan, pricingRules, customPlan } = data;
  const displayStatus = trial.displayStatus;
  const trialEndLabel = formatTrialEnd(trial.trialEndsAt);

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#f8f7fc] px-4 py-3 text-sm">
        <p className="text-gray-600">
          {trial.isTrial ? (
            <>
              <span className="font-semibold text-gray-900">
                {hasPlan ? currentPlan?.name : 'Free trial'}
              </span>
              {' · '}
              {trial.trialDaysLeft} day{trial.trialDaysLeft === 1 ? '' : 's'} left
              {trialEndLabel ? ` (ends ${trialEndLabel})` : ''}
            </>
          ) : (
            <>
              Current:{' '}
              <span className="font-semibold text-gray-900">
                {customPlan
                  ? 'Custom plan'
                  : hasPlan
                    ? (currentPlan?.name ?? '—')
                    : 'No plan'}
              </span>
              {' · '}
              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-sm font-bold ${
                  statusStyles[displayStatus] ?? statusStyles.Trial
                }`}
              >
                {displayStatus}
              </span>
            </>
          )}
        </p>
        <Link
          to={pathForSettingsSection('billing')}
          className="text-sm font-bold text-sky-600 hover:underline"
        >
          Billing overview →
        </Link>
      </div>

      <PlanCustomizer
        pricingRules={pricingRules}
        initialQuote={customPlan}
        onSaved={() => void load()}
      />

      {checkoutError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {checkoutError}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-[#f8f7fc] px-4 py-3 text-xs text-gray-600">
        <p className="font-semibold text-gray-800">UPI payment</p>
        <p className="mt-1">
          Company profile में phone number जोड़ें (Settings → Company) — UPI के लिए ज़रूरी है।
          Test mode में UPI ID <span className="font-mono">success@razorpay</span> डालें।
        </p>
        <p className="mt-2 text-gray-500">
          Checkout uses a one-time payment for your selected billing period. Auto-renew (UPI Autopay)
          activates when recurring billing is enabled on your Razorpay account.
        </p>
      </div>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Standard plans</h3>
            <p className="mt-1 text-xs text-gray-500">
              {hasPlan
                ? 'Compare tiers and choose the plan that fits your team. Your current plan is highlighted.'
                : 'You are on a free trial without a plan. Pick a tier below when you are ready to subscribe.'}
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-md px-3 py-1.5 ${billingCycle === 'monthly' ? 'bg-sky-600 text-white' : 'text-gray-600'}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`rounded-md px-3 py-1.5 ${billingCycle === 'annual' ? 'bg-sky-600 text-white' : 'text-gray-600'}`}
            >
              Annual
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = hasPlan && plan.id === currentPlanSlug;
            const canChoose =
              !hasPlan ||
              (plan.sortOrder ?? 0) > (currentPlan?.sortOrder ?? -1);

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl bg-white p-5 transition-shadow ${
                  isCurrent
                    ? 'border-2 border-[#0284c7] shadow-[0_8px_30px_rgba(108,99,255,0.12)]'
                    : plan.popular
                      ? 'border border-[#0284c7]/40 shadow-sm'
                      : 'border border-slate-200 shadow-sm'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-sky-600 px-2.5 py-0.5 text-sm font-bold tracking-wide text-white">
                    <Check className="h-3 w-3" />
                    YOUR PLAN
                  </span>
                )}
                {plan.popular && !isCurrent && (
                  <span className="absolute -top-2.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-sky-600 px-2.5 py-0.5 text-sm font-bold tracking-wide text-white">
                    <Sparkles className="h-3 w-3" />
                    POPULAR
                  </span>
                )}

                <div className="mb-3 flex items-center gap-2">
                  {plan.id === 'enterprise' && <Crown className="h-4 w-4 text-gray-700" />}
                  <span
                    className="text-sm font-bold uppercase tracking-widest"
                    style={{ color: plan.labelColor }}
                  >
                    {tierBadges[plan.id] ?? plan.name}
                  </span>
                </div>

                <p className="text-lg font-bold text-gray-900">{plan.name}</p>

                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(plan, billingCycle)}
                  </span>
                  {formatPriceSuffix(plan, billingCycle) ? (
                    <span className="text-sm text-gray-400">{formatPriceSuffix(plan, billingCycle)}</span>
                  ) : null}
                </div>
                {plan.annualPrice != null && plan.annualPrice > 0 && !plan.priceAnnualPaise && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    or ${plan.annualPrice.toLocaleString()}/yr
                  </p>
                )}
                {plan.trialDays ? (
                  <p className="mt-1 text-xs text-sky-600 font-medium">
                    {plan.trialDays}-day free trial
                  </p>
                ) : null}

                <PlanFeatureList plan={plan} />

                <div className="mt-5 pt-1">
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-bold text-gray-500"
                    >
                      Current plan
                    </button>
                  ) : canChoose && plan.id !== 'enterprise' ? (
                    <button
                      type="button"
                      disabled={checkoutPlanId === plan.id}
                      className="w-full rounded-xl bg-sky-600 py-2.5 text-sm font-bold text-white hover:bg-sky-700 transition-colors disabled:opacity-60"
                      onClick={() => void handleSubscribe(plan.id, plan.name)}
                    >
                      {checkoutPlanId === plan.id ? (
                        <span className="inline-flex items-center justify-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Opening checkout…
                        </span>
                      ) : hasPlan ? (
                        'Upgrade'
                      ) : (
                        'Subscribe'
                      )}
                    </button>
                  ) : plan.id === 'enterprise' ? (
                    <button
                      type="button"
                      className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
                      onClick={() => {
                        window.location.href = `mailto:support@convosync.io?subject=${encodeURIComponent('Enterprise plan inquiry')}`;
                      }}
                    >
                      Contact sales
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-gray-400"
                    >
                      Included in higher tiers
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-gray-400">
        Payments are processed securely via Razorpay in INR. Need help? Contact support@convosync.io
      </p>
    </div>
  );
}
