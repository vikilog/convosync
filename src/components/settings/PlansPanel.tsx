/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  Gauge,
  Loader2,
  Rocket,
  ShieldCheck,
  Sparkles,
  Sprout,
  Ticket,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import { api, formatCatchError } from '../../lib/api';
import {
  hasPaidSubscription,
  subscriptionStatusLabel,
} from '../../lib/billingSubscription';
import { dispatchCompanyUpdated } from '../../lib/companyEvents';
import { BRAND_PURPLE } from '../../lib/convocoins';
import { openRazorpayCheckout } from '../../lib/razorpay';
import { Input } from '../ui/input';

type BillingCycle = 'monthly' | 'annual';

type AppliedCoupon = {
  code: string;
  discountPaise: number;
  finalAmountPaise: number;
  originalAmountPaise: number;
  discountPercent: number;
  previewPlanName?: string;
};

type ValidateCouponResult =
  | {
      valid: true;
      code: string;
      discountPaise: number;
      finalAmountPaise: number;
      originalAmountPaise: number;
      discountPercent: number;
    }
  | { valid: false; reason: string };

type PlanFeatures = {
  contacts: string;
  teamMembers: string;
  aiAgents: string;
  channels: string;
};

type BillingCurrency = 'INR' | 'USD';

type PendingBillingOffer = {
  id: string;
  planId: string;
  plan?: { id: string; slug: string; name: string };
  billingCycle: BillingCycle;
  currency: BillingCurrency;
  amountMinor: number;
  offerType: 'subscription' | 'payment_link';
  status: 'pending' | 'paid' | 'cancelled';
  razorpaySubscriptionId: string | null;
  shortUrl: string | null;
  keyId: string | null;
  note: string | null;
};

type TenantPlan = {
  id: string;
  planId: string;
  name: string;
  price: number | null;
  priceLabel?: string;
  annualPrice?: number;
  priceMonthlyPaise?: number | null;
  priceAnnualPaise?: number | null;
  priceMonthlyUsd?: number | null;
  priceAnnualUsd?: number | null;
  priceMonthlyCents?: number | null;
  priceAnnualCents?: number | null;
  features: PlanFeatures;
  popular: boolean;
  emailsPerMonth?: string | number | null;
  walletCredits?: string | null;
  aiCopilot?: boolean;
  socialListening?: boolean;
  voiceAgent?: boolean;
  developers?: boolean;
  whatsappPay?: boolean;
  ctwaAds?: boolean;
  reports?: boolean;
  prioritySupport?: boolean;
  sortOrder?: number;
  isCustom?: boolean;
};

type SubscriptionPayload = {
  subscriptionStatus: string;
  hasPlan: boolean;
  currentPlanSlug: string | null;
  currentPlan: TenantPlan | null;
  trial?: {
    isTrial?: boolean;
    trialDaysLeft?: number | null;
    planSlug?: string | null;
    planName?: string | null;
  } | null;
  plans: TenantPlan[];
  currency?: BillingCurrency;
  country?: string;
};

type UsageMetric = {
  used: number;
  limit: number;
  pending?: number;
};

type BillingWorkspace = {
  subscriptionStatus: string;
  plan: { id: string; slug: string; name: string } | null;
  billingSubscription: {
    status: string;
    billingCycle: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    plan: { id: string; slug: string; name: string } | null;
  } | null;
  usageSnapshot?: {
    contacts?: UsageMetric;
    teamMembers?: UsageMetric;
    aiAgents?: UsageMetric;
    channels?: UsageMetric;
    campaigns?: UsageMetric;
    emails?: UsageMetric;
    aiTokens?: UsageMetric;
  } | null;
};

const UNLIMITED_LIMIT = 1_000_000;

function isUnlimitedLimit(limit: number | null | undefined): boolean {
  return limit == null || limit >= UNLIMITED_LIMIT;
}

function utilizationPct(used: number, limit: number | null | undefined): number | null {
  if (isUnlimitedLimit(limit) || !limit || limit <= 0) return null;
  return Math.min(100, Math.round((used / limit) * 100));
}

function UtilBar({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null | undefined;
}) {
  const unlimited = isUnlimitedLimit(limit);
  const pct = utilizationPct(used, limit);
  const width = pct != null ? Math.min(100, pct) : unlimited ? 0 : 0;
  const tone =
    pct == null
      ? 'bg-slate-200'
      : pct >= 95
        ? 'bg-red-500'
        : pct >= 80
          ? 'bg-amber-500'
          : 'bg-swiss-accent';

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="tabular-nums text-slate-500">
          {used.toLocaleString('en-IN')}
          {unlimited ? ' / Unlimited' : limit != null ? ` / ${limit.toLocaleString('en-IN')}` : ''}
          {pct != null ? ` · ${pct}%` : ''}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full border border-swiss-line bg-white">
        <div
          className={`h-full rounded-full transition-all duration-300 ${tone}`}
          style={{ width: unlimited ? '8%' : `${width}%` }}
        />
      </div>
    </div>
  );
}

const PLAN_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  starter: Sprout,
  growth: TrendingUp,
  business: Rocket,
  enterprise: Building2,
};

const springSoft = { type: 'spring' as const, stiffness: 380, damping: 32, mass: 0.8 };

function planHighlights(plan: TenantPlan): string[] {
  const f = plan.features;
  const lines: string[] = [
    f.channels,
    `${f.teamMembers} seats`,
    `${f.aiAgents} AI Agent${f.aiAgents === '1' ? '' : 's'}`,
  ];
  if (plan.aiCopilot) lines.push('AI Copilot included');
  const wallet = plan.walletCredits ?? '—';
  if (wallet !== '—') {
    lines.push(wallet === 'Custom' ? 'Negotiated wallet' : `${wallet} wallet`);
  }
  if (plan.ctwaAds) lines.push('CTWA / Ads + Advanced reports');
  else if (plan.socialListening || plan.voiceAgent || plan.developers) {
    const bits = [
      plan.socialListening ? 'Social Listening' : null,
      plan.voiceAgent ? 'Voice' : null,
      plan.developers ? 'Developers' : null,
      plan.whatsappPay ? 'WhatsApp Pay' : null,
    ].filter(Boolean);
    if (bits.length) lines.push(bits.join(' · '));
  }
  if (plan.prioritySupport) lines.push('Priority support');
  // ponytail: seats + AI are separate bullets now; 6 keeps Business feature row visible
  return lines.slice(0, 6);
}

function isCustomPriced(plan: TenantPlan, currency: BillingCurrency = 'INR'): boolean {
  if (plan.isCustom) return true;
  if (plan.priceLabel?.toLowerCase() === 'custom') return true;
  if (currency === 'USD') {
    if (plan.priceMonthlyUsd == null || plan.priceMonthlyUsd <= 0) {
      if (!plan.priceMonthlyCents && !plan.priceAnnualCents) return true;
    }
    return false;
  }
  if (plan.price == null || plan.price <= 0) return true;
  if (!plan.priceMonthlyPaise && !plan.priceAnnualPaise) return true;
  return false;
}

function formatBillingDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function contactSalesUrl(): string {
  const landing = (import.meta.env.VITE_LANDING_URL as string | undefined)?.replace(/\/$/, '');
  return landing ? `${landing}/#help-support` : 'mailto:hello@convosync.io';
}

function planAmountMinor(
  plan: TenantPlan,
  cycle: BillingCycle,
  currency: BillingCurrency
): number | null {
  if (currency === 'USD') {
    if (cycle === 'annual') {
      return (
        plan.priceAnnualCents ??
        (plan.priceAnnualUsd != null ? Math.round(plan.priceAnnualUsd * 100) : null)
      );
    }
    return (
      plan.priceMonthlyCents ??
      (plan.priceMonthlyUsd != null ? Math.round(plan.priceMonthlyUsd * 100) : null)
    );
  }
  if (cycle === 'annual') {
    return (
      plan.priceAnnualPaise ??
      (plan.annualPrice != null ? Math.round(plan.annualPrice * 100) : null)
    );
  }
  return plan.priceMonthlyPaise ?? (plan.price != null ? Math.round(plan.price * 100) : null);
}

function formatMinor(minor: number, currency: BillingCurrency): string {
  if (currency === 'USD') {
    return `$${(minor / 100).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }
  return `₹${(minor / 100).toLocaleString('en-IN')}`;
}

function priceForCycle(
  plan: TenantPlan,
  cycle: BillingCycle,
  currency: BillingCurrency
): {
  amount: number | null;
  label: string;
} {
  if (isCustomPriced(plan, currency)) {
    return { amount: null, label: plan.priceLabel ?? 'Custom' };
  }
  if (currency === 'USD') {
    if (cycle === 'annual') {
      const annual =
        plan.priceAnnualUsd ??
        (plan.priceAnnualCents != null ? plan.priceAnnualCents / 100 : null);
      if (annual != null) {
        return { amount: annual, label: `$${annual.toLocaleString('en-US')}` };
      }
    }
    const monthly =
      plan.priceMonthlyUsd ??
      (plan.priceMonthlyCents != null ? plan.priceMonthlyCents / 100 : null);
    return {
      amount: monthly,
      label: monthly != null ? `$${monthly.toLocaleString('en-US')}` : plan.priceLabel ?? '—',
    };
  }
  if (cycle === 'annual') {
    const annual =
      plan.annualPrice ?? (plan.priceAnnualPaise != null ? plan.priceAnnualPaise / 100 : null);
    if (annual != null) {
      return { amount: annual, label: `₹${annual.toLocaleString('en-IN')}` };
    }
  }
  const monthly =
    plan.price ?? (plan.priceMonthlyPaise != null ? plan.priceMonthlyPaise / 100 : null);
  return {
    amount: monthly,
    label: monthly != null ? `₹${monthly.toLocaleString('en-IN')}` : plan.priceLabel ?? '—',
  };
}

function annualSavingsPct(plan: TenantPlan, currency: BillingCurrency): number | null {
  if (currency === 'USD') {
    const monthly =
      plan.priceMonthlyUsd ??
      (plan.priceMonthlyCents != null ? plan.priceMonthlyCents / 100 : null);
    const annual =
      plan.priceAnnualUsd ??
      (plan.priceAnnualCents != null ? plan.priceAnnualCents / 100 : null);
    if (monthly == null || annual == null || monthly <= 0) return null;
    const fullYear = monthly * 12;
    if (annual >= fullYear) return null;
    return Math.round(((fullYear - annual) / fullYear) * 100);
  }
  const monthly = plan.price ?? (plan.priceMonthlyPaise != null ? plan.priceMonthlyPaise / 100 : null);
  const annual =
    plan.annualPrice ?? (plan.priceAnnualPaise != null ? plan.priceAnnualPaise / 100 : null);
  if (monthly == null || annual == null || monthly <= 0) return null;
  const fullYear = monthly * 12;
  if (annual >= fullYear) return null;
  return Math.round(((fullYear - annual) / fullYear) * 100);
}

function PlansSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4" aria-busy="true" aria-label="Loading plans">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-44 animate-pulse rounded-3xl bg-white lg:col-span-2" />
        <div className="h-44 animate-pulse rounded-3xl bg-white" />
      </div>
      <div className="flex justify-between gap-3 pt-2">
        <div className="h-10 w-52 animate-pulse rounded-xl bg-white" />
        <div className="h-10 w-44 animate-pulse rounded-xl bg-white" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[22rem] animate-pulse rounded-3xl bg-white" />
        ))}
      </div>
    </div>
  );
}

export function PlansPanel() {
  const reduceMotion = useReducedMotion();
  const [subscription, setSubscription] = useState<SubscriptionPayload | null>(null);
  const [billing, setBilling] = useState<BillingWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [checkoutSlug, setCheckoutSlug] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<TenantPlan | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [pendingOffers, setPendingOffers] = useState<PendingBillingOffer[]>([]);
  const [offerPayBusy, setOfferPayBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sub, bill, offersRes] = await Promise.all([
        api.getSubscription() as Promise<SubscriptionPayload>,
        api.getBillingWorkspace() as Promise<BillingWorkspace>,
        api.getBillingOffers().catch(() => ({ offers: [] })) as Promise<{
          offers: PendingBillingOffer[];
        }>,
      ]);
      setSubscription(sub);
      setBilling(bill);
      setPendingOffers(offersRes.offers ?? []);
    } catch (err) {
      setError(formatCatchError(err));
      setSubscription(null);
      setBilling(null);
      setPendingOffers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  }, [cycle]);

  const currentSlug =
    billing?.billingSubscription?.plan?.slug ??
    subscription?.currentPlanSlug ??
    subscription?.currentPlan?.id ??
    null;

  const currentPlan =
    subscription?.currentPlan ??
    subscription?.plans.find((p) => p.id === currentSlug) ??
    null;

  const plans = useMemo(() => {
    const list = [...(subscription?.plans ?? [])];
    list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return list;
  }, [subscription?.plans]);

  const recommended = useMemo(
    () =>
      plans.find((p) => p.popular && p.id !== currentSlug) ??
      plans.find((p) => p.id !== currentSlug),
    [plans, currentSlug]
  );

  const currency: BillingCurrency = subscription?.currency ?? 'INR';

  const maxAnnualSave = useMemo(() => {
    let max = 0;
    for (const p of plans) {
      const pct = annualSavingsPct(p, currency);
      if (pct != null && pct > max) max = pct;
    }
    return max;
  }, [plans, currency]);

  const hasAnnual =
    currency === 'USD'
      ? plans.some((p) => p.priceAnnualUsd != null || (p.priceAnnualCents ?? 0) > 0)
      : plans.some((p) => p.annualPrice != null || (p.priceAnnualPaise ?? 0) > 0);
  const paid = billing ? hasPaidSubscription(billing) : false;
  const status = billing
    ? subscriptionStatusLabel(billing.subscriptionStatus, billing.billingSubscription?.status)
    : subscription
      ? subscriptionStatusLabel(subscription.subscriptionStatus)
      : 'Inactive';
  const cancelling = billing?.billingSubscription?.cancelAtPeriodEnd ?? false;
  const nextBilling = billing?.billingSubscription?.currentPeriodEnd ?? null;

  const pageVariants: Variants = reduceMotion
    ? { hidden: {}, show: {} }
    : {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.07, delayChildren: 0.04 },
        },
      };

  const itemVariants: Variants = reduceMotion
    ? { hidden: {}, show: {} }
    : {
        hidden: { opacity: 0, y: 14 },
        show: {
          opacity: 1,
          y: 0,
          transition: springSoft,
        },
      };

  const cardVariants: Variants = reduceMotion
    ? { hidden: {}, show: {} }
    : {
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: springSoft },
      };

  function openCheckoutModal(plan: TenantPlan) {
    if (isCustomPriced(plan, currency)) {
      window.open(contactSalesUrl(), '_blank', 'noopener,noreferrer');
      return;
    }
    setCheckoutPlan(plan);
    setCouponInput('');
    setAppliedCoupon(null);
    setCouponError(null);
  }

  function closeCheckoutModal() {
    if (checkoutSlug) return;
    setCheckoutPlan(null);
    setCouponInput('');
    setAppliedCoupon(null);
    setCouponError(null);
  }

  async function handleApplyCoupon() {
    const code = couponInput.trim();
    if (!code) return;

    const plan = checkoutPlan;
    if (!plan) {
      setCouponError('No plan selected.');
      return;
    }

    const amountPaise = planAmountMinor(plan, cycle, currency);
    if (!amountPaise) {
      setCouponError('Cannot apply a coupon to this billing cycle.');
      return;
    }

    setCouponBusy(true);
    setCouponError(null);
    try {
      const result = (await api.validateBillingCoupon({
        code,
        amountPaise,
        planId: plan.id,
      })) as ValidateCouponResult;
      if (!result.valid) {
        setAppliedCoupon(null);
        setCouponError(result.reason);
        return;
      }
      setAppliedCoupon({
        code: result.code,
        discountPaise: result.discountPaise,
        finalAmountPaise: result.finalAmountPaise,
        originalAmountPaise: result.originalAmountPaise,
        discountPercent: result.discountPercent,
        previewPlanName: plan.name,
      });
      setCouponInput(result.code);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(formatCatchError(err));
    } finally {
      setCouponBusy(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  }

  async function handleConfirmCheckout() {
    const plan = checkoutPlan;
    if (!plan || isCustomPriced(plan, currency)) return;

    setCheckoutSlug(plan.id);
    setError(null);
    setActionMessage(null);
    try {
      const couponCode = appliedCoupon?.code ?? (couponInput.trim() || undefined);
      if (couponCode) {
        const amountPaise = planAmountMinor(plan, cycle, currency);
        if (amountPaise) {
          const result = (await api.validateBillingCoupon({
            code: couponCode,
            amountPaise,
            planId: plan.id,
          })) as ValidateCouponResult;
          if (!result.valid) {
            setAppliedCoupon(null);
            setCouponError(result.reason);
            return;
          }
        }
      }

      const created = (await api.createBillingSubscription({
        planId: plan.id,
        billingCycle: cycle,
        ...(couponCode ? { couponCode } : {}),
      })) as {
        checkoutMode?: 'subscription' | 'order';
        subscriptionId?: string;
        orderId?: string;
        keyId: string;
        amountPaise: number;
        currency?: BillingCurrency;
      };

      const useOrderCheckout = created.checkoutMode === 'order' || Boolean(created.orderId);
      const checkoutCurrency = created.currency ?? currency;

      await openRazorpayCheckout({
        key: created.keyId,
        name: 'ConvoSync',
        description: `${plan.name} (${cycle})`,
        theme: { color: BRAND_PURPLE },
        ...(useOrderCheckout
          ? {
              order_id: created.orderId,
              amount: created.amountPaise,
              currency: checkoutCurrency,
            }
          : { subscription_id: created.subscriptionId, currency: checkoutCurrency }),
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
          setActionMessage(`You're now on ${plan.name}.`);
          handleRemoveCoupon();
          setCheckoutPlan(null);
          await load();
          dispatchCompanyUpdated({});
        },
      });
    } catch (err) {
      const message = formatCatchError(err);
      if (message !== 'Payment cancelled') {
        if (appliedCoupon?.code || couponInput.trim()) {
          setCouponError(message);
        } else {
          setError(message);
        }
      }
    } finally {
      setCheckoutSlug(null);
    }
  }

  async function handleCancel() {
    const confirmed = window.confirm(
      'Cancel your subscription at the end of the current billing period? You will keep access until then.'
    );
    if (!confirmed) return;

    setCancelBusy(true);
    setError(null);
    setActionMessage(null);
    try {
      await api.cancelBillingSubscription({ cancelAtPeriodEnd: true });
      setActionMessage('Subscription will cancel at the end of the current billing period.');
      await load();
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setCancelBusy(false);
    }
  }

  async function handlePayOffer(offer: PendingBillingOffer) {
    setOfferPayBusy(offer.id);
    setError(null);
    try {
      if (offer.offerType === 'payment_link' || (!offer.razorpaySubscriptionId && offer.shortUrl)) {
        if (!offer.shortUrl) throw new Error('Payment link is not available yet');
        window.open(offer.shortUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      if (!offer.razorpaySubscriptionId || !offer.keyId) {
        if (offer.shortUrl) {
          window.open(offer.shortUrl, '_blank', 'noopener,noreferrer');
          return;
        }
        throw new Error('Checkout is not ready for this offer');
      }
      const planName = offer.plan?.name ?? 'subscription';
      await openRazorpayCheckout({
        key: offer.keyId,
        name: 'ConvoSync',
        description: `${planName} (${offer.billingCycle})`,
        theme: { color: BRAND_PURPLE },
        subscription_id: offer.razorpaySubscriptionId,
        currency: offer.currency,
        onSuccess: async (response) => {
          if (!response.razorpay_subscription_id || !response.razorpay_signature) {
            throw new Error('Incomplete subscription payment response');
          }
          await api.verifyBillingSubscription({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_signature: response.razorpay_signature,
          });
          setActionMessage(`You're now on ${planName}.`);
          await load();
          dispatchCompanyUpdated({});
        },
      });
    } catch (err) {
      const message = formatCatchError(err);
      if (message !== 'Payment cancelled') setError(message);
    } finally {
      setOfferPayBusy(null);
    }
  }

  function ctaLabel(plan: TenantPlan): string {
    if (plan.id === currentSlug) return 'Current plan';
    if (isCustomPriced(plan, currency)) return 'Contact sales';
    if (!currentSlug || !paid) return 'Subscribe';
    const currentPrice =
      currency === 'USD' ? (currentPlan?.priceMonthlyUsd ?? 0) : (currentPlan?.price ?? 0);
    const nextPrice = currency === 'USD' ? (plan.priceMonthlyUsd ?? 0) : (plan.price ?? 0);
    if (nextPrice > currentPrice) return 'Upgrade';
    if (nextPrice < currentPrice) return 'Switch plan';
    return 'Select plan';
  }

  function scrollToCatalog() {
    document.getElementById('plans-catalog')?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }

  if (loading) return <PlansSkeleton />;

  if (error && !subscription) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      >
        {error}
      </div>
    );
  }

  const currentPrice = currentPlan ? priceForCycle(currentPlan, 'monthly', currency) : null;
  const CurrentIcon = currentPlan ? (PLAN_ICONS[currentPlan.id] ?? Sparkles) : Sparkles;
  const checkoutPrice = checkoutPlan ? priceForCycle(checkoutPlan, cycle, currency) : null;
  const checkoutBusy = checkoutPlan ? checkoutSlug === checkoutPlan.id : false;

  return (
    <motion.div
      className="mx-auto max-w-6xl overflow-x-hidden"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      <div className="space-y-5">
        <AnimatePresence mode="popLayout">
          {error ? (
            <motion.div
              key="err"
              role="alert"
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </motion.div>
          ) : null}
          {actionMessage ? (
            <motion.div
              key="ok"
              role="status"
              aria-live="polite"
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2 rounded-2xl border border-swiss-accent/20 bg-accent-green-bg px-4 py-3 text-sm font-medium text-swiss-accent"
            >
              <Check className="h-4 w-4 shrink-0" aria-hidden />
              {actionMessage}
            </motion.div>
          ) : null}
          {pendingOffers.map((offer) => {
            const major = offer.amountMinor / 100;
            const amountLabel =
              offer.currency === 'USD'
                ? `$${major.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                : `₹${major.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
            const busy = offerPayBusy === offer.id;
            return (
              <motion.div
                key={offer.id}
                role="status"
                initial={reduceMotion ? false : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-950">
                    {offer.offerType === 'payment_link'
                      ? 'Complete your payment'
                      : 'Complete your subscription'}
                  </p>
                  <p className="mt-0.5 text-sm text-amber-900/80">
                    {offer.plan?.name ?? 'Plan'} · {amountLabel}/{offer.billingCycle}
                    {offer.offerType === 'payment_link' ? (
                      <span className="ml-1 inline-flex rounded-full bg-amber-200/80 px-2 py-0.5 text-[11px] font-bold text-amber-950">
                        Payment link (not recurring)
                      </span>
                    ) : (
                      <span className="ml-1 inline-flex rounded-full bg-amber-200/80 px-2 py-0.5 text-[11px] font-bold text-amber-950">
                        Subscription
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handlePayOffer(offer)}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-950 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                  Pay now
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Bento: current + upgrade nudge */}
        <div className="grid gap-4 lg:grid-cols-3">
          <motion.section
            variants={itemVariants}
            className="relative overflow-hidden rounded-3xl border border-border-subtle bg-white p-6 sm:p-7 lg:col-span-2"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Your workspace
            </p>

            {currentPlan ? (
              <div className="mt-4 flex flex-wrap items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-green-bg text-swiss-accent ring-1 ring-swiss-accent/12">
                  <CurrentIcon className="h-7 w-7" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                      {currentPlan.name}
                    </h2>
                    {currentPrice?.amount != null ? (
                      <p className="text-lg font-semibold text-slate-700">
                        {currentPrice.label}
                        <span className="text-sm font-medium text-slate-500">/mo</span>
                      </p>
                    ) : currentPrice ? (
                      <p className="text-lg font-semibold text-slate-700">{currentPrice.label}</p>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                        paid
                          ? 'bg-accent-green-bg text-swiss-accent ring-1 ring-swiss-accent/20'
                          : 'bg-white text-slate-700 ring-1 ring-black/5'
                      }`}
                    >
                      {paid ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                      {status}
                    </span>
                    {!paid && subscription?.trial?.isTrial ? (
                      <span className="inline-flex min-h-8 items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
                        Trial
                        {subscription.trial.trialDaysLeft != null
                          ? ` · ${subscription.trial.trialDaysLeft}d left`
                          : ''}
                      </span>
                    ) : null}
                    {cancelling ? (
                      <span className="inline-flex min-h-8 items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
                        Cancels at period end
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                    {paid && nextBilling ? (
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock className="h-4 w-4 text-slate-400" aria-hidden />
                        Next billing {formatBillingDate(nextBilling)}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5">
                      <Wallet className="h-4 w-4 text-slate-400" aria-hidden />
                      Usage on ConvoCoins
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-slate-400" aria-hidden />
                      Cancel anytime
                    </span>
                  </div>

                  {paid && !cancelling ? (
                    <button
                      type="button"
                      disabled={cancelBusy}
                      onClick={() => void handleCancel()}
                      className="mt-5 min-h-11 cursor-pointer text-sm font-semibold text-slate-500 underline-offset-2 transition-colors duration-200 hover:text-slate-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-swiss-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {cancelBusy ? 'Cancelling…' : 'Cancel subscription'}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-950">
                  No plan selected
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                  Pick a plan below to keep your workspace active and unlock upgrades anytime.
                </p>
              </>
            )}
          </motion.section>

          <motion.aside
            variants={itemVariants}
            className="flex flex-col justify-between rounded-3xl border border-swiss-accent bg-swiss-accent p-6 text-white sm:p-7"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
                Recommended
              </p>
              <h3 className="mt-3 font-display text-2xl font-bold tracking-tight">
                {recommended ? recommended.name : 'Browse plans'}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                {recommended && !isCustomPriced(recommended, currency)
                  ? `More seats, channels, and AI — from ${priceForCycle(recommended, 'monthly', currency).label}/mo.`
                  : recommended
                    ? 'Custom scale, priority onboarding, and negotiated volume.'
                    : 'Compare tiers and upgrade when you are ready.'}
              </p>
            </div>
            <motion.button
              type="button"
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              onClick={() => {
                if (recommended && isCustomPriced(recommended, currency)) {
                  window.open(contactSalesUrl(), '_blank', 'noopener,noreferrer');
                  return;
                }
                if (recommended) {
                  scrollToCatalog();
                  document
                    .getElementById(`plan-card-${recommended.id}`)
                    ?.focus({ preventScroll: true });
                  return;
                }
                scrollToCatalog();
              }}
              className="mt-6 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-swiss-accent transition-colors duration-200 hover:bg-accent-green-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {recommended
                ? isCustomPriced(recommended, currency)
                  ? 'Talk to sales'
                  : `Upgrade to ${recommended.name}`
                : 'Browse plans'}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </motion.button>
          </motion.aside>
        </div>

        {currentPlan && billing?.usageSnapshot ? (
          <motion.section
            variants={itemVariants}
            className="rounded-3xl border border-border-subtle bg-white p-6 sm:p-7"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-green-bg text-swiss-accent ring-1 ring-swiss-accent/10">
                <Gauge className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950">Plan utilization</h3>
                <p className="mt-0.5 text-sm text-slate-600">
                  Usage vs your plan limits — upgrade when you need more room.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <UtilBar
                label="Contacts"
                used={billing.usageSnapshot.contacts?.used ?? 0}
                limit={billing.usageSnapshot.contacts?.limit}
              />
              <UtilBar
                label="Channels"
                used={billing.usageSnapshot.channels?.used ?? 0}
                limit={billing.usageSnapshot.channels?.limit}
              />
              <UtilBar
                label="AI agents"
                used={billing.usageSnapshot.aiAgents?.used ?? 0}
                limit={billing.usageSnapshot.aiAgents?.limit}
              />
              <UtilBar
                label="Team members"
                used={billing.usageSnapshot.teamMembers?.used ?? 0}
                limit={billing.usageSnapshot.teamMembers?.limit}
              />
              <UtilBar
                label="AI tokens"
                used={billing.usageSnapshot.aiTokens?.used ?? 0}
                limit={billing.usageSnapshot.aiTokens?.limit}
              />
              <UtilBar
                label="Emails"
                used={billing.usageSnapshot.emails?.used ?? 0}
                limit={billing.usageSnapshot.emails?.limit}
              />
              <UtilBar
                label="Campaigns"
                used={billing.usageSnapshot.campaigns?.used ?? 0}
                limit={billing.usageSnapshot.campaigns?.limit}
              />
            </div>
            {(utilizationPct(
              billing.usageSnapshot.contacts?.used ?? 0,
              billing.usageSnapshot.contacts?.limit
            ) ?? 0) >= 80 ||
            (utilizationPct(
              billing.usageSnapshot.channels?.used ?? 0,
              billing.usageSnapshot.channels?.limit
            ) ?? 0) >= 80 ||
            (utilizationPct(
              billing.usageSnapshot.aiAgents?.used ?? 0,
              billing.usageSnapshot.aiAgents?.limit
            ) ?? 0) >= 80 ? (
              <p className="mt-4 text-sm text-amber-800">
                You&apos;re nearing a plan limit.{' '}
                <button
                  type="button"
                  onClick={scrollToCatalog}
                  className="cursor-pointer font-semibold underline-offset-2 hover:underline"
                >
                  Compare plans to upgrade
                </button>
              </p>
            ) : null}
          </motion.section>
        ) : null}

        {/* Catalog header */}
        <motion.div
          id="plans-catalog"
          variants={itemVariants}
          className="flex scroll-mt-6 flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <h3 className="font-display text-2xl font-bold tracking-tight text-slate-950">
              Compare plans
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Switch anytime. Message & AI usage stays on ConvoCoins.
            </p>
          </div>

          {hasAnnual ? (
            <div
              role="group"
              aria-label="Billing cycle"
              className="relative inline-flex rounded-2xl border border-border-subtle bg-white p-1"
            >
              {(['monthly', 'annual'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={cycle === key}
                  onClick={() => setCycle(key)}
                  className="relative inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold capitalize focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-swiss-accent"
                >
                  {cycle === key ? (
                    <motion.span
                      layoutId="plans-cycle-pill"
                      className="absolute inset-0 rounded-xl bg-white shadow-sm"
                      transition={reduceMotion ? { duration: 0 } : springSoft}
                    />
                  ) : null}
                  <span
                    className={`relative z-10 transition-colors duration-200 ${
                      cycle === key ? 'text-slate-950' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {key}
                  </span>
                  {key === 'annual' && maxAnnualSave > 0 ? (
                    <span className="relative z-10 rounded-md bg-accent-green-bg px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-swiss-accent">
                      Save {maxAnnualSave}%
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </motion.div>

        {/* Plan cards */}
        <motion.div
          variants={pageVariants}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {plans.map((plan) => {
            const isCurrent = plan.id === currentSlug;
            const custom = isCustomPriced(plan, currency);
            const price = priceForCycle(plan, cycle, currency);
            const busy = checkoutSlug === plan.id;
            const highlights = planHighlights(plan);
            const label = ctaLabel(plan);
            const Icon = PLAN_ICONS[plan.id] ?? Sparkles;
            const savePct = cycle === 'annual' ? annualSavingsPct(plan, currency) : null;
            const featured = plan.popular && !isCurrent;

            return (
              <motion.article
                key={plan.id}
                id={`plan-card-${plan.id}`}
                tabIndex={-1}
                variants={cardVariants}
                initial="hidden"
                animate="show"
                className={`relative flex flex-col rounded-3xl border bg-white p-5 outline-none sm:p-6 ${
                  isCurrent
                    ? 'border-swiss-accent'
                    : featured
                      ? 'border-swiss-accent/50'
                      : 'border-border-subtle'
                }`}
              >
                {(isCurrent || featured) && (
                  <span
                    className={`mb-3 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${
                      isCurrent ? 'bg-swiss-accent' : 'bg-channel-green'
                    }`}
                  >
                    {isCurrent ? 'Current' : 'Most popular'}
                  </span>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-green-bg text-swiss-accent ring-1 ring-swiss-accent/10">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <AnimatePresence mode="wait">
                    {savePct != null && savePct > 0 ? (
                      <motion.span
                        key={`save-${plan.id}-${cycle}`}
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="rounded-lg bg-accent-green-bg px-2 py-0.5 text-[11px] font-bold text-swiss-accent"
                      >
                        −{savePct}%
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>

                <h4 className="mt-4 text-lg font-bold tracking-tight text-slate-950">{plan.name}</h4>

                <div className="mt-2 min-h-[3.25rem]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${plan.id}-${cycle}`}
                      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                    >
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <p className="font-display text-3xl font-bold tracking-tight text-slate-950">
                          {price.label}
                        </p>
                        {price.amount != null ? (
                          <span className="text-sm font-medium text-slate-500">
                            /{cycle === 'annual' ? 'yr' : 'mo'}
                          </span>
                        ) : null}
                      </div>
                      {cycle === 'annual' && price.amount != null ? (
                        <p className="mt-1 text-xs text-slate-500">
                          ≈{' '}
                          {currency === 'USD'
                            ? `$${Math.round(price.amount / 12).toLocaleString('en-US')}`
                            : `₹${Math.round(price.amount / 12).toLocaleString('en-IN')}`}
                          /mo billed yearly
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-slate-500">Unlimited contacts</p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <ul className="mt-5 flex flex-1 flex-col gap-2.5" role="list">
                  {highlights.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm leading-snug text-slate-700"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-green-bg text-swiss-accent">
                        <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  type="button"
                  disabled={isCurrent || busy || Boolean(checkoutSlug) || Boolean(checkoutPlan)}
                  onClick={() => openCheckoutModal(plan)}
                  whileTap={
                    isCurrent || busy || reduceMotion ? undefined : { scale: 0.98 }
                  }
                  aria-label={
                    isCurrent ? `${plan.name} is your current plan` : `${label} — ${plan.name}`
                  }
                  className={`mt-6 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-swiss-accent disabled:cursor-not-allowed disabled:opacity-60 ${
                    isCurrent
                      ? 'bg-white text-slate-500'
                      : custom
                        ? 'border border-border-subtle bg-white text-slate-800 hover:bg-surface-muted'
                        : 'bg-swiss-accent text-white hover:bg-swiss-accent-hover'
                  }`}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                  {label}
                  {!isCurrent && !custom && !busy ? (
                    <ArrowRight className="h-4 w-4 opacity-80" aria-hidden />
                  ) : null}
                </motion.button>
              </motion.article>
            );
          })}
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="pb-1 text-center text-xs leading-relaxed text-slate-500"
        >
          {currency === 'USD'
            ? 'Prices in USD · Cards via Razorpay · Cancel anytime before the next billing date'
            : 'Prices in INR · UPI & cards via Razorpay · Cancel anytime before the next billing date'}
        </motion.p>
      </div>

      {checkoutPlan ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            className="w-full max-w-md rounded-2xl border border-border-subtle bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-checkout-title"
          >
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3.5">
              <h4 id="plan-checkout-title" className="font-display text-base font-bold text-slate-950">
                Confirm plan
              </h4>
              <button
                type="button"
                onClick={closeCheckoutModal}
                disabled={checkoutBusy}
                className="cursor-pointer rounded-lg p-1 text-slate-500 transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="rounded-2xl border border-swiss-accent/15 bg-accent-green-bg/60 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  {cycle} billing
                </p>
                <p className="mt-1 font-display text-xl font-bold text-slate-950">{checkoutPlan.name}</p>
                <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
                  <p className="text-2xl font-bold text-slate-900">{checkoutPrice?.label ?? '—'}</p>
                  {checkoutPrice?.amount != null ? (
                    <span className="text-sm font-medium text-slate-500">
                      /{cycle === 'annual' ? 'yr' : 'mo'}
                    </span>
                  ) : null}
                </div>
                {cycle === 'annual' && checkoutPrice?.amount != null ? (
                  <p className="mt-1 text-xs text-slate-600">
                    ≈{' '}
                    {currency === 'USD'
                      ? `$${Math.round(checkoutPrice.amount / 12).toLocaleString('en-US')}`
                      : `₹${Math.round(checkoutPrice.amount / 12).toLocaleString('en-IN')}`}
                    /mo billed yearly
                  </p>
                ) : null}
                {appliedCoupon ? (
                  <p className="mt-2 text-sm font-semibold text-swiss-accent">
                    Pay {formatMinor(appliedCoupon.finalAmountPaise, currency)}{' '}
                    <span className="font-normal text-slate-500 line-through">
                      {formatMinor(appliedCoupon.originalAmountPaise, currency)}
                    </span>
                  </p>
                ) : null}
              </div>

              <div className="mt-4">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-green-bg text-swiss-accent ring-1 ring-swiss-accent/10">
                    <Ticket className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-950">Coupon code</p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Optional. With a coupon, payment is one-time (not auto-renew).
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      if (appliedCoupon) setAppliedCoupon(null);
                      setCouponError(null);
                    }}
                    disabled={couponBusy || checkoutBusy}
                    placeholder="Enter code"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-auto min-h-10 flex-1 rounded-xl border border-border-subtle bg-white px-3 text-sm font-medium uppercase tracking-wide text-slate-900 placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-swiss-accent disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      disabled={checkoutBusy}
                      className="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-border-subtle bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-swiss-accent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <X className="h-4 w-4" aria-hidden />
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleApplyCoupon()}
                      disabled={couponBusy || !couponInput.trim() || checkoutBusy}
                      className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-swiss-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-swiss-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-swiss-accent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {couponBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                      Apply
                    </button>
                  )}
                </div>

                {couponError ? (
                  <p role="alert" className="mt-2 text-xs font-medium text-red-700">
                    {couponError}
                  </p>
                ) : null}

                {appliedCoupon ? (
                  <p className="mt-2 text-sm text-slate-700">
                    <span className="font-semibold text-swiss-accent">{appliedCoupon.code}</span>
                    {' · '}
                    {formatMinor(appliedCoupon.discountPaise, currency)} off
                  </p>
                ) : null}
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                You will be redirected to Razorpay to complete payment. Cancel anytime before the
                next billing date.
              </p>
            </div>

            <div className="flex gap-2 border-t border-border-subtle px-5 py-3.5">
              <button
                type="button"
                disabled={checkoutBusy}
                onClick={closeCheckoutModal}
                className="flex-1 cursor-pointer rounded-xl border border-border-subtle px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={checkoutBusy}
                onClick={() => void handleConfirmCheckout()}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-swiss-accent px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-swiss-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkoutBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {checkoutBusy
                  ? 'Opening…'
                  : appliedCoupon
                    ? `Pay ${formatMinor(appliedCoupon.finalAmountPaise, currency)}`
                    : 'Continue to pay'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
