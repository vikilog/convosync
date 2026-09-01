/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  Facebook,
  GitBranch,
  Instagram,
  Loader2,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  Pause,
  Pencil,
  Play,
  Unlink,
} from 'lucide-react';
import { api } from '../../lib/api';
import { dispatchOpenInboxConversation } from '../../lib/inboxEvents';
import { pathForCampaign, pathForContact, pathForContactsList, pathForTab } from '../../routes';
import { ContactLeadJourneyPanel } from '../leads/ContactLeadJourneyPanel';
import { ContactLinkedChannelsPanel } from './ContactLinkedChannelsPanel';
import { AddContactDrawer, type ContactEditPayload } from './AddContactDrawer';

type Channel = 'whatsapp' | 'instagram' | 'messenger';
type Overview = Awaited<ReturnType<typeof api.getContactOverview>>;

const CHANNEL_LABEL: Record<Channel, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  messenger: 'Messenger',
};

const CHANNEL_TONE: Record<
  Channel,
  { chip: string; icon: string; accent: string }
> = {
  whatsapp: {
    chip: 'bg-[var(--color-accent-green-bg)] text-[var(--color-channel-green)]',
    icon: 'text-[var(--color-channel-green)]',
    accent: 'border-l-[var(--color-channel-green)]',
  },
  instagram: {
    chip: 'bg-[#fce8f0] text-[#C13584]',
    icon: 'text-[#E1306C]',
    accent: 'border-l-[#E1306C]',
  },
  messenger: {
    chip: 'bg-[#e8f3ff] text-[var(--color-channel-blue)]',
    icon: 'text-[var(--color-channel-blue)]',
    accent: 'border-l-[var(--color-channel-blue)]',
  },
};

const INTENT_TONE: Record<string, string> = {
  interested: 'bg-emerald-50 text-emerald-800',
  question: 'bg-sky-50 text-sky-800',
  complaint: 'bg-red-50 text-red-800',
  unclear: 'bg-amber-50 text-amber-800',
  spam: 'bg-slate-100 text-slate-600',
};

function ChannelIcon({ channel, className }: { channel: Channel; className?: string }) {
  if (channel === 'instagram') return <Instagram className={className} aria-hidden />;
  if (channel === 'messenger') return <Facebook className={className} aria-hidden />;
  return <MessageCircle className={className} aria-hidden />;
}

function handleLabel(channel: Channel, phone: string): string {
  if (channel === 'instagram') {
    const id = phone.replace(/^ig:/, '');
    return /^\d+$/.test(id) ? id : `@${id}`;
  }
  if (channel === 'messenger') return phone.replace(/^fb:/, '');
  return phone;
}

function displayNameForChannel(channel: Channel, name: string, phone: string): string {
  if (channel === 'instagram') {
    const cleaned = name.replace(/^@+/, '').trim();
    if (cleaned && !/^\d+$/.test(cleaned)) return `@${cleaned}`;
    const fromPhone = phone.replace(/^ig:/, '');
    if (fromPhone && !/^\d+$/.test(fromPhone) && !fromPhone.startsWith('lead:')) {
      return `@${fromPhone}`;
    }
  }
  return name;
}

function displayInitial(name: string): string {
  const cleaned = name.replace(/^@+/, '').trim();
  const ch = cleaned.charAt(0);
  return (ch || '?').toUpperCase();
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function campaignStatusTone(status?: string): string {
  const s = (status ?? '').toLowerCase();
  if (s === 'clicked' || s === 'opened' || s === 'delivered') {
    return 'bg-emerald-50 text-emerald-800 border-emerald-100';
  }
  if (s === 'failed' || s === 'bounced') return 'bg-red-50 text-red-700 border-red-100';
  if (s === 'queued') return 'bg-amber-50 text-amber-800 border-amber-100';
  return 'bg-slate-100 text-slate-600 border-swiss-line';
}

export function ContactDetailView({ contactId }: { contactId: string }) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingInbox, setOpeningInbox] = useState<string | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editContact, setEditContact] = useState<ContactEditPayload | null>(null);
  const [togglingAutomation, setTogglingAutomation] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getContactOverview(contactId);
      setOverview(data);
    } catch (e) {
      setOverview(null);
      setError(e instanceof Error ? e.message : 'Failed to load contact');
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openInbox = async (id: string) => {
    setOpeningInbox(id);
    try {
      const conv = (await api.openConversation(id)) as { id?: string };
      const conversationId = String(conv.id ?? '');
      if (!conversationId) throw new Error('No conversation');
      navigate(pathForTab('inbox'));
      dispatchOpenInboxConversation(conversationId);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Could not open inbox');
    } finally {
      setOpeningInbox(null);
    }
  };

  const unlinkChannel = async (otherId: string) => {
    setUnlinkingId(otherId);
    try {
      await api.unlinkContactChannel(contactId, otherId);
      await load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Unlink failed');
    } finally {
      setUnlinkingId(null);
    }
  };

  const toggleAutomationPause = async () => {
    if (!overview) return;
    const next = !overview.contact.automationsPaused;
    setTogglingAutomation(true);
    try {
      await api.setContactAutomationPause(contactId, next);
      setOverview({ ...overview, contact: { ...overview.contact, automationsPaused: next } });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Could not update automation status');
    } finally {
      setTogglingAutomation(false);
    }
  };

  const openEdit = async () => {
    if (!overview) return;
    try {
      const raw = (await api.getContact(overview.contact.id)) as Record<string, unknown>;
      const customFields = (raw.customFields as Record<string, string>) ?? {};
      setEditContact({
        id: String(raw.id),
        name: String(raw.name),
        phone: String(raw.phone),
        email: raw.email ? String(raw.email) : undefined,
        tags: (raw.tags as string[]) ?? [],
        customFields,
        channel: overview.contact.channel,
        excludeFromInsights: Boolean(raw.excludeFromInsights),
      });
      setEditOpen(true);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Could not load contact');
    }
  };

  if (loading) {
    return (
      <div className="h-full min-h-[calc(100vh-64px)] overflow-y-auto bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 space-y-6 animate-pulse">
          <div className="h-4 w-24 rounded bg-black/5" />
          <div className="h-36 bg-white border border-swiss-line" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-white border border-swiss-line" />
            ))}
          </div>
          <div className="h-48 bg-white border border-swiss-line" />
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="h-full min-h-[calc(100vh-64px)] overflow-y-auto bg-white p-6">
        <button
          type="button"
          onClick={() => navigate(pathForContactsList())}
          className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to contacts
        </button>
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-semibold text-red-700">
          {error ?? 'Contact not found'}
        </div>
      </div>
    );
  }

  const { contact, channels, stats, campaigns, journey, instagramComments } = overview;
  const ch = contact.channel;
  const displayEmail =
    contact.email?.trim() ||
    channels.map((c) => c.email?.trim()).find(Boolean) ||
    null;
  // Prefer a human name from linked WhatsApp when this row is an @handle
  const linkedHumanName =
    channels.find(
      (c) =>
        c.channel === 'whatsapp' &&
        c.name.trim() &&
        !c.name.trim().startsWith('@') &&
        !/^\d+$/.test(c.name.trim())
    )?.name ?? null;
  const headerName =
    contact.name.trim().startsWith('@') && linkedHumanName
      ? linkedHumanName
      : contact.name;
  const headerHandle =
    headerName !== contact.name
      ? displayNameForChannel(ch, contact.name, contact.phone)
      : null;

  const metrics = [
    { label: 'Campaigns', value: stats.campaigns, icon: Megaphone },
    { label: 'Journeys', value: stats.journeys, icon: GitBranch },
    { label: 'Conversations', value: stats.conversations, icon: MessagesSquare },
    { label: 'IG comments', value: stats.instagramComments ?? 0, icon: Instagram },
    { label: 'Bots', value: stats.bots, icon: MessageSquare },
  ];

  const fade = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.22, ease: 'easeOut' as const },
      };

  return (
    <div className="relative h-full min-h-0 overflow-y-auto bg-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,_rgba(6,78,59,0.07),_transparent_65%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-4 py-5 md:px-8 md:py-7 space-y-6">
        <motion.div {...fade}>
          <button
            type="button"
            onClick={() => navigate(pathForContactsList())}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors duration-200 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Contacts
          </button>
        </motion.div>

        {/* Identity */}
        <motion.header
          {...fade}
          className="bg-white border border-swiss-line px-5 py-5 md:px-7 md:py-6"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white md:h-[4.5rem] md:w-[4.5rem] md:text-3xl">
                {displayInitial(headerName)}
              </div>
              <div className="min-w-0 space-y-2">
                <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                  {headerName}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${CHANNEL_TONE[ch].chip}`}
                  >
                    <ChannelIcon channel={ch} className="h-3.5 w-3.5" />
                    {CHANNEL_LABEL[ch]}
                  </span>
                  {headerHandle ? (
                    <span className="text-sm font-semibold text-slate-600">{headerHandle}</span>
                  ) : (
                    <span className="font-mono text-xs text-slate-600">
                      {handleLabel(ch, contact.phone)}
                    </span>
                  )}
                  {contact.source ? (
                    <span className="text-xs text-slate-400">· {contact.source}</span>
                  ) : null}
                </div>
                {displayEmail ? (
                  <p className="inline-flex max-w-full items-center gap-1.5 text-sm text-slate-600">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                    <span className="truncate">{displayEmail}</span>
                  </p>
                ) : null}
                {contact.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {contact.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              <button
                type="button"
                onClick={() => void openInbox(contact.id)}
                disabled={openingInbox === contact.id}
                className="btn-secondary min-h-11"
              >
                {openingInbox === contact.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <MessageSquare className="h-4 w-4" aria-hidden />
                )}
                Open inbox
              </button>
              <button
                type="button"
                onClick={() => void toggleAutomationPause()}
                disabled={togglingAutomation}
                title={
                  contact.automationsPaused
                    ? 'No automation will trigger for this contact until resumed'
                    : 'Stop all WhatsApp/Instagram automation from triggering for this contact'
                }
                className={`min-h-11 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors duration-200 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  contact.automationsPaused
                    ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    : 'border-black/10 bg-white text-slate-700 hover:bg-surface-muted'
                }`}
              >
                {togglingAutomation ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : contact.automationsPaused ? (
                  <Play className="h-4 w-4" aria-hidden />
                ) : (
                  <Pause className="h-4 w-4" aria-hidden />
                )}
                {contact.automationsPaused ? 'Resume automation' : 'Pause automation'}
              </button>
              <button type="button" onClick={() => void openEdit()} className="btn-primary min-h-11">
                <Pencil className="h-4 w-4" aria-hidden />
                Edit
              </button>
            </div>
          </div>

          {/* Metric strip — one composition, not a dashboard of cards */}
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-t border-swiss-line pt-4">
            {metrics.map((m) => (
              <div key={m.label} className="min-w-[5.5rem]">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <m.icon className="h-3.5 w-3.5" aria-hidden />
                  <span className="text-[11px] font-bold uppercase tracking-wide">{m.label}</span>
                </div>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-slate-900">{m.value}</p>
              </div>
            ))}
          </div>
        </motion.header>

        {/* Channels */}
        <motion.section {...fade} className="space-y-3" aria-labelledby="channels-heading">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="channels-heading" className="text-sm font-bold text-slate-800">
              Channels
            </h2>
            <ContactLinkedChannelsPanel
              contactId={contactId}
              variant="linkOnly"
              onChanged={() => void load()}
            />
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {channels.map((row) => {
              const tone = CHANNEL_TONE[row.channel];
              const isSelf = row.contactId === contactId;
              return (
                <li
                  key={row.contactId}
                  className={`bg-white border border-swiss-line border-l-4 ${tone.accent} p-4 transition-colors duration-200`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.chip}`}
                    >
                      <ChannelIcon channel={row.channel} className={`h-5 w-5 ${tone.icon}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          {CHANNEL_LABEL[row.channel]}
                        </p>
                        {isSelf ? (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                            Viewing
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        disabled={isSelf}
                        onClick={() => navigate(pathForContact(row.contactId))}
                        className={`mt-0.5 block max-w-full truncate text-left text-sm font-bold text-slate-900 ${
                          isSelf
                            ? 'cursor-default'
                            : 'cursor-pointer transition-colors duration-200 hover:text-primary'
                        }`}
                      >
                        {displayNameForChannel(row.channel, row.name, row.phone)}
                      </button>
                      <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                        {handleLabel(row.channel, row.phone)}
                      </p>
                      {row.email?.trim() ? (
                        <p className="mt-0.5 truncate text-xs text-slate-500">{row.email.trim()}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-slate-400">
                        {row.conversationCount} conversation
                        {row.conversationCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={openingInbox === row.contactId}
                      onClick={() => void openInbox(row.contactId)}
                      className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors duration-200 hover:bg-surface-muted disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {openingInbox === row.contactId ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                      )}
                      Inbox
                    </button>
                    {!isSelf ? (
                      <button
                        type="button"
                        disabled={unlinkingId === row.contactId}
                        onClick={() => void unlinkChannel(row.contactId)}
                        className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition-colors duration-200 hover:bg-black/5 hover:text-slate-800 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        {unlinkingId === row.contactId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                        ) : (
                          <Unlink className="h-3.5 w-3.5" aria-hidden />
                        )}
                        Unlink
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Activity column */}
          <div className="min-w-0 space-y-6">
            <motion.section
              {...fade}
              className="min-w-0 overflow-hidden bg-white border border-swiss-line p-5"
              aria-labelledby="campaigns-heading"
            >
              <h2 id="campaigns-heading" className="text-sm font-bold text-slate-800">
                Campaigns
              </h2>
              {campaigns.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Not included in any campaigns yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-swiss-line">
                  {campaigns.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => navigate(pathForCampaign(c.id))}
                        className="flex w-full cursor-pointer items-center justify-between gap-3 py-3 text-left transition-colors duration-200 hover:bg-black/[0.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-lg px-1"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{c.title}</p>
                          {c.subtitle ? (
                            <p className="mt-0.5 truncate text-xs text-slate-500">{c.subtitle}</p>
                          ) : null}
                        </div>
                        <div className="shrink-0 text-right space-y-1">
                          {c.status ? (
                            <span
                              className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase ${campaignStatusTone(c.status)}`}
                            >
                              {c.status}
                            </span>
                          ) : null}
                          <p className="text-meta text-slate-400">{formatDate(c.timestamp)}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.section>

            <motion.section
              {...fade}
              className="min-w-0 overflow-hidden bg-white border border-swiss-line p-5"
              aria-labelledby="ig-comments-heading"
            >
              <h2 id="ig-comments-heading" className="text-sm font-bold text-slate-800">
                Instagram comments
              </h2>
              {(instagramComments ?? []).length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  No comments found for this Instagram username across posts.
                </p>
              ) : (
                <ul className="mt-3 grid gap-3 overflow-hidden">
                  {(instagramComments ?? []).map((c) => (
                    <li key={c.id} className="min-w-0">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/social-listening/media/${encodeURIComponent(c.postId)}`)
                        }
                        className="flex w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-swiss-line bg-white text-left transition-colors duration-200 hover:border-black/10 hover:bg-surface-muted/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        <div className="flex min-w-0 items-start gap-3 p-3">
                          {c.postThumbnailUrl ? (
                            <img
                              src={c.postThumbnailUrl}
                              alt=""
                              className="h-14 w-14 shrink-0 rounded-lg object-cover bg-slate-100"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#fce8f0] text-[#E1306C]">
                              <Instagram className="h-5 w-5" aria-hidden />
                            </div>
                          )}
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="break-words text-sm font-semibold leading-snug text-slate-900 line-clamp-3">
                              {c.commentText}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              {c.intent ? (
                                <span
                                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                    INTENT_TONE[c.intent.toLowerCase()] ??
                                    'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {c.intent}
                                </span>
                              ) : null}
                              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                {c.status}
                              </span>
                              <span className="text-meta text-slate-400">
                                {formatDate(c.commentedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {c.postCaption ? (
                          <div className="min-w-0 border-t border-swiss-line bg-surface-muted/50 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              Post
                            </p>
                            <p className="mt-0.5 break-words text-xs leading-relaxed text-slate-600 line-clamp-2">
                              {c.postCaption}
                            </p>
                          </div>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.section>
          </div>

          {/* Side column */}
          <motion.aside {...fade} className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <ContactLeadJourneyPanel
              contactId={contactId}
              journey={
                journey
                  ? {
                      funnelName: journey.funnelName,
                      enteredAt: journey.enteredAt,
                      convertedAt: journey.convertedAt,
                      finalStage: journey.finalStage,
                      source: journey.source,
                      origin: journey.origin,
                      timeline: journey.timeline,
                    }
                  : null
              }
            />
            {!journey ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-surface-muted/50 p-5">
                <p className="text-sm font-bold text-slate-700">Lead journey</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  When this person is converted from Social Listening, the funnel timeline will
                  appear here.
                </p>
              </div>
            ) : null}
          </motion.aside>
        </div>
      </div>

      <AddContactDrawer
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditContact(null);
        }}
        editContact={editContact}
        onSaved={() => {
          setEditOpen(false);
          setEditContact(null);
          void load();
        }}
      />
    </div>
  );
}
