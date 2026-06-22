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
  formatInrAmount,
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
  usageSnapshot?: {
    contacts: { used: number; limit: number; pending: number };
    teamMembers: { used: number; limit: number; pending: number };
    aiAgents: { used: number; limit: number; pending: number };
    channels: { used: number; limit: number; pending: number };
    campaigns: { used: number; limit: number; pending: number };
    emails: { used: number; limit: number; pending: number };
    aiTokens: {
      used: number;
      limit: number;
      pending: number;
      inputTokens?: number;
      outputTokens?: number;
      costInr?: number;
      includedCreditInr?: number;
      billedCostInr?: number;
    };
  } | null;
  fx?: {
    usdInrRate: number;
    fetchedAt: string;
    source: string;
  } | null;
  addonCatalog?: AddonCatalogEntry[];
  emailProvider?: { name: string; pricingLabel: string };
  recentInvoices: BillingTransaction[];
  recentAddons: BillingTransaction[];
};

function formatLimitValue(value: number) {
  if (value > 1_000_000) return 'Unlimited';
  return value.toLocaleString();
}

function formatPendingValue(value: number) {
  if (value > 1_000_000) return 'Unlimited';
  return value.toLocaleString();
}

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

  const usageRows = limits
    ? [
        {
          label: 'Contacts',
          limit: limits.contactsLimit,
          usage: data.usageSnapshot?.contacts,
        },
        {
          label: 'Team members',
          limit: limits.teamMembersLimit,
          usage: data.usageSnapshot?.teamMembers,
        },
        {
          label: 'AI agents',
          limit: limits.aiAgentsLimit,
          usage: data.usageSnapshot?.aiAgents,
        },
        {
          label: 'Channels',
          limit: limits.channelsLimit,
          usage: data.usageSnapshot?.channels,
        },
        {
          label: 'Campaigns',
          limit: limits.campaignsLimit,
          usage: data.usageSnapshot?.campaigns,
        },
        {
          label: 'Emails / month',
          limit: limits.emailsLimit,
          usage: data.usageSnapshot?.emails,
        },
        {
          label: 'AI tokens',
          limit: limits.aiTokensIncluded,
          usage: data.usageSnapshot?.aiTokens,
        },
      ]
    : [];
  const totalPending = usageRows.reduce(
    (sum, row) => sum + (row.usage?.pending ?? row.limit),
    0
  );
  const totalUsed = usageRows.reduce((sum, row) => sum + (row.usage?.used ?? 0), 0);
  const aiTokenUsage = data.usageSnapshot?.aiTokens;
  const aiCostInr = aiTokenUsage?.costInr ?? 0;
  const aiBilledCostInr = aiTokenUsage?.billedCostInr ?? 0;

  return (
    <div className="space-y-5 max-w-6xl">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Current plan
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {data.plan?.name ?? 'No paid plan'}
            </p>
            <p className="mt-0.5 text-xs capitalize text-slate-600">{statusLabel}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Billing cycle
            </p>
            <p className="mt-1 text-base font-semibold capitalize text-slate-900">
              {sub?.billingCycle ?? '—'}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              {sub?.currentPeriodEnd
                ? `Renews on ${formatBillingDate(sub.currentPeriodEnd)}`
                : 'No active renewal window'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Usage snapshot
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {totalUsed.toLocaleString()} used
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              {formatPendingValue(totalPending)} pending across limits
            </p>
            {aiTokenUsage && (
              <p className="mt-1 text-xs text-slate-600">
                AI: {aiTokenUsage.used.toLocaleString()} tokens ·{' '}
                {formatInrAmount(aiCostInr)}
                {aiBilledCostInr > 0
                  ? ` (${formatInrAmount(aiBilledCostInr)} billable)`
                  : aiCostInr > 0
                    ? ' (included in plan)'
                    : ''}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <Link
            to={pathForSettingsSection('subscription')}
            className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-800"
          >
            Change or upgrade plan
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {sub?.cancelAtPeriodEnd && (
            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
              Cancels at period end
            </span>
          )}
        </div>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <Gauge className="mt-0.5 h-5 w-5 text-sky-600" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Usage limits
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Limit, used, pending, and monthly cost by resource
              </p>
            </div>
          </div>
          {limits ? (
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-[1.4fr_0.9fr_0.9fr_0.9fr_1fr] bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                <span>Metric</span>
                <span className="text-right">Limit</span>
                <span className="text-right">Used</span>
                <span className="text-right">Pending</span>
                <span className="text-right">Cost (month)</span>
              </div>
              <ul className="divide-y divide-slate-200">
                {usageRows.map((item) => {
                  const used = item.usage?.used ?? 0;
                  const pending = item.usage?.pending ?? item.limit;
                  const isAiTokens = item.label === 'AI tokens';
                  const rowCostInr = isAiTokens ? (item.usage?.costInr ?? 0) : null;
                  const rowBilledInr = isAiTokens ? (item.usage?.billedCostInr ?? 0) : null;
                  const pendingClass =
                    pending === 0
                      ? 'text-red-600'
                      : pending <= 5
                        ? 'text-amber-700'
                        : 'text-emerald-700';
                  return (
                    <li
                      key={item.label}
                      className="grid grid-cols-[1.4fr_0.9fr_0.9fr_0.9fr_1fr] items-center px-3 py-2.5 text-sm"
                    >
                      <span className="font-medium text-slate-700">
                        {item.label}
                        {isAiTokens &&
                        item.usage?.inputTokens != null &&
                        item.usage?.outputTokens != null ? (
                          <span className="mt-0.5 block text-[11px] font-normal text-slate-500">
                            {item.usage.inputTokens.toLocaleString()} in ·{' '}
                            {item.usage.outputTokens.toLocaleString()} out
                          </span>
                        ) : null}
                      </span>
                      <span className="text-right text-slate-700">
                        {formatLimitValue(item.usage?.limit ?? item.limit)}
                      </span>
                      <span className="text-right text-slate-700">{used.toLocaleString()}</span>
                      <span className={`text-right font-semibold ${pendingClass}`}>
                        {formatPendingValue(pending)}
                      </span>
                      <span className="text-right text-slate-700">
                        {isAiTokens ? (
                          <span className="inline-flex flex-col items-end">
                            <span>{formatInrAmount(rowCostInr ?? 0)}</span>
                            {rowBilledInr != null && rowBilledInr > 0 ? (
                              <span className="text-[11px] font-semibold text-amber-700">
                                {formatInrAmount(rowBilledInr)} billable
                              </span>
                            ) : rowCostInr != null && rowCostInr > 0 ? (
                              <span className="text-[11px] text-emerald-700">Included</span>
                            ) : null}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-500">
              Limits apply after you subscribe to a plan.
            </p>
          )}
          {data.emailProvider && (
            <p className="mt-3 text-xs text-slate-500">
              Email delivery: {data.emailProvider.name} · {data.emailProvider.pricingLabel}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 h-5 w-5 text-sky-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Billing details
              </p>
              <p className="mt-1 text-sm text-slate-600">Subscription and payment status</p>
            </div>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Plan</dt>
              <dd className="font-semibold text-slate-900">{data.plan?.name ?? 'No paid plan'}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Subscription status</dt>
              <dd className="font-semibold capitalize text-slate-900">{statusLabel}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Gateway status</dt>
              <dd className="font-semibold capitalize text-slate-900">{sub?.status ?? 'Created'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Billing cycle</dt>
              <dd className="font-semibold capitalize text-slate-900">{sub?.billingCycle ?? 'Monthly'}</dd>
            </div>
          </dl>
        </section>
      </div>

      {data.addonCatalog && data.addonCatalog.length > 0 && (
        <BillingAddonsPanel
          addonCatalog={data.addonCatalog}
          fx={data.fx ?? null}
          onPurchased={load}
        />
      )}

      {sub && ['active', 'authenticated', 'paused'].includes(sub.status) && (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-900">Manage subscription</p>
          <p className="mt-1 text-xs text-slate-600">
            Pause billing or cancel at the end of the current period.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {sub.status === 'paused' ? (
              <button
                type="button"
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
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
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
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
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
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

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Receipt className="mt-0.5 h-5 w-5 text-sky-600" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Recent transactions</p>
              <p className="mt-0.5 text-xs text-slate-600">Payments and invoices from Razorpay</p>
            </div>
          </div>
          <Link
            to={pathForSettingsSection('invoices')}
            className="text-sm font-semibold text-sky-700 hover:text-sky-800"
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
                    <p className="text-sm font-semibold text-slate-900">
                      {row.description ?? formatTransactionType(row.type)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatTransactionType(row.type)} · {formatBillingDate(row.paidAt ?? row.createdAt)}
                    </p>
                    <div className="mt-1.5 space-y-0.5">
                      <TransactionId label="Payment" value={row.razorpayPaymentId} />
                      <TransactionId label="Order" value={row.razorpayOrderId} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-900">
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

      <p className="flex items-center gap-2 text-xs text-slate-500">
        <Calendar className="h-3.5 w-3.5" />
        All amounts are in INR. Payment provider: Razorpay.
      </p>
    </div>
  );
}
