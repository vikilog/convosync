import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  XCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { pathForIntegrationsChannel, pathForTab } from '../routes';
import { useKeepAliveActivation, useKeepAliveActive } from './KeepAlive';
import { CreatePaymentRequestModal } from './pay/CreatePaymentRequestModal';

type PaymentRequest = {
  id: string;
  contactId: string | null;
  contactName: string;
  contactPhone: string;
  amountPaise: number;
  currency: string;
  description: string;
  status: string;
  paymentLinkUrl: string | null;
  sentAt: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

type PaySummary = {
  totalCollectedPaise: number;
  pendingCount: number;
  paidCount: number;
  sentCount: number;
  requestCount: number;
  razorpayConfigured: boolean;
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-sky-50 text-sky-700',
  paid: 'bg-primary/10 text-primary',
  expired: 'bg-amber-50 text-amber-800',
  failed: 'bg-red-50 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

function fmtInr(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const PayView: React.FC = () => {
  const isActive = useKeepAliveActive();
  const [summary, setSummary] = useState<PaySummary | null>(null);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'draft' | 'sent' | 'paid'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const waStatus = await api.getWhatsAppStatus().catch(() => ({ connected: false }));
      setWhatsappConnected(Boolean(waStatus.connected));
    } catch {
      setWhatsappConnected(false);
    }

    try {
      const [summaryRes, requestsRes] = await Promise.all([
        api.getWhatsAppPaySummary(),
        api.getWhatsAppPayRequests(filterStatus),
      ]);
      setSummary(summaryRes);
      setRequests(requestsRes.requests);
    } catch (err) {
      if (options?.silent) {
        console.error(err);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load WhatsApp Pay');
      }
      setSummary(null);
      setRequests([]);
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    if (!isActive) return;
    void loadData();
  }, [isActive, loadData]);

  useKeepAliveActivation(() => {
    void loadData({ silent: true });
  });

  const kpiStats = useMemo(
    () => [
      {
        label: 'Collected',
        value: fmtInr(summary?.totalCollectedPaise ?? 0),
        sub: `${summary?.paidCount ?? 0} paid`,
        icon: CheckCircle2,
        color: 'text-primary bg-primary/10',
      },
      {
        label: 'Pending',
        value: String(summary?.pendingCount ?? 0),
        sub: 'Awaiting payment',
        icon: Clock,
        color: 'text-amber-600 bg-amber-50',
      },
      {
        label: 'Sent in chat',
        value: String(summary?.sentCount ?? 0),
        sub: 'WhatsApp links delivered',
        icon: Send,
        color: 'text-sky-600 bg-sky-50',
      },
      {
        label: 'Total requests',
        value: String(summary?.requestCount ?? 0),
        sub: 'All time',
        icon: CreditCard,
        color: 'text-violet-600 bg-violet-50',
      },
    ],
    [summary]
  );

  const handleSend = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await api.sendWhatsAppPayRequest(id);
      await loadData({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send payment request');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this payment request?')) return;
    setBusyId(id);
    setError(null);
    try {
      await api.cancelWhatsAppPayRequest(id);
      await loadData({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
    } finally {
      setBusyId(null);
    }
  };

  const handleRefresh = async (id: string) => {
    setBusyId(id);
    try {
      await api.refreshWhatsAppPayRequest(id);
      await loadData({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh status');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 max-w-7xl mx-auto pb-12 flex items-center justify-center min-h-[240px]">
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
          Loading WhatsApp Pay…
        </div>
      </div>
    );
  }

  if (!whatsappConnected) {
    return (
      <div className="flex-1 max-w-2xl mx-auto pb-12 pt-8 px-4 text-center">
        <div className="inline-flex p-3 rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
          <CreditCard className="w-8 h-8" />
        </div>
        <h1 className="font-display text-xl font-black text-gray-900">WhatsApp Pay</h1>
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
          Connect WhatsApp first, then send secure Razorpay payment links directly in customer chats.
        </p>
        <Link
          to={pathForIntegrationsChannel('whatsapp')}
          className="inline-flex mt-6 px-4 py-2.5 bg-channel-green hover:bg-[#20bd5a] text-white text-sm font-bold rounded-xl transition-colors"
        >
          Connect WhatsApp
        </Link>
      </div>
    );
  }

  const payApiUnavailable = summary === null && Boolean(error);

  return (
    <div className="flex-1 space-y-6 max-w-7xl mx-auto pb-12 text-left">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-gray-900 text-xl leading-tight">WhatsApp Pay</h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            Create payment requests and send secure UPI / card links inside WhatsApp conversations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          disabled={!summary?.razorpayConfigured || payApiUnavailable}
          title={
            payApiUnavailable
              ? 'Payment service is unavailable'
              : summary?.razorpayConfigured
                ? undefined
                : 'Razorpay is not configured on the server'
          }
          className="bg-primary hover:bg-primary-hover disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New payment request
        </button>
      </header>

      {!summary?.razorpayConfigured && !payApiUnavailable && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium px-4 py-3 rounded-xl">
          Razorpay keys are not configured on the server. Payment links cannot be created until{' '}
          <code className="text-xs bg-amber-100 px-1 rounded">RAZORPAY_KEY_ID</code> and{' '}
          <code className="text-xs bg-amber-100 px-1 rounded">RAZORPAY_KEY_SECRET</code> are set.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm font-medium px-4 py-3 rounded-xl">
          {error}
          {payApiUnavailable && (
            <p className="text-xs mt-2 text-red-600/90">
              Payment APIs may not be deployed yet. Run the database migration and redeploy the backend.
            </p>
          )}
        </div>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-surface p-5 rounded-2xl border border-black/5 hover:border-primary/10 transition-colors"
          >
            <div className={`${stat.color} w-8 h-8 rounded-xl flex items-center justify-center mb-2`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest leading-none mb-1">
              {stat.label}
            </p>
            <p className="text-2xl font-black text-gray-900 font-mono">{stat.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-surface border border-black/5 rounded-xl p-1">
            {(['ALL', 'draft', 'sent', 'paid'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors cursor-pointer capitalize ${
                  filterStatus === s ? 'bg-primary text-white' : 'text-gray-600 hover:bg-surface-muted'
                }`}
              >
                {s === 'ALL' ? 'All' : s}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void loadData({ silent: true })}
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        <div className="bg-surface border border-black/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-muted text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-muted/60">
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900">{row.contactName}</p>
                      <p className="text-xs text-gray-500">{row.contactPhone}</p>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">
                      {fmtInr(row.amountPaise)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{row.description}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold capitalize ${
                          STATUS_STYLES[row.status] ?? STATUS_STYLES.draft
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {fmtDate(row.paidAt ?? row.sentAt ?? row.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {(row.status === 'draft' || row.status === 'sent') && (
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => void handleSend(row.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-hover disabled:opacity-50 cursor-pointer"
                          >
                            {busyId === row.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            {row.status === 'draft' ? 'Send' : 'Resend'}
                          </button>
                        )}
                        {row.status === 'sent' && (
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => void handleRefresh(row.id)}
                            className="px-2.5 py-1.5 rounded-lg border border-black/5 text-xs font-bold text-gray-600 hover:bg-surface-muted disabled:opacity-50 cursor-pointer"
                          >
                            Check
                          </button>
                        )}
                        {row.status !== 'paid' && row.status !== 'cancelled' && (
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => void handleCancel(row.id)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                            aria-label="Cancel"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {row.paymentLinkUrl && (
                          <a
                            href={row.paymentLinkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-sky-600 hover:underline"
                          >
                            Link
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {requests.length === 0 && (
            <div className="text-center py-16 px-4">
              <CreditCard className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-sm text-gray-700">No payment requests yet</p>
              <p className="text-xs text-gray-500 mt-1">
                Create a request and send a secure payment link in WhatsApp chat.
              </p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New payment request
              </button>
            </div>
          )}
        </div>
      </section>

      <p className="text-xs text-gray-500">
        Payments are processed via Razorpay. Enable the{' '}
        <code className="bg-slate-100 px-1 rounded">payment_link.paid</code> webhook event in your
        Razorpay dashboard for automatic status updates. Open{' '}
        <Link to={pathForTab('inbox')} className="text-sky-600 font-bold hover:underline">
          Inbox
        </Link>{' '}
        to see payment messages in conversation threads.
      </p>

      {showCreateModal && (
        <CreatePaymentRequestModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            void loadData({ silent: true });
          }}
        />
      )}
    </div>
  );
};
