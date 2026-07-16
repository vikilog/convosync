/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  Layers,
  ArrowRight,
  ArrowLeft,
  Check,
  Smartphone,
  CheckCheck,
  ShieldCheck,
  DollarSign,
  Play,
  Mail,
  MessageCircle,
  BarChart2,
  Globe,
  Hash,
  Plus,
  Loader2,
  Megaphone,
  Search,
} from 'lucide-react';
import {
  CAMPAIGN_CHANNELS,
  SELECTABLE_CAMPAIGN_CHANNELS,
  DEFAULT_INSTIGRAM_CONFIG,
  CampaignChannel,
  CampaignRecord,
  CampaignRecordStatus,
  CampaignTemplate,
  EmailTemplateRecord,
  InstagramCampaignConfig,
} from '../types';
import { api, parseApiError } from '../lib/api';
import { useKeepAliveActivation } from './KeepAlive';
import { mapTemplateFromApi, mapCampaignFromApi, mapEmailTemplateFromApi } from '../lib/mappers';
import {
  applyEmailTemplateVariables,
  mergePreviewVariables,
  wrapPreviewHtml,
} from './templates/emailTemplateUtils';
import { campaignIdFromPath, pathForCampaign, pathForNewCampaign, isNewCampaignPath, pathForTab } from '../routes';
import { CampaignDetailView } from './campaigns/CampaignDetailView';

type AudienceSegment = { id: string; name: string; count: number; icon: string };

type CampaignAudienceResponse = {
  channel: CampaignChannel;
  total: number;
  segments: AudienceSegment[];
};

type AudienceContactRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  tags: string[];
  source: string | null;
};

type CampaignAudienceContactsResponse = {
  channel: CampaignChannel;
  segmentId: string;
  total: number;
  truncated: boolean;
  limit: number;
  contacts: AudienceContactRow[];
};

function formatAudienceContactHandle(contact: AudienceContactRow, channel: CampaignChannel): string {
  if (channel === 'email') {
    return contact.email?.trim() || 'No email';
  }
  if (channel === 'instagram') {
    if (contact.phone.startsWith('ig:')) {
      return `Instagram · ${contact.phone.slice(3)}`;
    }
    return contact.source === 'Instagram' ? 'Instagram contact' : contact.phone;
  }
  return contact.phone;
}

function contactInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

const AudienceContactListPanel: React.FC<{
  channel: CampaignChannel;
  channelLabel: string;
  segmentLabel: string;
  contacts: AudienceContactRow[];
  total: number;
  truncated: boolean;
  loading: boolean;
  error: string | null;
}> = ({ channel, channelLabel, segmentLabel, contacts, total, truncated, loading, error }) => (
  <div className="relative flex h-full min-h-0 w-full max-w-md flex-col overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/80 shadow-sm">
    <div className="absolute inset-x-0 top-0 h-0.5 bg-sky-500" />
    <div className="shrink-0 border-b border-slate-200 bg-slate-50/80 px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Audience preview</p>
      <p className="mt-1 text-base font-semibold text-slate-900">{segmentLabel}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-500">
        {loading ? 'Loading contacts…' : `${total.toLocaleString()} ${channelLabel} contacts`}
        {!loading && truncated ? ` · showing first ${contacts.length}` : ''}
      </p>
    </div>

    {error && (
      <div className="mx-4 mt-3 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 shrink-0">
        {error}
      </div>
    )}

    <div className="flex-1 overflow-y-auto min-h-0">
      {loading ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-2.5 bg-gray-100 rounded w-2/3" />
                <div className="h-2 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Users className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No contacts in this audience</p>
          <p className="mt-1 text-xs text-slate-500">Try another tag or add contacts first.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {contacts.map((contact) => (
            <li key={contact.id} className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-slate-50">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sm font-bold text-sky-600">
                {contactInitials(contact.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{contact.name || 'Unnamed'}</p>
                <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                  {formatAudienceContactHandle(contact, channel)}
                </p>
                {contact.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {contact.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-sky-100 bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700"
                      >
                        {tag}
                      </span>
                    ))}
                    {contact.tags.length > 3 && (
                      <span className="text-[10px] font-medium text-slate-400">+{contact.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

// ─── Channel Icon Component ───────────────────────────────
const ChannelIcon: React.FC<{ channel: CampaignChannel; size?: number }> = ({ channel, size = 20 }) => {
  if (channel === 'whatsapp')
    return (
      <svg viewBox="0 0 24 24" style={{ width: size, height: size, fill: '#25D366' }}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    );
  if (channel === 'email') return <Mail style={{ width: size, height: size, color: '#0284c7' }} />;
  if (channel === 'instagram')
    return (
      <svg viewBox="0 0 24 24" style={{ width: size, height: size }}>
        <defs>
          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="25%" stopColor="#e6683c" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="75%" stopColor="#cc2366" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>
        <path
          fill="url(#ig-grad)"
          d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
        />
      </svg>
    );
  return null;
};

const CONTACT_AUTO_EMAIL_VARIABLES = new Set(['first_name', 'last_name', 'name', 'email', 'phone']);

// ─── Email Preview ─────────────────────────────────────────
const EmailTemplatePreview: React.FC<{
  subject: string;
  htmlBody: string;
  variables: string[];
  variableMappings: Record<string, string>;
}> = ({ subject, htmlBody, variables, variableMappings }) => {
  const merged = mergePreviewVariables(variables, variableMappings);
  const previewSubject = applyEmailTemplateVariables(subject, merged);
  const previewHtml = wrapPreviewHtml(applyEmailTemplateVariables(htmlBody, merged));

  return (
    <div className="w-full flex-1 min-h-[360px] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg flex flex-col">
      <div className="bg-[#f5f5f5] p-3 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="bg-white rounded-lg p-2 text-xs">
          <p className="text-gray-400 text-meta font-bold">SUBJECT</p>
          <p className="font-black text-gray-900 text-xs">{previewSubject || 'Your subject line…'}</p>
        </div>
      </div>
      <iframe
        title="Email preview"
        srcDoc={previewHtml}
        className="w-full flex-1 min-h-[320px] border-0 bg-white"
        sandbox=""
      />
    </div>
  );
};

// ─── Instagram Preview ─────────────────────────────────────
const InstagramPreview: React.FC<{ message: string }> = ({ message }) => (
  <div className="w-[320px] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xl">
    <div className="bg-white border-b border-gray-100 p-3 flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-black">
        CS
      </div>
      <div>
        <p className="text-sm font-black text-gray-900">convosync</p>
        <p className="text-meta text-gray-400">Active now</p>
      </div>
    </div>
    <div className="bg-white p-4 min-h-[200px]">
      <div className="flex justify-end mb-3">
        <div className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white text-xs leading-relaxed p-3 rounded-2xl rounded-tr-sm max-w-[80%]">
          {message.replace('{{first_name}}', 'Rahul') || 'Your Instagram DM here...'}
        </div>
      </div>
      <p className="text-badge text-gray-400 text-right">Delivered</p>
    </div>
  </div>
);

// ─── WhatsApp Preview (existing) ──────────────────────────
const WhatsAppPreview: React.FC<{ body: string; buttons: string[] }> = ({ body, buttons }) => (
  <div className="w-[320px] h-[580px] bg-white border-[8px] border-black rounded-[42px] shadow-2xl flex flex-col overflow-hidden select-none">
    <div className="h-6 bg-black flex justify-center items-center shrink-0">
      <div className="w-24 h-4 bg-black rounded-b-xl" />
    </div>
    <div className="bg-[#005e54] text-white p-3 py-2 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center font-black text-xs text-white">
          CS
        </div>
        <div>
          <p className="text-sm font-bold leading-none">ConvoSync Business</p>
          <p className="text-badge text-white/70 leading-none mt-0.5">Online · Official API</p>
        </div>
      </div>
      <Smartphone className="w-4 h-4 text-white/50" />
    </div>
    <div className="flex-1 bg-[#efeae2] p-3 text-left overflow-y-auto">
      <div className="flex justify-center mb-4">
        <span className="px-2.5 py-0.5 bg-[#e1f3f9] rounded-md text-badge font-bold text-cyan-800 uppercase tracking-wider">
          Official Business Account
        </span>
      </div>
      <div className="bg-white p-3 rounded-r-xl rounded-bl-xl shadow-sm border border-gray-100 max-w-[90%] space-y-2">
        <div className="w-full h-24 bg-gray-100 rounded-lg overflow-hidden">
          <img
            alt=""
            className="w-full h-full object-cover opacity-80"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZHuZym5jSP8mVnBO9WOVqQ0_V8_eYUdIkIkQHliqcxU03sgTlmGHEB7ojqecrutz4WWoc1iB_iZcBUAAqZic12M6dSxShpyPeTRjupd5OzVcPTfuElBQNBzJUL8mRcVgZp5LUrhbgOj50CagpRqjGhVZnM7jmTD_2kqDbcy15FrEYhUm8ih1KQtGpHPVXRv8SlbDpfWR3FKbQL9vSlkfSmGOMId4TyvkEirhmXb9PwgJZAgwVG9xv99Vd4KqyWPa32ekOWor1-ukp"
          />
        </div>
        <p className="text-xs text-stone-800 leading-normal font-medium">{body}</p>
        <div className="text-badge text-gray-400 text-right flex justify-end gap-0.5">
          <span>12:00 PM</span>
          <CheckCheck className="w-3 h-3 text-cyan-600" />
        </div>
      </div>
      {buttons.map((btn, i) => (
        <div
          key={i}
          className="bg-white/90 p-2 text-center rounded-lg border border-gray-200 max-w-[90%] mt-1.5 text-sm font-black text-blue-600 cursor-pointer"
        >
          {btn}
        </div>
      ))}
    </div>
    <div className="h-4 bg-gray-100 flex justify-center pb-1">
      <div className="w-16 h-1 bg-gray-300 rounded-full" />
    </div>
  </div>
);

type CampaignViewMode = 'list' | 'create';

const CAMPAIGN_STATUS_STYLE: Record<CampaignRecordStatus, string> = {
  Draft: 'bg-gray-100 text-gray-600 border-gray-200',
  Running: 'bg-blue-50 text-blue-700 border-blue-100',
  Completed: 'bg-green-50 text-green-700 border-green-100',
  Failed: 'bg-red-50 text-red-700 border-red-100',
};

function formatCampaignDate(iso: string | null): string {
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

const CampaignListPanel: React.FC<{
  campaigns: CampaignRecord[];
  loading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
  onRefresh: () => void;
  onOpenCampaign: (id: string) => void;
}> = ({ campaigns, loading, error, search, onSearchChange, onCreate, onRefresh, onOpenCampaign }) => {
  const q = search.trim().toLowerCase();
  const filtered = campaigns.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.segmentLabel.toLowerCase().includes(q) ||
      c.channel.includes(q)
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col space-y-4 overflow-y-auto bg-slate-50 p-6 selection:bg-sky-50">
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-sky-600" />
            Campaigns
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 font-medium">
            Broadcast messages to your contacts on WhatsApp, Email, and Instagram.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-meta font-semibold outline-none focus:ring-2 focus:ring-[#0284c7]/20"
            />
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-gray-50 text-gray-800 rounded-xl text-meta font-bold flex items-center gap-1.5 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Refresh
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="px-3 py-2 bg-channel-green hover:bg-[#20bd5a] text-white rounded-xl text-meta font-bold flex items-center gap-1.5 shadow-sm shadow-[#0284c7]/20"
          >
            <Plus className="w-3.5 h-3.5" /> Create campaign
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-600">
            {campaigns.length === 0 ? 'No campaigns yet' : 'No campaigns match your search'}
          </p>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            {campaigns.length === 0
              ? 'Create your first broadcast to reach contacts with approved WhatsApp templates.'
              : 'Try a different search term.'}
          </p>
          {campaigns.length === 0 && (
            <button
              type="button"
              onClick={onCreate}
              className="mt-4 px-4 py-2 bg-channel-green hover:bg-[#20bd5a] text-white rounded-xl text-sm font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Create campaign
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-sm font-black uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Audience</th>
                  <th className="px-4 py-3">Sent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((campaign) => {
                  const ch = CAMPAIGN_CHANNELS.find((c) => c.id === campaign.channel);
                  return (
                    <tr
                      key={campaign.id}
                      onClick={() => onOpenCampaign(campaign.id)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-gray-900">{campaign.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ChannelIcon channel={campaign.channel} size={16} />
                          <span className="text-sm font-bold text-gray-700">{ch?.name ?? campaign.channel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-gray-800">
                          {campaign.totalRecipients.toLocaleString()} contacts
                        </p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">{campaign.segmentLabel}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono font-bold text-gray-800">
                          {campaign.sentCount.toLocaleString()}
                          <span className="text-gray-400 font-medium">
                            {' '}
                            / {campaign.totalRecipients.toLocaleString()}
                          </span>
                        </p>
                        {campaign.readCount > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {campaign.readCount.toLocaleString()} read
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex text-sm font-black px-2 py-0.5 rounded-lg border ${CAMPAIGN_STATUS_STYLE[campaign.status]}`}
                        >
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-meta font-bold text-gray-700">
                          {formatCampaignDate(campaign.sentAt ?? campaign.createdAt)}
                        </p>
                        {campaign.sentAt && (
                          <p className="text-xs text-gray-400 mt-0.5">Sent</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main CampaignsView ────────────────────────────────────
const CampaignsWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [viewMode, setViewMode] = useState<CampaignViewMode>('list');
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [listSearch, setListSearch] = useState('');

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState<CampaignChannel>('whatsapp');

  const [selectedAudienceType, setSelectedAudienceType] = useState('segment');
  const [selectedSegmentId, setSelectedSegmentId] = useState('all');
  const [audienceData, setAudienceData] = useState<CampaignAudienceResponse | null>(null);
  const [audienceLoading, setAudienceLoading] = useState(true);
  const [audienceError, setAudienceError] = useState<string | null>(null);

  const [audienceContacts, setAudienceContacts] = useState<AudienceContactRow[]>([]);
  const [audienceContactsTotal, setAudienceContactsTotal] = useState(0);
  const [audienceContactsTruncated, setAudienceContactsTruncated] = useState(false);
  const [audienceContactsLoading, setAudienceContactsLoading] = useState(false);
  const [audienceContactsError, setAudienceContactsError] = useState<string | null>(null);

  const activeAudienceSegmentId =
    selectedAudienceType === 'all' ? 'all' : selectedSegmentId;

  const activeAudienceSegmentLabel = () => {
    if (selectedAudienceType === 'all') {
      return `All ${CAMPAIGN_CHANNELS.find((c) => c.id === selectedChannel)?.name ?? 'channel'} contacts`;
    }
    const seg = audienceData?.segments.find((s) => s.id === selectedSegmentId);
    return seg ? `Tag: ${seg.name}` : 'Selected segment';
  };

  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;

  const loadCampaigns = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setListLoading(true);
    if (!options?.silent) setListError(null);
    try {
      const raw = (await api.getCampaigns()) as Record<string, unknown>[];
      setCampaigns(raw.map((c) => mapCampaignFromApi(c)));
    } catch (err) {
      if (!options?.silent) {
        setListError(err instanceof Error ? err.message : 'Failed to load campaigns');
        setCampaigns([]);
      }
    } finally {
      if (!options?.silent) setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'list') {
      loadCampaigns();
    }
  }, [viewMode, loadCampaigns]);

  useKeepAliveActivation(() => {
    if (viewModeRef.current === 'list') {
      void loadCampaigns({ silent: true });
    }
  });

  const resetWizard = useCallback(() => {
    setCurrentStep(0);
    setSelectedChannel('whatsapp');
    setSelectedAudienceType('segment');
    setSelectedSegmentId('all');
    setSelectedTemplateName('');
    setSelectedEmailTemplateId('');
    setVariableMappings({});
    setEmailVariableMappings({});
    setIgConfig(DEFAULT_INSTIGRAM_CONFIG);
    setIsScheduled(false);
    setCampaignLaunched(false);
    setLaunching(false);
    setLaunchError(null);
    setLaunchResult(null);
    setLastCreatedCampaignId(null);
  }, []);

  const openCreateWizard = () => {
    resetWizard();
    setViewMode('create');
    if (!isNewCampaignPath(location.pathname)) {
      navigate(pathForNewCampaign());
    }
  };

  const backToList = () => {
    resetWizard();
    setViewMode('list');
    loadCampaigns();
    if (isNewCampaignPath(location.pathname)) {
      navigate(pathForTab('campaigns'), { replace: true });
    }
  };

  useEffect(() => {
    if (isNewCampaignPath(location.pathname) && viewMode !== 'create') {
      resetWizard();
      setViewMode('create');
    }
  }, [location.pathname, viewMode, resetWizard]);

  useEffect(() => {
    if (viewMode !== 'create') return;
    let cancelled = false;
    setAudienceLoading(true);
    setAudienceError(null);

    api
      .getCampaignAudience(selectedChannel)
      .then((raw) => {
        if (cancelled) return;
        const data = raw as CampaignAudienceResponse;
        setAudienceData(data);
        const tagSegments = data.segments.filter((s) => s.id !== 'all');
        if (tagSegments.length > 0) {
          setSelectedSegmentId(tagSegments[0].id);
          setSelectedAudienceType('segment');
        } else {
          setSelectedSegmentId('all');
          setSelectedAudienceType('all');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setAudienceError(err instanceof Error ? err.message : 'Failed to load audience');
          setAudienceData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setAudienceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedChannel, viewMode]);

  useEffect(() => {
    if (viewMode !== 'create') return;
    let cancelled = false;
    setAudienceContactsLoading(true);
    setAudienceContactsError(null);

    api
      .getCampaignAudienceContacts(selectedChannel, activeAudienceSegmentId)
      .then((raw) => {
        if (cancelled) return;
        const data = raw as CampaignAudienceContactsResponse;
        setAudienceContacts(data.contacts);
        setAudienceContactsTotal(data.total);
        setAudienceContactsTruncated(data.truncated);
      })
      .catch((err) => {
        if (!cancelled) {
          setAudienceContactsError(err instanceof Error ? err.message : 'Failed to load contacts');
          setAudienceContacts([]);
          setAudienceContactsTotal(0);
          setAudienceContactsTruncated(false);
        }
      })
      .finally(() => {
        if (!cancelled) setAudienceContactsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedChannel, activeAudienceSegmentId, viewMode]);

  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  useEffect(() => {
    if (viewMode !== 'create') return;
    let cancelled = false;
    setTemplatesLoading(true);
    setTemplatesError(null);

    api
      .getTemplates()
      .then((raw) => {
        if (cancelled) return;
        const mapped = (raw as Record<string, unknown>[])
          .map((t) => mapTemplateFromApi(t))
          .filter((t) => t.status === 'Approved');
        setTemplates(mapped);
        if (mapped[0]) {
          setSelectedTemplateName(mapped[0].name);
          setVariableMappings((prev) => {
            const next: Record<string, string> = {};
            for (const v of mapped[0].variables) {
              next[v] = prev[v] ?? '';
            }
            return next;
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setTemplatesError(err instanceof Error ? err.message : 'Failed to load templates');
          setTemplates([]);
        }
      })
      .finally(() => {
        if (!cancelled) setTemplatesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [viewMode]);

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateRecord[]>([]);
  const [emailTemplatesLoading, setEmailTemplatesLoading] = useState(true);
  const [emailTemplatesError, setEmailTemplatesError] = useState<string | null>(null);

  useEffect(() => {
    if (viewMode !== 'create') return;
    let cancelled = false;
    setEmailTemplatesLoading(true);
    setEmailTemplatesError(null);

    api
      .getEmailTemplates()
      .then((raw) => {
        if (cancelled) return;
        const mapped = (raw as Record<string, unknown>[])
          .map((t) => mapEmailTemplateFromApi(t))
          .filter((t) => t.status === 'active');
        setEmailTemplates(mapped);
        if (mapped[0]) {
          setSelectedEmailTemplateId(mapped[0].id ?? '');
          setEmailVariableMappings((prev) => {
            const next: Record<string, string> = {};
            for (const v of mapped[0].variables) {
              if (!CONTACT_AUTO_EMAIL_VARIABLES.has(v)) {
                next[v] = prev[v] ?? '';
              }
            }
            return next;
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setEmailTemplatesError(err instanceof Error ? err.message : 'Failed to load email templates');
          setEmailTemplates([]);
        }
      })
      .finally(() => {
        if (!cancelled) setEmailTemplatesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [viewMode]);

  const [selectedTemplateName, setSelectedTemplateName] = useState('');
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState('');
  const [variableMappings, setVariableMappings] = useState<Record<string, string>>({});
  const [emailVariableMappings, setEmailVariableMappings] = useState<Record<string, string>>({});

  const [igConfig, setIgConfig] = useState(DEFAULT_INSTIGRAM_CONFIG);

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('2026-06-10');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [campaignLaunched, setCampaignLaunched] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [launchResult, setLaunchResult] = useState<{ sentCount: number; totalRecipients: number } | null>(
    null
  );
  const [lastCreatedCampaignId, setLastCreatedCampaignId] = useState<string | null>(null);

  const activeTemplate = templates.find((t) => t.name === selectedTemplateName) ?? templates[0] ?? null;
  const activeEmailTemplate =
    emailTemplates.find((t) => t.id === selectedEmailTemplateId) ?? emailTemplates[0] ?? null;

  const allContactsCount = audienceData?.total ?? 0;
  const taggedSegments = (audienceData?.segments ?? []).filter((s) => s.id !== 'all');

  const audienceCount = () => {
    if (audienceLoading) return 0;
    if (selectedAudienceType === 'all') return allContactsCount;
    const seg = audienceData?.segments.find((s) => s.id === selectedSegmentId);
    return seg?.count ?? 0;
  };

  const estimatedCost = () => {
    if (selectedChannel === 'whatsapp') {
      const rate = activeTemplate?.category === 'Marketing' ? 0.0125 : 0.0084;
      return `$${(audienceCount() * rate).toFixed(2)} USD`;
    }
    if (selectedChannel === 'email') return `₹${(audienceCount() * 0.02).toFixed(0)} (AWS SES)`;
    if (selectedChannel === 'instagram') return 'Free (Meta DM API)';
    return '—';
  };

  const getRenderedWABody = () => {
    if (!activeTemplate) return '';
    let text = activeTemplate.bodyPattern;
    activeTemplate.variables.forEach((v, i) => {
      text = text.replace(`{{${i + 1}}}`, variableMappings[v] || `[${v}]`);
    });
    return text;
  };

  const STEPS = ['Channel', 'Audience', 'Message', 'Review'];
  const totalSteps = 4;

  const chConfig = CAMPAIGN_CHANNELS.find((c) => c.id === selectedChannel)!;
  const compactWizardLayout = currentStep >= 2;

  const handleLaunchCampaign = async () => {
    setLaunchError(null);

    if (selectedChannel === 'instagram') {
      setLaunchError('Instagram campaigns are preview-only right now. Use WhatsApp or Email to send.');
      return;
    }

    if (audienceCount() === 0) {
      setLaunchError('Your audience is empty. Add contacts or choose a different segment.');
      return;
    }

    if (isScheduled) {
      setLaunchError('Scheduled campaigns are not supported yet. Turn off scheduling to send now.');
      return;
    }

    let templateId: string | undefined;
    let campaignName: string;
    let mappings: Record<string, string>;

    if (selectedChannel === 'whatsapp') {
      if (!activeTemplate?.id) {
        setLaunchError('Select an approved WhatsApp template before launching.');
        return;
      }
      if (activeTemplate.variables.some((v) => !variableMappings[v]?.trim())) {
        setLaunchError('Fill in all template variables before launching.');
        return;
      }
      templateId = activeTemplate.id;
      campaignName = `${activeTemplate.name} · ${chConfig.name} · ${new Date().toLocaleDateString()}`;
      mappings = variableMappings;
    } else if (selectedChannel === 'email') {
      if (!activeEmailTemplate?.id) {
        setLaunchError('Select an active email template before launching.');
        return;
      }
      const manualVars = activeEmailTemplate.variables.filter((v) => !CONTACT_AUTO_EMAIL_VARIABLES.has(v));
      if (manualVars.some((v) => !emailVariableMappings[v]?.trim())) {
        setLaunchError('Fill in all campaign template variables before launching.');
        return;
      }
      templateId = activeEmailTemplate.id;
      campaignName = `${activeEmailTemplate.name} · ${chConfig.name} · ${new Date().toLocaleDateString()}`;
      mappings = emailVariableMappings;
    } else {
      setLaunchError('This channel is not supported for sending yet.');
      return;
    }

    const segmentId = selectedAudienceType === 'all' ? 'all' : selectedSegmentId;

    setLaunching(true);
    try {
      const created = (await api.createCampaign({
        name: campaignName,
        templateId,
        channel: selectedChannel,
        audienceType: selectedAudienceType === 'all' ? 'all' : 'segment',
        audienceFilter: {
          channel: selectedChannel,
          segmentId,
          variableMappings: mappings,
        },
      })) as { id: string };

      const result = (await api.sendCampaign(created.id)) as {
        sentCount?: number;
        totalRecipients?: number;
      };

      setLaunchResult({
        sentCount: result.sentCount ?? 0,
        totalRecipients: result.totalRecipients ?? audienceCount(),
      });
      setLastCreatedCampaignId(created.id);
      setCampaignLaunched(true);
      loadCampaigns();
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : parseApiError(String(err)));
    } finally {
      setLaunching(false);
    }
  };

  if (viewMode === 'list') {
    return (
      <CampaignListPanel
        campaigns={campaigns}
        loading={listLoading}
        error={listError}
        search={listSearch}
        onSearchChange={setListSearch}
        onCreate={openCreateWizard}
        onRefresh={loadCampaigns}
        onOpenCampaign={(id) => navigate(pathForCampaign(id))}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 selection:bg-sky-50">
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 md:px-6">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <button
            type="button"
            onClick={backToList}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">All campaigns</span>
          </button>

          <div className="flex min-w-0 items-center justify-center gap-1 overflow-x-auto px-1">
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      currentStep > i
                        ? 'bg-channel-green text-white'
                        : currentStep === i
                          ? 'bg-channel-green text-white ring-4 ring-emerald-100'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {currentStep > i ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span
                    className={`hidden shrink-0 text-sm font-semibold md:inline ${
                      currentStep === i ? 'text-sky-600' : currentStep > i ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-0.5 h-px w-4 shrink-0 md:w-8 ${currentStep > i ? 'bg-sky-300' : 'bg-slate-200'}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {currentStep > 0 ? (
            <div
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold"
              style={{
                background: chConfig.bgColor,
                borderColor: chConfig.borderColor,
                color: chConfig.color,
              }}
            >
              <ChannelIcon channel={selectedChannel} size={12} />
              <span className="hidden sm:inline">{chConfig.name}</span>
            </div>
          ) : (
            <div className="w-px" aria-hidden="true" />
          )}
        </div>

        <p className="mt-2 text-center text-xs font-medium text-slate-500 md:hidden">
          Step {currentStep + 1} of {totalSteps}: {STEPS[currentStep]}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden xl:flex-row">
      <section
        className={`flex h-full min-h-0 flex-col overflow-hidden border-slate-200 bg-white ${
          compactWizardLayout
            ? 'w-full shrink-0 xl:w-[min(520px,38vw)] xl:border-r'
            : 'flex-1 xl:border-r'
        }`}
      >
        <div
          className={`flex-1 min-h-0 overflow-y-auto text-left ${
            compactWizardLayout ? 'w-full px-4 py-5 md:px-6' : 'px-4 py-5 md:px-8 md:py-6'
          } ${compactWizardLayout ? '' : 'max-w-2xl'}`}
        >
          {campaignLaunched ? (
            <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-xl flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center border-4 border-green-100">
                <CheckCheck className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">Campaign Sent!</h4>
                <p className="text-xs text-gray-400 mt-1">
                  {launchResult
                    ? `${launchResult.sentCount.toLocaleString()} of ${launchResult.totalRecipients.toLocaleString()} messages sent via WhatsApp.`
                    : 'Broadcast completed.'}
                </p>
              </div>
              <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 divide-y divide-gray-100">
                {[
                  ['Channel', chConfig.name],
                  ['Audience', `${audienceCount().toLocaleString()} contacts`],
                  ['Estimated Cost', estimatedCost()],
                  ['Timing', isScheduled ? `${scheduledDate} ${scheduledTime}` : 'Immediately'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 text-sm font-bold">
                    <span className="text-gray-400">{k}</span>
                    <span className="text-gray-900 font-mono">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                <button
                  type="button"
                  onClick={backToList}
                  className="px-6 py-2 bg-white hover:bg-gray-50 border border-slate-200 text-gray-700 text-sm font-bold rounded-xl"
                >
                  Back to campaigns
                </button>
                {lastCreatedCampaignId && (
                  <button
                    type="button"
                    onClick={() => navigate(pathForCampaign(lastCreatedCampaignId))}
                    className="px-6 py-2 bg-channel-green hover:bg-[#20bd5a] text-white text-sm font-bold rounded-xl"
                  >
                    View insights
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => resetWizard()}
                  className="px-6 py-2 bg-white hover:bg-gray-50 border border-slate-200 text-gray-700 text-sm font-bold rounded-xl"
                >
                  Create another
                </button>
              </div>
            </div>
          ) : (
            <>
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Select Channel</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Choose which channel to send your campaign through.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {SELECTABLE_CAMPAIGN_CHANNELS.map((ch) => {
                      const selected = selectedChannel === ch.id;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setSelectedChannel(ch.id)}
                          className={`relative flex min-h-[168px] flex-col rounded-2xl border-2 p-4 text-left transition-all ${
                            selected
                              ? 'shadow-md'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                          }`}
                          style={
                            selected
                              ? {
                                  borderColor: ch.color,
                                  background: ch.bgColor,
                                }
                              : undefined
                          }
                        >
                          {selected && (
                            <div
                              className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full"
                              style={{ background: ch.color }}
                            >
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                          <div
                            className="mb-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: selected ? 'white' : ch.bgColor }}
                          >
                            <ChannelIcon channel={ch.id} size={22} />
                          </div>
                          <p className="pr-6 text-sm font-bold text-gray-900">{ch.name}</p>
                          <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-gray-500">
                            {ch.description}
                          </p>
                          <span
                            className="mt-3 inline-flex w-fit rounded-lg px-2 py-0.5 text-[11px] font-semibold"
                            style={{
                              background: selected ? 'white' : ch.bgColor,
                              color: ch.color,
                            }}
                          >
                            {ch.limit}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Select target audience</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Choose which {chConfig.name} contacts will receive this campaign.
                    </p>
                  </div>

                  {audienceError && (
                    <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                      {audienceError}
                    </p>
                  )}

                  <div className="space-y-3 select-none">
                    {[
                      {
                        type: 'all',
                        icon: Users,
                        title: `All ${chConfig.name} contacts`,
                        desc: `Every contact reachable on ${chConfig.name}`,
                        count: audienceLoading
                          ? 'Loading…'
                          : `${allContactsCount.toLocaleString()} contacts`,
                      },
                      {
                        type: 'segment',
                        icon: Layers,
                        title: 'By tag',
                        desc: 'Pick a tag from your workspace contacts',
                        count: audienceLoading
                          ? 'Loading…'
                          : taggedSegments.length > 0
                            ? `${taggedSegments.length} tags`
                            : 'No tags yet',
                      },
                    ].map((opt) => {
                      const selected = selectedAudienceType === opt.type;
                      const Icon = opt.icon;
                      return (
                        <div
                          key={opt.type}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedAudienceType(opt.type)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedAudienceType(opt.type);
                            }
                          }}
                          className={`rounded-xl bg-white p-4 transition-all ${
                            selected
                              ? 'ring-2 ring-sky-600 ring-offset-2 ring-offset-slate-50'
                              : 'ring-1 ring-slate-200 hover:ring-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900">{opt.title}</p>
                                <p className="mt-0.5 text-xs text-slate-500">{opt.desc}</p>
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs font-medium text-slate-600">
                                {opt.count}
                              </span>
                              <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                  selected
                                    ? 'border-channel-green bg-channel-green text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {selected && <Check className="h-3 w-3" />}
                              </span>
                            </div>
                          </div>

                          {opt.type === 'segment' && selected && (
                            <div className="mt-4 border-t border-slate-100 pt-4">
                              {audienceLoading ? (
                                <p className="text-xs font-medium text-slate-400">Loading tags…</p>
                              ) : taggedSegments.length === 0 ? (
                                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                  No tags on your contacts yet. Add tags from Contacts or use &quot;All
                                  contacts&quot;.
                                </p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {taggedSegments.map((segment) => {
                                    const tagSelected = selectedSegmentId === segment.id;
                                    return (
                                      <button
                                        key={segment.id}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedSegmentId(segment.id);
                                        }}
                                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                                          tagSelected
                                            ? 'border-channel-green bg-sky-50 text-sky-700'
                                            : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50/50'
                                        }`}
                                      >
                                        <Hash className="h-3 w-3 shrink-0" />
                                        {segment.name}
                                        <span
                                          className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                                            tagSelected ? 'bg-white text-sky-600' : 'bg-slate-100 text-slate-500'
                                          }`}
                                        >
                                          {segment.count.toLocaleString()}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="relative overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/80">
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-sky-500" />
                    <div className="flex items-center gap-4 p-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                        <BarChart2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {audienceLoading
                            ? 'Loading audience…'
                            : `${audienceCount().toLocaleString()} contacts selected`}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {audienceLoading
                            ? `Fetching ${chConfig.name} contacts from your workspace`
                            : `via ${chConfig.name} · Est. cost: ${estimatedCost()}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      {selectedChannel === 'whatsapp' && 'Design Message'}
                      {selectedChannel === 'email' && 'Compose Email'}
                      {selectedChannel === 'instagram' && 'Write Instagram DM'}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selectedChannel === 'whatsapp' &&
                        'Select an approved Meta template and map variable parameters.'}
                      {selectedChannel === 'email' &&
                        'Pick a saved email template and set variable values for the campaign.'}
                      {selectedChannel === 'instagram' && 'Write your Instagram DM (max 1,000 characters).'}
                    </p>
                  </div>

                  {selectedChannel === 'whatsapp' && (
                    <div className="space-y-4">
                      {templatesError && (
                        <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                          {templatesError}
                        </p>
                      )}
                      {templatesLoading ? (
                        <p className="text-xs text-gray-400 font-bold">Loading your templates…</p>
                      ) : templates.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center space-y-1">
                          <p className="text-sm font-bold text-gray-900">No approved templates</p>
                          <p className="text-xs text-gray-400">
                            Create and approve a template in Message Templates first.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm font-black uppercase text-gray-400 tracking-wider mb-1.5">
                              Approved Meta Template
                            </label>
                            <select
                              value={selectedTemplateName}
                              onChange={(e) => {
                                const name = e.target.value;
                                setSelectedTemplateName(name);
                                const tpl = templates.find((t) => t.name === name);
                                if (tpl) {
                                  setVariableMappings((prev) => {
                                    const next: Record<string, string> = {};
                                    for (const v of tpl.variables) {
                                      next[v] = prev[v] ?? '';
                                    }
                                    return next;
                                  });
                                }
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#0284c7]/20 cursor-pointer"
                            >
                              {templates.map((t) => (
                                <option key={t.id ?? t.name} value={t.name}>
                                  {t.name} ({t.category})
                                </option>
                              ))}
                            </select>
                          </div>
                          {activeTemplate && activeTemplate.variables.length > 0 && (
                            <div className="space-y-3 bg-sky-50/10 p-4 border border-channel-green/5 rounded-xl">
                              <h4 className="text-sm font-black text-sky-600 uppercase tracking-widest">
                                Map Placeholder Variables
                              </h4>
                              {activeTemplate.variables.map((v, i) => (
                                <div key={i} className="grid grid-cols-3 items-center gap-2">
                                  <span className="text-sm font-bold text-gray-500 font-mono">
                                    {'{{' + (i + 1) + '}}'} ({v})
                                  </span>
                                  <div className="col-span-2">
                                    <input
                                      type="text"
                                      value={variableMappings[v] || ''}
                                      onChange={(e) =>
                                        setVariableMappings((p) => ({ ...p, [v]: e.target.value }))
                                      }
                                      placeholder={`Input ${v}`}
                                      className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs outline-none focus:ring-2 focus:ring-[#0284c7]/20 font-bold"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {selectedChannel === 'email' && (
                    <div className="space-y-4">
                      {emailTemplatesError && (
                        <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                          {emailTemplatesError}
                        </p>
                      )}
                      {emailTemplatesLoading ? (
                        <p className="text-xs text-gray-400 font-bold">Loading email templates…</p>
                      ) : emailTemplates.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center space-y-1">
                          <p className="text-sm font-bold text-gray-900">No active email templates</p>
                          <p className="text-xs text-gray-400">
                            Create and activate a template under Email Templates first.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm font-black uppercase text-gray-400 tracking-wider mb-1.5">
                              Email Template
                            </label>
                            <select
                              value={selectedEmailTemplateId}
                              onChange={(e) => {
                                const id = e.target.value;
                                setSelectedEmailTemplateId(id);
                                const tpl = emailTemplates.find((t) => t.id === id);
                                if (tpl) {
                                  setEmailVariableMappings((prev) => {
                                    const next: Record<string, string> = {};
                                    for (const v of tpl.variables) {
                                      if (!CONTACT_AUTO_EMAIL_VARIABLES.has(v)) {
                                        next[v] = prev[v] ?? '';
                                      }
                                    }
                                    return next;
                                  });
                                }
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#0284c7]/20 cursor-pointer"
                            >
                              {emailTemplates.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                            {activeEmailTemplate && (
                              <p className="text-xs text-gray-400 mt-1.5 font-medium">
                                Subject: <span className="text-gray-600">{activeEmailTemplate.subject}</span>
                              </p>
                            )}
                          </div>
                          {activeEmailTemplate && activeEmailTemplate.variables.length > 0 && (
                            <div className="space-y-3 bg-sky-50/10 p-4 border border-channel-green/5 rounded-xl">
                              <h4 className="text-sm font-black text-sky-600 uppercase tracking-widest">
                                Template Variables
                              </h4>
                              {activeEmailTemplate.variables.map((v) => {
                                const fromContact = CONTACT_AUTO_EMAIL_VARIABLES.has(v);
                                return (
                                  <div key={v} className="grid grid-cols-3 items-center gap-2">
                                    <span className="text-sm font-bold text-gray-500 font-mono">
                                      {'{{' + v + '}}'}
                                    </span>
                                    <div className="col-span-2">
                                      {fromContact ? (
                                        <p className="text-xs text-gray-500 font-bold bg-white border border-slate-200 rounded-xl py-1.5 px-3">
                                          Filled from each contact ({v.replace(/_/g, ' ')})
                                        </p>
                                      ) : (
                                        <input
                                          type="text"
                                          value={emailVariableMappings[v] || ''}
                                          onChange={(e) =>
                                            setEmailVariableMappings((p) => ({ ...p, [v]: e.target.value }))
                                          }
                                          placeholder={`Value for ${v}`}
                                          className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs outline-none focus:ring-2 focus:ring-[#0284c7]/20 font-bold"
                                        />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {selectedChannel === 'instagram' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-black uppercase text-gray-400 tracking-wider mb-1.5">
                          DM Message
                        </label>
                        <textarea
                          value={igConfig.message}
                          onChange={(e) => setIgConfig({ message: e.target.value })}
                          rows={6}
                          maxLength={1000}
                          placeholder="Write your Instagram DM here. Use {{first_name}} for personalization."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0284c7]/20 resize-none leading-relaxed"
                        />
                        <div className="flex justify-between mt-1">
                          <p className="text-xs text-gray-400">
                            Use <code className="bg-gray-100 px-1 rounded">{'{{first_name}}'}</code> for
                            personalization
                          </p>
                          <p
                            className={`text-sm font-bold ${igConfig.message.length > 900 ? 'text-red-500' : 'text-gray-400'}`}
                          >
                            {igConfig.message.length}/1000
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#FDF0F7] border border-[#F5A7C7] rounded-xl p-4 flex gap-3">
                        <Globe className="w-4 h-4 text-[#E1306C] shrink-0 mt-0.5" />
                        <p className="text-meta text-[#E1306C] font-medium leading-relaxed">
                          <strong>Note:</strong> Instagram DMs can only be sent to contacts who have previously
                          messaged your business Instagram account in the last 24 hours (or with message tag
                          permission).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 select-none">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Schedule & Dispatch Review</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Review campaign details and schedule or send immediately.
                    </p>
                  </div>

                  <div className="p-4 bg-green-50/60 border border-green-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 text-green-600 rounded-xl">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Estimated Cost</p>
                        <p className="text-xs text-gray-400 font-bold mt-0.5">
                          {audienceCount().toLocaleString()} contacts via {chConfig.name}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-black font-mono text-emerald-800">{estimatedCost()}</span>
                  </div>

                  <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900">Schedule for later</p>
                        <p className="text-xs text-gray-400 font-bold">Defer broadcast to a specific time</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isScheduled}
                        onChange={(e) => setIsScheduled(e.target.checked)}
                        className="w-4 h-4 accent-[#0284c7] cursor-pointer"
                      />
                    </div>
                    {isScheduled && (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none font-bold"
                        />
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none font-bold"
                        />
                      </div>
                    )}
                  </div>

                  <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-sky-600 uppercase tracking-wider mb-1">
                        Compliance Check Passed
                      </p>
                      <p className="text-xs text-gray-400 font-bold leading-normal">
                        {selectedChannel === 'whatsapp' &&
                          'Template approved by Meta. Quality rating: High. Within daily messaging limits.'}
                        {selectedChannel === 'email' &&
                          'Unsubscribe link will be auto-added. CAN-SPAM and GDPR compliant.'}
                        {selectedChannel === 'instagram' &&
                          'Message complies with Instagram DM policies. Only opted-in contacts targeted.'}
                      </p>
                    </div>
                  </div>

                  {launchError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-bold p-3 rounded-xl">
                      {launchError}
                    </div>
                  )}
                </div>
              )}

            </>
          )}
        </div>

        {!campaignLaunched && (
          <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 py-3 md:px-8">
            <button
              type="button"
              onClick={() => setCurrentStep((p) => Math.max(0, p - 1))}
              disabled={currentStep === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {currentStep < totalSteps - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((p) => p + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-channel-green px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/15 transition-colors hover:bg-[#20bd5a]"
              >
                Next step <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLaunchCampaign}
                disabled={launching}
                className="inline-flex items-center gap-1.5 rounded-lg bg-channel-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/15 transition-colors hover:bg-[#20bd5a] disabled:opacity-60"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                {launching
                  ? 'Sending…'
                  : isScheduled
                    ? `Schedule: ${scheduledDate}`
                    : 'Launch campaign'}
              </button>
            )}
          </div>
        )}
      </section>

      <section
        className={`flex h-full min-h-0 flex-col overflow-hidden bg-slate-100/60 ${
          compactWizardLayout
            ? 'w-full min-w-0 flex-1 p-4 lg:p-6'
            : 'w-full min-w-0 flex-1 p-5 lg:p-6 xl:w-[min(440px,36vw)] xl:flex-none'
        }`}
      >
        <div
          className={`flex min-h-0 flex-1 flex-col ${
            compactWizardLayout ? 'mx-auto w-full max-w-3xl xl:max-w-none' : 'mx-auto w-full max-w-md'
          }`}
        >
          <p className="mb-3 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {currentStep === 1 ? 'Audience preview' : currentStep === 0 ? 'Channel preview' : `Live ${chConfig.name} preview`}
          </p>
          <div className={`min-h-0 flex-1 ${compactWizardLayout ? 'flex flex-col' : ''}`}>

        {currentStep === 0 && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl"
              style={{ background: chConfig.bgColor }}
            >
              <ChannelIcon channel={selectedChannel} size={40} />
            </div>
            <div>
              <p className="font-black text-gray-900 text-lg">{chConfig.name}</p>
              <p className="text-xs text-gray-400 mt-1 max-w-[200px] leading-relaxed">{chConfig.description}</p>
              <p className="text-sm font-black mt-2" style={{ color: chConfig.color }}>
                {chConfig.limit}
              </p>
            </div>
            <p className="text-xs text-gray-400">Select a channel and click Next Step to see live preview</p>
          </div>
        )}

        {currentStep === 1 && (
          <AudienceContactListPanel
            channel={selectedChannel}
            channelLabel={chConfig.name}
            segmentLabel={activeAudienceSegmentLabel()}
            contacts={audienceContacts}
            total={audienceContactsTotal}
            truncated={audienceContactsTruncated}
            loading={audienceContactsLoading || audienceLoading}
            error={audienceContactsError}
          />
        )}

        {currentStep > 1 && selectedChannel === 'whatsapp' && (
          <WhatsAppPreview body={getRenderedWABody()} buttons={activeTemplate?.buttons || []} />
        )}
        {currentStep > 1 && selectedChannel === 'email' && activeEmailTemplate && (
          <div className="flex-1 flex flex-col min-h-0 w-full">
            <EmailTemplatePreview
              subject={activeEmailTemplate.subject}
              htmlBody={activeEmailTemplate.htmlBody}
              variables={activeEmailTemplate.variables}
              variableMappings={emailVariableMappings}
            />
          </div>
        )}
        {currentStep > 1 && selectedChannel === 'instagram' && <InstagramPreview message={igConfig.message} />}
          </div>
        </div>
      </section>
      </div>
    </div>
  );
};

export const CampaignsView: React.FC = () => {
  const location = useLocation();
  const detailCampaignId = campaignIdFromPath(location.pathname);
  if (detailCampaignId) {
    return <CampaignDetailView campaignId={detailCampaignId} />;
  }
  return <CampaignsWorkspace />;
};
