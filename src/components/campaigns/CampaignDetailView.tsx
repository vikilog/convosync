/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCheck,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CAMPAIGN_CHANNELS,
  CampaignDeliveryTrendPoint,
  CampaignDetail,
  CampaignRecipientInsight,
  CampaignRecordStatus,
} from '../../types';
import { api } from '../../lib/api';
import { mapCampaignDetailFromApi } from '../../lib/mappers';
import { pathForTab } from '../../routes';
import { CampaignDetailAnalytics } from './CampaignDetailAnalytics';
import { ResendButton } from '../shared/ResendButton';

const FAILED_STATUSES = new Set(['failed', 'bounced', 'rejected']);

const STATUS_STYLE: Record<CampaignRecordStatus, string> = {
  Draft: 'bg-gray-100 text-gray-600 border-gray-200',
  Scheduled: 'bg-amber-50 text-amber-800 border-amber-100',
  Running: 'bg-blue-50 text-blue-700 border-blue-100',
  Completed: 'bg-green-50 text-green-700 border-green-100',
  Failed: 'bg-red-50 text-red-700 border-red-100',
};

const MESSAGE_STATUS_STYLE: Record<string, string> = {
  read: 'text-emerald-800 bg-emerald-50/90 ring-emerald-200/70',
  opened: 'text-emerald-800 bg-emerald-50/90 ring-emerald-200/70',
  clicked: 'text-emerald-800 bg-emerald-50/90 ring-emerald-200/70',
  delivered: 'text-sky-800 bg-sky-50/90 ring-sky-200/70',
  sent: 'text-slate-700 bg-slate-100/90 ring-slate-200/80',
  resent: 'text-primary bg-primary/8 ring-primary/20',
  queued: 'text-amber-800 bg-amber-50/90 ring-amber-200/70',
  resend_pending: 'text-amber-800 bg-amber-50/90 ring-amber-200/70',
  failed: 'text-red-800 bg-red-50/90 ring-red-200/70',
  bounced: 'text-red-800 bg-red-50/90 ring-red-200/70',
  rejected: 'text-red-800 bg-red-50/90 ring-red-200/70',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const WhatsAppMessagePreview: React.FC<{ body: string }> = ({ body }) => (
  <div className="w-full bg-[#efeae2] rounded-2xl p-4 border border-slate-200">
    <div className="bg-white p-3 rounded-r-xl rounded-bl-xl shadow-sm border border-gray-100 space-y-1">
      <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-wrap">{body}</p>
      <div className="text-meta text-gray-400 text-right flex justify-end gap-0.5">
        <span>{formatDate(new Date().toISOString()).split(',')[1]?.trim() ?? ''}</span>
        <CheckCheck className="w-3 h-3 text-cyan-600" aria-hidden />
      </div>
    </div>
  </div>
);

const DeliveryTrendChart: React.FC<{ series: CampaignDeliveryTrendPoint[] }> = ({ series }) => {
  const shouldReduceMotion = useReducedMotion();
  const data = useMemo(
    () =>
      series.map((p) => ({
        ...p,
        label: formatDate(p.at),
      })),
    [series]
  );
  const deliveredTotal =
    series.length > 0 ? series[series.length - 1]!.cumulative.toLocaleString() : null;

  return (
    <div className="border-b border-black/5 px-5 py-5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Delivery pace</h4>
          <p className="mt-0.5 text-[11px] font-medium text-gray-400">
            Cumulative delivered vs time
          </p>
        </div>
        <p className="shrink-0 text-xs font-semibold tabular-nums text-gray-500">
          {deliveredTotal != null ? (
            <>
              <span className="text-primary">{deliveredTotal}</span>
              <span className="ml-1 text-gray-400">delivered</span>
            </>
          ) : (
            'No deliveries'
          )}
        </p>
      </div>
      <div className="h-[180px] w-full">
        {series.length === 0 ? (
          <div
            className="flex h-full min-h-[180px] flex-col items-center justify-center px-4 text-center"
            role="status"
          >
            <p className="text-sm font-semibold text-gray-600">Pace chart pending</p>
            <p className="mt-1 max-w-sm text-xs font-medium leading-relaxed text-gray-400">
              Cumulative delivery appears once delivered timestamps land — common until webhook
              timeline backfill finishes.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#e8e6e1" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                formatter={(value: number) => [value, 'Delivered']}
                labelFormatter={(label) => String(label)}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.06)',
                  fontSize: 12,
                  background: '#fafaf8',
                  boxShadow: 'none',
                }}
              />
              <Line
                type="monotone"
                dataKey="cumulative"
                name="Delivered"
                stroke="var(--color-primary, #064e3b)"
                strokeWidth={2}
                dot={series.length <= 24 ? { r: 2.5, fill: 'var(--color-primary, #064e3b)' } : false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: '#fafaf8' }}
                animationDuration={shouldReduceMotion ? 0 : 500}
                isAnimationActive={!shouldReduceMotion}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

const RecipientsTable: React.FC<{
  channel: CampaignDetail['channel'];
  recipients: CampaignRecipientInsight[];
  sentCount: number;
  status: CampaignRecordStatus;
  showActions?: boolean;
  resendingId?: string | null;
  onResend?: (messageId: string) => void;
}> = ({ channel, recipients, sentCount, status, showActions, resendingId, onResend }) => {
  const isEmail = channel === 'email';

  const destLabel = isEmail ? 'Email' : channel === 'instagram' ? 'Instagram' : 'Phone';

  const resolveDest = (row: CampaignRecipientInsight) => {
    if (channel === 'email') return row.email ?? '—';
    if (channel === 'instagram') {
      return row.phone.startsWith('ig:') ? row.phone.slice(3) : row.phone;
    }
    return row.phone;
  };

  if (recipients.length === 0) {
    return (
      <div className="flex min-h-[220px] flex-1 items-center justify-center p-10 text-center">
        <div className="max-w-md">
          <p className="text-sm font-semibold text-gray-600">No delivery logs yet</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-gray-400">
            {status === 'Draft' || status === 'Scheduled'
              ? status === 'Scheduled'
                ? 'This campaign is scheduled. Delivery logs appear after it runs.'
                : 'This campaign has not been sent.'
              : 'Recipient records appear after the broadcast runs. Try Refresh if you just sent.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col className={isEmail ? 'w-[14%]' : 'w-[18%]'} />
          <col className={isEmail ? 'w-[16%]' : 'w-[18%]'} />
          {isEmail && <col className="w-[18%]" />}
          <col className="w-[12%]" />
          <col className="w-[14%]" />
          <col className="w-[14%]" />
          <col className="w-[14%]" />
          {showActions && <col className="w-[10%]" />}
        </colgroup>
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-black/5 bg-surface/95 backdrop-blur-sm">
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
              Contact
            </th>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
              {destLabel}
            </th>
            {isEmail && (
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                Subject
              </th>
            )}
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
              Status
            </th>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
              Sent at
            </th>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
              Delivered at
            </th>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
              Read at
            </th>
            {showActions && (
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                Action
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {recipients.map((row) => {
            const statusKey = row.status.toLowerCase();
            const canResend = FAILED_STATUSES.has(statusKey);
            return (
              <tr
                key={row.messageId}
                className="border-b border-black/[0.04] transition-colors duration-150 hover:bg-black/[0.015]"
              >
                <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 truncate">
                  {row.contactName}
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-gray-500 truncate">
                  {resolveDest(row)}
                </td>
                {isEmail && (
                  <td className="px-5 py-3.5 text-xs text-gray-500 truncate">
                    {row.content || '—'}
                  </td>
                )}
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize tracking-wide ring-1 ring-inset ${
                      MESSAGE_STATUS_STYLE[statusKey] ??
                      'bg-gray-100 text-gray-600 ring-gray-200'
                    }`}
                  >
                    {row.status.replace('_', ' ')}
                  </span>
                  {row.errorMessage && (
                    <p
                      className="mt-1.5 truncate text-xs font-medium text-red-600"
                      title={row.errorMessage}
                    >
                      {row.errorMessage}
                    </p>
                  )}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-xs font-medium tabular-nums text-gray-500">
                  {formatDate(row.sentAt)}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-xs font-medium tabular-nums text-gray-500">
                  {formatDate(row.deliveredAt)}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-xs font-medium tabular-nums text-gray-500">
                  {formatDate(row.readAt)}
                </td>
                {showActions && (
                  <td className="px-5 py-3.5">
                    {canResend && onResend ? (
                      <ResendButton
                        size="row"
                        loading={resendingId === row.messageId}
                        onClick={() => onResend(row.messageId)}
                      />
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {recipients.length < sentCount && sentCount > 0 && (
        <p className="border-t border-black/5 px-5 py-2.5 text-xs font-medium text-gray-400">
          Showing {recipients.length} of {sentCount} sent
        </p>
      )}
    </div>
  );
};

type Props = {
  campaignId: string;
};

export const CampaignDetailView: React.FC<Props> = ({ campaignId }) => {
  const navigate = useNavigate();
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFailedOnly, setShowFailedOnly] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendingAll, setResendingAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadDetail = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const raw = (await api.getCampaign(campaignId)) as Record<string, unknown>;
      setDetail(mapCampaignDetailFromApi(raw));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
      if (!opts?.silent) setDetail(null);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const failedRecipients = useMemo(
    () =>
      (detail?.recipients ?? []).filter((r) => FAILED_STATUSES.has(r.status.toLowerCase())),
    [detail?.recipients]
  );

  const handleResendOne = async (messageId: string) => {
    setResendingId(messageId);
    setActionError(null);
    try {
      await api.resendCampaignRecipient(campaignId, messageId);
      await loadDetail({ silent: true });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Resend failed');
    } finally {
      setResendingId(null);
    }
  };

  const handleResendAll = async () => {
    setResendingAll(true);
    setActionError(null);
    try {
      const result = await api.resendCampaignFailed(campaignId);
      if (result.failed > 0) {
        setActionError(`Resent ${result.resent}, ${result.failed} still failed`);
      }
      await loadDetail({ silent: true });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Resend all failed');
    } finally {
      setResendingAll(false);
    }
  };

  const isEmail = detail?.channel === 'email';

  const detailRows = useMemo((): [string, string][] => {
    if (!detail) return [];
    const ch = CAMPAIGN_CHANNELS.find((c) => c.id === detail.channel);
    const rows: [string, string][] = [
      ['Channel', ch?.name ?? detail.channel],
      ['Audience', detail.segmentLabel],
      ['Audience type', detail.audienceType],
      ['Template', detail.template?.name ?? '—'],
    ];
    if (isEmail) {
      rows.push(['Subject', detail.template?.subject ?? '—']);
      rows.push(['Template status', detail.template?.status ?? '—']);
    } else {
      rows.push(['Template category', detail.template?.category ?? '—']);
    }
    rows.push(
      ['Created', formatDate(detail.createdAt)],
      ['Sent', formatDate(detail.sentAt)],
      ['Scheduled', detail.scheduledAt ? formatDate(detail.scheduledAt) : 'Immediate']
    );
    return rows;
  }, [detail, isEmail]);

  if (loading) {
    return (
      <div className="flex-1 h-[calc(100vh-64px)] flex items-center justify-center bg-surface-muted">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex-1 h-[calc(100vh-64px)] overflow-y-auto bg-surface-muted p-6">
        <button
          type="button"
          onClick={() => navigate(pathForTab('campaigns'))}
          aria-label="Back to campaigns"
          className="flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
        </button>
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm font-bold rounded-2xl p-6">
          {error ?? 'Campaign not found'}
        </div>
      </div>
    );
  }

  const { insights } = detail;
  const ch = CAMPAIGN_CHANNELS.find((c) => c.id === detail.channel);
  const messageBody = detail.recipients[0]?.content ?? detail.template?.bodyPattern ?? '';
  const showWhatsAppPreview = detail.channel === 'whatsapp' && Boolean(messageBody);

  const mainContent = (
    <div className="p-6 w-full max-w-none space-y-5">
      <div className="bg-surface border border-black/5 rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(pathForTab('campaigns'))}
              aria-label="Back to campaigns"
              className="shrink-0 flex items-center text-gray-500 hover:text-primary cursor-pointer transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden />
            </button>
            <h2 className="text-base font-black text-gray-900 break-words">{detail.name}</h2>
            <span
              className={`inline-flex text-sm font-black px-2 py-0.5 rounded-lg border ${STATUS_STYLE[detail.status]}`}
            >
              {detail.status}
            </span>
            {ch && (
              <span
                className="inline-flex text-sm font-black px-2 py-0.5 rounded-lg border"
                style={{
                  background: ch.bgColor,
                  borderColor: ch.borderColor,
                  color: ch.color,
                }}
              >
                {ch.name}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={loadDetail}
            aria-label="Refresh"
            className="cursor-pointer p-1.5 bg-surface-muted border border-black/5 hover:bg-surface text-gray-600 rounded-xl flex items-center transition-colors duration-200"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden />
          </button>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-meta font-bold text-gray-500 pt-1 border-t border-black/5">
          <span>
            <span className="text-gray-400">Recipients </span>
            {insights.totalRecipients.toLocaleString()}
          </span>
          <span>
            <span className="text-gray-400">Sent </span>
            {insights.sent.toLocaleString()}
          </span>
          <span>
            <span className="text-gray-400">Delivered </span>
            {insights.delivered.toLocaleString()}
            {insights.deliveryRate > 0 && (
              <span className="text-gray-400 font-normal"> ({insights.deliveryRate}%)</span>
            )}
          </span>
          {isEmail ? (
            <span>
              <span className="text-gray-400">Opened </span>
              {insights.read.toLocaleString()}
              {insights.readRate > 0 && (
                <span className="text-gray-400 font-normal"> ({insights.readRate}%)</span>
              )}
            </span>
          ) : (
            <span>
              <span className="text-gray-400">Read </span>
              {insights.read.toLocaleString()}
            </span>
          )}
          {insights.failed > 0 ? (
            <button
              type="button"
              onClick={() => setShowFailedOnly(true)}
              className="cursor-pointer text-red-600 underline underline-offset-2 hover:text-red-800"
            >
              <span className="text-red-400">Failed </span>
              {insights.failed.toLocaleString()}
            </button>
          ) : (
            <span>
              <span className="text-gray-400">Failed </span>0
            </span>
          )}
          {(insights.successRate != null || detail.analytics) && (
            <span>
              <span className="text-gray-400">Success </span>
              {(detail.analytics?.successRate ?? insights.successRate ?? 0).toLocaleString()}%
            </span>
          )}
        </div>
        {actionError && (
          <p className="text-xs text-red-600 font-bold pt-1">{actionError}</p>
        )}
      </div>

      {detail.analytics && (
        <CampaignDetailAnalytics channel={detail.channel} analytics={detail.analytics} />
      )}

      <div className="bg-surface border border-black/5 rounded-2xl p-5">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3">Details</h3>
        <dl className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-3">
          {detailRows.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-gray-400 font-bold">{label}</dt>
              <dd className="mt-0.5 text-sm text-gray-900 font-bold break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section
        className="flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-black/5 bg-surface"
        aria-labelledby="campaign-recipients-heading"
      >
        <div className="flex shrink-0 items-baseline justify-between gap-3 border-b border-black/5 px-5 py-4">
          <div className="min-w-0">
            <h3
              id="campaign-recipients-heading"
              className="text-sm font-semibold tracking-tight text-gray-900"
            >
              Recipients
            </h3>
            <p className="mt-0.5 text-xs font-medium text-gray-400">
              Per-message delivery status and timestamps
            </p>
          </div>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-500">
            {detail.recipients.length > 0
              ? `${detail.recipients.length} logged`
              : detail.sentCount > 0
                ? `${detail.sentCount} sent`
                : '0 contacts'}
          </span>
        </div>
        {detail.recipients.length > 0 && (
          <DeliveryTrendChart series={detail.analytics?.deliveryTrend ?? []} />
        )}
        <RecipientsTable
          channel={detail.channel}
          recipients={detail.recipients}
          sentCount={detail.sentCount}
          status={detail.status}
        />
      </section>

      {showFailedOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface rounded-2xl border border-black/10 shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-black/5 flex items-center justify-between gap-3 shrink-0">
              <div>
                <h3 className="text-sm font-black text-gray-900">
                  Failed recipients ({failedRecipients.length})
                </h3>
                <p className="text-xs text-gray-400 font-bold mt-0.5">
                  Resend uses the original payload through the same send pipeline
                </p>
              </div>
              <div className="flex items-center gap-2">
                {failedRecipients.length > 0 && (
                  <button
                    type="button"
                    disabled={resendingAll}
                    onClick={() => void handleResendAll()}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700 disabled:opacity-50"
                  >
                    {resendingAll ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                    ) : null}
                    Resend All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFailedOnly(false)}
                  className="cursor-pointer p-1.5 rounded-lg hover:bg-surface-muted text-gray-500"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              {failedRecipients.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-sm font-bold text-gray-600">No failed recipients</p>
                  <p className="text-xs text-gray-400 mt-1">All failures have been resent or cleared.</p>
                </div>
              ) : (
                <RecipientsTable
                  channel={detail.channel}
                  recipients={failedRecipients}
                  sentCount={failedRecipients.length}
                  status={detail.status}
                  showActions
                  resendingId={resendingId}
                  onResend={(id) => void handleResendOne(id)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (!showWhatsAppPreview) {
    return (
      <div className="flex-1 h-[calc(100vh-64px)] overflow-y-auto bg-surface-muted selection:bg-primary/15">
        <div className="max-w-7xl">{mainContent}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col xl:flex-row h-[calc(100vh-64px)] overflow-hidden bg-surface-muted selection:bg-primary/15">
      <section className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto border-r border-black/5">
        {mainContent}
      </section>
      <aside className="w-full xl:w-[320px] shrink-0 p-5 flex flex-col bg-surface border-t xl:border-t-0 xl:border-l border-black/5 overflow-y-auto">
        <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">
          Message sent
        </p>
        <WhatsAppMessagePreview body={messageBody} />
        {detail.template?.name && (
          <p className="text-xs text-gray-400 font-bold mt-4">
            Template: <span className="text-gray-600">{detail.template.name}</span>
          </p>
        )}
      </aside>
    </div>
  );
};
