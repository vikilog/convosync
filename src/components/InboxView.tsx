/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Sparkles,
  FileText,
  MessageSquareText,
  Send,
  Paperclip,
  User,
  Bot,
  Plus,
  Loader2,
  ArrowLeft,
  PanelRightOpen,
  Search,
  PauseCircle,
  Mail,
  X,
  OctagonX,
} from 'lucide-react';
import { Contact, ChatMessage, type ChatMessageType } from '../types';
import { api, formatCatchError, getUserName, SendFailedError } from '../lib/api';
import { useWorkspaceAccess } from '../hooks/useWorkspaceAccess';
import { useInboxAssigneeMeta } from '../hooks/inbox/useInboxMeta';
import {
  isConversationInInboxScope,
  isInboxChannelAllowed,
  type InboxChannel,
} from '../lib/inboxScope';
import { mapContactFromApi, mapMessageFromApi } from '../lib/mappers';
import {
  mapConversationEventToMessage,
  mergeMessagesAndEvents,
  type ConversationEventApi,
} from '../lib/conversationEvents';
import { dedupeInboxThreads } from '../lib/inboxDedupe';
import { fetchInboxConversationRows } from '../lib/inboxConversations';
import { groupMessagesByDate } from '../lib/formatDates';
import { getSocket } from '../lib/socket';
import { setActiveInboxConversationId, setInboxVisible } from '../lib/inboxFocus';
import { pathForIntegrationsChannel } from '../routes';
import {
  dispatchInboxUnreadTotal,
  INBOX_OPEN_CONVERSATION_EVENT,
} from '../lib/inboxEvents';
import {
  formatMessagingWindowRemaining,
  messagingWindowFromLastInbound,
} from '../lib/messagingWindow';
import { useKeepAliveActivation, useKeepAliveActive } from './KeepAlive';
import { ConnectChannelEmpty } from './ConnectChannelEmpty';
import { InboxAssigneePicker } from './inbox/InboxAssigneePicker';
import { InboxNewChatPicker } from './inbox/InboxNewChatPicker';
import type { InboxEmailSendPayload } from './inbox/InboxNewChatPicker';
import { InboxTemplatePicker } from './inbox/InboxTemplatePicker';
import { InboxCannedResponsePicker, type CannedSelection } from './inbox/InboxCannedResponsePicker';
import { type PickedGalleryImage } from './media/MediaGalleryPickerModal';
import { telegramFileSizeError } from '../lib/telegramMediaLimits';
import { SendMediaDialog } from './inbox/SendMediaDialog';
import {
  InboxMessageList,
  type AutomationWaitingBanner,
} from './inbox/InboxMessageList';
import { InboxContactSidebar } from './inbox/InboxContactSidebar';
import { ContactHistoricalAuditsModal } from './inbox/ContactHistoricalAuditsModal';
import { useContactJourneyProgress } from '../hooks/useContactJourneyProgress';
import { useIsLargeUp } from '../hooks/useBreakpoint';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  AddContactDrawer,
  type ContactEditPayload,
} from './contacts/AddContactDrawer';
import {
  formatInstagramSyncProgress,
  type InstagramSyncProgressPayload,
} from '../lib/instagramSyncEvents';

const IG_INBOX_HAS_MORE_KEY = 'convosync:ig:inboxHasMore';
const MESSAGE_PAGE_SIZE = 50;

type AgentOption = { id: string; name: string };
type BotOption = { id: string; name: string };
type JourneyOption = { id: string; name: string };

const COMPOSER_QUICK_EMOJIS = ['😀', '😊', '🙏', '👍', '❤️', '🎉', '✨', '🔥'];

/** Encoded inbox assignee value for the Active dropdown. */
function encodeAssigneeFromConv(conv: Record<string, unknown>): string {
  const type = conv.assigneeType as string | null | undefined;
  const id = conv.assigneeId as string | null | undefined;
  if (!type) {
    const assignedTo = conv.assignedTo as string | null | undefined;
    return assignedTo ? `user:${assignedTo}` : '';
  }
  if (type === 'ai') return 'ai';
  if (type === 'user') return id ? `user:${id}` : '';
  if (type === 'ai_agent') return id ? `ai_agent:${id}` : '';
  if (type === 'rule_based') return id ? `rule_based:${id}` : '';
  if (type === 'journey') return id ? `journey:${id}` : '';
  return '';
}

function decodeAssigneeValue(value: string): {
  assigneeType: string | null;
  assigneeId: string | null;
} {
  if (!value) return { assigneeType: null, assigneeId: null };
  if (value === 'ai') return { assigneeType: 'ai', assigneeId: null };
  const colon = value.indexOf(':');
  if (colon === -1) return { assigneeType: null, assigneeId: null };
  const type = value.slice(0, colon);
  const id = value.slice(colon + 1);
  return { assigneeType: type, assigneeId: id || null };
}

function assigneeLabelFromValue(
  value: string,
  teamAgents: AgentOption[],
  aiAgents: AgentOption[],
  ruleBasedBots: BotOption[],
  journeys: JourneyOption[]
): string {
  if (!value) return 'Unassigned';
  if (value === 'ai') return 'AI Copilot';
  const { assigneeType, assigneeId } = decodeAssigneeValue(value);
  if (assigneeType === 'user') {
    return teamAgents.find((a) => a.id === assigneeId)?.name ?? 'Team member';
  }
  if (assigneeType === 'ai_agent') {
    return aiAgents.find((a) => a.id === assigneeId)?.name ?? 'AI Agent';
  }
  if (assigneeType === 'rule_based') {
    return ruleBasedBots.find((b) => b.id === assigneeId)?.name ?? 'Rule-based bot';
  }
  if (assigneeType === 'journey') {
    return journeys.find((j) => j.id === assigneeId)?.name ?? 'Journey';
  }
  return 'Unassigned';
}

type InboxThread = Contact & {
  conversationId: string;
  lastMessageAt?: string;
};

function mapInboxThread(
  contact: Record<string, unknown>,
  conv: Record<string, unknown>,
  conversationId: string
): InboxThread {
  const lastMessageAt = conv.lastMessageAt ? String(conv.lastMessageAt) : undefined;
  return {
    ...mapContactFromApi(contact, conv),
    conversationId,
    lastMessageAt,
  };
}

/** Move/update a thread to the top (latest activity). */
function bumpInboxThread(
  prev: InboxThread[],
  conversationId: string,
  patch: Partial<InboxThread>
): InboxThread[] {
  const idx = prev.findIndex((t) => t.conversationId === conversationId);
  if (idx === -1) return prev;
  const updated: InboxThread = {
    ...prev[idx],
    ...patch,
    lastMessageAt: patch.lastMessageAt ?? new Date().toISOString(),
  };
  return [updated, ...prev.filter((_, i) => i !== idx)];
}

function mergeInboxThreads(prev: InboxThread[], incoming: InboxThread): InboxThread[] {
  const withoutDup = prev.filter((t) => t.conversationId !== incoming.conversationId);
  return dedupeInboxThreads([incoming, ...withoutDup]);
}

function whatsappLineLabel(
  thread: InboxThread,
  accounts: WhatsAppInboxAccount[]
): string | null {
  if (contactChannel(thread) !== 'whatsapp' || !thread.channelAccountId) return null;
  const account = accounts.find((a) => a.phoneNumberId === thread.channelAccountId);
  return account ? whatsappAccountLabel(account) : null;
}

function inboxChannelLineLabel(
  thread: InboxThread,
  whatsappAccounts: WhatsAppInboxAccount[],
  instagramLabel: string | null,
  messengerLabel: string | null,
  telegramLabel: string | null
): string | null {
  const channel = contactChannel(thread);
  if (channel === 'whatsapp') {
    return (
      whatsappLineLabel(thread, whatsappAccounts) ||
      (whatsappAccounts.length === 1 ? whatsappAccountLabel(whatsappAccounts[0]) : null)
    );
  }
  if (channel === 'instagram') {
    return instagramLabel || thread.handle || null;
  }
  if (channel === 'messenger') {
    return messengerLabel || null;
  }
  if (channel === 'telegram') {
    return telegramLabel || thread.handle || null;
  }
  if (channel === 'email') {
    return thread.email || thread.handle || null;
  }
  return null;
}

function inboxChannelLineClass(thread: InboxThread): string {
  const channel = contactChannel(thread);
  if (channel === 'instagram') return 'text-[#C13584]';
  if (channel === 'messenger') return 'text-[#1877F2]';
  if (channel === 'telegram') return 'text-[#229ED9]';
  if (channel === 'email') return 'text-emerald-800';
  return 'text-[#128C7E]';
}

function isPendingMessageId(id: string): boolean {
  return id.startsWith('pending-');
}

function dedupeChatMessages(messages: ChatMessage[]): ChatMessage[] {
  const seenIds = new Set<string>();
  const result: ChatMessage[] = [];

  for (const msg of messages) {
    if (seenIds.has(msg.id)) continue;
    // Only collapses a leftover optimistic placeholder once its confirmed
    // counterpart is present in the same list — two fully-confirmed
    // messages are never merged by content alone, so a contact (or agent)
    // genuinely repeating the same text within a minute isn't silently
    // hidden from view, even after a full reload.
    if (isPendingMessageId(msg.id)) {
      const minuteBucket = msg.createdAt ? msg.createdAt.slice(0, 16) : '';
      const hasConfirmedMatch = messages.some(
        (other) =>
          other.id !== msg.id &&
          !isPendingMessageId(other.id) &&
          other.sender === msg.sender &&
          other.content === msg.content &&
          (other.createdAt ? other.createdAt.slice(0, 16) : '') === minuteBucket
      );
      if (hasConfirmedMatch) continue;
    }
    seenIds.add(msg.id);
    result.push(msg);
  }

  return result;
}

function normalizeMessagesResponse(res: unknown): {
  messages: Record<string, unknown>[];
  events: ConversationEventApi[];
  hasMore: boolean;
} {
  if (Array.isArray(res)) return { messages: res, events: [], hasMore: false };
  const obj = res as {
    messages?: Record<string, unknown>[];
    events?: ConversationEventApi[];
    hasMore?: boolean;
  };
  return {
    messages: obj.messages ?? [],
    events: Array.isArray(obj.events) ? obj.events : [],
    hasMore: Boolean(obj.hasMore),
  };
}

function historyFromMessagesResponse(res: unknown): ChatMessage[] {
  const { messages, events } = normalizeMessagesResponse(res);
  return mergeMessagesAndEvents(
    messages.map((m) => mapMessageFromApi(m)),
    events
  );
}

function isAiAssigneeValue(value: string | undefined): boolean {
  if (!value) return false;
  return value === 'ai' || value.startsWith('ai_agent:');
}

function isHumanAssigneeValue(value: string | undefined): boolean {
  return Boolean(value?.startsWith('user:'));
}

function mediaKindFromFile(file: File): ChatMessageType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'document';
}

function previewLabelForFile(file: File, caption?: string): string {
  if (caption?.trim()) return caption.trim();
  if (file.type.startsWith('image/')) return '📷 Photo';
  if (file.type.startsWith('video/')) return '🎥 Video';
  if (file.type.startsWith('audio/')) return '🎤 Audio';
  return file.name || '📎 Document';
}

/** Media Gallery hands back a signed URL, not a File — fetch it into one so
 * the picked-from-gallery path can reuse the exact same upload pipeline. */
async function urlToFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load file from Media Gallery');
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
}

function replaceChatMessage(
  prev: Record<string, ChatMessage[]>,
  conversationId: string,
  messageId: string,
  next: ChatMessage
): Record<string, ChatMessage[]> {
  const history = prev[conversationId] || [];
  return {
    ...prev,
    [conversationId]: history.map((m) => {
      if (m.id !== messageId) return m;
      // Keep local blob preview so media doesn't flash to skeleton after send
      return {
        ...next,
        localPreviewUrl: next.localPreviewUrl || m.localPreviewUrl,
      };
    }),
  };
}

function removeChatMessage(
  prev: Record<string, ChatMessage[]>,
  conversationId: string,
  messageId: string
): Record<string, ChatMessage[]> {
  const history = prev[conversationId] || [];
  return {
    ...prev,
    [conversationId]: history.filter((m) => m.id !== messageId),
  };
}

function appendChatMessage(
  prev: Record<string, ChatMessage[]>,
  conversationId: string,
  msg: ChatMessage
): Record<string, ChatMessage[]> {
  const history = prev[conversationId] || [];
  if (history.some((m) => m.id === msg.id)) return prev;
  // Only collapses an optimistic placeholder against its confirmed
  // counterpart (id-keyed reconciliation via replaceChatMessage handles the
  // normal case; this is the fallback for a confirmation arriving via
  // socket before/instead of the HTTP response) — two fully-confirmed
  // messages are never merged by content alone, so a genuinely repeated
  // message isn't silently dropped.
  const duplicateContent = history.some(
    (m) =>
      (isPendingMessageId(m.id) || isPendingMessageId(msg.id)) &&
      m.sender === msg.sender &&
      m.content === msg.content &&
      m.createdAt &&
      msg.createdAt &&
      Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 5000
  );
  if (duplicateContent) return prev;
  return { ...prev, [conversationId]: [...history, msg] };
}

const statusToApi = (s: 'Open' | 'Pending' | 'Resolved') => s.toLowerCase();

function EmptyChatPanel({ message }: { message: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400">
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

/** Meta Messenger mark (chat bubble + lightning), not the Facebook "f". */
function MessengerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17V22l3.45-1.89c.99.27 2.04.42 3.41.42 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm.99 13.07l-2.54-2.71-4.95 2.71 5.44-5.79 2.61 2.71 4.89-2.71-5.45 5.79z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22.05 2.53a1.68 1.68 0 00-1.72-.28L1.9 9.6a1.6 1.6 0 00.1 3.02l4.7 1.47 1.82 5.84a1.61 1.61 0 002.63.7l2.6-2.32 4.6 3.4a1.66 1.66 0 002.6-1L22.7 4.1a1.68 1.68 0 00-.65-1.57zM9.4 14.6l-1.15 3.7-1.14-3.66 10.1-8.02z" />
    </svg>
  );
}

interface WhatsAppInboxAccount {
  phoneNumberId: string;
  phoneNumber?: string;
  displayName?: string;
  label?: string;
}

function whatsappAccountLabel(acc: WhatsAppInboxAccount): string {
  return acc.label || acc.displayName || acc.phoneNumber || 'WhatsApp';
}

const FILTER_TABS = [
  { id: 'all' as const, label: 'All' },
  { id: 'mine' as const, label: 'Mine' },
  { id: 'unassigned' as const, label: 'Unassigned' },
];

const CHANNEL_TABS: { id: InboxChannel; label: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'Email' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'messenger', label: 'Messenger' },
  { id: 'telegram', label: 'Telegram' },
];

function contactChannel(
  contact: Contact
): 'whatsapp' | 'instagram' | 'messenger' | 'email' | 'telegram' {
  if (contact.channel === 'instagram') return 'instagram';
  if (contact.channel === 'messenger') return 'messenger';
  if (contact.channel === 'telegram') return 'telegram';
  if (contact.channel === 'email') return 'email';
  return 'whatsapp';
}

function channelLabel(contact: Contact): string {
  const channel = contactChannel(contact);
  if (channel === 'instagram') return 'Instagram';
  if (channel === 'messenger') return 'Messenger';
  if (channel === 'telegram') return 'Telegram';
  if (channel === 'email') return 'Email';
  return 'WhatsApp';
}

function contactDisplayHandle(contact: Contact): string {
  return contact.handle || contact.phone;
}

export const InboxView: React.FC = () => {
  const navigate = useNavigate();
  const { inboxScope } = useWorkspaceAccess();
  const isLargeUp = useIsLargeUp();
  const reduceMotion = useReducedMotion();
  const {
    currentUserId,
    currentUserName,
    teamAgents,
    aiAgents,
    ruleBasedBots,
    publishedWhatsAppJourneys,
    publishedInstagramJourneys,
    whatsappAccounts,
    instagramConnected,
    instagramInboxLabel,
    messengerConnected,
    messengerInboxLabel,
    telegramConnected,
    telegramInboxLabel,
    emailConnected,
    channelsReady,
  } = useInboxAssigneeMeta();
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>('list');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [listSearch, setListSearch] = useState('');
  const [inboxThreads, setInboxThreads] = useState<InboxThread[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({});
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesHasMore, setMessagesHasMore] = useState<Record<string, boolean>>({});
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [assignedToByConversationId, setAssignedToByConversationId] = useState<
    Record<string, string>
  >({});

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filterTab, setFilterTab] = useState<'all' | 'mine' | 'unassigned'>('all');
  const [channelFilter, setChannelFilter] = useState<InboxChannel>('whatsapp');
  const [instagramSyncing, setInstagramSyncing] = useState(false);
  const [instagramSyncHint, setInstagramSyncHint] = useState<string | null>(null);
  const [instagramHasMore, setInstagramHasMore] = useState(() => {
    try {
      return sessionStorage.getItem(IG_INBOX_HAS_MORE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [messageInput, setMessageInput] = useState<string>('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [takeoverLoading, setTakeoverLoading] = useState(false);
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [handoverToast, setHandoverToast] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showCannedPicker, setShowCannedPicker] = useState(false);
  const [pendingComposerFile, setPendingComposerFile] = useState<File | null>(null);
  const [pendingComposerPreview, setPendingComposerPreview] = useState<string | null>(null);

  const [activeAssigneeValue, setActiveAssigneeValue] = useState<string>('');
  const [stoppingAutomation, setStoppingAutomation] = useState(false);
  const [chatStatus, setChatStatus] = useState<'Open' | 'Pending' | 'Resolved'>('Open');
  const [journeyProgressRefresh, setJourneyProgressRefresh] = useState(0);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [editContactData, setEditContactData] = useState<ContactEditPayload | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newContactOpen, setNewContactOpen] = useState(false);
  const [newChatPhoneNumberId, setNewChatPhoneNumberId] = useState<string | undefined>();
  const [auditsOpen, setAuditsOpen] = useState(false);
  const [sendingMedia, setSendingMedia] = useState(false);
  const [sendingText, setSendingText] = useState(false);
  // Synchronous guard: `sendingMedia` state isn't visible until the next
  // render, so a fast double-click/Enter-repeat can fire handleSendMessage
  // or handleSendAttachment twice before either state update lands —
  // sending the message to the customer twice. A ref is checked
  // synchronously and closes that window; state still drives the UI.
  const sendingRef = useRef(false);
  const [resendingMessageId, setResendingMessageId] = useState<string | null>(null);
  const [composerActionsOpen, setComposerActionsOpen] = useState(false);
  const inboxTabActive = useKeepAliveActive();
  const selectedConversationIdRef = useRef(selectedConversationId);
  selectedConversationIdRef.current = selectedConversationId;
  const inboxTabActiveRef = useRef(inboxTabActive);
  inboxTabActiveRef.current = inboxTabActive;

  const inboxThreadsRef = useRef(inboxThreads);
  inboxThreadsRef.current = inboxThreads;
  const chatHistoriesRef = useRef(chatHistories);
  chatHistoriesRef.current = chatHistories;

  /** Selected chat only counts as "reading" while Inbox tab is visible (KeepAlive). */
  const viewingConversationId = inboxTabActive ? selectedConversationId : '';

  const visibleChannelTabs = useMemo(
    () =>
      CHANNEL_TABS.filter((tab) => {
        if (!isInboxChannelAllowed(tab.id, inboxScope)) return false;
        if (tab.id === 'whatsapp') return whatsappAccounts.length > 0;
        if (tab.id === 'email') return emailConnected;
        if (tab.id === 'instagram') return instagramConnected;
        if (tab.id === 'messenger') return messengerConnected;
        if (tab.id === 'telegram') return telegramConnected;
        return false;
      }),
    [
      inboxScope,
      whatsappAccounts.length,
      emailConnected,
      instagramConnected,
      messengerConnected,
      telegramConnected,
    ]
  );

  const newChatWhatsAppAccounts = useMemo(
    () =>
      whatsappAccounts.filter((acc) =>
        isConversationInInboxScope(
          { channel: 'whatsapp', channelAccountId: acc.phoneNumberId },
          inboxScope
        )
      ),
    [whatsappAccounts, inboxScope]
  );

  useEffect(() => {
    if (!visibleChannelTabs.some((tab) => tab.id === channelFilter)) {
      setChannelFilter(visibleChannelTabs[0]?.id ?? 'whatsapp');
    }
  }, [channelFilter, visibleChannelTabs]);

  const filteredThreads = inboxThreads.filter((thread) => {
    const channel = contactChannel(thread);
    const matchesChannel = channel === channelFilter;
    const matchesScope = isConversationInInboxScope(
      {
        channel,
        channelAccountId: thread.channelAccountId,
      },
      inboxScope
    );

    const q = listSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      thread.name.toLowerCase().includes(q) ||
      (thread.handle || '').toLowerCase().includes(q) ||
      (thread.phone || '').toLowerCase().includes(q) ||
      (thread.lastMessage || '').toLowerCase().includes(q);

    if (!matchesChannel || !matchesScope || !matchesSearch) return false;

    if (filterTab === 'mine') {
      return assignedToByConversationId[thread.conversationId] === `user:${currentUserId}`;
    }
    if (filterTab === 'unassigned') {
      return !assignedToByConversationId[thread.conversationId];
    }
    return true;
  });

  const selectedThread =
    filteredThreads.find((t) => t.conversationId === selectedConversationId) ?? undefined;
  const selectedContact = selectedThread;
  const selectedChannel = selectedThread
    ? contactChannel(selectedThread)
    : channelFilter;
  /** WA inbox → WhatsApp journeys; IG inbox → Instagram automations. */
  const channelAutomations =
    selectedChannel === 'instagram'
      ? publishedInstagramJourneys
      : selectedChannel === 'whatsapp'
        ? publishedWhatsAppJourneys
        : [];
  const automationMenuLabel =
    selectedChannel === 'instagram' ? 'Instagram Automation' : 'WhatsApp Automation';
  const allAutomationsForLabels = useMemo(
    () => [...publishedWhatsAppJourneys, ...publishedInstagramJourneys],
    [publishedWhatsAppJourneys, publishedInstagramJourneys]
  );

  const activeHistory = selectedThread
    ? dedupeChatMessages(chatHistories[selectedThread.conversationId] || [])
    : [];
  const messageGroups = groupMessagesByDate(activeHistory);
  const showMessageSkeleton =
    messagesLoading &&
    Boolean(selectedConversationId) &&
    chatHistories[selectedConversationId] === undefined;
  const { progress: journeyProgress, initialLoading: journeyInitialLoading } =
    useContactJourneyProgress(
      selectedThread?.id ?? null,
      journeyProgressRefresh,
      selectedChannel === 'instagram' || selectedChannel === 'whatsapp'
        ? selectedChannel
        : null
    );

  const automationWaitingBanner = useMemo((): AutomationWaitingBanner | null => {
    if (!journeyProgress || journeyProgress.status !== 'waiting') return null;
    const current = journeyProgress.steps.find((s) => s.state === 'current');
    const kind: AutomationWaitingBanner['kind'] =
      current?.type === 'ASK_QUESTION' ||
      (current?.detail || '').toLowerCase().includes('reply')
        ? 'reply'
        : current?.type === 'WAIT'
          ? 'delay'
          : 'other';
    return {
      automationLabel: automationMenuLabel,
      journeyName: journeyProgress.journeyName,
      kind,
    };
  }, [journeyProgress, automationMenuLabel]);

  const lastInboundAt = useMemo(() => {
    for (let i = activeHistory.length - 1; i >= 0; i -= 1) {
      if (activeHistory[i].sender === 'contact' && activeHistory[i].createdAt) {
        return activeHistory[i].createdAt;
      }
    }
    return null;
  }, [activeHistory]);

  const messagingWindow = useMemo(
    () => messagingWindowFromLastInbound(lastInboundAt),
    [lastInboundAt]
  );

  useEffect(() => {
    if (loading) return;
    if (!filteredThreads.length) {
      if (selectedConversationId) setSelectedConversationId('');
      return;
    }
    if (!filteredThreads.some((t) => t.conversationId === selectedConversationId)) {
      setSelectedConversationId(filteredThreads[0].conversationId);
    }
  }, [loading, filteredThreads, selectedConversationId]);

  const sumUnreadForNav = useCallback(
    (threads: InboxThread[], activeConversationId: string) =>
      threads.reduce(
        (sum, thread) =>
          sum + (thread.conversationId === activeConversationId ? 0 : thread.unreadCount),
        0
      ),
    []
  );

  const selectThread = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    if (!isLargeUp) {
      setMobilePane('chat');
      setDetailsOpen(false);
    }
    setInboxThreads((prev) => {
      const next = prev.map((t) =>
        t.conversationId === conversationId ? { ...t, unreadCount: 0 } : t
      );
      dispatchInboxUnreadTotal(sumUnreadForNav(next, conversationId));
      return next;
    });
  }, [sumUnreadForNav, isLargeUp]);

  const loadConversations = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setLoadError(null);
    try {
      // Conversations only — assignee/channel metadata comes from React Query (useInboxAssigneeMeta)
      const convs = await fetchInboxConversationRows();

      const mapped: InboxThread[] = [];
      const assignMap: Record<string, string> = {};

      const activeConversationId = selectedConversationIdRef.current;

      convs.forEach((conv) => {
        const contact = conv.contact as Record<string, unknown>;
        const conversationId = String(conv.id);
        assignMap[conversationId] = encodeAssigneeFromConv(conv);
        const isActive = conversationId === activeConversationId;
        mapped.push(
          mapInboxThread(
            contact,
            {
              ...conv,
              unreadCount: isActive ? 0 : conv.unreadCount,
            },
            conversationId
          )
        );
      });

      const deduped = dedupeInboxThreads(mapped);
      setInboxThreads(deduped);
      setAssignedToByConversationId(assignMap);

      setSelectedConversationId((prev) => {
        const nextSelected =
          prev && deduped.some((t) => t.conversationId === prev)
            ? prev
            : deduped[0]?.conversationId ?? '';
        dispatchInboxUnreadTotal(sumUnreadForNav(deduped, nextSelected));
        return nextSelected;
      });

      return { mapped: deduped };
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load inbox');
      return null;
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [sumUnreadForNav]);

  const ingestConversation = useCallback(async (conversationId: string) => {
    try {
      const conv = (await api.getConversation(conversationId)) as Record<string, unknown>;
      const contact = conv.contact as Record<string, unknown>;
      const mapped = mapInboxThread(contact, conv, conversationId);
      const assignee = encodeAssigneeFromConv(conv);

      setAssignedToByConversationId((prev) => ({ ...prev, [conversationId]: assignee }));
      setInboxThreads((prev) => mergeInboxThreads(prev, mapped));
      return conversationId;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useKeepAliveActivation(() => {
    void loadConversations({ silent: true });
    const conversationId = selectedConversationIdRef.current;
    if (!conversationId) return;
    void api
      .getMessages(conversationId)
      .then((res) => {
        setChatHistories((prev) => ({
          ...prev,
          [conversationId]: historyFromMessagesResponse(res),
        }));
      })
      .catch(console.error);
  });

  useEffect(() => {
    if (!handoverToast) return;
    const t = window.setTimeout(() => setHandoverToast(null), 3000);
    return () => window.clearTimeout(t);
  }, [handoverToast]);

  useEffect(() => {
    setInboxVisible(inboxTabActive);
  }, [inboxTabActive]);

  useEffect(() => {
    setActiveInboxConversationId(selectedConversationId);
  }, [selectedConversationId]);

  useEffect(() => {
    dispatchInboxUnreadTotal(sumUnreadForNav(inboxThreads, viewingConversationId));
  }, [inboxThreads, viewingConversationId, sumUnreadForNav]);

  useEffect(() => () => setInboxVisible(false), []);

  useEffect(() => {
    const onOpenConversation = (event: Event) => {
      const conversationId = (event as CustomEvent<{ conversationId: string }>).detail
        ?.conversationId;
      if (!conversationId) return;
      selectThread(conversationId);
    };

    window.addEventListener(INBOX_OPEN_CONVERSATION_EVENT, onOpenConversation);
    return () => window.removeEventListener(INBOX_OPEN_CONVERSATION_EVENT, onOpenConversation);
  }, [selectThread]);

  useEffect(() => {
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') {
        void loadConversations({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', refreshOnFocus);
    return () => {
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessagesLoading(false);
      return;
    }

    const clearStaleSelection = () => {
      setInboxThreads((prev) => prev.filter((t) => t.conversationId !== selectedConversationId));
      setChatHistories((prev) => {
        const next = { ...prev };
        delete next[selectedConversationId];
        return next;
      });
      setSelectedConversationId('');
    };

    let cancelled = false;
    if (chatHistoriesRef.current[selectedConversationId] === undefined) {
      setMessagesLoading(true);
    }

    api
      .getConversation(selectedConversationId)
      .then(async (conv) => {
        if (cancelled) return;
        const contact = conv.contact as Record<string, unknown>;
        const mapped = mapInboxThread(contact, conv as Record<string, unknown>, selectedConversationId);
        setInboxThreads((prev) =>
          dedupeInboxThreads(
            prev.map((t) => (t.conversationId === selectedConversationId ? mapped : t))
          )
        );

        const res = await api.getMessages(selectedConversationId, { limit: MESSAGE_PAGE_SIZE });
        if (cancelled) return;
        const { hasMore } = normalizeMessagesResponse(res);
        setChatHistories((prev) => ({
          ...prev,
          [selectedConversationId]: historyFromMessagesResponse(res),
        }));
        setMessagesHasMore((prev) => ({ ...prev, [selectedConversationId]: hasMore }));
        setAssignedToByConversationId((prev) => ({
          ...prev,
          [selectedConversationId]: encodeAssigneeFromConv(conv as Record<string, unknown>),
        }));
        setInboxThreads((prev) =>
          prev.map((t) =>
            t.conversationId === selectedConversationId ? { ...t, unreadCount: 0 } : t
          )
        );
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('404') || message.toLowerCase().includes('not found')) {
          clearStaleSelection();
          return;
        }
        console.error(err);
      })
      .finally(() => {
        if (!cancelled) setMessagesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedConversationId]);

  useEffect(() => {
    const socket = getSocket();

    const reloadMessagesForConversation = async (conversationId: string) => {
      try {
        const res = await api.getMessages(conversationId);
        setChatHistories((prev) => ({
          ...prev,
          [conversationId]: historyFromMessagesResponse(res),
        }));
      } catch (err) {
        console.error(err);
      }
    };

    const onNewMessage = async (payload: {
      conversationId: string;
      message: Record<string, unknown>;
    }) => {
      const conversationId = payload.conversationId;
      const msg = mapMessageFromApi(payload.message);
      const isIncoming = payload.message.sender === 'contact';

      const known = inboxThreadsRef.current.some((t) => t.conversationId === conversationId);
      if (!known) {
        const ingested = await ingestConversation(conversationId);
        if (!ingested) {
          await loadConversations({ silent: true });
        }
      }

      // KeepAlive leaves Inbox mounted off-tab — don't treat selection as "reading" then
      const isViewing =
        inboxTabActiveRef.current && conversationId === selectedConversationIdRef.current;

      setChatHistories((prev) => {
        const history = prev[conversationId] || [];
        // Replace optimistic pending bubble when the server echo arrives
        if (msg.sender === 'agent') {
          const pendingIdx = history.findIndex(
            (m) =>
              m.id.startsWith('pending-') &&
              m.sender === 'agent' &&
              m.content === msg.content
          );
          if (pendingIdx >= 0) {
            const pending = history[pendingIdx];
            const next = [...history];
            next[pendingIdx] = {
              ...msg,
              localPreviewUrl: msg.localPreviewUrl || pending.localPreviewUrl,
              status: msg.status === 'sending' ? 'sent' : msg.status,
            };
            return { ...prev, [conversationId]: next };
          }
        }
        return appendChatMessage(prev, conversationId, msg);
      });

      setInboxThreads((prev) => {
        const idx = prev.findIndex((t) => t.conversationId === conversationId);
        if (idx === -1) return prev;
        const next = bumpInboxThread(prev, conversationId, {
          lastMessage: msg.content,
          lastActive: 'Just now',
          unreadCount:
            isIncoming && !isViewing ? prev[idx].unreadCount + 1 : isViewing ? 0 : prev[idx].unreadCount,
        });
        const viewingId = inboxTabActiveRef.current
          ? selectedConversationIdRef.current
          : '';
        dispatchInboxUnreadTotal(sumUnreadForNav(next, viewingId));
        return next;
      });

      if (isViewing) {
        setJourneyProgressRefresh((n) => n + 1);
      }
    };

    const onContactUpdated = (payload: {
      contactId: string;
      tags?: string[];
      name?: string;
      avatar?: string;
    }) => {
      const { contactId, tags, name, avatar } = payload;
      if (!contactId) return;
      setInboxThreads((prev) =>
        prev.map((t) =>
          t.id === contactId
            ? {
                ...t,
                ...(tags && { tags }),
                ...(name && { name }),
                ...(avatar && { avatar }),
              }
            : t
        )
      );
    };

    const onConversationUpdated = async (payload: { conversationId: string }) => {
      const conversationId = payload.conversationId;
      const known = inboxThreadsRef.current.some((t) => t.conversationId === conversationId);
      if (!known) {
        const ingested = await ingestConversation(conversationId);
        if (!ingested) {
          await loadConversations({ silent: true });
        }
      }

      try {
        const conv = (await api.getConversation(conversationId)) as Record<string, unknown>;
        const isViewing =
          inboxTabActiveRef.current && conversationId === selectedConversationIdRef.current;
        const contact = conv.contact as Record<string, unknown>;
        const mapped = mapInboxThread(
          contact,
          {
            ...conv,
            unreadCount: isViewing ? 0 : conv.unreadCount,
          },
          conversationId
        );

        setInboxThreads((prev) => {
          const next = mergeInboxThreads(prev, mapped);
          const viewingId = inboxTabActiveRef.current
            ? selectedConversationIdRef.current
            : '';
          dispatchInboxUnreadTotal(sumUnreadForNav(next, viewingId));
          return next;
        });

        setAssignedToByConversationId((prev) => ({
          ...prev,
          [conversationId]: encodeAssigneeFromConv(conv),
        }));

        // getMessages marks the thread read — only while Inbox is on screen
        if (isViewing) {
          await reloadMessagesForConversation(conversationId);
        }
      } catch (err) {
        console.error(err);
      }
    };

    // Live delivery/read ticks (Meta status / Instagram messaging_seen webhooks)
    const onMessageStatus = (payload: {
      messageId: string;
      status: string;
      clicked?: boolean;
      errors?: Array<{ code?: number; title?: string; message?: string }>;
    }) => {
      const { messageId, status, clicked, errors } = payload;
      if (!messageId || !status) return;
      const err = errors?.[0];
      const deliveryError = err
        ? [err.title || err.message, err.code != null ? `(${err.code})` : null]
            .filter(Boolean)
            .join(' ') || undefined
        : undefined;
      setChatHistories((prev) => {
        let changed = false;
        const next: Record<string, ChatMessage[]> = {};
        for (const convId of Object.keys(prev)) {
          const msgs = prev[convId] ?? [];
          const anchor = msgs.find((m) => m.id === messageId);
          if (!anchor) {
            next[convId] = msgs;
            continue;
          }
          changed = true;
          if (status === 'read') {
            const cutoff = new Date(anchor.createdAt).getTime();
            next[convId] = msgs.map((m) => {
              if (m.sender === 'contact') return m;
              if (m.id === messageId) {
                return {
                  ...m,
                  status: 'read',
                  ...(clicked || m.clicked ? { clicked: true } : {}),
                  ...(deliveryError ? { deliveryError } : {}),
                };
              }
              if (m.status === 'read') return m;
              if (new Date(m.createdAt).getTime() <= cutoff) {
                return { ...m, status: 'read' };
              }
              return m;
            });
          } else {
            next[convId] = msgs.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    status: status as ChatMessage['status'],
                    ...(clicked || m.clicked ? { clicked: true } : {}),
                    ...(deliveryError ? { deliveryError } : {}),
                  }
                : m
            );
          }
        }
        return changed ? next : prev;
      });
    };

    socket.on('new_message', onNewMessage);
    socket.on('conversation_updated', onConversationUpdated);
    socket.on('contact_updated', onContactUpdated);
    socket.on('message_status', onMessageStatus);

    const onConversationEvent = (payload: {
      conversationId: string;
      event: ConversationEventApi;
    }) => {
      if (!payload?.conversationId || !payload.event) return;
      const isViewing =
        inboxTabActiveRef.current &&
        payload.conversationId === selectedConversationIdRef.current;
      if (!isViewing) return;
      const sys = mapConversationEventToMessage(payload.event);
      setChatHistories((prev) => {
        const history = prev[payload.conversationId] || [];
        if (history.some((m) => m.id === sys.id)) return prev;
        return {
          ...prev,
          [payload.conversationId]: [...history, sys].sort(
            (a, b) =>
              new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
          ),
        };
      });
    };
    socket.on('conversation_event', onConversationEvent);

    const onMessengerSyncProgress = (payload: { phase?: string }) => {
      if (payload.phase === 'completed' || payload.phase === 'error') {
        void loadConversations();
      }
    };
    socket.on('messenger_sync_progress', onMessengerSyncProgress);

    const onInstagramSyncProgress = (payload: InstagramSyncProgressPayload) => {
      if (payload.phase === 'started') {
        setInstagramSyncing(true);
        setInstagramSyncHint(formatInstagramSyncProgress(payload));
      } else if (payload.phase === 'completed') {
        setInstagramSyncing(false);
        setInstagramSyncHint(formatInstagramSyncProgress(payload));
        const more = Boolean(payload.hasMore);
        setInstagramHasMore(more);
        try {
          sessionStorage.setItem(IG_INBOX_HAS_MORE_KEY, more ? '1' : '0');
        } catch {
          /* ignore */
        }
        void loadConversations();
      } else if (payload.phase === 'error') {
        setInstagramSyncing(false);
        setInstagramSyncHint(formatInstagramSyncProgress(payload));
      } else if (payload.message) {
        setInstagramSyncHint(payload.message);
      }
    };
    socket.on('instagram_sync_progress', onInstagramSyncProgress);

    // A dropped-then-restored connection (flaky network, brief server
    // restart) misses every event broadcast during the gap — the tab may
    // never have gone hidden, so the visibilitychange refresh above never
    // fires either. Catch up explicitly on reconnect.
    const onReconnect = () => {
      void loadConversations({ silent: true });
      const activeId = selectedConversationIdRef.current;
      if (activeId) void reloadMessagesForConversation(activeId);
    };
    socket.io.on('reconnect', onReconnect);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('conversation_updated', onConversationUpdated);
      socket.off('contact_updated', onContactUpdated);
      socket.off('message_status', onMessageStatus);
      socket.off('conversation_event', onConversationEvent);
      socket.off('messenger_sync_progress', onMessengerSyncProgress);
      socket.off('instagram_sync_progress', onInstagramSyncProgress);
      socket.io.off('reconnect', onReconnect);
    };
    // inboxThreads intentionally omitted — handlers read inboxThreadsRef.current
    // instead so this effect doesn't tear down and re-register all socket
    // listeners on nearly every incoming event.
  }, [ingestConversation, loadConversations, sumUnreadForNav]);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const composerActionsRef = useRef<HTMLDivElement>(null);
  const [sendMediaDialogOpen, setSendMediaDialogOpen] = useState(false);

  useEffect(() => {
    if (!composerActionsOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (
        composerActionsRef.current &&
        !composerActionsRef.current.contains(event.target as Node)
      ) {
        setComposerActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [composerActionsOpen]);

  useEffect(() => {
    setComposerActionsOpen(false);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedContact) return;
    setActiveAssigneeValue(assignedToByConversationId[selectedThread.conversationId] ?? '');
    setChatStatus(selectedThread.status);
  }, [selectedConversationId, selectedThread, assignedToByConversationId]);

  useEffect(() => {
    setPendingComposerFile(null);
    setPendingComposerPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [selectedConversationId]);

  const clearPendingComposerMedia = useCallback(() => {
    setPendingComposerFile(null);
    setPendingComposerPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeHistory]);

  const persistConversation = async (patch: {
    status?: string;
    assigneeType?: string | null;
    assigneeId?: string | null;
  }) => {
    if (!selectedThread) return;
    const convId = selectedThread.conversationId;
    try {
      const updated = (await api.updateConversation(convId, patch)) as Record<string, unknown>;
      const assigneeValue = encodeAssigneeFromConv(updated);
      const label = assigneeLabelFromValue(
        assigneeValue,
        teamAgents,
        aiAgents,
        ruleBasedBots,
        allAutomationsForLabels
      );
      const statusCap = patch.status
        ? ((patch.status.charAt(0).toUpperCase() + patch.status.slice(1)) as Contact['status'])
        : undefined;

      setAssignedToByConversationId((prev) => ({ ...prev, [convId]: assigneeValue }));
      setInboxThreads((prev) =>
        prev.map((t) =>
          t.conversationId === convId
            ? {
                ...t,
                assignedAgent: label,
                ...(statusCap && { status: statusCap }),
              }
            : t
        )
      );
      if (patch.assigneeType === 'journey') {
        setJourneyProgressRefresh((n) => n + 1);
      }
    } catch (err) {
      console.error(err);
      setSendError(err instanceof Error ? err.message : 'Failed to update assignment');
    }
  };

  const handleTakeover = async () => {
    if (!selectedThread || takeoverLoading) return;
    const convId = selectedThread.conversationId;
    setTakeoverLoading(true);
    setSendError(null);
    try {
      const updated = (await api.takeoverConversation(convId)) as Record<string, unknown>;
      const assigneeValue = encodeAssigneeFromConv(updated);
      const label = assigneeLabelFromValue(
        assigneeValue,
        teamAgents,
        aiAgents,
        ruleBasedBots,
        allAutomationsForLabels
      );
      setAssignedToByConversationId((prev) => ({ ...prev, [convId]: assigneeValue }));
      setActiveAssigneeValue(assigneeValue);
      setInboxThreads((prev) =>
        prev.map((t) =>
          t.conversationId === convId ? { ...t, assignedAgent: label } : t
        )
      );
      const res = await api.getMessages(convId);
      setChatHistories((prev) => ({
        ...prev,
        [convId]: historyFromMessagesResponse(res),
      }));
      setHandoverToast('You took over this chat');
    } catch (err) {
      console.error(err);
      setSendError(formatCatchError(err) || 'Failed to take over chat');
    } finally {
      setTakeoverLoading(false);
    }
  };

  const handleReleaseToAi = async () => {
    if (!selectedThread || releaseLoading) return;
    const convId = selectedThread.conversationId;
    setReleaseLoading(true);
    setSendError(null);
    try {
      const updated = (await api.releaseConversationToAi(convId)) as Record<string, unknown>;
      const assigneeValue = encodeAssigneeFromConv(updated);
      const label = assigneeLabelFromValue(
        assigneeValue,
        teamAgents,
        aiAgents,
        ruleBasedBots,
        allAutomationsForLabels
      );
      setAssignedToByConversationId((prev) => ({ ...prev, [convId]: assigneeValue }));
      setActiveAssigneeValue(assigneeValue);
      setInboxThreads((prev) =>
        prev.map((t) =>
          t.conversationId === convId ? { ...t, assignedAgent: label } : t
        )
      );
      const res = await api.getMessages(convId);
      setChatHistories((prev) => ({
        ...prev,
        [convId]: historyFromMessagesResponse(res),
      }));
      setHandoverToast('Chat released to AI');
    } catch (err) {
      console.error(err);
      setSendError(formatCatchError(err) || 'Failed to release chat to AI');
    } finally {
      setReleaseLoading(false);
    }
  };

  const handleSendAttachment = async (file: File) => {
    if (!selectedThread || sendingMedia || sendingRef.current) return;
    sendingRef.current = true;
    const convId = selectedThread.conversationId;
    const caption = messageInput.trim();
    const pendingId = `pending-${Date.now()}`;
    const localPreviewUrl = URL.createObjectURL(file);
    const kind = mediaKindFromFile(file);
    const preview = previewLabelForFile(file, caption);
    const pendingMessage: ChatMessage = {
      id: pendingId,
      sender: 'agent',
      senderName: getUserName() || 'Agent',
      content: preview,
      type: kind,
      media: { fileName: file.name, mimeType: file.type, caption: caption || undefined },
      createdAt: new Date().toISOString(),
      timestamp: 'Just now',
      status: 'sending',
      localPreviewUrl,
    };

    setSendError(null);
    setSendingMedia(true);
    setMessageInput('');
    clearPendingComposerMedia();
    setChatHistories((prev) => appendChatMessage(prev, convId, pendingMessage));
    setInboxThreads((prev) =>
      bumpInboxThread(prev, convId, {
        lastMessage: preview,
        unreadCount: 0,
        lastActive: 'Just now',
      })
    );

    try {
      const sent = await api.sendMediaMessage(convId, file, caption || undefined);
      const newMessage = {
        ...mapMessageFromApi(sent as Record<string, unknown>),
        localPreviewUrl,
        status: 'sent' as const,
      };
      setChatHistories((prev) => replaceChatMessage(prev, convId, pendingId, newMessage));
      setInboxThreads((prev) =>
        bumpInboxThread(prev, convId, {
          lastMessage: newMessage.content,
          unreadCount: 0,
          lastActive: 'Just now',
        })
      );
      setJourneyProgressRefresh((n) => n + 1);
      // Keep blob URL on the message so preview stays stable (no skeleton flash)
    } catch (err) {
      if (err instanceof SendFailedError && err.failedMessage) {
        const failed = {
          ...mapMessageFromApi(err.failedMessage),
          localPreviewUrl,
        };
        setChatHistories((prev) => replaceChatMessage(prev, convId, pendingId, failed));
      } else {
        setChatHistories((prev) => removeChatMessage(prev, convId, pendingId));
        if (caption) setMessageInput(caption);
        URL.revokeObjectURL(localPreviewUrl);
      }
      setSendError(err instanceof Error ? err.message : 'Failed to send attachment');
      console.error(err);
    } finally {
      setSendingMedia(false);
      sendingRef.current = false;
    }
  };

  /** Telegram-only album (sendMediaGroup) — 2-10 photos/videos, one shared caption. */
  const handleSendCarousel = async (files: File[]) => {
    if (!selectedThread || sendingMedia || sendingRef.current || files.length < 2) return;
    sendingRef.current = true;
    const convId = selectedThread.conversationId;
    const caption = messageInput.trim();
    const pendingId = `pending-${Date.now()}`;
    const localPreviewUrls = files.map((f) => URL.createObjectURL(f));
    const preview = caption || `📷 Album (${files.length} items)`;
    const pendingMessage: ChatMessage = {
      id: pendingId,
      sender: 'agent',
      senderName: getUserName() || 'Agent',
      content: preview,
      type: 'carousel',
      media: { caption: caption || undefined },
      carouselItems: files.map((f) => ({ mimeType: f.type, fileName: f.name, hasFile: true })),
      localPreviewUrls,
      createdAt: new Date().toISOString(),
      timestamp: 'Just now',
      status: 'sending',
    };

    setSendError(null);
    setSendingMedia(true);
    setMessageInput('');
    clearPendingComposerMedia();
    setChatHistories((prev) => appendChatMessage(prev, convId, pendingMessage));
    setInboxThreads((prev) =>
      bumpInboxThread(prev, convId, {
        lastMessage: preview,
        unreadCount: 0,
        lastActive: 'Just now',
      })
    );

    try {
      const sent = await api.sendCarouselMessage(convId, files, caption || undefined);
      const newMessage = {
        ...mapMessageFromApi(sent as Record<string, unknown>),
        localPreviewUrls,
        status: 'sent' as const,
      };
      setChatHistories((prev) => replaceChatMessage(prev, convId, pendingId, newMessage));
      setInboxThreads((prev) =>
        bumpInboxThread(prev, convId, {
          lastMessage: newMessage.content,
          unreadCount: 0,
          lastActive: 'Just now',
        })
      );
      setJourneyProgressRefresh((n) => n + 1);
    } catch (err) {
      setChatHistories((prev) => removeChatMessage(prev, convId, pendingId));
      if (caption) setMessageInput(caption);
      localPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
      setSendError(err instanceof Error ? err.message : 'Failed to send album');
      console.error(err);
    } finally {
      setSendingMedia(false);
      sendingRef.current = false;
    }
  };

  const handleGallerySinglePick = async (image: PickedGalleryImage) => {
    try {
      const file = await urlToFile(image.url, image.filename || image.title);
      if (selectedContact && contactChannel(selectedContact) === 'telegram') {
        const sizeError = telegramFileSizeError(file);
        if (sizeError) {
          setSendError(sizeError);
          return;
        }
      }
      await handleSendAttachment(file);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to load file from Media Gallery');
    }
  };

  const handleGalleryMultiplePick = async (images: PickedGalleryImage[]) => {
    try {
      const files = await Promise.all(
        images.map((img) => urlToFile(img.url, img.filename || img.title))
      );
      if (selectedContact && contactChannel(selectedContact) === 'telegram') {
        const sizeError = files.map(telegramFileSizeError).find(Boolean);
        if (sizeError) {
          setSendError(sizeError);
          return;
        }
      }
      await handleSendCarousel(files);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to load files from Media Gallery');
    }
  };

  const handleCannedSelect = async (selection: CannedSelection) => {
    setSendError(null);
    setMessageInput(selection.message);
    clearPendingComposerMedia();
    if (!selection.hasMedia) return;
    // Media messages are only supported on WhatsApp, Instagram, and
    // Messenger (backend guard in routes/conversations.ts) — attaching the
    // canned response's media on any other channel (e.g. Email) would only
    // fail at send time with a confusing error, so just keep the text.
    const channel = selectedContact ? contactChannel(selectedContact) : null;
    if (channel !== 'whatsapp' && channel !== 'instagram' && channel !== 'messenger') return;
    try {
      const blob = await api.fetchCannedResponseMedia(selection.cannedId);
      const fileName = selection.mediaFileName || 'attachment';
      const file = new File([blob], fileName, {
        type: blob.type || 'application/octet-stream',
      });
      setPendingComposerFile(file);
      setPendingComposerPreview(URL.createObjectURL(blob));
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Could not load canned media');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedThread) return;
    if (pendingComposerFile) {
      await handleSendAttachment(pendingComposerFile);
      return;
    }
    if (!messageInput.trim()) return;
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSendingText(true);

    const content = messageInput.trim();
    const convId = selectedThread.conversationId;
    const pendingId = `pending-${Date.now()}`;
    const pendingMessage: ChatMessage = {
      id: pendingId,
      sender: 'agent',
      senderName: getUserName() || 'Agent',
      content,
      type: 'text',
      createdAt: new Date().toISOString(),
      timestamp: 'Just now',
      status: 'sending',
    };

    setMessageInput('');
    setSendError(null);
    setChatHistories((prev) => appendChatMessage(prev, convId, pendingMessage));
    setInboxThreads((prev) =>
      bumpInboxThread(prev, convId, {
        lastMessage: content,
        unreadCount: 0,
        lastActive: 'Just now',
      })
    );

    try {
      const sent = await api.sendMessage(convId, content);
      const newMessage = {
        ...mapMessageFromApi(sent as Record<string, unknown>),
        status: 'sent' as const,
      };
      setChatHistories((prev) => replaceChatMessage(prev, convId, pendingId, newMessage));
      setJourneyProgressRefresh((n) => n + 1);
    } catch (err) {
      if (err instanceof SendFailedError && err.failedMessage) {
        setChatHistories((prev) =>
          replaceChatMessage(prev, convId, pendingId, mapMessageFromApi(err.failedMessage!))
        );
      } else {
        setChatHistories((prev) => removeChatMessage(prev, convId, pendingId));
        setMessageInput(content);
      }
      setSendError(err instanceof Error ? err.message : 'Failed to send message');
      console.error(err);
    } finally {
      sendingRef.current = false;
      setSendingText(false);
    }
  };

  const handleResendMessage = async (messageId: string) => {
    if (!selectedThread || resendingMessageId) return;
    const convId = selectedThread.conversationId;
    setResendingMessageId(messageId);
    setSendError(null);
    setChatHistories((prev) => {
      const msgs = prev[convId] ?? [];
      return {
        ...prev,
        [convId]: msgs.map((m) =>
          m.id === messageId ? { ...m, status: 'resend_pending' as const } : m
        ),
      };
    });
    try {
      const sent = await api.resendMessage(messageId);
      setChatHistories((prev) =>
        replaceChatMessage(prev, convId, messageId, mapMessageFromApi(sent))
      );
    } catch (err) {
      setChatHistories((prev) => {
        const msgs = prev[convId] ?? [];
        return {
          ...prev,
          [convId]: msgs.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  status: 'failed' as const,
                  deliveryError: err instanceof Error ? err.message : 'Resend failed',
                }
              : m
          ),
        };
      });
      setSendError(err instanceof Error ? err.message : 'Resend failed');
    } finally {
      setResendingMessageId(null);
    }
  };

  const handleLoadOlderMessages = async () => {
    if (!selectedThread || loadingOlderMessages) return;
    const convId = selectedThread.conversationId;
    const history = chatHistories[convId] ?? [];
    const oldestReal = history.find((m) => m.sender !== 'system' && !isPendingMessageId(m.id));
    if (!oldestReal) return;

    setLoadingOlderMessages(true);
    try {
      const res = await api.getMessages(convId, {
        limit: MESSAGE_PAGE_SIZE,
        before: oldestReal.id,
      });
      const { messages: olderRaw, events, hasMore } = normalizeMessagesResponse(res);
      const olderMapped = olderRaw.map((m) => mapMessageFromApi(m));
      setChatHistories((prev) => {
        const current = prev[convId] ?? [];
        // `events` is always the conversation's COMPLETE event list
        // regardless of pagination — re-deriving all event bubbles fresh
        // against the union of both windows (rather than trying to merge
        // incrementally) keeps them correctly interleaved, and
        // dedupeChatMessages' id-based check safely collapses any repeats.
        const currentRealOnly = current.filter((m) => m.sender !== 'system');
        const merged = mergeMessagesAndEvents([...olderMapped, ...currentRealOnly], events);
        return { ...prev, [convId]: dedupeChatMessages(merged) };
      });
      setMessagesHasMore((prev) => ({ ...prev, [convId]: hasMore }));
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to load older messages');
    } finally {
      setLoadingOlderMessages(false);
    }
  };

  const openEditContact = async () => {
    if (!selectedContact) return;
    setSendError(null);
    try {
      const raw = (await api.getContact(selectedContact.id)) as Record<string, unknown>;
      const customFields = (raw.customFields as Record<string, string>) ?? {};
      setEditContactData({
        id: String(raw.id),
        name: String(raw.name),
        phone: String(raw.phone),
        email: raw.email ? String(raw.email) : undefined,
        tags: (raw.tags as string[]) ?? [],
        customFields,
        channel: selectedContact.channel,
        excludeFromInsights: Boolean(raw.excludeFromInsights),
      });
      setEditContactOpen(true);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Could not load contact');
    }
  };

  const startWhatsAppChat = useCallback(
    async (contactId: string, phoneNumberId?: string) => {
      setSendError(null);
      let conv: Record<string, unknown>;
      try {
        conv = (await api.openConversation(contactId, phoneNumberId)) as Record<string, unknown>;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not start chat';
        setSendError(message);
        throw err;
      }
      const contact = conv.contact as Record<string, unknown>;
      const conversationId = String(conv.id);
      const mapped = mapInboxThread(contact, conv, conversationId);
      const assignee = encodeAssigneeFromConv(conv);

      setAssignedToByConversationId((prev) => ({ ...prev, [conversationId]: assignee }));
      setInboxThreads((prev) => mergeInboxThreads(prev, mapped));
      selectThread(conversationId);
      setNewChatOpen(false);
      setNewContactOpen(false);
      setNewChatPhoneNumberId(undefined);
    },
    [selectThread]
  );

  const startEmailChat = useCallback(
    async (payload: InboxEmailSendPayload) => {
      setSendError(null);
      let result: {
        conversation?: Record<string, unknown>;
        message?: Record<string, unknown>;
      };
      try {
        result = (await api.sendInboxEmail(payload)) as typeof result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not send email';
        setSendError(message);
        throw err;
      }
      const conv = result.conversation;
      if (!conv?.id) {
        const message = 'Email sent but conversation was not returned';
        setSendError(message);
        throw new Error(message);
      }
      const contact = (conv.contact as Record<string, unknown>) ?? {};
      const conversationId = String(conv.id);
      const mapped = mapInboxThread(contact, conv, conversationId);
      const assignee = encodeAssigneeFromConv(conv);

      setAssignedToByConversationId((prev) => ({ ...prev, [conversationId]: assignee }));
      setInboxThreads((prev) => mergeInboxThreads(prev, mapped));
      if (result.message) {
        setChatHistories((prev) =>
          appendChatMessage(prev, conversationId, mapMessageFromApi(result.message!))
        );
      }
      selectThread(conversationId);
      setChannelFilter('email');
      setNewChatOpen(false);
    },
    [selectThread]
  );

  const handleDeleteConversation = async () => {
    if (!selectedThread) return;
    const label = selectedThread.name || contactDisplayHandle(selectedThread);
    const confirmed = window.confirm(
      `Delete this chat with ${label}? Messages will be removed from the inbox.`
    );
    if (!confirmed) return;

    setSendError(null);
    try {
      await api.deleteConversation(selectedThread.conversationId);
      const deletedId = selectedThread.conversationId;
      setInboxThreads((prev) => {
        const next = prev.filter((t) => t.conversationId !== deletedId);
        dispatchInboxUnreadTotal(sumUnreadForNav(next, ''));
        return next;
      });
      setChatHistories((prev) => {
        const next = { ...prev };
        delete next[deletedId];
        return next;
      });
      setAssignedToByConversationId((prev) => {
        const next = { ...prev };
        delete next[deletedId];
        return next;
      });
      setSelectedConversationId('');
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to delete chat');
    }
  };

  const handleBlacklistContact = async () => {
    if (!selectedThread || selectedThread.tags.includes('Blocked')) return;
    const label = selectedThread.name || contactDisplayHandle(selectedThread);
    const confirmed = window.confirm(
      `Blacklist ${label}? They'll be excluded from future campaigns.`
    );
    if (!confirmed) return;

    setSendError(null);
    try {
      // Matches backend's contactOptOut.service.ts BLOCKED_TAG — campaign
      // audience building already excludes contacts carrying this tag.
      const nextTags = Array.from(new Set([...selectedThread.tags, 'Blocked']));
      await api.updateContact(selectedThread.id, { tags: nextTags });
      // Local state updates via the contact_updated socket event this call triggers.
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to blacklist contact');
    }
  };

  const handleContactSaved = async () => {
    if (!selectedThread) return;
    try {
      const raw = (await api.getContact(selectedThread.id)) as Record<string, unknown>;
      const conv = (await api
        .getConversation(selectedThread.conversationId)
        .catch(() => null)) as Record<string, unknown> | null;
      const mapped: InboxThread = {
        ...mapContactFromApi(raw, conv ?? undefined),
        conversationId: selectedThread.conversationId,
      };
      setInboxThreads((prev) =>
        prev.map((t) => (t.conversationId === selectedThread.conversationId ? mapped : t))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiSuggest = () => {
    if (!selectedContact) return;
    const interest =
      selectedContact.courseInterest !== '—'
        ? selectedContact.courseInterest
        : 'our programs';
    setMessageInput(
      `Hello ${selectedContact.name}! Thanks for reaching out. I can help with ${interest}, scheduling, and next steps. What would you like to know first?`
    );
  };

  const handleTriggerTemplate = () => {
    if (!selectedContact) return;
    if (contactChannel(selectedContact) === 'instagram') {
      setSendError('Templates are not available for Instagram DMs.');
      return;
    }
    if (contactChannel(selectedContact) === 'messenger') {
      setSendError('Templates are not available for Messenger.');
      return;
    }
    setSendError(null);
    setShowTemplatePicker(true);
  };

  const handleSendTemplate = async (
    templateId: string,
    variables: string[],
    headerMediaFile?: File | null
  ) => {
    if (!selectedThread) return;
    setSendError(null);
    const convId = selectedThread.conversationId;

    try {
      const sent = await api.sendTemplateMessage(convId, templateId, variables, headerMediaFile);
      const newMessage = mapMessageFromApi(sent as Record<string, unknown>);
      setChatHistories((prev) => appendChatMessage(prev, convId, newMessage));
      setInboxThreads((prev) =>
        bumpInboxThread(prev, convId, {
          lastMessage: newMessage.content,
          unreadCount: 0,
          lastActive: 'Just now',
        })
      );
    } catch (err) {
      if (err instanceof SendFailedError && err.failedMessage) {
        setChatHistories((prev) =>
          appendChatMessage(prev, convId, mapMessageFromApi(err.failedMessage!))
        );
      }
      setSendError(err instanceof Error ? err.message : 'Failed to send template');
      throw err;
    }
  };

  const instagramThreadCount = inboxThreads.filter(
    (thread) => contactChannel(thread) === 'instagram'
  ).length;

  const channelEmptyMessage =
    channelFilter === 'whatsapp'
      ? 'No WhatsApp conversations yet.'
      : channelFilter === 'email'
        ? 'No email conversations yet.'
        : channelFilter === 'messenger'
          ? 'No Messenger conversations yet.'
          : 'No Instagram conversations yet.';

  async function handleInstagramSync(opts?: { loadMore?: boolean }) {
    setInstagramSyncing(true);
    setInstagramSyncHint(
      opts?.loadMore ? 'Loading more Instagram chats…' : 'Starting Instagram sync…'
    );
    try {
      const res = (await api.syncInstagramInbox(
        opts?.loadMore ? { loadMore: true } : undefined
      )) as { message?: string };
      setInstagramSyncHint(res.message || 'Instagram sync started…');
    } catch (err) {
      setInstagramSyncing(false);
      setInstagramSyncHint(
        err instanceof Error ? err.message : 'Failed to start Instagram sync'
      );
    }
  }

  const listEmptyMessage = loading
    ? 'Loading conversations…'
    : loadError
      ? loadError
      : filterTab === 'mine'
        ? `No conversations assigned to ${currentUserName || 'you'}.`
        : filterTab === 'unassigned'
          ? 'No unassigned conversations.'
          : inboxThreads.some((t) => contactChannel(t) === channelFilter)
            ? 'No conversations in this view.'
            : channelEmptyMessage;

  const hasConnectedChannel =
    whatsappAccounts.length > 0 || emailConnected || instagramConnected || messengerConnected;
  const showConnectChannelEmpty = channelsReady && !hasConnectedChannel;

  if (showConnectChannelEmpty) {
    return (
      <div className="flex flex-row h-full min-h-0 overflow-hidden bg-surface-muted border-t border-swiss-line selection:bg-primary/15">
        <ConnectChannelEmpty
          onConnect={() => navigate(pathForIntegrationsChannel('whatsapp'))}
        />
      </div>
    );
  }

  const activeAssigneeType = decodeAssigneeValue(activeAssigneeValue).assigneeType;
  const isAutomationActive =
    activeAssigneeType === 'journey' ||
    activeAssigneeType === 'ai' ||
    activeAssigneeType === 'ai_agent' ||
    activeAssigneeType === 'rule_based';

  const handleStopAutomation = async () => {
    if (stoppingAutomation) return;
    setStoppingAutomation(true);
    setActiveAssigneeValue('');
    try {
      await persistConversation({ assigneeType: null, assigneeId: null });
    } finally {
      setStoppingAutomation(false);
    }
  };

  const profileSidebarProps = selectedContact
    ? {
        contact: selectedContact,
        conversationId: selectedConversationId,
        contactHandle: contactDisplayHandle(selectedContact),
        journeyProgress,
        journeyInitialLoading,
        publishedJourneys: channelAutomations,
        automationLabel: automationMenuLabel,
        assignedJourneyId:
          decodeAssigneeValue(activeAssigneeValue).assigneeType === 'journey'
            ? decodeAssigneeValue(activeAssigneeValue).assigneeId
            : null,
        onAssignJourney: (journeyId: string) => {
          const nextValue = `journey:${journeyId}`;
          setActiveAssigneeValue(nextValue);
          void persistConversation({
            assigneeType: 'journey',
            assigneeId: journeyId,
          });
        },
        onEditContact: () => void openEditContact(),
        onDeleteChat: () => void handleDeleteConversation(),
        onBlacklistContact: () => void handleBlacklistContact(),
        onViewAudits: () => setAuditsOpen(true),
        onClose: () => setDetailsOpen(false),
      }
    : null;

  return (
    <div className="flex flex-row h-full min-h-0 overflow-hidden bg-surface-muted border-t border-swiss-line selection:bg-primary/15">
      <section
        className={`${
          isLargeUp ? 'w-[300px] xl:w-[320px]' : 'w-full'
        } shrink-0 flex-col bg-white border-r border-swiss-line h-full text-left ${
          !isLargeUp && mobilePane !== 'list' ? 'hidden' : 'flex'
        }`}
      >
        <div className="p-3 border-b border-swiss-line flex flex-col gap-2.5">
          <div
            className="flex min-w-0 gap-1 rounded-xl bg-surface-muted p-1 ring-1 ring-swiss-line"
            role="tablist"
            aria-label="Filter conversations"
          >
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filterTab === tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`flex-1 cursor-pointer rounded-lg py-1.5 text-xs font-bold transition-colors duration-200 ${
                  filterTab === tab.id
                    ? 'bg-white text-primary ring-1 ring-primary/15'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div
            className="flex min-w-0 gap-1 rounded-xl bg-surface-muted p-1 ring-1 ring-swiss-line"
            role="tablist"
            aria-label="Channel"
          >
            {visibleChannelTabs.map((tab) => {
              const active = channelFilter === tab.id;
              const iconClass = `h-4 w-4 ${
                active
                  ? tab.id === 'instagram'
                    ? 'text-[#E1306C]'
                    : tab.id === 'messenger'
                      ? 'text-[#1877F2]'
                      : tab.id === 'telegram'
                        ? 'text-[#229ED9]'
                        : tab.id === 'email'
                          ? 'text-emerald-800'
                          : 'text-[#25D366]'
                  : 'text-slate-500'
              }`;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={tab.label}
                  title={tab.label}
                  onClick={() => setChannelFilter(tab.id)}
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg py-1.5 transition-colors duration-200 ${
                    active
                      ? 'bg-white ring-1 ring-black/5'
                      : 'hover:bg-white/70'
                  }`}
                >
                  {tab.id === 'instagram' ? (
                    <InstagramIcon className={iconClass} />
                  ) : tab.id === 'messenger' ? (
                    <MessengerIcon className={iconClass} />
                  ) : tab.id === 'telegram' ? (
                    <TelegramIcon className={iconClass} />
                  ) : tab.id === 'email' ? (
                    <Mail className={iconClass} aria-hidden />
                  ) : (
                    <WhatsAppIcon className={iconClass} />
                  )}
                </button>
              );
            })}
            {(channelFilter === 'whatsapp' && whatsappAccounts.length > 0) ||
            (channelFilter === 'email' && emailConnected) ? (
              <button
                type="button"
                onClick={() => setNewChatOpen(true)}
                className="shrink-0 cursor-pointer rounded-lg bg-primary p-1.5 text-white transition-colors duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                title={channelFilter === 'email' ? 'New email' : 'New WhatsApp chat'}
                aria-label={channelFilter === 'email' ? 'New email' : 'New WhatsApp chat'}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <label className="relative block">
            <span className="sr-only">Search conversations</span>
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              type="search"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Search conversations…"
              className="h-auto min-h-10 cursor-text rounded-xl border-swiss-line bg-surface-muted py-2 pl-8 pr-3 text-sm font-medium text-swiss-ink outline-none transition-colors duration-200 placeholder:text-slate-400 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15"
            />
          </label>
        </div>

        {channelFilter === 'instagram' &&
        instagramConnected &&
        instagramThreadCount === 0 &&
        !loading &&
        filterTab === 'all' ? (
          <div className="mx-3 mt-2 rounded-lg border border-[#E1306C]/20 bg-[#fce8f0] px-3 py-2.5">
            <p className="text-xs font-semibold text-[#C13584]">Instagram connected — no chats yet</p>
            <p className="mt-1 text-xs text-slate-600 leading-snug">
              Sync imports recent DMs. Meta may block very old threads; new customer messages still
              arrive live.
            </p>
            <button
              type="button"
              disabled={instagramSyncing}
              onClick={() => void handleInstagramSync()}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#E1306C] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              {instagramSyncing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Syncing…
                </>
              ) : (
                'Sync Instagram chats'
              )}
            </button>
            {instagramSyncHint ? (
              <p className="mt-2 text-[11px] text-slate-500 leading-snug">{instagramSyncHint}</p>
            ) : null}
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto">
          {loading && inboxThreads.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm font-medium">
              {listEmptyMessage}
              {loadError && (
                <button
                  type="button"
                  onClick={() => loadConversations()}
                  className="mx-auto mt-3 block cursor-pointer text-primary hover:underline"
                >
                  Retry
                </button>
              )}
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm font-medium">
              {listSearch.trim()
                ? 'No conversations match your search.'
                : listEmptyMessage}
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isActive = thread.conversationId === selectedConversationId;
              const unread = thread.unreadCount > 0 && !isActive;
              const waLine = whatsappLineLabel(thread, whatsappAccounts);
              const showWaLine = waLine && whatsappAccounts.length > 1;
              const ch = contactChannel(thread);
              return (
                <div
                  key={thread.conversationId}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectThread(thread.conversationId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      selectThread(thread.conversationId);
                    }
                  }}
                  className={`group relative cursor-pointer border-l-[3px] px-3 py-2.5 text-left transition-colors duration-200 ${
                    isActive
                      ? 'border-l-primary bg-primary/10'
                      : unread
                        ? 'border-l-transparent bg-emerald-50/40 hover:bg-primary/5'
                        : 'border-l-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      {thread.avatar ? (
                        <img
                          src={thread.avatar}
                          alt={thread.name}
                          className="h-10 w-10 rounded-full border border-swiss-line object-cover bg-surface-muted"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border border-swiss-line bg-primary/10 text-xs font-black text-primary ${
                          thread.avatar ? 'hidden' : ''
                        }`}
                      >
                        {thread.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-2 ring-white ${
                          ch === 'instagram'
                            ? 'text-[#E1306C]'
                            : ch === 'messenger'
                              ? 'text-[#1877F2]'
                              : ch === 'telegram'
                                ? 'text-[#229ED9]'
                                : ch === 'email'
                                  ? 'text-emerald-800'
                                  : 'text-[#25D366]'
                        }`}
                        aria-label={channelLabel(thread)}
                      >
                        {ch === 'instagram' ? (
                          <InstagramIcon className="h-2.5 w-2.5" />
                        ) : ch === 'messenger' ? (
                          <MessengerIcon className="h-2.5 w-2.5" />
                        ) : ch === 'telegram' ? (
                          <TelegramIcon className="h-2.5 w-2.5" />
                        ) : ch === 'email' ? (
                          <Mail className="h-2.5 w-2.5" aria-hidden />
                        ) : (
                          <WhatsAppIcon className="h-2.5 w-2.5" />
                        )}
                      </span>
                    </div>

                    <div className="overflow-hidden min-w-0 flex-1 leading-tight">
                      <div className="flex items-center justify-between gap-1 min-w-0">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <h4
                            className={`truncate text-sm ${
                              unread
                                ? 'font-bold text-gray-950'
                                : isActive
                                  ? 'font-semibold text-primary'
                                  : 'font-semibold text-swiss-ink group-hover:text-primary'
                            }`}
                          >
                            {thread.name}
                          </h4>
                          {(() => {
                            const assignee = assignedToByConversationId[thread.conversationId];
                            if (isAiAssigneeValue(assignee)) {
                              return (
                                <span
                                  className="shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full bg-violet-50 text-violet-600"
                                  title="AI handling"
                                  aria-label="AI handling"
                                >
                                  <Bot className="w-2.5 h-2.5" />
                                </span>
                              );
                            }
                            if (isHumanAssigneeValue(assignee)) {
                              const humanId = assignee.slice('user:'.length);
                              const human =
                                teamAgents.find((a) => a.id === humanId) ??
                                (humanId === currentUserId
                                  ? { name: currentUserName || 'You' }
                                  : null);
                              const initial = (human?.name || 'A').charAt(0).toUpperCase();
                              return (
                                <span
                                  className="shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] font-black"
                                  title={human?.name || 'Human agent'}
                                  aria-label={human?.name || 'Human agent'}
                                >
                                  {initial}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <span
                          className={`shrink-0 font-mono text-meta font-bold leading-none ${
                            unread ? 'text-primary' : 'text-swiss-faint'
                          }`}
                        >
                          {thread.lastActive}
                        </span>
                      </div>
                      {showWaLine && (
                        <p className="text-meta font-bold text-primary truncate mt-0.5">
                          {waLine}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-1 mt-0.5 min-w-0">
                        <p
                          className={`truncate text-xs flex-1 ${
                            unread ? 'font-semibold text-swiss-ink' : 'font-medium text-swiss-muted'
                          }`}
                        >
                          {thread.lastMessage === '[media]'
                            ? 'Media unavailable'
                            : thread.lastMessage}
                        </p>
                        {unread && (
                          <span className="bg-channel-green text-white text-badge min-w-[18px] h-[18px] px-1 rounded-full font-black flex items-center justify-center leading-none shrink-0">
                            {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {channelFilter === 'instagram' &&
          instagramConnected &&
          instagramHasMore &&
          (filteredThreads.length > 0 || instagramThreadCount > 0) ? (
            <div className="sticky bottom-0 border-t border-swiss-line bg-white px-3 py-2.5">
              <button
                type="button"
                disabled={instagramSyncing}
                onClick={() => void handleInstagramSync({ loadMore: true })}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E1306C]/30 bg-[#fce8f0] px-3 py-2 text-xs font-semibold text-[#C13584] hover:bg-[#f8d4e2] disabled:opacity-60"
              >
                {instagramSyncing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading next 20…
                  </>
                ) : (
                  'Load more'
                )}
              </button>
              {instagramSyncHint ? (
                <p className="mt-1.5 text-[11px] text-slate-500 leading-snug text-center">
                  {instagramSyncHint}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section
        className={`flex-1 flex-col bg-surface-muted h-full overflow-hidden relative ${
          !isLargeUp && mobilePane !== 'chat' ? 'hidden' : 'flex'
        }`}
      >
        {loading ? (
          <EmptyChatPanel message="Loading conversation…" />
        ) : !selectedContact ? (
          <EmptyChatPanel message="Select a conversation from the list, or wait for new chats to arrive." />
        ) : (
          <>
            <div className="flex h-16 items-center justify-between gap-2 border-b border-swiss-line bg-surface px-3 md:px-4">
              <div className="flex min-w-0 items-center text-left">
                {!isLargeUp && (
                  <button
                    type="button"
                    onClick={() => setMobilePane('list')}
                    className="mr-2 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-swiss-muted transition-colors duration-200 hover:bg-primary/10 hover:text-primary"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <div className="relative shrink-0">
                  {selectedContact.avatar ? (
                    <img
                      src={selectedContact.avatar}
                      alt={selectedContact.name}
                      className="h-10 w-10 rounded-full object-cover bg-surface-muted ring-1 ring-black/5"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary ring-1 ring-primary/15 ${
                      selectedContact.avatar ? 'hidden' : ''
                    }`}
                  >
                    {selectedContact.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                </div>
                <div className="ml-3 min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <h3 className="truncate text-sm font-semibold leading-tight text-gray-950">
                      {selectedContact.name}
                    </h3>
                    {journeyProgress?.status === 'waiting' && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#f2994a]/30 bg-[#fff5e6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#b45309]">
                        <PauseCircle className="h-3 w-3" aria-hidden />
                        Automation waiting
                      </span>
                    )}
                  </div>
                  {selectedThread &&
                    (() => {
                      const line = inboxChannelLineLabel(
                        selectedThread,
                        whatsappAccounts,
                        instagramInboxLabel,
                        messengerInboxLabel,
                        telegramInboxLabel
                      );
                      return line ? (
                        <p
                          className={`mt-0.5 truncate text-xs font-bold ${inboxChannelLineClass(selectedThread)}`}
                        >
                          {line}
                        </p>
                      ) : null;
                    })()}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
                {/* ponytail: inbox voice-call button parked for later release — restore Phone import + createCall handler */}

                <div className="hidden items-center rounded-xl bg-surface-muted px-2.5 py-1.5 ring-1 ring-swiss-line lg:flex">
                  <span className="mr-1 flex items-center gap-1 text-sm font-bold text-swiss-muted">
                    <User className="h-3.5 w-3.5 text-primary" /> Active :
                  </span>
                  <InboxAssigneePicker
                    value={activeAssigneeValue}
                    teamAgents={teamAgents}
                    aiAgents={aiAgents}
                    ruleBasedBots={ruleBasedBots}
                    publishedJourneys={channelAutomations}
                    journeysMenuLabel={automationMenuLabel}
                    onChange={(nextValue) => {
                      setActiveAssigneeValue(nextValue);
                      const { assigneeType, assigneeId } = decodeAssigneeValue(nextValue);
                      void persistConversation({
                        assigneeType,
                        assigneeId,
                      });
                    }}
                  />
                </div>

                {isAutomationActive && (
                  <button
                    type="button"
                    onClick={() => void handleStopAutomation()}
                    disabled={stoppingAutomation}
                    title="Stop automation for this conversation"
                    className="hidden items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50 lg:flex"
                  >
                    <OctagonX className="h-3.5 w-3.5" />
                    Stop
                  </button>
                )}

                <div
                  className={`flex items-center rounded-xl px-2.5 py-1.5 ring-1 ${
                    chatStatus === 'Open'
                      ? 'bg-[#e6f7ec]/60 text-accent-green ring-[#5dfd8a]/40'
                      : chatStatus === 'Pending'
                        ? 'bg-[#fff5e6]/60 text-[#f2994a] ring-[#f2994a]/30'
                        : 'bg-slate-50/80 text-slate-600 ring-swiss-line'
                  }`}
                >
                  <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-current" />
                  <select
                    value={chatStatus}
                    onChange={(e) => {
                      const s = e.target.value as 'Open' | 'Pending' | 'Resolved';
                      setChatStatus(s);
                      void persistConversation({ status: statusToApi(s) });
                    }}
                    className="cursor-pointer border-none bg-transparent p-0 text-sm font-extrabold outline-none focus:outline-none focus:ring-0"
                  >
                    <option value="Open">Open</option>
                    <option value="Pending">Pending</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailsOpen(true)}
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-swiss-muted transition-colors duration-200 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-label="Open contact profile"
                  title="Contact & journey"
                >
                  <PanelRightOpen className="h-4 w-4" />
                </button>
              </div>
            </div>

            <InboxMessageList
              messages={messageGroups}
              channel={contactChannel(selectedContact)}
              conversationId={selectedConversationId}
              messageEndRef={messageEndRef}
              loading={showMessageSkeleton}
              resendingId={resendingMessageId}
              onResend={(id) => void handleResendMessage(id)}
              automationWaiting={automationWaitingBanner}
              hasMoreOlder={Boolean(selectedConversationId && messagesHasMore[selectedConversationId])}
              loadingOlder={loadingOlderMessages}
              onLoadOlder={() => void handleLoadOlderMessages()}
            />

            <div className="border-t border-swiss-line bg-surface p-2.5 text-left">
              {isAiAssigneeValue(activeAssigneeValue) ? (
                <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-violet-200 bg-violet-50/80 px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-violet-700 min-w-0">
                    <Bot className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">AI is handling this chat</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleTakeover()}
                    disabled={takeoverLoading}
                    className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-violet-300 bg-white text-violet-700 text-xs font-bold hover:bg-violet-100 disabled:opacity-60 transition-colors shrink-0"
                  >
                    {takeoverLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                    Take Over
                  </button>
                </div>
              ) : activeAssigneeValue === `user:${currentUserId}` ? (
                <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-700 min-w-0">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">You&apos;re handling this chat</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleReleaseToAi()}
                    disabled={releaseLoading}
                    className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-swiss-line bg-white text-swiss-muted text-xs font-bold hover:bg-gray-100 disabled:opacity-60 transition-colors shrink-0"
                  >
                    {releaseLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Bot className="w-3.5 h-3.5" />
                    )}
                    Release to AI
                  </button>
                </div>
              ) : null}

              {selectedContact &&
                (contactChannel(selectedContact) === 'instagram' ||
                  contactChannel(selectedContact) === 'messenger') &&
                messagingWindow &&
                (() => {
                  const isIg = contactChannel(selectedContact) === 'instagram';
                  const label = isIg ? 'Instagram DM' : 'Messenger';
                  const fromLabel = isIg ? instagramInboxLabel : messengerInboxLabel;
                  const remaining = formatMessagingWindowRemaining(messagingWindow.remainingMs);
                  if (messagingWindow.open) {
                    return (
                      <p
                        className={`mb-2 rounded-xl px-3 py-2 text-xs font-bold ring-1 ${
                          isIg
                            ? 'bg-[#fce8f0]/90 text-[#C13584] ring-[#E1306C]/15'
                            : 'bg-[#e8f4ff]/90 text-[#1877F2] ring-[#1877F2]/15'
                        }`}
                      >
                        {label}
                        {fromLabel ? ` · ${fromLabel}` : ''} — free-form reply window:{' '}
                        {remaining}
                      </p>
                    );
                  }
                  return (
                    <p className="mb-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 ring-1 ring-amber-200/80">
                      {label} 24h reply window expired
                      {fromLabel ? ` (${fromLabel})` : ''}. Customer must message again before
                      free-form replies work.
                    </p>
                  );
                })()}

              {sendError && (
                <div className="mb-2 flex items-start justify-between gap-2 text-sm font-semibold text-danger-red bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <p className="min-w-0 flex-1">{sendError}</p>
                  <button
                    type="button"
                    onClick={() => setSendError(null)}
                    className="shrink-0 cursor-pointer rounded p-0.5 text-danger-red/70 hover:bg-red-100 hover:text-danger-red"
                    aria-label="Dismiss error"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {selectedChannel === 'email' ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5">
                  <p className="text-xs font-bold text-emerald-900 min-w-0">
                    Email thread — use New Conversation to send another message.
                  </p>
                  <button
                    type="button"
                    onClick={() => setNewChatOpen(true)}
                    className="shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-emerald-900 text-white text-xs font-bold hover:bg-emerald-950"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    New email
                  </button>
                </div>
              ) : (
              <>
              {pendingComposerFile && (
                <div className="mb-2 flex items-center gap-2 rounded-lg border border-swiss-line bg-surface-muted px-3 py-2">
                  {pendingComposerFile.type.startsWith('image/') && pendingComposerPreview ? (
                    <img
                      src={pendingComposerPreview}
                      alt={pendingComposerFile.name}
                      className="w-10 h-10 rounded object-cover border border-swiss-line"
                    />
                  ) : (
                    <Paperclip className="w-4 h-4 text-sky-600 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-swiss-ink truncate">{pendingComposerFile.name}</p>
                    <p className="text-[11px] text-swiss-faint">Canned attachment ready to send</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearPendingComposerMedia}
                    className="text-xs font-bold text-swiss-faint hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              )}

              <SendMediaDialog
                open={sendMediaDialogOpen}
                onClose={() => setSendMediaDialogOpen(false)}
                allowMultiSelect={Boolean(selectedContact && contactChannel(selectedContact) === 'telegram')}
                enforceTelegramLimits={Boolean(selectedContact && contactChannel(selectedContact) === 'telegram')}
                maxSelect={10}
                onDeviceFiles={(files) => {
                  if (files.length === 1) void handleSendAttachment(files[0]);
                  else if (files.length >= 2) void handleSendCarousel(files);
                }}
                onGalleryPick={(image) => void handleGallerySinglePick(image)}
                onGalleryPickMultiple={(images) => void handleGalleryMultiplePick(images)}
              />

              <div
                className={`flex min-h-11 items-center gap-0.5 rounded-2xl bg-surface px-1.5 ring-1 transition-shadow duration-200 ${
                  sendingMedia
                    ? 'ring-2 ring-primary/25'
                    : 'ring-swiss-line focus-within:ring-2 focus-within:ring-primary/20'
                }`}
              >
                <Textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    sendingMedia
                      ? 'Sending attachment…'
                      : selectedContact &&
                          (contactChannel(selectedContact) === 'whatsapp' ||
                            contactChannel(selectedContact) === 'instagram')
                        ? 'Type a message…'
                        : 'Type your message…'
                  }
                  rows={1}
                  disabled={sendingMedia}
                  className="max-h-20 min-h-9 flex-1 resize-none border-0 bg-transparent py-2.5 pl-2.5 pr-1 text-sm font-medium leading-5 outline-none [field-sizing:fixed] focus-visible:outline-none focus-visible:ring-0 disabled:opacity-60"
                />

                <div className="flex shrink-0 items-center gap-0.5 pr-0.5">
                  <div className="relative" ref={composerActionsRef}>
                    <button
                      type="button"
                      disabled={sendingMedia}
                      onClick={() => setComposerActionsOpen((open) => !open)}
                      className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl transition-colors duration-200 disabled:opacity-40 ${
                        composerActionsOpen
                          ? 'bg-primary/10 text-primary'
                          : 'text-swiss-faint hover:bg-primary/10 hover:text-primary'
                      }`}
                      title="More options"
                      aria-label="More options"
                      aria-expanded={composerActionsOpen}
                    >
                      <Plus className="h-4 w-4" />
                    </button>

                    {composerActionsOpen && selectedContact && (
                      <div
                        role="menu"
                        className="absolute bottom-full right-0 z-50 mb-2 w-[min(240px,calc(100vw-2rem))] rounded-2xl bg-surface py-1.5 shadow-lg shadow-black/10 ring-1 ring-swiss-line"
                      >
                        {(contactChannel(selectedContact) === 'whatsapp' ||
                          contactChannel(selectedContact) === 'instagram' ||
                          contactChannel(selectedContact) === 'telegram') && (
                          <button
                            type="button"
                            role="menuitem"
                            disabled={sendingMedia}
                            onClick={() => {
                              setComposerActionsOpen(false);
                              setSendMediaDialogOpen(true);
                            }}
                            className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-sm font-semibold text-swiss-ink transition-colors duration-200 hover:bg-primary/5 hover:text-primary disabled:opacity-40"
                          >
                            <Paperclip className="h-4 w-4 shrink-0" />
                            Media
                          </button>
                        )}
                        <button
                          type="button"
                          role="menuitem"
                          disabled={sendingMedia}
                          onClick={() => {
                            setComposerActionsOpen(false);
                            void handleAiSuggest();
                          }}
                          className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-sm font-semibold text-swiss-ink transition-colors duration-200 hover:bg-primary/5 hover:text-primary disabled:opacity-40"
                        >
                          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                          AI suggest
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          disabled={sendingMedia}
                          onClick={() => {
                            setComposerActionsOpen(false);
                            setSendError(null);
                            setShowCannedPicker(true);
                          }}
                          className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-sm font-semibold text-swiss-ink transition-colors duration-200 hover:bg-primary/5 hover:text-primary disabled:opacity-40"
                        >
                          <MessageSquareText className="h-4 w-4 shrink-0" />
                          Canned responses
                        </button>
                        {contactChannel(selectedContact) !== 'instagram' &&
                          contactChannel(selectedContact) !== 'messenger' &&
                          contactChannel(selectedContact) !== 'telegram' && (
                            <button
                              type="button"
                              role="menuitem"
                              disabled={sendingMedia}
                              onClick={() => {
                                setComposerActionsOpen(false);
                                void handleTriggerTemplate();
                              }}
                              className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-sm font-semibold text-swiss-ink transition-colors duration-200 hover:bg-primary/5 hover:text-primary disabled:opacity-40"
                            >
                              <FileText className="h-4 w-4 shrink-0" />
                              Templates
                            </button>
                          )}
                        <div className="mt-1 border-t border-swiss-line px-3 pb-1 pt-2">
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-swiss-faint">
                            Emoji
                          </p>
                          <div className="grid grid-cols-8 gap-0.5">
                            {COMPOSER_QUICK_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                disabled={sendingMedia}
                                onClick={() => {
                                  setMessageInput((prev) => prev + emoji);
                                  setComposerActionsOpen(false);
                                }}
                                className="h-8 w-8 cursor-pointer rounded-lg text-base transition-colors duration-200 hover:bg-primary/5 disabled:opacity-40"
                                aria-label={`Insert ${emoji}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={
                      (!messageInput.trim() && !pendingComposerFile) || sendingMedia || sendingText
                    }
                    className="ml-0.5 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-channel-green text-white shadow-emerald-600/15 transition-colors duration-200 hover:bg-[#20bd5a] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={sendingMedia || sendingText ? 'Sending' : 'Send message'}
                  >
                    {sendingMedia || sendingText ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              </>
              )}
            </div>
          </>
        )}
      </section>

      <AnimatePresence>
        {profileSidebarProps && detailsOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close contact details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
              className="fixed inset-0 z-40 cursor-pointer bg-gray-900/35"
              onClick={() => setDetailsOpen(false)}
            />
            <motion.div
              initial={reduceMotion ? false : { x: '100%' }}
              animate={{ x: 0 }}
              exit={reduceMotion ? undefined : { x: '100%' }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', damping: 28, stiffness: 320 }
              }
              className="fixed inset-y-0 right-0 z-50 w-full max-w-[min(400px,92vw)] overflow-hidden bg-surface shadow-2xl ring-1 ring-black/5"
            >
              <InboxContactSidebar {...profileSidebarProps} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <InboxTemplatePicker
        open={showTemplatePicker}
        contactName={selectedContact?.name ?? ''}
        onClose={() => setShowTemplatePicker(false)}
        onSend={handleSendTemplate}
        sendError={sendError}
      />

      <InboxCannedResponsePicker
        open={showCannedPicker}
        contactName={selectedContact?.name}
        contactPhone={selectedContact?.phone}
        onClose={() => setShowCannedPicker(false)}
        onSelect={(selection) => void handleCannedSelect(selection)}
      />

      <ContactHistoricalAuditsModal
        open={auditsOpen}
        contactId={selectedContact?.id ?? null}
        contactName={selectedContact?.name}
        contactPhone={selectedContact?.phone}
        onClose={() => setAuditsOpen(false)}
      />

      <InboxNewChatPicker
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onSelectContact={startWhatsAppChat}
        onSendEmail={startEmailChat}
        initialChannel={channelFilter === 'email' ? 'email' : 'whatsapp'}
        emailReady={emailConnected}
        whatsappAccounts={newChatWhatsAppAccounts}
        onAddNewContact={(phoneNumberId) => {
          setNewChatPhoneNumberId(phoneNumberId);
          setNewChatOpen(false);
          setNewContactOpen(true);
        }}
        error={newChatOpen ? sendError : null}
      />

      <AddContactDrawer
        open={editContactOpen}
        editContact={editContactData}
        onClose={() => {
          setEditContactOpen(false);
          setEditContactData(null);
        }}
        onSaved={() => void handleContactSaved()}
      />

      <AddContactDrawer
        open={newContactOpen}
        onClose={() => {
          setNewContactOpen(false);
          setNewChatPhoneNumberId(undefined);
        }}
        onCreated={(contact) => {
          if (contact?.id) {
            void startWhatsAppChat(contact.id, newChatPhoneNumberId).catch((err) => {
              setSendError(err instanceof Error ? err.message : 'Could not start chat');
            });
          }
        }}
      />

      {handoverToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-swiss-line bg-gray-900 px-4 py-3 text-sm font-bold text-white shadow-lg">
          {handoverToast}
        </div>
      )}
    </div>
  );
};
