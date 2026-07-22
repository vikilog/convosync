/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCheck, Loader2, RefreshCw } from 'lucide-react';
import {
  CAMPAIGN_CHANNELS,
  CampaignDetail,
  CampaignRecipientInsight,
  CampaignRecordStatus,
} from '../../types';
import { api } from '../../lib/api';
import { mapCampaignDetailFromApi } from '../../lib/mappers';
import { pathForTab } from '../../routes';

const STATUS_STYLE: Record<CampaignRecordStatus, string> = {
  Draft: 'bg-gray-100 text-gray-600 border-gray-200',
  Running: 'bg-blue-50 text-blue-700 border-blue-100',
  Completed: 'bg-green-50 text-green-700 border-green-100',
  Failed: 'bg-red-50 text-red-700 border-red-100',
};

const MESSAGE_STATUS_STYLE: Record<string, string> = {
  read: 'text-green-700 bg-green-50 border-green-100',
  opened: 'text-green-700 bg-green-50 border-green-100',
  clicked: 'text-green-700 bg-green-50 border-green-100',
  delivered: 'text-blue-700 bg-blue-50 border-blue-100',
  sent: 'text-gray-600 bg-gray-100 border-gray-200',
  queued: 'text-amber-700 bg-amber-50 border-amber-100',
  failed: 'text-red-700 bg-red-50 border-red-100',
  bounced: 'text-red-700 bg-red-50 border-red-100',
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

const RecipientsTable: React.FC<{
  channel: CampaignDetail['channel'];
  recipients: CampaignRecipientInsight[];
  sentCount: number;
  status: CampaignRecordStatus;
}> = ({ channel, recipients, sentCount, status }) => {
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
      <div className="flex-1 flex items-center justify-center p-10 text-center min-h-[220px]">
        <div>
          <p className="text-sm font-bold text-gray-600">No delivery logs yet</p>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            {status === 'Draft'
              ? 'This campaign has not been sent.'
              : 'Recipient records appear after the broadcast runs. Try Refresh if you just sent.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-x-auto">
      <table className="w-full table-fixed text-left border-collapse">
        <colgroup>
          <col className={isEmail ? 'w-[18%]' : 'w-[28%]'} />
          <col className={isEmail ? 'w-[22%]' : 'w-[28%]'} />
          {isEmail && <col className="w-[28%]" />}
          <col className="w-[16%]" />
          <col className="w-[18%]" />
        </colgroup>
        <thead>
          <tr className="bg-surface-muted border-b border-black/5">
            <th className="px-5 py-2.5 text-sm font-black uppercase tracking-wider text-gray-400">
              Contact
            </th>
            <th className="px-5 py-2.5 text-sm font-black uppercase tracking-wider text-gray-400">
              {destLabel}
            </th>
            {isEmail && (
              <th className="px-5 py-2.5 text-sm font-black uppercase tracking-wider text-gray-400">
                Subject
              </th>
            )}
            <th className="px-5 py-2.5 text-sm font-black uppercase tracking-wider text-gray-400">
              Status
            </th>
            <th className="px-5 py-2.5 text-sm font-black uppercase tracking-wider text-gray-400">
              Sent at
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {recipients.map((row) => {
            const statusKey = row.status.toLowerCase();
            return (
              <tr key={row.messageId} className="hover:bg-surface-muted/60 transition-colors duration-200">
                <td className="px-5 py-3 text-sm font-bold text-gray-900 truncate">
                  {row.contactName}
                </td>
                <td className="px-5 py-3 text-meta font-mono text-gray-600 truncate">
                  {resolveDest(row)}
                </td>
                {isEmail && (
                  <td className="px-5 py-3 text-meta text-gray-500 truncate">
                    {row.content || '—'}
                  </td>
                )}
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex text-meta font-black px-2 py-0.5 rounded-md border capitalize ${
                      MESSAGE_STATUS_STYLE[statusKey] ?? 'text-gray-600 bg-gray-100 border-gray-200'
                    }`}
                  >
                    {row.status}
                  </span>
                  {row.errorMessage && (
                    <p className="text-xs text-red-600 mt-1 font-medium truncate" title={row.errorMessage}>
                      {row.errorMessage}
                    </p>
                  )}
                </td>
                <td className="px-5 py-3 text-meta font-bold text-gray-500 whitespace-nowrap">
                  {formatDate(row.sentAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {recipients.length < sentCount && sentCount > 0 && (
        <p className="px-5 py-2 text-xs text-gray-400 font-bold border-t border-slate-200">
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

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = (await api.getCampaign(campaignId)) as Record<string, unknown>;
      setDetail(mapCampaignDetailFromApi(raw));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

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
          className="flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Campaigns
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
      <button
        type="button"
        onClick={() => navigate(pathForTab('campaigns'))}
        className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-primary cursor-pointer transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden /> Campaigns
      </button>

      <div className="bg-surface border border-black/5 rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-black text-gray-900 break-words">{detail.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
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
          </div>
          <button
            type="button"
            onClick={loadDetail}
            className="cursor-pointer px-2.5 py-1.5 bg-surface-muted border border-black/5 hover:bg-surface text-gray-600 rounded-xl text-sm font-bold flex items-center gap-1 transition-colors duration-200"
          >
            <RefreshCw className="w-3 h-3" aria-hidden /> Refresh
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
          {insights.failed > 0 && (
            <span className="text-red-600">
              <span className="text-red-400">Failed </span>
              {insights.failed.toLocaleString()}
            </span>
          )}
        </div>
      </div>

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

      <div className="bg-surface border border-black/5 rounded-2xl overflow-hidden flex flex-col min-h-[320px]">
        <div className="px-5 py-3 border-b border-black/5 flex items-center justify-between shrink-0">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Recipients</h3>
          <span className="text-sm font-bold text-gray-400">
            {detail.recipients.length > 0
              ? `${detail.recipients.length} logged`
              : detail.sentCount > 0
                ? `${detail.sentCount} sent`
                : '0 contacts'}
          </span>
        </div>
        <RecipientsTable
          channel={detail.channel}
          recipients={detail.recipients}
          sentCount={detail.sentCount}
          status={detail.status}
        />
      </div>
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
