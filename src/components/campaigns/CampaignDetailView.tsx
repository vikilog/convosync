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
  Pencil,
  RefreshCw,
  RotateCcw,
  X,
} from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
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
import {
  isFailedCampaignRelaunchable,
  isScheduledCampaignEditable,
  SCHEDULED_CAMPAIGN_EDIT_BLOCKED_HINT,
} from '../../lib/campaignScheduleEdit';
import { mapCampaignDetailFromApi } from '../../lib/mappers';
import { formatCampaignDateTime as formatDate } from '../../lib/campaignFormat';
import { pathForNewCampaign, pathForTab } from '../../routes';
import { CampaignDetailAnalytics } from './CampaignDetailAnalytics';
import { ResendButton } from '../shared/ResendButton';

const FAILED_STATUSES = new Set(['failed', 'bounced', 'rejected']);

const STATUS_STYLE: Record<CampaignRecordStatus, string> = {
  Draft: 'bg-white text-swiss-muted border-gray-200',
  Scheduled: 'bg-amber-50 text-amber-800 border-amber-100',
  Running: 'bg-blue-50 text-blue-700 border-blue-100',
  Completed: 'bg-green-50 text-green-700 border-green-100',
  Failed: 'bg-red-50 text-red-700 border-red-100',
  Cancelled: 'bg-white text-swiss-muted border-gray-200',
};

const MESSAGE_STATUS_STYLE: Record<string, string> = {
  read: 'text-emerald-800 bg-emerald-50/90 ring-emerald-200/70',
  opened: 'text-emerald-800 bg-emerald-50/90 ring-emerald-200/70',
  clicked: 'text-emerald-800 bg-emerald-50/90 ring-emerald-200/70',
  delivered: 'text-sky-800 bg-sky-50/90 ring-sky-200/70',
  sent: 'text-slate-700 bg-white/90 ring-swiss-line',
  resent: 'text-swiss-accent bg-swiss-accent/8 ring-swiss-accent/20',
  queued: 'text-amber-800 bg-amber-50/90 ring-amber-200/70',
  resend_pending: 'text-amber-800 bg-amber-50/90 ring-amber-200/70',
  failed: 'text-red-800 bg-red-50/90 ring-red-200/70',
  bounced: 'text-red-800 bg-red-50/90 ring-red-200/70',
  rejected: 'text-red-800 bg-red-50/90 ring-red-200/70',
};

const WhatsAppMessagePreview: React.FC<{ body: string }> = ({ body }) => (
  <div className="w-full bg-[#efeae2] rounded-2xl p-4 border border-swiss-line">
 <div className="bg-white p-3 rounded-r-xl rounded-bl-xl border border-gray-100 space-y-1">
      <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-wrap">{body}</p>
      <div className="text-meta text-swiss-faint text-right flex justify-end gap-0.5">
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
    <div className="border-b border-swiss-line px-5 py-5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h4 className="text-sm font-medium text-swiss-ink">Delivery pace</h4>
          <p className="mt-0.5 text-[11px] font-medium text-swiss-faint">
            Cumulative delivered vs time
          </p>
        </div>
        <p className="shrink-0 text-xs font-medium tabular-nums text-swiss-muted">
          {deliveredTotal != null ? (
            <>
              <span className="text-swiss-accent">{deliveredTotal}</span>
              <span className="ml-1 text-swiss-faint">delivered</span>
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
            <p className="text-sm font-medium text-swiss-muted">Pace chart pending</p>
            <p className="mt-1 max-w-sm text-xs font-medium leading-relaxed text-swiss-faint">
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
                stroke="var(--color-swiss-accent, #064e3b)"
                strokeWidth={2}
                dot={series.length <= 24 ? { r: 2.5, fill: 'var(--color-swiss-accent, #064e3b)' } : false}
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
          <p className="text-sm font-medium text-swiss-muted">No delivery logs yet</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-swiss-faint">
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
      <Table className="table-fixed border-collapse text-left">
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
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="border-b border-swiss-line bg-white/95 backdrop-blur-sm">
            <TableHead className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-swiss-faint whitespace-normal">
              Contact
            </TableHead>
            <TableHead className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-swiss-faint whitespace-normal">
              {destLabel}
            </TableHead>
            {isEmail && (
              <TableHead className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-swiss-faint whitespace-normal">
                Subject
              </TableHead>
            )}
            <TableHead className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-swiss-faint whitespace-normal">
              Status
            </TableHead>
            <TableHead className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-swiss-faint whitespace-normal">
              Sent at
            </TableHead>
            <TableHead className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-swiss-faint whitespace-normal">
              Delivered at
            </TableHead>
            <TableHead className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-swiss-faint whitespace-normal">
              Read at
            </TableHead>
            {showActions && (
              <TableHead className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-swiss-faint whitespace-normal">
                Action
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipients.map((row) => {
            const statusKey = row.status.toLowerCase();
            const canResend = FAILED_STATUSES.has(statusKey);
            return (
              <TableRow
                key={row.messageId}
                className="border-b border-black/[0.04] transition-colors duration-150 hover:bg-black/[0.015]"
              >
                <TableCell className="px-5 py-3.5 text-sm font-medium text-swiss-ink truncate">
                  {row.contactName}
                </TableCell>
                <TableCell className="px-5 py-3.5 font-mono text-xs text-swiss-muted truncate">
                  {resolveDest(row)}
                </TableCell>
                {isEmail && (
                  <TableCell className="px-5 py-3.5 text-xs text-swiss-muted truncate">
                    {row.content || '—'}
                  </TableCell>
                )}
                <TableCell className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium capitalize tracking-wide ring-1 ring-inset ${
                      MESSAGE_STATUS_STYLE[statusKey] ??
                      'bg-white text-swiss-muted ring-gray-200'
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
                </TableCell>
                <TableCell className="whitespace-nowrap px-5 py-3.5 text-xs font-medium tabular-nums text-swiss-muted">
                  {formatDate(row.sentAt)}
                </TableCell>
                <TableCell className="whitespace-nowrap px-5 py-3.5 text-xs font-medium tabular-nums text-swiss-muted">
                  {formatDate(row.deliveredAt)}
                </TableCell>
                <TableCell className="whitespace-nowrap px-5 py-3.5 text-xs font-medium tabular-nums text-swiss-muted">
                  {formatDate(row.readAt)}
                </TableCell>
                {showActions && (
                  <TableCell className="px-5 py-3.5">
                    {canResend && onResend ? (
                      <ResendButton
                        size="row"
                        loading={resendingId === row.messageId}
                        onClick={() => onResend(row.messageId)}
                      />
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {recipients.length < sentCount && sentCount > 0 && (
        <p className="border-t border-swiss-line px-5 py-2.5 text-xs font-medium text-swiss-faint">
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

  const openFullEdit = () => {
    navigate(pathForNewCampaign(), { state: { editCampaignId: campaignId } });
  };

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
  const canEditSchedule = detail
    ? isScheduledCampaignEditable(detail.status, detail.scheduledAt)
    : false;
  const isScheduled = detail?.status === 'Scheduled';
  const isFailed = detail ? isFailedCampaignRelaunchable(detail.status) : false;

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
      <div className="flex-1 h-[calc(100vh-64px)] flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-swiss-accent" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex-1 h-[calc(100vh-64px)] overflow-y-auto bg-white p-6">
        <button
          type="button"
          onClick={() => navigate(pathForTab('campaigns'))}
          aria-label="Back to campaigns"
          className="flex items-center gap-1.5 text-sm font-medium text-swiss-muted hover:text-swiss-accent mb-4"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
        </button>
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm font-medium rounded-2xl p-6">
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
      <div className="bg-white border border-swiss-line p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(pathForTab('campaigns'))}
              aria-label="Back to campaigns"
              className="shrink-0 flex items-center text-swiss-muted hover:text-swiss-accent cursor-pointer transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden />
            </button>
            <h2 className="text-base font-medium text-swiss-ink break-words">{detail.name}</h2>
            <span
              className={`inline-flex text-sm font-medium px-2 py-0.5 rounded-lg border ${STATUS_STYLE[detail.status]}`}
            >
              {detail.status}
            </span>
            {ch && (
              <span
                className="inline-flex text-sm font-medium px-2 py-0.5 rounded-lg border"
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
          <div className="flex items-center gap-2">
            {isScheduled && (
              <button
                type="button"
                onClick={() => canEditSchedule && openFullEdit()}
                disabled={!canEditSchedule}
                title={canEditSchedule ? 'Edit campaign' : SCHEDULED_CAMPAIGN_EDIT_BLOCKED_HINT}
                className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-swiss-line hover:bg-surface-muted text-swiss-ink rounded-xl text-xs font-medium disabled:cursor-not-allowed disabled:opacity-45 transition-colors duration-200"
              >
                <Pencil className="w-3.5 h-3.5" aria-hidden />
                Edit
              </button>
            )}
            {isFailed && (
              <button
                type="button"
                onClick={openFullEdit}
                title="Edit and relaunch this campaign"
                className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-swiss-line hover:bg-surface-muted text-swiss-ink rounded-xl text-xs font-medium transition-colors duration-200"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden />
                Relaunch
              </button>
            )}
            <button
              type="button"
              onClick={loadDetail}
              aria-label="Refresh"
              className="cursor-pointer p-1.5 bg-white border border-swiss-line hover:bg-surface-muted text-swiss-muted rounded-xl flex items-center transition-colors duration-200"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-meta font-medium text-swiss-muted pt-1 border-t border-swiss-line">
          <span>
            <span className="text-swiss-faint">Recipients </span>
            {insights.totalRecipients.toLocaleString()}
          </span>
          <span>
            <span className="text-swiss-faint">Sent </span>
            {insights.sent.toLocaleString()}
          </span>
          <span>
            <span className="text-swiss-faint">Delivered </span>
            {insights.delivered.toLocaleString()}
            {insights.deliveryRate > 0 && (
              <span className="text-swiss-faint font-normal"> ({insights.deliveryRate}%)</span>
            )}
          </span>
          {isEmail ? (
            <span>
              <span className="text-swiss-faint">Opened </span>
              {insights.read.toLocaleString()}
              {insights.readRate > 0 && (
                <span className="text-swiss-faint font-normal"> ({insights.readRate}%)</span>
              )}
            </span>
          ) : (
            <span>
              <span className="text-swiss-faint">Read </span>
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
              <span className="text-swiss-faint">Failed </span>0
            </span>
          )}
          {(insights.successRate != null || detail.analytics) && (
            <span>
              <span className="text-swiss-faint">Success </span>
              {(detail.analytics?.successRate ?? insights.successRate ?? 0).toLocaleString()}%
            </span>
          )}
        </div>
        {actionError && (
          <p className="text-xs text-red-600 font-medium pt-1">{actionError}</p>
        )}
      </div>

      {detail.analytics && (
        <CampaignDetailAnalytics channel={detail.channel} analytics={detail.analytics} />
      )}

      <div className="bg-white border border-swiss-line p-5">
        <h3 className="text-sm font-medium text-swiss-ink uppercase tracking-wider mb-3">Details</h3>
        <dl className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-3">
          {detailRows.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-swiss-faint font-medium">{label}</dt>
              <dd className="mt-0.5 text-sm text-swiss-ink font-medium break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section
        className="flex min-h-[320px] flex-col overflow-hidden bg-white border border-swiss-line"
        aria-labelledby="campaign-recipients-heading"
      >
        <div className="flex shrink-0 items-baseline justify-between gap-3 border-b border-swiss-line px-5 py-4">
          <div className="min-w-0">
            <h3
              id="campaign-recipients-heading"
              className="text-sm font-medium tracking-tight text-swiss-ink"
            >
              Recipients
            </h3>
            <p className="mt-0.5 text-xs font-medium text-swiss-faint">
              Per-message delivery status and timestamps
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium tabular-nums text-swiss-muted">
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
          <div className="bg-white rounded-2xl border border-black/10 shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-swiss-line flex items-center justify-between gap-3 shrink-0">
              <div>
                <h3 className="text-sm font-medium text-swiss-ink">
                  Failed recipients ({failedRecipients.length})
                </h3>
                <p className="text-xs text-swiss-faint font-medium mt-0.5">
                  Resend uses the original payload through the same send pipeline
                </p>
              </div>
              <div className="flex items-center gap-2">
                {failedRecipients.length > 0 && (
                  <button
                    type="button"
                    disabled={resendingAll}
                    onClick={() => void handleResendAll()}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50"
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
                  className="cursor-pointer p-1.5 rounded-lg hover:bg-surface-muted text-swiss-muted"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              {failedRecipients.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-sm font-medium text-swiss-muted">No failed recipients</p>
                  <p className="text-xs text-swiss-faint mt-1">All failures have been resent or cleared.</p>
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
      <div className="flex-1 h-[calc(100vh-64px)] overflow-y-auto bg-white selection:bg-swiss-accent/15">
        <div className="max-w-7xl">{mainContent}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col xl:flex-row h-[calc(100vh-64px)] overflow-hidden bg-white font-swiss selection:bg-swiss-accent/15">
      <section className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto border-r border-swiss-line">
        {mainContent}
      </section>
      <aside className="w-full xl:w-[320px] shrink-0 p-5 flex flex-col bg-white border-t xl:border-t-0 xl:border-l border-swiss-line overflow-y-auto">
        <p className="text-sm font-medium text-swiss-faint uppercase tracking-widest mb-4">
          Message sent
        </p>
        <WhatsAppMessagePreview body={messageBody} />
        {detail.template?.name && (
          <p className="text-xs text-swiss-faint font-medium mt-4">
            Template: <span className="text-swiss-muted">{detail.template.name}</span>
          </p>
        )}
      </aside>
    </div>
  );
};
