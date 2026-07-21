/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { api, formatCatchError } from '../../lib/api';
import { openRazorpayCheckout } from '../../lib/razorpay';
import { BRAND_PURPLE } from '../../lib/convocoins';
import { hasPaidSubscription, resolveCheckoutPlan, subscriptionStatusLabel, type BillingPlanOption } from '../../lib/billingSubscription';

const PLAN_NAME = 'ConvoSync Pro';
const PLAN_PRICE_INR = 1999;
const PLAN_SLUG = 'starter';

const INCLUDED_FEATURES = [
  'WhatsApp Inbox (unlimited)',
  'Instagram Inbox (unlimited)',
  'Campaigns',
  'Templates',
  'Journey builder',
  'AI Agent',
  'Email campaigns',
  'All channels access',
  'Unlimited team members',
  'Priority support',
] as const;

type BillingWorkspace = {
  subscriptionStatus: string;
  plan: { id: string; slug: string; name: string } | null;
  billingSubscription: {
    status: string;
    billingCycle: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
};

function formatBillingDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function subscriptionLabel(status: string, billingStatus?: string): string {
  return subscriptionStatusLabel(status, billingStatus);
}

export function SubscriptionPanel({
  embedded = false,
  onBillingChange,
}: {
  embedded?: boolean;
  onBillingChange?: () => void;
}) {
  const [data, setData] = useState<BillingWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutPlanSlug, setCheckoutPlanSlug] = useState(PLAN_SLUG);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, plansRes] = await Promise.all([
        api.getBillingWorkspace(),
        api.getBillingPlans().catch(() => []),
      ]);
      const checkoutPlan = resolveCheckoutPlan(
        (plansRes as BillingPlanOption[]) ?? [],
        PLAN_SLUG
      );
      setCheckoutPlanSlug(checkoutPlan?.slug ?? PLAN_SLUG);
      setData(res as BillingWorkspace);
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

  async function handleSubscribe() {
    setCheckoutBusy(true);
    setError(null);
    setActionMessage(null);
    try {
      const created = (await api.createBillingSubscription({
        planId: checkoutPlanSlug,
        billingCycle: 'monthly',
      })) as {
        checkoutMode?: 'subscription' | 'order';
        subscriptionId?: string;
        orderId?: string;
        keyId: string;
        amountPaise: number;
      };

      const useOrderCheckout = created.checkoutMode === 'order' || Boolean(created.orderId);

      await openRazorpayCheckout({
        key: created.keyId,
        name: 'ConvoSync',
        description: `${PLAN_NAME} (monthly)`,
        theme: { color: BRAND_PURPLE },
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
          onBillingChange?.();
        },
      });
    } catch (err) {
      const message = formatCatchError(err);
      if (message !== 'Payment cancelled') {
        setError(message);
      }
    } finally {
      setCheckoutBusy(false);
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
      onBillingChange?.();
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setCancelBusy(false);
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-20 text-slate-400 ${embedded ? 'py-12' : ''}`}>
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const active = data ? hasPaidSubscription(data) : false;
  const status = data
    ? subscriptionLabel(data.subscriptionStatus, data.billingSubscription?.status)
    : 'Inactive';
  const nextBilling = data?.billingSubscription?.currentPeriodEnd ?? null;
  const cancelling = data?.billingSubscription?.cancelAtPeriodEnd ?? false;

  return (
    <div className={embedded ? 'space-y-5' : 'mx-auto max-w-2xl space-y-5'}>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {actionMessage ? (
        <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
          {actionMessage}
        </div>
      ) : null}

      <section className="rounded-xl border border-black/5 bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <p className="text-xl font-bold text-slate-900">{PLAN_NAME}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">
          ₹{PLAN_PRICE_INR.toLocaleString('en-IN')}
          <span className="text-base font-medium text-slate-500">/month</span>
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
              active
                ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                : 'bg-surface-muted text-slate-600 ring-1 ring-black/5'
            }`}
          >
            {active ? <Check className="h-3.5 w-3.5" /> : null}
            {status}
          </span>
          {cancelling ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
              Cancels at period end
            </span>
          ) : null}
        </div>

        {active ? (
          <>
            <p className="mt-5 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">Next billing:</span>{' '}
              {formatBillingDate(nextBilling)}
            </p>
            {!cancelling ? (
              <button
                type="button"
                disabled={cancelBusy}
                onClick={() => void handleCancel()}
                className="mt-5 text-sm font-semibold text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline disabled:opacity-50"
              >
                {cancelBusy ? 'Cancelling…' : 'Cancel subscription'}
              </button>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            disabled={checkoutBusy}
            onClick={() => void handleSubscribe()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {checkoutBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Subscribe to {PLAN_NAME}
          </button>
        )}
      </section>

      <section className="rounded-xl border border-black/5 bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          What&apos;s included
        </h3>
        <ul className="mt-4 space-y-2.5">
          {INCLUDED_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </section>

      {!embedded ? (
        <section className="rounded-xl border border-violet-100 bg-violet-50/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <p className="text-sm leading-relaxed text-slate-700">
            Usage charges (WhatsApp templates, AI responses, emails) are billed separately from
            your <span className="font-semibold text-violet-800">ConvoCoins</span> wallet.
          </p>
        </section>
      ) : null}
    </div>
  );
}
