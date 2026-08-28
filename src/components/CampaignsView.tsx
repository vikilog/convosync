/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Users,
  Layers,
  ArrowRight,
  ArrowLeft,
  Check,
  Smartphone,
  CheckCheck,
  ShieldCheck,
  Coins,
  Play,
  Mail,
  MessageCircle,
  Globe,
  Hash,
  Plus,
  Loader2,
  Megaphone,
  Search,
  Upload,
  ImageIcon,
  Video,
  FileText,
  Images,
  Pencil,
  Clock,
  CheckCircle2,
  XCircle,
  CircleDashed,
  PlayCircle,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
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
import {
  campaignWhenAt,
  nextCampaignListSort,
  sortCampaignsForList,
  type CampaignListSortDir,
  type CampaignListSortKey,
} from '../lib/campaignListSort';
import { useKeepAliveActivation } from './KeepAlive';
import {
  mapTemplateFromApi,
  mapCampaignFromApi,
  mapEmailTemplateFromApi,
  mapCampaignDetailFromApi,
} from '../lib/mappers';
import {
  applyEmailTemplateVariables,
  mergePreviewVariables,
  wrapPreviewHtml,
} from './templates/emailTemplateUtils';
import {
  headerFormatFromApi,
  HEADER_MEDIA_ACCEPT,
  HEADER_MEDIA_HINT,
  type HeaderFormat,
} from './templates/templateBuilderUtils';
import {
  MediaGalleryPickerModal,
  type MediaGalleryFilterType,
  type PickedGalleryImage,
} from './media/MediaGalleryPickerModal';
import { campaignIdFromPath, pathForCampaign, pathForNewCampaign, isNewCampaignPath, pathForTab } from '../routes';
import {
  defaultScheduleLocal,
  isScheduledCampaignEditable,
  isoToLocalDateTime,
  localDateTimeToIso,
  minScheduleTimeFor,
  SCHEDULED_CAMPAIGN_EDIT_BLOCKED_HINT,
  todayLocal,
  wizardSeedFromCampaignDetail,
  type ScheduledWizardSeed,
} from '../lib/campaignScheduleEdit';
import { formatCampaignDateTime as formatCampaignDate } from '../lib/campaignFormat';
import { formatCc } from '../lib/convocoins';
import { WALLET_CC_RATES } from '../lib/walletPricing';
import { CampaignDetailView } from './campaigns/CampaignDetailView';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';

function isMediaHeaderFormat(format: HeaderFormat): format is 'image' | 'video' | 'document' {
  return format === 'image' || format === 'video' || format === 'document';
}

function galleryFilterForHeader(format: 'image' | 'video' | 'document'): MediaGalleryFilterType {
  if (format === 'video') return 'video';
  if (format === 'document') return 'pdf';
  return 'image';
}

/** List Tag column: "All" for all-contacts; otherwise Tag(s) label from segmentLabel. */
function campaignListTagLabel(segmentLabel: string): string {
  if (!segmentLabel || segmentLabel === 'All contacts') return 'All';
  return segmentLabel;
}

type AudienceSegment = { id: string; name: string; count: number; icon: string };

type CampaignAudienceResponse = {
  channel: CampaignChannel;
  total: number;
  excludedCount?: number;
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
  segmentIds?: string[];
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
}> = ({ channel, channelLabel, segmentLabel, contacts, total, truncated, loading, error }) => {
  const reduceMotion = useReducedMotion();
  const fade = reduceMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-white border border-swiss-line">
      <div className="absolute inset-x-0 top-0 z-10 h-0.5 bg-primary" />
      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <p className="truncate text-sm font-semibold text-slate-900">{segmentLabel}</p>
        <p className="mt-0.5 text-xs font-medium text-slate-500">
          {loading ? 'Loading contacts…' : `${total.toLocaleString()} ${channelLabel} contacts`}
          {!loading && truncated ? ` · showing first ${contacts.length}` : ''}
        </p>
      </div>

      {error && (
        <div className="mx-3 mt-3 shrink-0 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${segmentLabel}|${loading ? 'loading' : contacts.length}`}
            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={fade}
            className="h-full"
          >
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex animate-pulse items-center gap-3">
                    <div className="h-9 w-9 rounded-full skel" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2.5 w-2/3 rounded skel" />
                      <div className="h-2 w-1/2 rounded skel" />
                    </div>
                  </div>
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-10 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                  <Users className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No contacts in this audience</p>
                <p className="mt-1 text-xs text-slate-500">Try another tag or add contacts first.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {contacts.map((contact) => (
                  <li
                    key={contact.id}
                    className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {contactInitials(contact.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {contact.name || 'Unnamed'}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                        {formatAudienceContactHandle(contact, channel)}
                      </p>
                      {contact.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {contact.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md border border-swiss-line bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                            >
                              {tag}
                            </span>
                          ))}
                          {contact.tags.length > 3 && (
                            <span className="text-[10px] font-medium text-slate-400">
                              +{contact.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── Channel Icon Component ───────────────────────────────
const ChannelIcon: React.FC<{ channel: CampaignChannel; size?: number }> = ({ channel, size = 20 }) => {
  if (channel === 'whatsapp')
    return (
      <svg viewBox="0 0 24 24" style={{ width: size, height: size, fill: '#25D366' }}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    );
  if (channel === 'email') return <Mail style={{ width: size, height: size, color: '#078038' }} />;
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

const CONTACT_AUTO_EMAIL_VARIABLES = new Set([
  'first_name',
  'last_name',
  'name',
  'email',
  'phone',
  'contact.name',
  'contact.first_name',
  'contact.last_name',
  'contact.email',
  'contact.phone',
]);

const WA_CONTACT_FIELD_OPTIONS = [
  { value: '{{contact.name}}', label: 'Contact name' },
  { value: '{{contact.first_name}}', label: 'First name' },
  { value: '{{contact.phone}}', label: 'Phone' },
  { value: '{{contact.email}}', label: 'Email' },
] as const;

const WA_PREVIEW_SAMPLES: Record<string, string> = {
  '{{contact.name}}': 'Alex',
  '{{contact.first_name}}': 'Alex',
  '{{contact.phone}}': '+919999999999',
  '{{contact.email}}': 'alex@example.com',
};

function defaultWaVariableMappings(
  variables: string[],
  prev: Record<string, string> = {}
): Record<string, string> {
  const next: Record<string, string> = {};
  variables.forEach((v, i) => {
    if (prev[v]?.trim()) {
      next[v] = prev[v];
      return;
    }
    const lower = v.toLowerCase();
    if (i === 0 || lower.includes('name') || lower === 'var_1') {
      next[v] = '{{contact.name}}';
      return;
    }
    next[v] = '';
  });
  return next;
}

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
          <p className="text-swiss-faint text-meta font-bold">SUBJECT</p>
          <p className="font-black text-swiss-ink text-xs">{previewSubject || 'Your subject line…'}</p>
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
        <p className="text-sm font-black text-swiss-ink">convosync</p>
        <p className="text-meta text-swiss-faint">Active now</p>
      </div>
    </div>
    <div className="bg-white p-4 min-h-[200px]">
      <div className="flex justify-end mb-3">
        <div className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white text-xs leading-relaxed p-3 rounded-2xl rounded-tr-sm max-w-[80%]">
          {message.replace('{{first_name}}', 'Rahul') || 'Your Instagram DM here...'}
        </div>
      </div>
      <p className="text-badge text-swiss-faint text-right">Delivered</p>
    </div>
  </div>
);

// ─── WhatsApp Preview ─────────────────────────────────────
const WhatsAppPreview: React.FC<{
  body: string;
  buttons: string[];
  headerFormat?: HeaderFormat;
  headerMediaPreviewUrl?: string;
  headerMediaFileName?: string | null;
  previewKey?: string;
}> = ({
  body,
  buttons,
  headerFormat: headerFormatProp,
  headerMediaPreviewUrl,
  headerMediaFileName,
  previewKey = 'wa-preview',
}) => {
  const headerFormat: HeaderFormat = headerFormatProp ?? 'none';
  const reduceMotion = useReducedMotion();
  const fade = reduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div className="mx-auto flex h-full w-full max-w-[340px] flex-col items-center justify-center select-none">
      <div className="flex h-[min(580px,100%)] w-full max-h-full flex-col overflow-hidden rounded-[42px] border-[8px] border-slate-900 bg-white shadow-lg shadow-slate-900/10">
        <div className="flex h-6 shrink-0 items-center justify-center bg-slate-900">
          <div className="h-4 w-24 rounded-b-xl bg-slate-900" />
        </div>
        <div className="flex shrink-0 items-center justify-between bg-[#005e54] px-3 py-2 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
              CS
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">ConvoSync Business</p>
              <p className="mt-0.5 text-[10px] font-medium leading-none text-white/70">
                Online · Official API
              </p>
            </div>
          </div>
          <Smartphone className="h-4 w-4 text-white/50" aria-hidden />
        </div>
        <div className="relative min-h-0 flex-1 overflow-y-auto bg-[#efeae2] p-3 text-left">
          <div className="mb-4 flex justify-center">
            <span className="rounded-md bg-[#e1f3f9] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-800">
              Official Business Account
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={previewKey}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={fade}
              className="space-y-1.5"
            >
              <div className="max-w-[90%] space-y-2 rounded-r-xl rounded-bl-xl border border-swiss-line bg-white p-3 ">
                {isMediaHeaderFormat(headerFormat) && (
                  <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                    {headerFormat === 'image' && headerMediaPreviewUrl ? (
                      <img
                        alt="Header"
                        className="h-full w-full object-cover"
                        src={headerMediaPreviewUrl}
                      />
                    ) : headerFormat === 'video' && headerMediaPreviewUrl ? (
                      <video
                        src={headerMediaPreviewUrl}
                        className="h-full w-full object-cover"
                        muted
                      />
                    ) : (
                      <span className="truncate px-2 text-center text-[10px] font-semibold text-slate-500">
                        {headerMediaFileName || `${headerFormat} header`}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-xs font-medium leading-normal text-stone-800">{body}</p>
                <div className="flex justify-end gap-0.5 text-[10px] text-slate-400">
                  <span>12:00 PM</span>
                  <CheckCheck className="h-3 w-3 text-cyan-600" aria-hidden />
                </div>
              </div>
              {buttons.map((btn, i) => (
                <div
                  key={`${btn}-${i}`}
                  className="mt-1.5 max-w-[90%] cursor-default rounded-lg border border-swiss-line bg-white/90 p-2 text-center text-sm font-semibold text-blue-600"
                >
                  {btn}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex h-4 justify-center bg-slate-100 pb-1">
          <div className="h-1 w-16 rounded-full bg-slate-300" />
        </div>
      </div>
    </div>
  );
};

type CampaignViewMode = 'list' | 'create';

/** Status icon colors — same palette as the old text badges. */
const CAMPAIGN_STATUS_ICON: Record<
  CampaignRecordStatus,
  { Icon: typeof CheckCircle2; className: string }
> = {
  Draft: { Icon: CircleDashed, className: 'text-swiss-muted' },
  Scheduled: { Icon: Clock, className: 'text-amber-700' },
  Running: { Icon: PlayCircle, className: 'text-blue-600' },
  Completed: { Icon: CheckCircle2, className: 'text-green-700' },
  Failed: { Icon: XCircle, className: 'text-red-600' },
  Cancelled: { Icon: XCircle, className: 'text-swiss-muted' },
};

/** Progress fill — mirrors analytics funnel accents (failed red, done primary, running blue). */
function campaignProgressAccent(status: CampaignRecordStatus): string {
  if (status === 'Failed') return '#b91c1c';
  if (status === 'Completed') return 'var(--color-primary, #078038)';
  if (status === 'Running') return '#2563eb';
  return '#64748b';
}

/** Auto-names are "template · Channel · date"; list title shows the template part only. */
function campaignListTitle(name: string): string {
  const cleaned = name.replace(/\s·\s(?:WhatsApp|Email|Instagram)\s·\s.+$/i, '').trim();
  return cleaned || name;
}

function campaignProgressPct(sent: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (sent / total) * 100));
}

const LIST_EASE = [0.22, 1, 0.36, 1] as const;

/** Schedule times are entered/interpreted in whatever timezone the browser is set
 * to, with no indicator anywhere — silently wrong if a teammate opens the same
 * scheduled campaign from a different-timezone browser and re-saves without
 * touching the time fields. Computed once; a session's timezone doesn't change. */
const SCHEDULE_TIMEZONE_LABEL = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    return '';
  }
})();

function formatCampaignDateShort(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Match wallet rates for Marketing / Utility / Auth (API may send MARKETING). */
function waTemplateRateCc(category: string | undefined): { rate: number; label: string } {
  const key = (category ?? 'utility').trim().toUpperCase();
  if (key === 'MARKETING') return { rate: WALLET_CC_RATES.waMarketing, label: 'Marketing' };
  if (key === 'AUTHENTICATION') return { rate: WALLET_CC_RATES.waAuth, label: 'Authentication' };
  return { rate: WALLET_CC_RATES.waUtility, label: 'Utility' };
}

/** Mirrors backend shouldMeterWhatsApp — CC only when paymentMode is platform. */
function metersWhatsAppCc(paymentMode: 'self_pay' | 'platform' | null | undefined): boolean {
  return paymentMode === 'platform';
}

/** Mirrors backend usesPlatformEmailMetering for the workspace default provider. */
function metersEmailCc(defaultProvider: string | null | undefined): boolean {
  if (!defaultProvider) return true;
  return defaultProvider === 'CONVOSYNC_MANAGED' || defaultProvider === 'WABIZ_MANAGED';
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
}> = ({
  campaigns,
  loading,
  error,
  search,
  onSearchChange,
  onCreate,
  onRefresh,
  onOpenCampaign,
}) => {
  const reduceMotion = useReducedMotion();
  const [sortKey, setSortKey] = useState<CampaignListSortKey>('created');
  const [sortDir, setSortDir] = useState<CampaignListSortDir>('desc');
  const q = search.trim().toLowerCase();
  const filtered = campaigns.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.segmentLabel.toLowerCase().includes(q) ||
      c.channel.includes(q)
  );
  const displayed = sortCampaignsForList(filtered, sortKey, sortDir);

  const onSortHeader = (key: CampaignListSortKey) => {
    const next = nextCampaignListSort(sortKey, sortDir, key);
    setSortKey(next.key);
    setSortDir(next.dir);
  };

  // Summary from full loaded list (not search-filtered) so cards stay stable while typing.
  const stats = {
    total: campaigns.length,
    completed: campaigns.reduce((n, c) => n + (c.status === 'Completed' ? 1 : 0), 0),
    failed: campaigns.reduce((n, c) => n + (c.status === 'Failed' ? 1 : 0), 0),
    scheduled: campaigns.reduce((n, c) => n + (c.status === 'Scheduled' ? 1 : 0), 0),
  };

  const rowListVariants = {
    hidden: {},
    visible: {
      transition: reduceMotion ? { staggerChildren: 0 } : { staggerChildren: 0.035 },
    },
  };
  const rowItemVariants = {
    hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.28, ease: LIST_EASE },
    },
  };

  const statCells: Array<{ label: string; value: number; tone?: string }> = [
    { label: 'Total campaigns', value: stats.total },
    { label: 'Completed', value: stats.completed, tone: 'text-primary' },
    { label: 'Failed', value: stats.failed, tone: stats.failed > 0 ? 'text-red-700' : undefined },
    { label: 'Scheduled', value: stats.scheduled, tone: stats.scheduled > 0 ? 'text-amber-800' : undefined },
  ];

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto bg-white selection:bg-primary/15">
      <div className="w-full max-w-none space-y-4 px-3 py-4 sm:px-4 sm:py-5">
        {/* Header — title left, tools right */}
        <div className="relative overflow-hidden bg-white border border-swiss-line">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-primary" />
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-swiss-ink">
                <Megaphone className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                Campaigns
              </h2>
              <p className="mt-0.5 text-xs font-medium text-swiss-faint">
                Broadcast messages to your contacts on WhatsApp, Email, and Instagram.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <div className="relative min-w-[12rem] flex-1 sm:w-64 sm:flex-none">
                <label htmlFor="campaigns-search" className="sr-only">
                  Search campaigns
                </label>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-swiss-faint"
                  aria-hidden
                />
                <Input
                  id="campaigns-search"
                  type="search"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search campaigns…"
                  className="h-auto min-h-10 rounded-lg border-swiss-line bg-slate-50 py-2 pl-9 pr-3 text-sm font-semibold text-swiss-ink outline-none transition-colors duration-200 placeholder:text-slate-400 focus-visible:border-primary/40 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/15"
                />
              </div>
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 bg-white border border-swiss-line px-3 py-2 text-meta font-bold text-swiss-ink transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
                Refresh
              </button>
              <button
                type="button"
                onClick={onCreate}
                className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-meta font-bold text-white shadow-primary/15 transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden /> Create campaign
              </button>
            </div>
          </div>
        </div>

        {/* Summary metrics — derived from loaded list */}
        {!loading && (
          <div
            className="grid grid-cols-2 overflow-hidden bg-white border border-swiss-line sm:grid-cols-4 sm:divide-x sm:divide-y-0 divide-y divide-black/[0.04]"
            aria-label="Campaign summary"
          >
            {statCells.map((cell) => (
              <div key={cell.label} className="min-w-0 px-4 py-4 sm:px-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-swiss-faint">
                  {cell.label}
                </p>
                <p
                  className={`mt-1.5 text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums ${
                    cell.tone ?? 'text-swiss-ink'
                  }`}
                >
                  {cell.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p
            className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-bold text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-16 text-swiss-faint" aria-busy="true">
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-swiss-line bg-white px-6 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Megaphone className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-sm font-bold text-swiss-muted">
              {campaigns.length === 0 ? 'No campaigns yet' : 'No campaigns match your search'}
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs font-medium text-swiss-faint">
              {campaigns.length === 0
                ? 'Create your first broadcast to reach contacts with approved WhatsApp templates.'
                : 'Try a different search term.'}
            </p>
            {campaigns.length === 0 && (
              <button
                type="button"
                onClick={onCreate}
                className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors duration-200 hover:bg-primary-hover"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden /> Create campaign
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden bg-white border border-swiss-line">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left">
                <thead>
                  <tr className="border-b border-black/[0.04] bg-primary/[0.04]">
                    {(
                      [
                        { label: 'Campaign' },
                        { label: 'Channel' },
                        { label: 'Audience' },
                        { label: 'Tag' },
                        { label: 'Progress' },
                        { label: 'Status' },
                        { label: 'Created', sort: 'created' as const },
                        { label: 'When', sort: 'when' as const },
                      ] as const
                    ).map((col) => {
                      const sortable = 'sort' in col ? col.sort : undefined;
                      const active = sortable != null && sortKey === sortable;
                      const ariaSort = !sortable
                        ? undefined
                        : active
                          ? sortDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none';
                      return (
                        <th
                          key={col.label}
                          scope="col"
                          aria-sort={ariaSort}
                          className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-swiss-faint"
                        >
                          {sortable ? (
                            <button
                              type="button"
                              onClick={() => onSortHeader(sortable)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-md text-inherit transition-colors duration-150 hover:text-swiss-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                            >
                              {col.label}
                              {active ? (
                                sortDir === 'asc' ? (
                                  <ChevronUp className="h-3 w-3 shrink-0 text-primary" aria-hidden />
                                ) : (
                                  <ChevronDown className="h-3 w-3 shrink-0 text-primary" aria-hidden />
                                )
                              ) : null}
                            </button>
                          ) : (
                            col.label
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <motion.tbody
                  className="divide-y divide-black/[0.04]"
                  variants={rowListVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {displayed.map((campaign, rowIndex) => {
                    const ch = CAMPAIGN_CHANNELS.find((c) => c.id === campaign.channel);
                    const channelLabel = ch?.name ?? campaign.channel;
                    const statusMeta = CAMPAIGN_STATUS_ICON[campaign.status];
                    const StatusIcon = statusMeta.Icon;
                    const pct = campaignProgressPct(
                      campaign.sentCount,
                      campaign.totalRecipients
                    );
                    const accent = campaignProgressAccent(campaign.status);
                    const whenAt = campaignWhenAt(campaign);
                    return (
                      <motion.tr
                        key={campaign.id}
                        variants={rowItemVariants}
                        onClick={() => onOpenCampaign(campaign.id)}
                        className="cursor-pointer transition-colors duration-150 hover:bg-primary/[0.04]"
                      >
                        <td className="px-4 py-3 align-middle">
                          <p className="text-sm font-bold leading-snug text-swiss-ink">
                            {campaignListTitle(campaign.name)}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <span
                            className="inline-flex"
                            title={channelLabel}
                            aria-label={channelLabel}
                          >
                            <ChannelIcon channel={campaign.channel} size={18} />
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <p className="text-sm font-bold tabular-nums text-swiss-ink">
                            {campaign.totalRecipients.toLocaleString()} contacts
                          </p>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <p className="max-w-[12rem] truncate text-sm font-medium text-swiss-ink">
                            {campaignListTagLabel(campaign.segmentLabel)}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex min-w-[9rem] max-w-[12rem] items-center gap-2.5">
                            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-sm bg-black/[0.04]">
                              <motion.div
                                className="h-full origin-left rounded-sm"
                                style={{
                                  backgroundColor: accent,
                                  width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`,
                                }}
                                initial={reduceMotion ? false : { scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{
                                  delay: reduceMotion ? 0 : 0.06 + rowIndex * 0.03,
                                  duration: reduceMotion ? 0 : 0.45,
                                  ease: LIST_EASE,
                                }}
                                role="progressbar"
                                aria-valuenow={Math.round(pct)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`Sent ${campaign.sentCount} of ${campaign.totalRecipients}`}
                              />
                            </div>
                            <span className="shrink-0 text-xs font-semibold tabular-nums text-swiss-ink">
                              {campaign.sentCount.toLocaleString()}
                              <span className="font-medium text-swiss-faint">
                                /{campaign.totalRecipients.toLocaleString()}
                              </span>
                            </span>
                          </div>
                          {campaign.readCount > 0 && (
                            <p className="mt-1 text-[11px] font-medium text-swiss-faint">
                              {campaign.readCount.toLocaleString()} read
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <span
                            className={`inline-flex ${statusMeta.className}`}
                            title={campaign.status}
                            aria-label={campaign.status}
                          >
                            <StatusIcon className="h-4 w-4" aria-hidden />
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <p className="text-meta font-bold tabular-nums text-swiss-ink">
                            {formatCampaignDateShort(campaign.createdAt)}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {whenAt ? (
                            <p
                              className={`text-meta font-bold tabular-nums ${
                                campaign.status === 'Scheduled' && campaign.scheduledAt
                                  ? 'text-amber-800'
                                  : 'text-swiss-ink'
                              }`}
                            >
                              {formatCampaignDate(whenAt)}
                            </p>
                          ) : (
                            <p className="text-meta font-medium text-swiss-faint">—</p>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main CampaignsView ────────────────────────────────────
const CampaignsWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [viewMode, setViewMode] = useState<CampaignViewMode>('list');
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [listSearch, setListSearch] = useState('');
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState('');
  /** When set, audience/template loaders apply this seed instead of first-item defaults. */
  const pendingEditSeedRef = useRef<ScheduledWizardSeed | null>(null);
  const skipHeaderResetRef = useRef(false);
  const editLoadSeqRef = useRef(0);
  // Synchronous guard — `launching` state alone can't block a fast double-click
  // firing this handler twice before React commits the disabled state.
  const launchingRef = useRef(false);
  // If createCampaign succeeds but the immediate sendCampaign call that
  // follows it fails, this remembers the created campaign so a retry resumes
  // sending it instead of calling createCampaign again and duplicating it.
  const pendingSendCampaignIdRef = useRef<string | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState<CampaignChannel>('whatsapp');

  const [selectedAudienceType, setSelectedAudienceType] = useState('segment');
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([]);
  const [tagQuery, setTagQuery] = useState('');
  const [audienceData, setAudienceData] = useState<CampaignAudienceResponse | null>(null);
  const [audienceLoading, setAudienceLoading] = useState(true);
  const [audienceError, setAudienceError] = useState<string | null>(null);

  const [audienceContacts, setAudienceContacts] = useState<AudienceContactRow[]>([]);
  const [audienceContactsTotal, setAudienceContactsTotal] = useState(0);
  const [audienceContactsTruncated, setAudienceContactsTruncated] = useState(false);
  const [audienceContactsLoading, setAudienceContactsLoading] = useState(false);
  const [audienceContactsError, setAudienceContactsError] = useState<string | null>(null);

  /** WhatsApp: only `platform` meters CC. Email: platform-managed default. IG: always. */
  const [waPaymentMode, setWaPaymentMode] = useState<'self_pay' | 'platform' | null>(null);
  const [emailDefaultProvider, setEmailDefaultProvider] = useState<string | null>(null);

  const activeAudienceSegmentIds =
    selectedAudienceType === 'all' ? ['all'] : selectedSegmentIds;
  const activeAudienceSegmentKey = activeAudienceSegmentIds.join('\0');

  const activeAudienceSegmentLabel = () => {
    if (selectedAudienceType === 'all') {
      return `All ${CAMPAIGN_CHANNELS.find((c) => c.id === selectedChannel)?.name ?? 'channel'} contacts`;
    }
    const names = selectedSegmentIds
      .map((id) => audienceData?.segments.find((s) => s.id === id)?.name)
      .filter((n): n is string => !!n);
    if (names.length === 0) return 'No tags selected';
    if (names.length === 1) return `Tag: ${names[0]}`;
    if (names.length <= 3) return `Tags: ${names.join(', ')}`;
    return `${names.length} tags · ${audienceContactsTotal.toLocaleString()} contacts`;
  };

  const toggleAudienceTag = (segmentId: string) => {
    setSelectedSegmentIds((prev) =>
      prev.includes(segmentId) ? prev.filter((id) => id !== segmentId) : [...prev, segmentId]
    );
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

  const clearHeaderMediaOverride = useCallback(() => {
    setHeaderMediaStorageKey(null);
    setHeaderMediaMimeType(null);
    setHeaderMediaFileName(null);
    setHeaderMediaAssetId(null);
    setHeaderMediaPreviewUrl((prev) => {
      if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return '';
    });
    setHeaderMediaError(null);
    setGalleryPickerOpen(false);
  }, []);

  const resetWizard = useCallback(() => {
    editLoadSeqRef.current += 1;
    pendingEditSeedRef.current = null;
    skipHeaderResetRef.current = false;
    launchingRef.current = false;
    pendingSendCampaignIdRef.current = null;
    setEditingCampaignId(null);
    setCampaignName('');
    setCurrentStep(0);
    setSelectedChannel('whatsapp');
    setSelectedAudienceType('segment');
    setSelectedSegmentIds([]);
    setTagQuery('');
    setSelectedTemplateName('');
    setSelectedEmailTemplateId('');
    setVariableMappings({});
    setEmailVariableMappings({});
    clearHeaderMediaOverride();
    setHeaderMediaUploading(false);
    setIgConfig(DEFAULT_INSTIGRAM_CONFIG);
    setIsScheduled(false);
    const next = defaultScheduleLocal();
    setScheduledDate(next.date);
    setScheduledTime(next.time);
    setCampaignLaunched(false);
    setLaunching(false);
    setLaunchError(null);
    setLaunchResult(null);
    setLastCreatedCampaignId(null);
    setWaPaymentMode(null);
    setEmailDefaultProvider(null);
  }, [clearHeaderMediaOverride]);

  const openCreateWizard = () => {
    resetWizard();
    setViewMode('create');
    if (!isNewCampaignPath(location.pathname)) {
      navigate(pathForNewCampaign());
    }
  };

  // Header media is seeded twice: immediately for a template already known
  // (applyEditSeedToWizard) and again once the async template list resolves
  // and confirms the match (the whatsapp-templates effect below) — same
  // fields either way.
  const applySeedHeaderMedia = useCallback((seed: ScheduledWizardSeed) => {
    if (!seed.headerMediaStorageKey && !seed.headerMediaAssetId) return;
    setHeaderMediaStorageKey(seed.headerMediaStorageKey);
    setHeaderMediaMimeType(seed.headerMediaMimeType);
    setHeaderMediaFileName(seed.headerMediaFileName);
    setHeaderMediaAssetId(seed.headerMediaAssetId);
    if (seed.headerMediaStorageKey) {
      setHeaderMediaPreviewUrl(api.templateHeaderMediaUrl(seed.headerMediaStorageKey));
    }
  }, []);

  const applyEditSeedToWizard = useCallback((seed: ScheduledWizardSeed) => {
    pendingEditSeedRef.current = seed;
    skipHeaderResetRef.current = true;
    setCampaignName(seed.name);
    setSelectedChannel(seed.channel);
    setSelectedAudienceType(seed.audienceType);
    setSelectedSegmentIds(seed.segmentIds);
    setIsScheduled(true);
    const local = isoToLocalDateTime(seed.scheduledAt);
    setScheduledDate(local.date);
    setScheduledTime(local.time);
    setCurrentStep(1);
    if (seed.channel === 'whatsapp' && seed.templateName) {
      setSelectedTemplateName(seed.templateName);
      setVariableMappings({ ...seed.variableMappings });
    }
    if (seed.channel === 'email' && seed.templateId) {
      setSelectedEmailTemplateId(seed.templateId);
      setEmailVariableMappings({ ...seed.variableMappings });
    }
    applySeedHeaderMedia(seed);
  }, [applySeedHeaderMedia]);

  const openEditWizard = useCallback(
    async (campaignId: string) => {
      resetWizard();
      const seq = ++editLoadSeqRef.current;
      setEditingCampaignId(campaignId);
      setViewMode('create');
      setLaunching(true);
      // Detail handoff uses location.state; list edit stays in this workspace (no state).
      if (!isNewCampaignPath(location.pathname)) {
        navigate(pathForNewCampaign());
      }
      try {
        const raw = (await api.getCampaign(campaignId)) as Record<string, unknown>;
        if (seq !== editLoadSeqRef.current) return;
        const detail = mapCampaignDetailFromApi(raw);
        if (!isScheduledCampaignEditable(detail.status, detail.scheduledAt)) {
          setLaunchError(SCHEDULED_CAMPAIGN_EDIT_BLOCKED_HINT);
          setLaunching(false);
          return;
        }
        const seed = wizardSeedFromCampaignDetail(detail);
        if (!seed) {
          setLaunchError('Campaign has no schedule to edit.');
          setLaunching(false);
          return;
        }
        applyEditSeedToWizard(seed);
        setEditingCampaignId(campaignId);
        setLaunchError(null);
      } catch (err) {
        if (seq !== editLoadSeqRef.current) return;
        setLaunchError(err instanceof Error ? err.message : 'Failed to load campaign for edit');
      } finally {
        if (seq === editLoadSeqRef.current) setLaunching(false);
      }
    },
    [applyEditSeedToWizard, location.pathname, navigate, resetWizard]
  );

  const backToList = () => {
    resetWizard();
    setViewMode('list');
    loadCampaigns();
    if (isNewCampaignPath(location.pathname)) {
      navigate(pathForTab('campaigns'), { replace: true });
    }
  };

  useEffect(() => {
    const state = location.state as { editCampaignId?: string } | null;
    if (state?.editCampaignId) {
      navigate(location.pathname, { replace: true, state: {} });
      void openEditWizard(state.editCampaignId);
      return;
    }
    if (isNewCampaignPath(location.pathname) && viewMode !== 'create') {
      resetWizard();
      setViewMode('create');
    }
  }, [location.pathname, location.state, viewMode, resetWizard, openEditWizard, navigate]);

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
        const seed = pendingEditSeedRef.current;
        if (seed && seed.channel === selectedChannel) {
          setSelectedAudienceType(seed.audienceType);
          setSelectedSegmentIds(seed.segmentIds);
          return;
        }
        const tagSegments = data.segments.filter((s) => s.id !== 'all');
        if (tagSegments.length > 0) {
          setSelectedSegmentIds([tagSegments[0].id]);
          setSelectedAudienceType('segment');
        } else {
          setSelectedSegmentIds([]);
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

    if (selectedChannel === 'whatsapp') {
      api
        .getWhatsAppPaymentMode()
        .then((res) => {
          if (!cancelled) setWaPaymentMode(res.paymentMode ?? null);
        })
        .catch(() => {
          if (!cancelled) setWaPaymentMode(null);
        });
    } else if (selectedChannel === 'email') {
      api
        .getEmailProviders()
        .then((raw) => {
          if (cancelled) return;
          const rows = (raw as { provider?: string; isDefault?: boolean }[]) ?? [];
          const def = rows.find((p) => p.isDefault) ?? rows[0];
          setEmailDefaultProvider(def?.provider ?? null);
        })
        .catch(() => {
          if (!cancelled) setEmailDefaultProvider(null);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [selectedChannel, viewMode]);

  useEffect(() => {
    if (viewMode !== 'create') return;
    let cancelled = false;

    if (selectedAudienceType === 'segment' && selectedSegmentIds.length === 0) {
      setAudienceContacts([]);
      setAudienceContactsTotal(0);
      setAudienceContactsTruncated(false);
      setAudienceContactsError(null);
      setAudienceContactsLoading(false);
      return;
    }

    setAudienceContactsLoading(true);
    setAudienceContactsError(null);

    const segmentIds =
      selectedAudienceType === 'all' ? ['all'] : selectedSegmentIds;

    api
      .getCampaignAudienceContacts(selectedChannel, segmentIds)
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
  }, [selectedChannel, activeAudienceSegmentKey, selectedAudienceType, selectedSegmentIds, viewMode]);

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
        const seed = pendingEditSeedRef.current;
        if (seed?.channel === 'whatsapp') {
          const match =
            mapped.find((t) => seed.templateId && t.id === seed.templateId) ??
            mapped.find((t) => seed.templateName && t.name === seed.templateName) ??
            null;
          if (match) {
            skipHeaderResetRef.current = true;
            setSelectedTemplateName(match.name);
            setVariableMappings({ ...seed.variableMappings });
            applySeedHeaderMedia(seed);
          }
          return;
        }
        if (mapped[0]) {
          setSelectedTemplateName(mapped[0].name);
          setVariableMappings((prev) => defaultWaVariableMappings(mapped[0].variables, prev));
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
  }, [viewMode, applySeedHeaderMedia]);

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
        const seed = pendingEditSeedRef.current;
        if (seed?.channel === 'email') {
          const match =
            mapped.find((t) => seed.templateId && t.id === seed.templateId) ?? mapped[0] ?? null;
          if (match?.id) {
            setSelectedEmailTemplateId(match.id);
            setEmailVariableMappings(() => {
              const next: Record<string, string> = {};
              for (const v of match.variables) {
                if (!CONTACT_AUTO_EMAIL_VARIABLES.has(v)) {
                  next[v] = seed.variableMappings[v] ?? '';
                }
              }
              return next;
            });
          }
          return;
        }
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
  const [headerMediaStorageKey, setHeaderMediaStorageKey] = useState<string | null>(null);
  const [headerMediaMimeType, setHeaderMediaMimeType] = useState<string | null>(null);
  const [headerMediaFileName, setHeaderMediaFileName] = useState<string | null>(null);
  const [headerMediaAssetId, setHeaderMediaAssetId] = useState<string | null>(null);
  const [headerMediaPreviewUrl, setHeaderMediaPreviewUrl] = useState('');
  const [headerMediaUploading, setHeaderMediaUploading] = useState(false);
  const [headerMediaError, setHeaderMediaError] = useState<string | null>(null);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  const [headerMediaEditOpen, setHeaderMediaEditOpen] = useState(false);
  const headerMediaInputRef = useRef<HTMLInputElement>(null);
  const headerMediaEditRef = useRef<HTMLDivElement>(null);

  const [igConfig, setIgConfig] = useState(DEFAULT_INSTIGRAM_CONFIG);

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(() => defaultScheduleLocal().date);
  const [scheduledTime, setScheduledTime] = useState(() => defaultScheduleLocal().time);
  const [campaignLaunched, setCampaignLaunched] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const sendConfirmedRef = useRef(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [launchResult, setLaunchResult] = useState<{
    sentCount: number;
    totalRecipients: number;
    scheduled?: boolean;
  } | null>(null);
  const [lastCreatedCampaignId, setLastCreatedCampaignId] = useState<string | null>(null);

  const activeTemplate = templates.find((t) => t.name === selectedTemplateName) ?? templates[0] ?? null;
  const activeEmailTemplate =
    emailTemplates.find((t) => t.id === selectedEmailTemplateId) ?? emailTemplates[0] ?? null;

  const waHeaderFormat = activeTemplate
    ? headerFormatFromApi(activeTemplate.headerFormat, Boolean(activeTemplate.header))
    : 'none';
  const requiresHeaderMedia = isMediaHeaderFormat(waHeaderFormat);
  const templateDefaultMediaUrl =
    activeTemplate?.headerMediaStorageKey
      ? api.templateHeaderMediaUrl(activeTemplate.headerMediaStorageKey)
      : '';
  const hasHeaderMediaReady =
    !requiresHeaderMedia ||
    Boolean(
      headerMediaStorageKey ||
        headerMediaAssetId ||
        activeTemplate?.headerMediaStorageKey
    );
  const effectiveHeaderMediaPreview =
    headerMediaPreviewUrl || (requiresHeaderMedia ? templateDefaultMediaUrl : '');
  const hasHeaderMediaPreview = Boolean(effectiveHeaderMediaPreview);

  useEffect(() => {
    // Reset campaign override when template changes; keep template sample preview.
    if (skipHeaderResetRef.current) {
      skipHeaderResetRef.current = false;
      return;
    }
    clearHeaderMediaOverride();
    setHeaderMediaEditOpen(false);
    if (
      activeTemplate &&
      isMediaHeaderFormat(
        headerFormatFromApi(activeTemplate.headerFormat, Boolean(activeTemplate.header))
      ) &&
      activeTemplate.headerMediaStorageKey
    ) {
      setHeaderMediaPreviewUrl(api.templateHeaderMediaUrl(activeTemplate.headerMediaStorageKey));
    }
  }, [activeTemplate?.id, clearHeaderMediaOverride]);

  useEffect(() => {
    if (!headerMediaEditOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!headerMediaEditRef.current?.contains(e.target as Node)) {
        setHeaderMediaEditOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHeaderMediaEditOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [headerMediaEditOpen]);

  const allContactsCount = audienceData?.total ?? 0;
  const taggedSegments = (audienceData?.segments ?? []).filter((s) => s.id !== 'all');
  const tagQueryNormalized = tagQuery.trim().toLowerCase();
  const filteredTaggedSegments = tagQueryNormalized
    ? taggedSegments.filter((s) => s.name.toLowerCase().includes(tagQueryNormalized))
    : taggedSegments;

  const audienceCount = () => {
    if (audienceLoading) return 0;
    if (selectedAudienceType === 'all') return allContactsCount;
    if (selectedSegmentIds.length === 0) return 0;
    // Single tag: chip count is exact. Multi: must use live union total (deduped).
    if (selectedSegmentIds.length === 1 && audienceContactsLoading) {
      return audienceData?.segments.find((s) => s.id === selectedSegmentIds[0])?.count ?? 0;
    }
    // Multi-tag mid-fetch: audienceContactsTotal is still the PREVIOUS
    // selection's total — the union fetch for the current selection hasn't
    // resolved yet. Falling through to it showed a stale contact count and
    // cost estimate for the instant a new tag was added/removed.
    if (selectedSegmentIds.length > 1 && audienceContactsLoading) return 0;
    return audienceContactsTotal;
  };

  const showsCcCostEstimate = () => {
    if (selectedChannel === 'whatsapp') return metersWhatsAppCc(waPaymentMode);
    if (selectedChannel === 'email') return metersEmailCc(emailDefaultProvider);
    return true;
  };

  const estimatedCostCc = () => {
    if (!showsCcCostEstimate()) return 0;
    const n = audienceCount();
    if (selectedChannel === 'whatsapp') {
      return Math.round(n * waTemplateRateCc(activeTemplate?.category).rate * 100) / 100;
    }
    if (selectedChannel === 'email') return Math.round(n * WALLET_CC_RATES.email * 100) / 100;
    if (selectedChannel === 'instagram') return Math.round(n * WALLET_CC_RATES.instagram * 100) / 100;
    return 0;
  };

  const estimatedCostRateLabel = () => {
    if (!showsCcCostEstimate()) return '';
    if (selectedChannel === 'whatsapp') {
      const { rate, label } = waTemplateRateCc(activeTemplate?.category);
      return `${rate} CC / conversation · ${label}`;
    }
    if (selectedChannel === 'email') return `${WALLET_CC_RATES.email} CC / send`;
    if (selectedChannel === 'instagram') return `${WALLET_CC_RATES.instagram} CC / message`;
    return '';
  };

  const estimatedCost = () => formatCc(estimatedCostCc());

  const STEPS = ['Channel', 'Audience', 'Message', 'Review'];
  const totalSteps = 4;
  const chConfig = CAMPAIGN_CHANNELS.find((c) => c.id === selectedChannel)!;

  const getRenderedWABody = () => {
    if (!activeTemplate) return '';
    let text = activeTemplate.bodyPattern;
    activeTemplate.variables.forEach((v, i) => {
      const mapped = variableMappings[v]?.trim() || '';
      const sample =
        WA_PREVIEW_SAMPLES[mapped] ||
        (mapped.includes('{{') ? 'Alex' : mapped) ||
        `[${v}]`;
      text = text.replace(`{{${i + 1}}}`, sample);
    });
    return text;
  };
  // Form-primary + tight preview rail. Avoids narrow-form / empty-stage islands on xl+.
  const formPrimaryLayout = currentStep >= 1;
  // Remount preview chrome on template/media change only — body text updates in place.
  const waPreviewKey = [
    selectedTemplateName,
    waHeaderFormat,
    effectiveHeaderMediaPreview || '',
    headerMediaFileName || '',
  ].join('|');

  const handleHeaderMediaUpload = async (file: File | null) => {
    if (!file || !requiresHeaderMedia) return;
    setHeaderMediaError(null);
    setHeaderMediaUploading(true);
    try {
      const res = await api.uploadTemplateHeaderMedia(file, { persistOnly: true });
      setHeaderMediaAssetId(null);
      setHeaderMediaStorageKey(res.headerMediaStorageKey);
      setHeaderMediaMimeType(res.headerMediaMimeType);
      setHeaderMediaFileName(res.headerMediaFileName || file.name);
      setHeaderMediaPreviewUrl((prev) => {
        if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
    } catch (err) {
      setHeaderMediaError(err instanceof Error ? err.message : 'Failed to upload header media');
    } finally {
      setHeaderMediaUploading(false);
    }
  };

  const handleGalleryHeaderPick = (picked: PickedGalleryImage) => {
    setHeaderMediaError(null);
    setHeaderMediaStorageKey(null);
    setHeaderMediaMimeType(null);
    setHeaderMediaAssetId(picked.id);
    setHeaderMediaFileName(picked.filename || picked.title);
    setHeaderMediaPreviewUrl((prev) => {
      if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return picked.url;
    });
    setGalleryPickerOpen(false);
  };

  const useTemplateSampleMedia = () => {
    setHeaderMediaStorageKey(null);
    setHeaderMediaMimeType(null);
    setHeaderMediaAssetId(null);
    setHeaderMediaFileName(activeTemplate?.headerMediaFileName ?? null);
    setHeaderMediaPreviewUrl((prev) => {
      if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return templateDefaultMediaUrl;
    });
    setHeaderMediaError(null);
  };

  const handleWizardNext = () => {
    if (currentStep === 1) {
      if (selectedAudienceType === 'segment' && selectedSegmentIds.length === 0) {
        setLaunchError('Select at least one tag for the campaign audience.');
        return;
      }
      if (audienceCount() === 0) {
        setLaunchError('Your audience is empty. Add contacts or choose a different segment.');
        return;
      }
      setLaunchError(null);
    }
    if (currentStep === 2 && selectedChannel === 'whatsapp') {
      if (!activeTemplate?.id) {
        setLaunchError('Select an approved WhatsApp template before continuing.');
        return;
      }
      if (activeTemplate.variables.some((v) => !variableMappings[v]?.trim())) {
        setLaunchError('Fill in all template variables before continuing.');
        return;
      }
      if (requiresHeaderMedia && !hasHeaderMediaReady) {
        setLaunchError(
          `This template needs a ${waHeaderFormat} header. Upload media or pick from the gallery.`
        );
        return;
      }
      setLaunchError(null);
    }
    setCurrentStep((p) => Math.min(totalSteps - 1, p + 1));
  };

  const handleLaunchCampaign = async () => {
    // Synchronous check-and-set — blocks a fast double-click/double-fire that
    // would otherwise slip through before the `launching` state re-render
    // lands and the button actually becomes disabled. For a bulk broadcast a
    // slipped-through second call means messaging the whole audience twice.
    if (launchingRef.current) return;
    launchingRef.current = true;
    // Validation failures return before setLaunching(true)'s try/finally
    // below, so they need their own explicit reset of the guard.
    const fail = (msg: string) => {
      setLaunchError(msg);
      launchingRef.current = false;
    };
    setLaunchError(null);
    const isEditing = Boolean(editingCampaignId);

    if (selectedChannel === 'instagram') {
      return fail('Instagram campaigns are preview-only right now. Use WhatsApp or Email to send.');
    }

    if (selectedAudienceType === 'segment' && selectedSegmentIds.length === 0) {
      return fail('Select at least one tag for the campaign audience.');
    }
    if (audienceCount() === 0) {
      return fail('Your audience is empty. Add contacts or choose a different segment.');
    }

    // Edit must stay scheduled — no immediate send / duplicate create.
    const mustSchedule = isEditing || isScheduled;

    // Sending now is irreversible (unlike a scheduled send, which can be
    // cancelled) — require an explicit confirmation before it fires.
    if (!mustSchedule && !sendConfirmedRef.current) {
      launchingRef.current = false;
      setShowSendConfirm(true);
      return;
    }

    let scheduledAtIso: string | undefined;
    if (mustSchedule) {
      try {
        scheduledAtIso = localDateTimeToIso(scheduledDate, scheduledTime);
      } catch {
        return fail('Pick a valid schedule date and time.');
      }
      if (new Date(scheduledAtIso).getTime() <= Date.now() + 30_000) {
        return fail('Schedule time must be at least 30 seconds in the future.');
      }
    }

    let templateId: string | undefined;
    let resolvedName: string;
    let mappings: Record<string, string>;

    if (selectedChannel === 'whatsapp') {
      if (!activeTemplate?.id) {
        return fail('Select an approved WhatsApp template before launching.');
      }
      if (activeTemplate.variables.some((v) => !variableMappings[v]?.trim())) {
        return fail('Fill in all template variables before launching.');
      }
      if (requiresHeaderMedia && !hasHeaderMediaReady) {
        return fail(
          `This template needs a ${waHeaderFormat} header. Upload media or pick from the gallery before launching.`
        );
      }
      templateId = activeTemplate.id;
      resolvedName =
        campaignName.trim() ||
        `${activeTemplate.name} · ${chConfig.name} · ${new Date().toLocaleDateString()}`;
      mappings = variableMappings;
    } else if (selectedChannel === 'email') {
      if (!activeEmailTemplate?.id) {
        return fail('Select an active email template before launching.');
      }
      const manualVars = activeEmailTemplate.variables.filter((v) => !CONTACT_AUTO_EMAIL_VARIABLES.has(v));
      if (manualVars.some((v) => !emailVariableMappings[v]?.trim())) {
        return fail('Fill in all campaign template variables before launching.');
      }
      templateId = activeEmailTemplate.id;
      resolvedName =
        campaignName.trim() ||
        `${activeEmailTemplate.name} · ${chConfig.name} · ${new Date().toLocaleDateString()}`;
      mappings = emailVariableMappings;
    } else {
      return fail('This channel is not supported for sending yet.');
    }

    const segmentIds = selectedAudienceType === 'all' ? ['all'] : selectedSegmentIds;

    setLaunching(true);
    try {
      const headerMediaFilter =
        selectedChannel === 'whatsapp' && requiresHeaderMedia
          ? {
              ...(headerMediaStorageKey
                ? {
                    headerMediaStorageKey,
                    headerMediaMimeType: headerMediaMimeType || undefined,
                    headerMediaFileName: headerMediaFileName || undefined,
                  }
                : {}),
              ...(headerMediaAssetId
                ? {
                    headerMediaAssetId,
                    headerMediaFileName: headerMediaFileName || undefined,
                  }
                : {}),
            }
          : {};

      const audiencePayload = {
        channel: selectedChannel,
        segmentId: segmentIds[0] ?? 'all',
        segmentIds,
        variableMappings: mappings,
        ...headerMediaFilter,
      };

      if (isEditing && editingCampaignId && scheduledAtIso) {
        await api.updateCampaign(editingCampaignId, {
          name: resolvedName,
          templateId,
          channel: selectedChannel,
          audienceType: selectedAudienceType === 'all' ? 'all' : 'segment',
          audienceFilter: audiencePayload,
          scheduledAt: scheduledAtIso,
        });
        pendingEditSeedRef.current = null;
        setLaunchResult({
          sentCount: 0,
          totalRecipients: audienceCount(),
          scheduled: true,
        });
        setLastCreatedCampaignId(editingCampaignId);
        setCampaignLaunched(true);
        loadCampaigns();
        return;
      }

      // A prior attempt may have already created this campaign and only
      // failed on the sendCampaign call after it — resume sending that same
      // campaign instead of calling createCampaign again and duplicating it.
      let created: { id: string; status?: string };
      if (pendingSendCampaignIdRef.current) {
        created = { id: pendingSendCampaignIdRef.current };
      } else {
        created = (await api.createCampaign({
          name: resolvedName,
          templateId,
          channel: selectedChannel,
          audienceType: selectedAudienceType === 'all' ? 'all' : 'segment',
          audienceFilter: audiencePayload,
          ...(scheduledAtIso ? { scheduledAt: scheduledAtIso } : {}),
        })) as { id: string; status?: string };
      }

      if (scheduledAtIso || created.status === 'scheduled') {
        setLaunchResult({
          sentCount: 0,
          totalRecipients: audienceCount(),
          scheduled: true,
        });
        setLastCreatedCampaignId(created.id);
        setCampaignLaunched(true);
        loadCampaigns();
        return;
      }

      pendingSendCampaignIdRef.current = created.id;
      const result = (await api.sendCampaign(created.id)) as {
        sentCount?: number;
        totalRecipients?: number;
      };
      pendingSendCampaignIdRef.current = null;

      setLaunchResult({
        sentCount: result.sentCount ?? 0,
        totalRecipients: result.totalRecipients ?? audienceCount(),
        scheduled: false,
      });
      setLastCreatedCampaignId(created.id);
      setCampaignLaunched(true);
      loadCampaigns();
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : parseApiError(String(err)));
    } finally {
      setLaunching(false);
      launchingRef.current = false;
      sendConfirmedRef.current = false;
    }
  };

  const confirmSendNow = () => {
    setShowSendConfirm(false);
    sendConfirmedRef.current = true;
    handleLaunchCampaign();
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

  const isEditingScheduled = Boolean(editingCampaignId);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white selection:bg-primary/15">
      <div className="shrink-0 border-b border-swiss-line bg-white px-4 py-3 md:px-6">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <button
            type="button"
            onClick={backToList}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-swiss-line px-2.5 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-surface-muted"
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
                        ? 'bg-primary text-white'
                        : currentStep === i
                          ? 'bg-primary text-white ring-4 ring-primary/10'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {currentStep > i ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span
                    className={`hidden shrink-0 text-sm font-semibold md:inline ${
                      currentStep === i ? 'text-primary' : currentStep > i ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-0.5 h-px w-4 shrink-0 md:w-8 ${currentStep > i ? 'bg-primary/30' : 'bg-slate-200'}`}
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
      <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-swiss-line bg-white xl:border-r">
        <div
          className={`min-h-0 flex-1 px-4 py-5 text-left md:px-8 md:py-6 ${
            formPrimaryLayout ? 'w-full' : 'max-w-2xl'
          } ${
            currentStep === 1 && selectedAudienceType === 'segment'
              ? 'flex flex-col overflow-hidden'
              : 'overflow-y-auto'
          }`}
        >
          {campaignLaunched ? (
            <div className="bg-white ring-1 ring-swiss-line p-8 rounded-2xl shadow-xl flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center border-4 border-primary/15">
                <CheckCheck className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-swiss-ink text-base">
                  {isEditingScheduled
                    ? 'Campaign Updated!'
                    : launchResult?.scheduled
                      ? 'Campaign Scheduled!'
                      : 'Campaign Sent!'}
                </h4>
                <p className="text-xs text-swiss-faint mt-1">
                  {launchResult?.scheduled
                    ? `Will send to ${launchResult.totalRecipients.toLocaleString()} contacts on ${scheduledDate} at ${scheduledTime}.`
                    : launchResult
                      ? `${launchResult.sentCount.toLocaleString()} of ${launchResult.totalRecipients.toLocaleString()} messages sent.`
                      : 'Broadcast completed.'}
                </p>
              </div>
              <div className="w-full bg-slate-50 p-4 rounded-xl border border-swiss-line divide-y divide-gray-100">
                {[
                  ['Channel', chConfig.name],
                  ['Audience', `${audienceCount().toLocaleString()} contacts`],
                  ...(showsCcCostEstimate()
                    ? [['Estimated Cost', estimatedCost()] as const]
                    : []),
                  [
                    'Timing',
                    isScheduled || isEditingScheduled
                      ? `${scheduledDate} ${scheduledTime}`
                      : 'Immediately',
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 text-sm font-bold">
                    <span className="text-swiss-faint">{k}</span>
                    <span className="text-swiss-ink font-mono">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                <button
                  type="button"
                  onClick={backToList}
                  className="px-6 py-2 bg-white hover:bg-gray-50 border border-swiss-line text-swiss-ink text-sm font-bold rounded-xl"
                >
                  Back to campaigns
                </button>
                {lastCreatedCampaignId && (
                  <button
                    type="button"
                    onClick={() => navigate(pathForCampaign(lastCreatedCampaignId))}
                    className="px-6 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl"
                  >
                    View insights
                  </button>
                )}
                {!isEditingScheduled && (
                  <button
                    type="button"
                    onClick={() => resetWizard()}
                    className="px-6 py-2 bg-white hover:bg-gray-50 border border-swiss-line text-swiss-ink text-sm font-bold rounded-xl"
                  >
                    Create another
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-swiss-ink text-sm">Select Channel</h3>
                    <p className="text-xs text-swiss-faint mt-0.5">
                      {isEditingScheduled
                        ? 'Channel is locked for scheduled campaigns.'
                        : 'Choose which channel to send your campaign through.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {SELECTABLE_CAMPAIGN_CHANNELS.map((ch) => {
                      const selected = selectedChannel === ch.id;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          disabled={isEditingScheduled && !selected}
                          onClick={() => {
                            if (!isEditingScheduled) setSelectedChannel(ch.id);
                          }}
                          className={`relative flex min-h-[168px] flex-col rounded-2xl border-2 p-4 text-left transition-all ${
                            selected
                              ? ''
                              : 'border-swiss-line bg-white hover:border-black/10 '
                          } ${isEditingScheduled && !selected ? 'cursor-not-allowed opacity-45' : ''}`}
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
                            style={{ background: selected ? '#fff' : ch.bgColor }}
                          >
                            <ChannelIcon channel={ch.id} size={22} />
                          </div>
                          <p className="pr-6 text-sm font-bold text-swiss-ink">{ch.name}</p>
                          <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-swiss-muted">
                            {ch.description}
                          </p>
                          <span
                            className="mt-3 inline-flex w-fit rounded-lg px-2 py-0.5 text-[11px] font-semibold"
                            style={{
                              background: selected ? '#fff' : ch.bgColor,
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
                <div
                  className={
                    selectedAudienceType === 'segment'
                      ? 'flex min-h-0 flex-1 flex-col gap-4'
                      : 'space-y-4'
                  }
                >
                  {audienceError && (
                    <p className="shrink-0 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                      {audienceError}
                    </p>
                  )}

                  <div className="grid shrink-0 grid-cols-1 gap-3 select-none sm:grid-cols-2">
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
                        desc: 'Pick one or more tags from your workspace contacts',
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
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => {
                            setSelectedAudienceType(opt.type);
                            if (
                              opt.type === 'segment' &&
                              selectedSegmentIds.length === 0 &&
                              taggedSegments.length > 0
                            ) {
                              setSelectedSegmentIds([taggedSegments[0].id]);
                            }
                          }}
                          className={`rounded-xl bg-white p-4 text-left transition-all ${
                            selected
                              ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface'
                              : 'ring-1 ring-swiss-line hover:ring-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900">{opt.title}</p>
                                <p className="mt-0.5 text-xs text-slate-500">{opt.desc}</p>
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <span className="rounded-md border border-swiss-line bg-slate-50 px-2 py-0.5 font-mono text-xs font-medium text-slate-600">
                                {opt.count}
                              </span>
                              <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                  selected
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {selected && <Check className="h-3 w-3" />}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {!audienceLoading && (audienceData?.excludedCount ?? 0) > 0 && (
                    <p className="shrink-0 text-xs font-medium text-slate-400">
                      {audienceData?.excludedCount} contact
                      {audienceData?.excludedCount === 1 ? '' : 's'} excluded automatically
                      (unsubscribed or blocked) — not counted above.
                    </p>
                  )}

                  <AnimatePresence initial={false}>
                    {selectedAudienceType === 'segment' && (
                      <motion.div
                        key="tag-picker"
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.2,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="flex min-h-0 flex-1 flex-col bg-white border border-swiss-line"
                      >
                        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                              Tags
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              Select tags for this campaign (union of matching contacts)
                            </p>
                          </div>
                          {taggedSegments.length > 0 && (
                            <div className="relative w-full sm:w-56">
                              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                              <Input
                                type="search"
                                value={tagQuery}
                                onChange={(e) => setTagQuery(e.target.value)}
                                placeholder="Search tags…"
                                className="h-auto rounded-lg border-swiss-line bg-slate-50 py-2 pl-8 pr-3 text-sm text-slate-800 outline-none ring-primary/20 placeholder:text-slate-400 focus-visible:border-primary/40 focus-visible:bg-white focus-visible:ring-2"
                              />
                            </div>
                          )}
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto p-4">
                          {audienceLoading ? (
                            <p className="text-xs font-medium text-slate-400">Loading tags…</p>
                          ) : taggedSegments.length === 0 ? (
                            <p className="rounded-lg border border-swiss-line bg-slate-50 px-3 py-2 text-xs text-slate-500">
                              No tags on your contacts yet. Add tags from Contacts or use &quot;All
                              contacts&quot;.
                            </p>
                          ) : filteredTaggedSegments.length === 0 ? (
                            <p className="rounded-lg border border-swiss-line bg-slate-50 px-3 py-2 text-xs text-slate-500">
                              No tags match &quot;{tagQuery.trim()}&quot;.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {filteredTaggedSegments.map((segment) => {
                                const tagSelected = selectedSegmentIds.includes(segment.id);
                                return (
                                  <button
                                    key={segment.id}
                                    type="button"
                                    onClick={() => toggleAudienceTag(segment.id)}
                                    aria-pressed={tagSelected}
                                    className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                                      tagSelected
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-swiss-line bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span
                                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                        tagSelected
                                          ? 'border-primary bg-primary text-white'
                                          : 'border-slate-300 bg-white'
                                      }`}
                                    >
                                      {tagSelected && <Check className="h-2.5 w-2.5" />}
                                    </span>
                                    <Hash className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                    <span className="min-w-0 flex-1 truncate">{segment.name}</span>
                                    <span
                                      className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] ${
                                        tagSelected
                                          ? 'bg-white text-primary'
                                          : 'bg-slate-100 text-slate-500'
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {selectedChannel === 'whatsapp' && 'Design message'}
                      {selectedChannel === 'email' && 'Compose email'}
                      {selectedChannel === 'instagram' && 'Write Instagram DM'}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedChannel === 'whatsapp' &&
                        'Select an approved Meta template and map variable parameters.'}
                      {selectedChannel === 'email' &&
                        'Pick a saved email template and set variable values for the campaign.'}
                      {selectedChannel === 'instagram' &&
                        'Write your Instagram DM (max 1,000 characters).'}
                    </p>
                  </div>

                  {selectedChannel === 'whatsapp' && (
                    <div className="space-y-4">
                      {templatesError && (
                        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                          {templatesError}
                        </p>
                      )}
                      {templatesLoading ? (
                        <p className="text-xs font-medium text-slate-400">Loading your templates…</p>
                      ) : templates.length === 0 ? (
                        <div className="bg-white border border-swiss-line p-5 text-center">
                          <p className="text-sm font-semibold text-slate-900">No approved templates</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Create and approve a template in Message Templates first.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="bg-white border border-swiss-line p-4">
                            <label
                              htmlFor="wa-campaign-template"
                              className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400"
                            >
                              Approved Meta template
                            </label>
                            <Select
                              value={selectedTemplateName}
                              onValueChange={(name) => {
                                setSelectedTemplateName(name);
                                const tpl = templates.find((t) => t.name === name);
                                if (tpl) {
                                  setVariableMappings((prev) =>
                                    defaultWaVariableMappings(tpl.variables, prev)
                                  );
                                }
                              }}
                            >
                              <SelectTrigger
                                id="wa-campaign-template"
                                className="mt-2 h-auto w-full cursor-pointer rounded-lg border-swiss-line bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-none focus-visible:ring-2 focus-visible:ring-primary/20"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {templates.map((t) => (
                                  <SelectItem key={t.id ?? t.name} value={t.name}>
                                    {t.name} ({t.category})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {activeTemplate && (
                              <p className="mt-2 text-xs font-medium text-slate-500">
                                Preview updates live as you change template, media, or variables.
                              </p>
                            )}
                          </div>

                          {activeTemplate && requiresHeaderMedia && (
                            <div className="bg-white border border-swiss-line p-4">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-900">Header media</h4>
                                  <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                    Required {waHeaderFormat} sent with every recipient
                                  </p>
                                </div>
                                {!hasHeaderMediaReady && (
                                  <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                    Needed to launch
                                  </span>
                                )}
                              </div>

                              <input
                                ref={headerMediaInputRef}
                                type="file"
                                accept={HEADER_MEDIA_ACCEPT[waHeaderFormat]}
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] ?? null;
                                  void handleHeaderMediaUpload(file);
                                  e.target.value = '';
                                  setHeaderMediaEditOpen(false);
                                }}
                              />

                              <div className="mt-3 flex gap-3">
                                <button
                                  type="button"
                                  disabled={headerMediaUploading}
                                  onClick={() => setHeaderMediaEditOpen((o) => !o)}
                                  className="group relative flex h-20 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-slate-100 ring-1 ring-swiss-line disabled:opacity-60"
                                  aria-label={
                                    hasHeaderMediaPreview
                                      ? `Edit header ${waHeaderFormat}`
                                      : `Add header ${waHeaderFormat}`
                                  }
                                >
                                  {waHeaderFormat === 'image' && effectiveHeaderMediaPreview ? (
                                    <img
                                      src={effectiveHeaderMediaPreview}
                                      alt="Header preview"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : waHeaderFormat === 'video' && effectiveHeaderMediaPreview ? (
                                    <video
                                      src={effectiveHeaderMediaPreview}
                                      className="h-full w-full object-cover"
                                      muted
                                    />
                                  ) : (
                                    <span className="text-slate-400">
                                      {waHeaderFormat === 'video' ? (
                                        <Video className="h-5 w-5" aria-hidden />
                                      ) : waHeaderFormat === 'document' ? (
                                        <FileText className="h-5 w-5" aria-hidden />
                                      ) : (
                                        <ImageIcon className="h-5 w-5" aria-hidden />
                                      )}
                                    </span>
                                  )}
                                  <span className="absolute inset-0 flex items-center justify-center bg-slate-900/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                    <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-800">
                                      <Pencil className="h-3 w-3" aria-hidden />
                                      Edit
                                    </span>
                                  </span>
                                </button>

                                <div className="relative min-w-0 flex-1" ref={headerMediaEditRef}>
                                  <p className="truncate text-sm font-semibold text-slate-800">
                                    {headerMediaFileName ||
                                      activeTemplate.headerMediaFileName ||
                                      `Choose ${waHeaderFormat} file`}
                                  </p>
                                  <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                    {HEADER_MEDIA_HINT[waHeaderFormat]}
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={headerMediaUploading}
                                      onClick={() => setHeaderMediaEditOpen((o) => !o)}
                                      aria-expanded={headerMediaEditOpen}
                                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                                    >
                                      {headerMediaUploading ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                                      ) : hasHeaderMediaPreview ? (
                                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                                      ) : (
                                        <Upload className="h-3.5 w-3.5" aria-hidden />
                                      )}
                                      {hasHeaderMediaPreview ? 'Edit' : 'Upload'}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={headerMediaUploading}
                                      onClick={() => {
                                        setHeaderMediaEditOpen(false);
                                        setGalleryPickerOpen(true);
                                      }}
                                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-swiss-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
                                    >
                                      <Images className="h-3.5 w-3.5" aria-hidden />
                                      Gallery
                                    </button>
                                    {(headerMediaStorageKey || headerMediaAssetId) &&
                                      activeTemplate.headerMediaStorageKey && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            useTemplateSampleMedia();
                                            setHeaderMediaEditOpen(false);
                                          }}
                                          className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                                        >
                                          Use sample
                                        </button>
                                      )}
                                  </div>

                                  {headerMediaEditOpen && (
                                    <div
                                      role="menu"
                                      className="absolute left-0 top-full z-20 mt-1.5 w-56 rounded-lg border border-swiss-line bg-white py-1 shadow-lg shadow-slate-900/10"
                                    >
                                      <button
                                        type="button"
                                        role="menuitem"
                                        disabled={headerMediaUploading}
                                        onClick={() => headerMediaInputRef.current?.click()}
                                        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                                      >
                                        <Upload className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                                        Upload new {waHeaderFormat}
                                      </button>
                                      <button
                                        type="button"
                                        role="menuitem"
                                        disabled={headerMediaUploading}
                                        onClick={() => {
                                          setHeaderMediaEditOpen(false);
                                          setGalleryPickerOpen(true);
                                        }}
                                        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                                      >
                                        <Images className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                                        Pick from gallery
                                      </button>
                                      {(headerMediaStorageKey || headerMediaAssetId) &&
                                        activeTemplate.headerMediaStorageKey && (
                                          <button
                                            type="button"
                                            role="menuitem"
                                            onClick={() => {
                                              useTemplateSampleMedia();
                                              setHeaderMediaEditOpen(false);
                                            }}
                                            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                          >
                                            Use template sample
                                          </button>
                                        )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {(headerMediaError || launchError) && (
                                <p className="mt-3 text-xs font-semibold text-red-600">
                                  {headerMediaError || launchError}
                                </p>
                              )}
                            </div>
                          )}

                          {activeTemplate && activeTemplate.variables.length > 0 && (
                            <div className="bg-white border border-swiss-line">
                              <div className="border-b border-slate-100 px-4 py-3">
                                <h4 className="text-sm font-semibold text-slate-900">
                                  Map variable parameters
                                </h4>
                                <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                  Map each placeholder to a contact field, or set fixed text for everyone.
                                </p>
                              </div>
                              <div className="divide-y divide-slate-100">
                                {activeTemplate.variables.map((v, i) => {
                                  const current = variableMappings[v] || '';
                                  const isKnownField = WA_CONTACT_FIELD_OPTIONS.some(
                                    (o) => o.value === current
                                  );
                                  return (
                                    <div
                                      key={v}
                                      className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[minmax(0,9rem)_1fr] sm:items-start sm:gap-4"
                                    >
                                      <div className="min-w-0 pt-1.5">
                                        <p className="font-mono text-xs font-semibold text-primary">
                                          {'{{' + (i + 1) + '}}'}
                                        </p>
                                        <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
                                          {v}
                                        </p>
                                      </div>
                                      <div className="space-y-1.5">
                                        <Select
                                          value={isKnownField ? current : '__custom__'}
                                          onValueChange={(next) => {
                                            setVariableMappings((p) => ({
                                              ...p,
                                              [v]: next === '__custom__' ? '' : next,
                                            }));
                                          }}
                                        >
                                          <SelectTrigger
                                            aria-label={`Map variable ${i + 1}`}
                                            className="h-auto w-full cursor-pointer rounded-lg border-swiss-line bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-none focus-visible:ring-2 focus-visible:ring-primary/20"
                                          >
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {WA_CONTACT_FIELD_OPTIONS.map((o) => (
                                              <SelectItem key={o.value} value={o.value}>
                                                {o.label}
                                              </SelectItem>
                                            ))}
                                            <SelectItem value="__custom__">Custom text…</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        {!isKnownField && (
                                          <Input
                                            type="text"
                                            value={current}
                                            onChange={(e) =>
                                              setVariableMappings((p) => ({
                                                ...p,
                                                [v]: e.target.value,
                                              }))
                                            }
                                            placeholder="Fixed text for all recipients"
                                            className="h-auto rounded-lg border-swiss-line bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                                          />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {selectedChannel === 'email' && (
                    <div className="space-y-4">
                      {emailTemplatesError && (
                        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                          {emailTemplatesError}
                        </p>
                      )}
                      {emailTemplatesLoading ? (
                        <p className="text-xs font-medium text-slate-400">Loading email templates…</p>
                      ) : emailTemplates.length === 0 ? (
                        <div className="bg-white border border-swiss-line p-5 text-center">
                          <p className="text-sm font-semibold text-slate-900">No active email templates</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Create and activate a template under Email Templates first.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="bg-white border border-swiss-line p-4">
                            <label
                              htmlFor="email-campaign-template"
                              className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400"
                            >
                              Email template
                            </label>
                            <Select
                              value={selectedEmailTemplateId}
                              onValueChange={(id) => {
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
                            >
                              <SelectTrigger
                                id="email-campaign-template"
                                className="mt-2 h-auto w-full cursor-pointer rounded-lg border-swiss-line bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-none focus-visible:ring-2 focus-visible:ring-primary/20"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {emailTemplates.map((t) => (
                                  <SelectItem key={t.id} value={t.id}>
                                    {t.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {activeEmailTemplate && (
                              <p className="mt-2 text-xs font-medium text-slate-500">
                                Subject:{' '}
                                <span className="text-slate-700">{activeEmailTemplate.subject}</span>
                              </p>
                            )}
                          </div>
                          {activeEmailTemplate && activeEmailTemplate.variables.length > 0 && (
                            <div className="bg-white border border-swiss-line">
                              <div className="border-b border-slate-100 px-4 py-3">
                                <h4 className="text-sm font-semibold text-slate-900">
                                  Map variable parameters
                                </h4>
                                <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                  Contact fields fill per recipient; others use a campaign-wide value.
                                </p>
                              </div>
                              <div className="divide-y divide-slate-100">
                                {activeEmailTemplate.variables.map((v) => {
                                  const fromContact = CONTACT_AUTO_EMAIL_VARIABLES.has(v);
                                  return (
                                    <div
                                      key={v}
                                      className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[minmax(0,9rem)_1fr] sm:items-center sm:gap-4"
                                    >
                                      <span className="font-mono text-xs font-semibold text-primary">
                                        {'{{' + v + '}}'}
                                      </span>
                                      <div>
                                        {fromContact ? (
                                          <p className="rounded-lg border border-swiss-line bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                                            Filled from each contact ({v.replace(/_/g, ' ')})
                                          </p>
                                        ) : (
                                          <Input
                                            type="text"
                                            value={emailVariableMappings[v] || ''}
                                            onChange={(e) =>
                                              setEmailVariableMappings((p) => ({
                                                ...p,
                                                [v]: e.target.value,
                                              }))
                                            }
                                            placeholder={`Value for ${v}`}
                                            className="h-auto rounded-lg border-swiss-line bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                                          />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {selectedChannel === 'instagram' && (
                    <div className="space-y-4">
                      <div className="bg-white border border-swiss-line p-4">
                        <label
                          htmlFor="ig-campaign-message"
                          className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400"
                        >
                          DM message
                        </label>
                        <Textarea
                          id="ig-campaign-message"
                          value={igConfig.message}
                          onChange={(e) => setIgConfig({ message: e.target.value })}
                          rows={6}
                          maxLength={1000}
                          placeholder="Write your Instagram DM here. Use {{first_name}} for personalization."
                          className="mt-2 resize-none rounded-lg border-swiss-line px-3 py-2.5 text-sm font-medium leading-relaxed text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                        <div className="mt-2 flex justify-between gap-3">
                          <p className="text-xs text-slate-400">
                            Use{' '}
                            <code className="rounded bg-slate-100 px-1 font-mono text-[11px]">
                              {'{{first_name}}'}
                            </code>{' '}
                            for personalization
                          </p>
                          <p
                            className={`shrink-0 text-xs font-semibold tabular-nums ${
                              igConfig.message.length > 900 ? 'text-red-500' : 'text-slate-400'
                            }`}
                          >
                            {igConfig.message.length}/1000
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 rounded-xl border border-swiss-line bg-slate-50 px-4 py-3">
                        <Globe className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                        <p className="text-xs font-medium leading-relaxed text-slate-600">
                          <span className="font-semibold text-slate-800">Note:</span> Instagram DMs can
                          only be sent to contacts who messaged your business account in the last 24
                          hours (or with message tag permission).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 select-none">
                  <div>
                    <h3 className="font-bold text-swiss-ink text-sm">Schedule & Dispatch Review</h3>
                    <p className="text-xs text-swiss-faint mt-0.5">
                      {isEditingScheduled
                        ? 'Update audience, message, name, and send time. Stays scheduled — no duplicate send.'
                        : 'Review campaign details and schedule or send immediately.'}
                    </p>
                  </div>

                  {isEditingScheduled && (
                    <label className="block space-y-1.5 bg-white border border-swiss-line p-4 rounded-xl">
                      <span className="text-sm font-bold text-swiss-ink">Campaign name</span>
                      <Input
                        type="text"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        className="h-auto rounded-xl border-swiss-line bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
                      />
                    </label>
                  )}

                  {showsCcCostEstimate() ? (
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
                          <Coins className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-swiss-ink">Estimated Cost</p>
                          <p className="text-xs text-swiss-faint font-bold mt-0.5 truncate">
                            {`${audienceCount().toLocaleString()} contacts · ${estimatedCostRateLabel()}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-black font-mono text-primary shrink-0">
                        {estimatedCost()}
                      </span>
                    </div>
                  ) : null}

                  <div className="bg-white border border-swiss-line p-4 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-swiss-ink">Schedule for later</p>
                        <p className="text-xs text-swiss-faint font-bold">
                          {isEditingScheduled
                            ? 'Scheduled campaigns must keep a future send time'
                            : 'Defer broadcast to a specific time'}
                        </p>
                      </div>
                      <Checkbox
                        checked={isScheduled || isEditingScheduled}
                        disabled={isEditingScheduled}
                        onCheckedChange={(checked) => setIsScheduled(checked === true)}
                        className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                    {(isScheduled || isEditingScheduled) && (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <Input
                          type="date"
                          value={scheduledDate}
                          min={todayLocal()}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="h-auto rounded-xl border-swiss-line bg-slate-50 px-3 py-2 text-xs font-bold outline-none"
                        />
                        <Input
                          type="time"
                          value={scheduledTime}
                          min={minScheduleTimeFor(scheduledDate)}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="h-auto rounded-xl border-swiss-line bg-slate-50 px-3 py-2 text-xs font-bold outline-none"
                        />
                        <p className="col-span-2 text-[11px] font-medium text-swiss-faint">
                          Times shown in your browser's timezone
                          {SCHEDULE_TIMEZONE_LABEL ? ` (${SCHEDULE_TIMEZONE_LABEL})` : ''}.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-primary uppercase tracking-wider mb-1">
                        Before you send
                      </p>
                      <p className="text-xs text-swiss-faint font-bold leading-normal">
                        {selectedChannel === 'whatsapp' &&
                          'Template approved by Meta. Audience automatically excludes unsubscribed and blocked contacts.'}
                        {selectedChannel === 'email' &&
                          'Every email includes a working one-click unsubscribe link. Audience automatically excludes unsubscribed and blocked contacts. You are responsible for your own legal compliance (CAN-SPAM, GDPR, etc.).'}
                        {selectedChannel === 'instagram' &&
                          "Instagram campaigns are preview-only right now — sending isn't available yet."}
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
          <div className="flex shrink-0 items-center justify-between border-t border-swiss-line bg-white px-4 py-3 md:px-8">
            <button
              type="button"
              onClick={() => setCurrentStep((p) => Math.max(0, p - 1))}
              disabled={currentStep === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white ring-1 ring-swiss-line px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-surface-muted disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {currentStep < totalSteps - 1 ? (
              <button
                type="button"
                onClick={handleWizardNext}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-primary/15 transition-colors hover:bg-primary-hover"
              >
                Next step <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLaunchCampaign}
                disabled={launching}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-primary/15 transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                {launching
                  ? isEditingScheduled
                    ? 'Saving…'
                    : isScheduled
                      ? 'Scheduling…'
                      : 'Sending…'
                  : isEditingScheduled
                    ? `Save · ${scheduledDate} ${scheduledTime}`
                    : isScheduled
                      ? `Schedule · ${scheduledDate} ${scheduledTime}`
                      : 'Launch campaign'}
              </button>
            )}
          </div>
        )}
      </section>

      <section
        className={`flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-slate-50 ${
          formPrimaryLayout
            ? 'w-full flex-1 p-4 xl:w-[min(400px,34vw)] xl:flex-none xl:border-l xl:border-swiss-line lg:p-5'
            : 'w-full flex-1 p-5 lg:p-6 xl:w-[min(440px,36vw)] xl:flex-none'
        }`}
      >
        <div
          className={`mx-auto flex h-full min-h-0 w-full flex-col ${
            formPrimaryLayout ? 'max-w-none' : 'max-w-md xl:max-w-none'
          }`}
        >
          <p className="mb-3 shrink-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
            {currentStep === 1
              ? 'Audience preview'
              : currentStep === 0
                ? 'Channel preview'
                : `Live ${chConfig.name} preview`}
          </p>
          <div
            className={`min-h-0 flex-1 ${
              currentStep > 1 && selectedChannel === 'whatsapp'
                ? 'flex flex-col items-stretch'
                : currentStep === 1
                  ? 'flex min-h-0 flex-col'
                  : ''
            }`}
          >
            {currentStep === 0 && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-3xl shadow-lg"
                  style={{ background: chConfig.bgColor }}
                >
                  <ChannelIcon channel={selectedChannel} size={40} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">{chConfig.name}</p>
                  <p className="mt-1 max-w-[200px] text-xs leading-relaxed text-slate-500">
                    {chConfig.description}
                  </p>
                  <p className="mt-2 text-sm font-semibold" style={{ color: chConfig.color }}>
                    {chConfig.limit}
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  Select a channel and click Next step to see live preview
                </p>
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
              <WhatsAppPreview
                body={getRenderedWABody()}
                buttons={activeTemplate?.buttons || []}
                headerFormat={waHeaderFormat}
                headerMediaPreviewUrl={effectiveHeaderMediaPreview || undefined}
                headerMediaFileName={
                  headerMediaFileName || activeTemplate?.headerMediaFileName || null
                }
                previewKey={waPreviewKey}
              />
            )}
            {currentStep > 1 && selectedChannel === 'email' && activeEmailTemplate && (
              <div className="flex min-h-0 w-full flex-1 flex-col">
                <EmailTemplatePreview
                  subject={activeEmailTemplate.subject}
                  htmlBody={activeEmailTemplate.htmlBody}
                  variables={activeEmailTemplate.variables}
                  variableMappings={emailVariableMappings}
                />
              </div>
            )}
            {currentStep > 1 && selectedChannel === 'instagram' && (
              <InstagramPreview message={igConfig.message} />
            )}
          </div>
        </div>
      </section>
      </div>

      {requiresHeaderMedia && (
        <MediaGalleryPickerModal
          open={galleryPickerOpen}
          onClose={() => setGalleryPickerOpen(false)}
          onPick={handleGalleryHeaderPick}
          filterType={galleryFilterForHeader(waHeaderFormat)}
        />
      )}

      <AnimatePresence>
        {showSendConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSendConfirm(false)}
          >
            <motion.div
              role="dialog"
              aria-labelledby="send-confirm-title"
              className="w-full max-w-sm overflow-hidden rounded-2xl border border-swiss-line bg-white shadow-2xl"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 px-5 pt-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h2 id="send-confirm-title" className="text-sm font-semibold text-swiss-ink">
                    Send to {audienceCount().toLocaleString()} contacts now?
                  </h2>
                  <p className="mt-1 text-xs text-swiss-muted">
                    This sends {chConfig.name} messages immediately and can&apos;t be undone.
                    Schedule for later instead if you want a chance to cancel.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
                <button
                  type="button"
                  onClick={() => setShowSendConfirm(false)}
                  className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmSendNow}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-primary/15 transition-colors hover:bg-primary-hover"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  Send now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
