/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCheck, Loader2, RefreshCw, Smartphone } from 'lucide-react';
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
  <div className="w-full max-w-[300px] mx-auto bg-[#efeae2] rounded-2xl p-4 border border-slate-200">
    <div className="bg-white p-3 rounded-r-xl rounded-bl-xl shadow-sm border border-gray-100 space-y-1">
      <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-wrap">{body}</p>
      <div className="text-meta text-gray-400 text-right flex justify-end gap-0.5">
        <span>{formatDate(new Date().toISOString()).split(',')[1]?.trim() ?? ''}</span>
        <CheckCheck className="w-3 h-3 text-cyan-600" />
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
      <div className="p-10 text-center">
        <p className="text-sm font-bold text-gray-600">No delivery logs yet</p>
        <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
          {status === 'Draft'
            ? 'This campaign has not been sent.'
            : 'Recipient records appear after the broadcast runs. Try Refresh if you just sent.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[640px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
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
              <tr key={row.messageId} className="hover:bg-[#fdfcff]">
                <td className="px-5 py-3 text-sm font-bold text-gray-900">{row.contactName}</td>
                <td className="px-5 py-3 text-meta font-mono text-gray-600">{resolveDest(row)}</td>
                {isEmail && (
                  <td className="px-5 py-3 text-meta text-gray-500 max-w-[200px] truncate">
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
                    <p className="text-xs text-red-600 mt-1 font-medium max-w-[180px]">
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
      <div className="flex-1 h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex-1 h-[calc(100vh-64px)] overflow-y-auto bg-slate-50 p-6">
        <button
          type="button"
          onClick={() => navigate(pathForTab('campaigns'))}
          className="flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-sky-600 mb-4"
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
    <div className={`p-6 w-full space-y-5 ${showWhatsAppPreview ? 'max-w-3xl' : 'max-w-6xl'}`}>
      <button
        type="button"
        onClick={() => navigate(pathForTab('campaigns'))}
        className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-sky-600"
      >
        <ArrowLeft className="w-4 h-4" /> Campaigns
      </button>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-gray-900">{detail.name}</h2>
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
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-white text-gray-600 rounded-xl text-sm font-bold flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-meta font-bold text-gray-500 pt-1 border-t border-slate-200">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:col-span-1">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3">Details</h3>
          <dl className="divide-y divide-slate-200">
            {detailRows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-2.5 text-xs">
                <dt className="text-gray-400 font-bold shrink-0">{label}</dt>
                <dd className="text-gray-900 font-bold text-right break-words max-w-[55%]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden lg:col-span-2 flex flex-col min-h-[280px]">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
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
    </div>
  );

  if (!showWhatsAppPreview) {
    return (
      <div className="flex-1 h-[calc(100vh-64px)] overflow-y-auto bg-slate-50 selection:bg-sky-50">
        {mainContent}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col xl:flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-50 selection:bg-sky-50">
      <section className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto border-r border-slate-200">
        {mainContent}
      </section>
      <section className="w-full xl:w-[380px] shrink-0 p-6 flex flex-col items-center justify-start bg-gray-50/50 overflow-y-auto">
        <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Message sent</p>
        <WhatsAppMessagePreview body={messageBody} />
        {detail.template?.name && (
          <p className="text-xs text-gray-400 font-bold mt-4 text-center">
            Template: {detail.template.name}
          </p>
        )}
      </section>
    </div>
  );
};
