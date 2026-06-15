/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  CreditCard,
  Gauge,
  Loader2,
  Pause,
  Play,
  Receipt,
  XCircle,
} from 'lucide-react';
import { api, formatCatchError } from '../../lib/api';
import {
  formatBillingDate,
  formatInrPaise,
  formatTransactionType,
  invoiceStatusStyles,
} from '../../lib/billingFormat';
import { pathForSettingsSection } from '../../routes';
import { BillingAddonsPanel, type AddonCatalogEntry } from './BillingAddonsPanel';

type BillingTransaction = {
  id: string;
  source?: 'invoice' | 'addon';
  type: string;
  amountPaise: number;
  currency: string;
  status: string;
  description: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpayInvoiceId: string | null;
  paidAt: string | null;
  createdAt: string;
};

type BillingWorkspace = {
  subscriptionStatus: string;
  plan: { id: string; slug: string; name: string } | null;
  billingSubscription: {
    id: string;
    status: string;
    billingCycle: string;
    razorpaySubscriptionId: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    plan: { id: string; slug: string; name: string } | null;
  } | null;
  usageLimits: {
    contactsLimit: number;
    teamMembersLimit: number;
    aiAgentsLimit: number;
    channelsLimit: number;
    aiTokensIncluded: number;
    campaignsLimit: number;
    emailsLimit: number;
  } | null;
  addonCatalog?: AddonCatalogEntry[];
  emailProvider?: { name: string; pricingLabel: string };
  recentInvoices: BillingTransaction[];
  recentAddons: BillingTransaction[];
};

function TransactionId({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <p className="text-xs text-gray-500">
      <span className="font-semibold text-gray-400">{label}:</span>{' '}
      <span className="font-mono text-gray-600">{value}</span>
    </p>
  );
}

export function BillingOverviewPanel() {
  const [data, setData] = useState<BillingWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await api.getBillingWorkspace()) as BillingWorkspace;
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

  async function runAction(
    key: string,
    fn: () => Promise<unknown>
  ) {
    setActionLoading(key);
    setError(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
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

  if (!data) return null;

  const sub = data.billingSubscription;
  const limits = data.usageLimits;
  const recentRows = [...data.recentInvoices, ...data.recentAddons]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statusLabel =
    data.subscriptionStatus === 'active'
      ? 'Active'
      : data.subscriptionStatus === 'trial'
        ? 'Trial'
        : data.subscriptionStatus.replace(/_/g, ' ');

  return (
    <div className="space-y-6 max-w-5xl">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 h-5 w-5 text-sky-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold uppercase tracking-widest text-gray-400">
                Account
              </p>
              <h3 className="mt-1 text-lg font-bold text-gray-900">
                {data.plan?.name ?? 'No paid plan'}
              </h3>
              <p className="mt-1 text-sm capitalize text-gray-500">{statusLabel}</p>
            </div>
          </div>
          {sub && (
            <dl className="mt-4 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between gap-2">
                <dt className="text-gray-400">Billing cycle</dt>
                <dd className="font-semibold capitalize">{sub.billingCycle}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-400">Razorpay status</dt>
                <dd className="font-semibold capitalize">{sub.status}</dd>
              </div>
              {sub.currentPeriodEnd && (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-400">Current period ends</dt>
                  <dd className="font-semibold">{formatBillingDate(sub.currentPeriodEnd)}</dd>
                </div>
              )}
              {sub.cancelAtPeriodEnd && (
                <p className="rounded-lg bg-amber-50 px-2 py-1 text-amber-800">
                  Cancels at end of billing period
                </p>
              )}
            </dl>
          )}
          <Link
            to={pathForSettingsSection('subscription')}
            className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-sky-600 hover:underline"
          >
            Change or upgrade plan
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Gauge className="mt-0.5 h-5 w-5 text-sky-600" />
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-gray-400">
                Usage limits
              </p>
              <p className="mt-1 text-sm text-gray-500">Included in your current plan</p>
            </div>
          </div>
          {limits ? (
            <ul className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {[
                ['Contacts', limits.contactsLimit],
                ['Team', limits.teamMembersLimit],
                ['AI agents', limits.aiAgentsLimit],
                ['Channels', limits.channelsLimit],
                ['AI tokens', limits.aiTokensIncluded],
                ['Campaigns', limits.campaignsLimit],
                ['Emails / mo', limits.emailsLimit],
              ].map(([label, value]) => (
                <li
                  key={label}
                  className="flex justify-between rounded-lg bg-slate-50 px-3 py-2"
                >
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-gray-800">
                    {typeof value === 'number' && value > 1_000_000
                      ? 'Unlimited'
                      : value?.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-gray-400">
              Limits apply after you subscribe to a plan.
            </p>
          )}
          {data.emailProvider && (
            <p className="mt-3 text-xs text-gray-400">
              Email delivery: {data.emailProvider.name} · {data.emailProvider.pricingLabel}
            </p>
          )}
        </section>
      </div>

      {data.addonCatalog && data.addonCatalog.length > 0 && (
        <BillingAddonsPanel addonCatalog={data.addonCatalog} onPurchased={load} />
      )}

      {sub && ['active', 'authenticated', 'paused'].includes(sub.status) && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-gray-900">Manage subscription</p>
          <p className="mt-1 text-xs text-gray-500">
            Pause billing or cancel at the end of the current period.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {sub.status === 'paused' ? (
              <button
                type="button"
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                onClick={() => void runAction('resume', () => api.resumeBillingSubscription())}
              >
                {actionLoading === 'resume' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Resume
              </button>
            ) : (
              <button
                type="button"
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                onClick={() => void runAction('pause', () => api.pauseBillingSubscription())}
              >
                {actionLoading === 'pause' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Pause className="h-3.5 w-3.5" />
                )}
                Pause
              </button>
            )}
            {!sub.cancelAtPeriodEnd && (
              <button
                type="button"
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
                onClick={() =>
                  void runAction('cancel', () =>
                    api.cancelBillingSubscription({ cancelAtPeriodEnd: true })
                  )
                }
              >
                {actionLoading === 'cancel' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                Cancel at period end
              </button>
            )}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Receipt className="mt-0.5 h-5 w-5 text-sky-600" />
            <div>
              <p className="text-sm font-bold text-gray-900">Recent transactions</p>
              <p className="mt-0.5 text-xs text-gray-500">Payments and invoices from Razorpay</p>
            </div>
          </div>
          <Link
            to={pathForSettingsSection('invoices')}
            className="text-sm font-bold text-sky-600 hover:underline"
          >
            View all
          </Link>
        </div>

        {recentRows.length === 0 ? (
          <p className="mt-6 text-center text-sm text-gray-400 py-8">
            No transactions yet. Subscribe to a plan to see payments here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200">
            {recentRows.map((row) => (
              <li key={row.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {row.description ?? formatTransactionType(row.type)}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatTransactionType(row.type)} · {formatBillingDate(row.paidAt ?? row.createdAt)}
                    </p>
                    <div className="mt-1.5 space-y-0.5">
                      <TransactionId label="Payment" value={row.razorpayPaymentId} />
                      <TransactionId label="Order" value={row.razorpayOrderId} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {formatInrPaise(row.amountPaise, row.currency)}
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-sm font-bold capitalize ${
                        invoiceStatusStyles[row.status] ?? invoiceStatusStyles.created
                      }`}
                    >
                      {row.status}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="flex items-center gap-2 text-xs text-gray-400">
        <Calendar className="h-3.5 w-3.5" />
        All amounts are in INR. Payment provider: Razorpay.
      </p>
    </div>
  );
}
