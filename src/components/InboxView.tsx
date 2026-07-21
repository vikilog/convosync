/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  FileText,
  MessageSquareText,
  Send,
  Paperclip,
  User,
  Facebook,
  Plus,
  Loader2,
  ArrowLeft,
  PanelRightOpen,
} from 'lucide-react';
import { Contact, ChatMessage, type ChatMessageType } from '../types';
import { api, formatCatchError, getUserName } from '../lib/api';
import { useWorkspaceAccess } from '../hooks/useWorkspaceAccess';
import { useInboxAssigneeMeta } from '../hooks/inbox/useInboxMeta';
import {
  isConversationInInboxScope,
  isInboxChannelAllowed,
  type InboxChannel,
} from '../lib/inboxScope';
import { mapContactFromApi, mapMessageFromApi } from '../lib/mappers';
import { dedupeInboxThreads } from '../lib/inboxDedupe';
import { fetchInboxConversationRows } from '../lib/inboxConversations';
import { groupMessagesByDate } from '../lib/formatDates';
import { getSocket } from '../lib/socket';
import { setActiveInboxConversationId, setInboxVisible } from '../lib/inboxFocus';
import {
  dispatchInboxUnreadTotal,
  INBOX_OPEN_CONVERSATION_EVENT,
} from '../lib/inboxEvents';
import { useKeepAliveActivation, useKeepAliveActive } from './KeepAlive';
import { InboxAssigneePicker } from './inbox/InboxAssigneePicker';
import { InboxNewChatPicker } from './inbox/InboxNewChatPicker';
import { InboxTemplatePicker } from './inbox/InboxTemplatePicker';
import { InboxCannedResponsePicker, type CannedSelection } from './inbox/InboxCannedResponsePicker';
import { InboxMessageList } from './inbox/InboxMessageList';
import { InboxContactSidebar } from './inbox/InboxContactSidebar';
import { ContactHistoricalAuditsModal } from './inbox/ContactHistoricalAuditsModal';
import { useContactJourneyProgress } from '../hooks/useContactJourneyProgress';
import { useIsLargeUp, useIsXLargeUp } from '../hooks/useBreakpoint';
import {
  AddContactDrawer,
  type ContactEditPayload,
} from './contacts/AddContactDrawer';

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
  messengerLabel: string | null
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
  return null;
}

function inboxChannelLineClass(thread: InboxThread): string {
  const channel = contactChannel(thread);
  if (channel === 'instagram') return 'text-[#C13584]';
  if (channel === 'messenger') return 'text-[#1877F2]';
  return 'text-[#128C7E]';
}

function dedupeChatMessages(messages: ChatMessage[]): ChatMessage[] {
  const seenIds = new Set<string>();
  const seenContent = new Set<string>();
  const result: ChatMessage[] = [];

  for (const msg of messages) {
    if (seenIds.has(msg.id)) continue;
    const minuteBucket = msg.createdAt ? msg.createdAt.slice(0, 16) : '';
    const contentKey = `${msg.sender}|${msg.content}|${minuteBucket}`;
    if (seenContent.has(contentKey)) continue;
    seenIds.add(msg.id);
    seenContent.add(contentKey);
    result.push(msg);
  }

  return result;
}

function normalizeMessagesResponse(res: unknown): {
  messages: Record<string, unknown>[];
  hasMore: boolean;
} {
  if (Array.isArray(res)) return { messages: res, hasMore: false };
  const obj = res as { messages?: Record<string, unknown>[]; hasMore?: boolean };
  return { messages: obj.messages ?? [], hasMore: Boolean(obj.hasMore) };
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
  const duplicateContent = history.some(
    (m) =>
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
  { id: 'instagram', label: 'Instagram' },
];

function contactChannel(contact: Contact): 'whatsapp' | 'instagram' | 'messenger' {
  if (contact.channel === 'instagram') return 'instagram';
  if (contact.channel === 'messenger') return 'messenger';
  return 'whatsapp';
}

function channelLabel(contact: Contact): string {
  const channel = contactChannel(contact);
  if (channel === 'instagram') return 'Instagram';
  if (channel === 'messenger') return 'Messenger';
  return 'WhatsApp';
}

function contactDisplayHandle(contact: Contact): string {
  return contact.handle || contact.phone;
}

export const InboxView: React.FC = () => {
  const { inboxScope } = useWorkspaceAccess();
  const isLargeUp = useIsLargeUp();
  const isXLargeUp = useIsXLargeUp();
  const {
    currentUserId,
    currentUserName,
    teamAgents,
    aiAgents,
    ruleBasedBots,
    publishedJourneys,
    whatsappAccounts,
    instagramConnected,
    instagramInboxLabel,
    messengerInboxLabel,
  } = useInboxAssigneeMeta();
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>('list');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [inboxThreads, setInboxThreads] = useState<InboxThread[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({});
  const [assignedToByConversationId, setAssignedToByConversationId] = useState<
    Record<string, string>
  >({});

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filterTab, setFilterTab] = useState<'all' | 'mine' | 'unassigned'>('all');
  const [channelFilter, setChannelFilter] = useState<InboxChannel>('whatsapp');
  const [instagramSyncing, setInstagramSyncing] = useState(false);
  const [instagramSyncHint, setInstagramSyncHint] = useState<string | null>(null);

  const [messageInput, setMessageInput] = useState<string>('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showCannedPicker, setShowCannedPicker] = useState(false);
  const [pendingComposerFile, setPendingComposerFile] = useState<File | null>(null);
  const [pendingComposerPreview, setPendingComposerPreview] = useState<string | null>(null);

  const [activeAssigneeValue, setActiveAssigneeValue] = useState<string>('');
  const [chatStatus, setChatStatus] = useState<'Open' | 'Pending' | 'Resolved'>('Open');
  const [journeyProgressRefresh, setJourneyProgressRefresh] = useState(0);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [editContactData, setEditContactData] = useState<ContactEditPayload | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newContactOpen, setNewContactOpen] = useState(false);
  const [newChatPhoneNumberId, setNewChatPhoneNumberId] = useState<string | undefined>();
  const [auditsOpen, setAuditsOpen] = useState(false);
  const [sendingMedia, setSendingMedia] = useState(false);
  const [composerActionsOpen, setComposerActionsOpen] = useState(false);
  const inboxTabActive = useKeepAliveActive();
  const selectedConversationIdRef = useRef(selectedConversationId);
  selectedConversationIdRef.current = selectedConversationId;
  const inboxTabActiveRef = useRef(inboxTabActive);
  inboxTabActiveRef.current = inboxTabActive;

  const inboxThreadsRef = useRef(inboxThreads);
  inboxThreadsRef.current = inboxThreads;

  /** Selected chat only counts as "reading" while Inbox tab is visible (KeepAlive). */
  const viewingConversationId = inboxTabActive ? selectedConversationId : '';

  const visibleChannelTabs = useMemo(
    () => CHANNEL_TABS.filter((tab) => isInboxChannelAllowed(tab.id, inboxScope)),
    [inboxScope]
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

    if (filterTab === 'mine') {
      return (
        matchesChannel &&
        matchesScope &&
        assignedToByConversationId[thread.conversationId] === `user:${currentUserId}`
      );
    }
    if (filterTab === 'unassigned') {
      return matchesChannel && matchesScope && !assignedToByConversationId[thread.conversationId];
    }
    return matchesChannel && matchesScope;
  });

  const selectedThread =
    filteredThreads.find((t) => t.conversationId === selectedConversationId) ?? undefined;
  const selectedContact = selectedThread;

  const activeHistory = selectedThread
    ? dedupeChatMessages(chatHistories[selectedThread.conversationId] || [])
    : [];
  const messageGroups = groupMessagesByDate(activeHistory);
  const { progress: journeyProgress, initialLoading: journeyInitialLoading } =
    useContactJourneyProgress(selectedThread?.id ?? null, journeyProgressRefresh);

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
      .then((msgs: Record<string, unknown>[]) => {
        setChatHistories((prev) => ({
          ...prev,
          [conversationId]: msgs.map((m) => mapMessageFromApi(m)),
        }));
      })
      .catch(console.error);
  });

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
    if (!selectedConversationId) return;

    const clearStaleSelection = () => {
      setInboxThreads((prev) => prev.filter((t) => t.conversationId !== selectedConversationId));
      setChatHistories((prev) => {
        const next = { ...prev };
        delete next[selectedConversationId];
        return next;
      });
      setSelectedConversationId('');
    };

    api
      .getConversation(selectedConversationId)
      .then(async (conv) => {
        const contact = conv.contact as Record<string, unknown>;
        const mapped = mapInboxThread(contact, conv as Record<string, unknown>, selectedConversationId);
        setInboxThreads((prev) =>
          dedupeInboxThreads(
            prev.map((t) => (t.conversationId === selectedConversationId ? mapped : t))
          )
        );

        const res = await api.getMessages(selectedConversationId);
        const { messages } = normalizeMessagesResponse(res);
        setChatHistories((prev) => ({
          ...prev,
          [selectedConversationId]: messages.map((m) => mapMessageFromApi(m)),
        }));
        setInboxThreads((prev) =>
          prev.map((t) =>
            t.conversationId === selectedConversationId ? { ...t, unreadCount: 0 } : t
          )
        );
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('404') || message.toLowerCase().includes('not found')) {
          clearStaleSelection();
          return;
        }
        console.error(err);
      });
  }, [selectedConversationId]);

  useEffect(() => {
    const socket = getSocket();

    const reloadMessagesForConversation = async (conversationId: string) => {
      try {
        const msgs = (await api.getMessages(conversationId)) as Record<string, unknown>[];
        setChatHistories((prev) => ({
          ...prev,
          [conversationId]: msgs.map((m) => mapMessageFromApi(m)),
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

        // getMessages marks the thread read — only while Inbox is on screen
        if (isViewing) {
          await reloadMessagesForConversation(conversationId);
        }
      } catch (err) {
        console.error(err);
      }
    };

    // Live delivery/read ticks (Meta status / Instagram messaging_seen webhooks)
    const onMessageStatus = (payload: { messageId: string; status: string }) => {
      const { messageId, status } = payload;
      if (!messageId || !status) return;
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
              if (m.status === 'read') return m;
              if (m.id === messageId || new Date(m.createdAt).getTime() <= cutoff) {
                return { ...m, status: 'read' };
              }
              return m;
            });
          } else {
            next[convId] = msgs.map((m) =>
              m.id === messageId ? { ...m, status: status as ChatMessage['status'] } : m
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

    const onMessengerSyncProgress = (payload: { phase?: string }) => {
      if (payload.phase === 'completed' || payload.phase === 'error') {
        void loadConversations();
      }
    };
    socket.on('messenger_sync_progress', onMessengerSyncProgress);

    const onInstagramSyncProgress = (payload: { phase?: string; message?: string }) => {
      if (payload.phase === 'started') {
        setInstagramSyncing(true);
        setInstagramSyncHint(payload.message || 'Syncing Instagram chats…');
      } else if (payload.phase === 'completed') {
        setInstagramSyncing(false);
        setInstagramSyncHint(payload.message || 'Instagram sync complete.');
        void loadConversations();
      } else if (payload.phase === 'error') {
        setInstagramSyncing(false);
        setInstagramSyncHint(payload.message || 'Instagram sync failed.');
      } else if (payload.message) {
        setInstagramSyncHint(payload.message);
      }
    };
    socket.on('instagram_sync_progress', onInstagramSyncProgress);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('conversation_updated', onConversationUpdated);
      socket.off('contact_updated', onContactUpdated);
      socket.off('message_status', onMessageStatus);
      socket.off('messenger_sync_progress', onMessengerSyncProgress);
      socket.off('instagram_sync_progress', onInstagramSyncProgress);
    };
  }, [inboxThreads, ingestConversation, loadConversations, sumUnreadForNav]);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const composerActionsRef = useRef<HTMLDivElement>(null);

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
        publishedJourneys
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

  const handleSendAttachment = async (file: File) => {
    if (!selectedThread || sendingMedia) return;
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
      setChatHistories((prev) => removeChatMessage(prev, convId, pendingId));
      if (caption) setMessageInput(caption);
      setSendError(err instanceof Error ? err.message : 'Failed to send attachment');
      console.error(err);
      URL.revokeObjectURL(localPreviewUrl);
    } finally {
      setSendingMedia(false);
      if (mediaInputRef.current) mediaInputRef.current.value = '';
    }
  };

  const handleCannedSelect = async (selection: CannedSelection) => {
    setSendError(null);
    setMessageInput(selection.message);
    clearPendingComposerMedia();
    if (!selection.hasMedia) return;
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
      setChatHistories((prev) => removeChatMessage(prev, convId, pendingId));
      setMessageInput(content);
      setSendError(err instanceof Error ? err.message : 'Failed to send message');
      console.error(err);
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

    try {
      const convId = selectedThread.conversationId;
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
      setSendError(err instanceof Error ? err.message : 'Failed to send template');
      throw err;
    }
  };

  const activeAssigneeName = assigneeLabelFromValue(
    activeAssigneeValue,
    teamAgents,
    aiAgents,
    ruleBasedBots,
    publishedJourneys
  );

  const instagramThreadCount = inboxThreads.filter(
    (thread) => contactChannel(thread) === 'instagram'
  ).length;

  const channelEmptyMessage =
    channelFilter === 'whatsapp'
      ? 'No WhatsApp conversations yet.'
      : 'No Instagram conversations yet.';

  async function handleInstagramSync() {
    setInstagramSyncing(true);
    setInstagramSyncHint('Starting Instagram sync…');
    try {
      const res = (await api.syncInstagramInbox()) as { message?: string };
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

  return (
    <div className="flex flex-row h-full min-h-0 overflow-hidden bg-surface-muted border-t border-black/5 selection:bg-sky-50">
      <section
        className={`${
          isLargeUp ? 'w-[280px] xl:w-[300px]' : 'w-full'
        } shrink-0 flex-col bg-surface border-r border-black/5 h-full text-left ${
          !isLargeUp && mobilePane !== 'list' ? 'hidden' : 'flex'
        }`}
      >
        <div className="p-3 border-b border-black/5 flex flex-col gap-2">
          <div
            className="flex min-w-0 gap-1 rounded-lg border border-black/5 bg-surface-muted p-1"
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
                className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-colors ${
                  filterTab === tab.id
                    ? 'bg-surface text-emerald-800 shadow-sm ring-1 ring-emerald-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div
            className="flex min-w-0 gap-1 rounded-lg border border-black/5 bg-surface-muted p-1"
            role="tablist"
            aria-label="Channel"
          >
            {visibleChannelTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={channelFilter === tab.id}
                onClick={() => setChannelFilter(tab.id)}
                className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-colors ${
                  channelFilter === tab.id
                    ? 'bg-surface text-emerald-800 shadow-sm ring-1 ring-emerald-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
            {channelFilter === 'whatsapp' && whatsappAccounts.length > 0 ? (
              <button
                type="button"
                onClick={() => setNewChatOpen(true)}
                className="shrink-0 rounded-md bg-[#128C7E] p-1.5 text-white transition-colors hover:bg-[#0f7a6e]"
                title="New WhatsApp chat"
                aria-label="New WhatsApp chat"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
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

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loading && inboxThreads.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm font-medium">
              {listEmptyMessage}
              {loadError && (
                <button
                  type="button"
                  onClick={() => loadConversations()}
                  className="block mx-auto mt-3 text-sky-600 hover:underline"
                >
                  Retry
                </button>
              )}
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm font-medium">
              {listEmptyMessage}
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isActive = thread.conversationId === selectedConversationId;
              const waLine = whatsappLineLabel(thread, whatsappAccounts);
              const showWaLine = waLine && whatsappAccounts.length > 1;
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
                  className={`group px-3 py-2.5 cursor-pointer transition-all border-l-3 text-left relative ${
                    isActive
                      ? 'bg-primary/10 border-l-primary'
                      : 'border-transparent hover:bg-surface-muted'
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="relative shrink-0">
                      {thread.avatar ? (
                        <img
                          src={thread.avatar}
                          alt={thread.name}
                          className="w-9 h-9 rounded-full border border-gray-100 object-cover bg-surface-muted"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-9 h-9 rounded-full bg-sky-50 text-sky-600 font-black border border-border-subtle flex items-center justify-center text-xs ${
                          thread.avatar ? 'hidden' : ''
                        }`}
                      >
                        {thread.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                    </div>

                    <div className="overflow-hidden min-w-0 flex-1 leading-tight">
                      <div className="flex items-center justify-between gap-1 min-w-0">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <h4
                            className={`text-sm font-bold truncate ${
                              isActive
                                ? 'text-primary'
                                : 'text-gray-900 group-hover:text-primary'
                            }`}
                          >
                            {thread.name}
                          </h4>
                          <span
                            className={`shrink-0 ${
                              contactChannel(thread) === 'instagram'
                                ? 'text-[#E1306C]'
                                : contactChannel(thread) === 'messenger'
                                  ? 'text-[#1877F2]'
                                : 'text-[#25D366]'
                            }`}
                            aria-label={channelLabel(thread)}
                          >
                            {contactChannel(thread) === 'instagram' ? (
                              <InstagramIcon className="w-3.5 h-3.5" />
                            ) : contactChannel(thread) === 'messenger' ? (
                              <Facebook className="w-3.5 h-3.5" />
                            ) : (
                              <WhatsAppIcon className="w-3.5 h-3.5" />
                            )}
                          </span>
                        </div>
                        <span className="text-meta text-gray-400 font-bold font-mono leading-none shrink-0">
                          {thread.lastActive}
                        </span>
                      </div>
                      {showWaLine && (
                        <p className="text-meta font-bold text-[#128C7E] truncate mt-0.5">
                          {waLine}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-1 mt-0.5 min-w-0">
                        <p className="text-xs text-gray-500 truncate font-medium flex-1">
                          {thread.lastMessage === '[media]'
                            ? 'Media unavailable'
                            : thread.lastMessage}
                        </p>
                        {thread.unreadCount > 0 && !isActive && (
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
            <div className="h-16 flex items-center justify-between gap-2 px-3 md:px-4 border-b border-black/5 bg-surface">
              <div className="flex items-center min-w-0 text-left">
                {!isLargeUp && (
                  <button
                    type="button"
                    onClick={() => setMobilePane('list')}
                    className="mr-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-sky-50 hover:text-sky-600 transition-colors"
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
                      className="w-10 h-10 rounded-full object-cover bg-surface-muted"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-10 h-10 rounded-full bg-sky-50 text-sky-600 font-black flex items-center justify-center text-xs ${
                      selectedContact.avatar ? 'hidden' : ''
                    }`}
                  >
                    {selectedContact.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-secondary-fixed border-2 border-white rounded-full translate-x-1 translate-y-1" />
                </div>
                <div className="ml-3 min-w-0">
                  <h3 className="font-bold text-gray-950 text-sm leading-tight truncate flex items-center gap-1.5">
                    {selectedContact.name}
                  </h3>
                  {selectedThread &&
                    (() => {
                      const line = inboxChannelLineLabel(
                        selectedThread,
                        whatsappAccounts,
                        instagramInboxLabel,
                        messengerInboxLabel
                      );
                      return line ? (
                        <p
                          className={`text-sm font-bold mt-0.5 ${inboxChannelLineClass(selectedThread)}`}
                        >
                          {line}
                        </p>
                      ) : null;
                    })()}
                </div>
              </div>

              <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                {!isXLargeUp && (
                  <button
                    type="button"
                    onClick={() => setDetailsOpen(true)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                    aria-label="Open contact details"
                  >
                    <PanelRightOpen className="h-4 w-4" />
                  </button>
                )}

                {/* ponytail: inbox voice-call button parked for later release — restore Phone import + createCall handler */}

                <div className="hidden lg:flex items-center bg-surface-muted px-2.5 py-1.5 rounded-xl border border-black/5">
                  <span className="text-sm font-bold text-gray-500 mr-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-sky-600" /> Active :
                  </span>
                  <InboxAssigneePicker
                    value={activeAssigneeValue}
                    teamAgents={teamAgents}
                    aiAgents={aiAgents}
                    ruleBasedBots={ruleBasedBots}
                    publishedJourneys={publishedJourneys}
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

                <div
                  className={`flex items-center px-2.5 py-1.5 rounded-xl border ${
                    chatStatus === 'Open'
                      ? 'bg-[#e6f7ec]/60 border-[#5dfd8a]/40 text-accent-green'
                      : chatStatus === 'Pending'
                        ? 'bg-[#fff5e6]/60 border-[#f2994a]/30 text-[#f2994a]'
                        : 'bg-sky-50/60 border-sky-200 text-sky-600'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full mr-2 bg-current animate-pulse" />
                  <select
                    value={chatStatus}
                    onChange={(e) => {
                      const s = e.target.value as 'Open' | 'Pending' | 'Resolved';
                      setChatStatus(s);
                      void persistConversation({ status: statusToApi(s) });
                    }}
                    className="bg-transparent border-none text-sm font-extrabold focus:ring-0 outline-none p-0 cursor-pointer focus:outline-none"
                  >
                    <option value="Open">Open</option>
                    <option value="Pending">Pending</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>
            </div>

            <InboxMessageList
              messages={messageGroups}
              channel={contactChannel(selectedContact)}
              messageEndRef={messageEndRef}
            />

            <div className="p-2.5 bg-surface border-t border-black/5 text-left">
              {selectedContact && contactChannel(selectedContact) === 'instagram' && (
                <p className="mb-2 text-sm font-bold text-[#C13584] bg-[#fce8f0] border border-[#E1306C]/15 rounded-lg px-3 py-2">
                  Replying via Instagram DM
                  {instagramInboxLabel ? ` from ${instagramInboxLabel}` : ''}. Meta allows replies within
                  24 hours of the customer&apos;s last message.
                </p>
              )}

              {selectedContact && contactChannel(selectedContact) === 'messenger' && (
                <p className="mb-2 text-sm font-bold text-[#1877F2] bg-[#e8f4ff] border border-[#1877F2]/15 rounded-lg px-3 py-2">
                  Replying via Messenger
                  {messengerInboxLabel ? ` from ${messengerInboxLabel}` : ''}. Meta allows replies within
                  24 hours of the customer&apos;s last message.
                </p>
              )}

              {sendError && (
                <p className="mb-2 text-sm font-semibold text-danger-red bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {sendError}
                </p>
              )}

              {pendingComposerFile && (
                <div className="mb-2 flex items-center gap-2 rounded-lg border border-black/5 bg-surface-muted px-3 py-2">
                  {pendingComposerFile.type.startsWith('image/') && pendingComposerPreview ? (
                    <img
                      src={pendingComposerPreview}
                      alt={pendingComposerFile.name}
                      className="w-10 h-10 rounded object-cover border border-black/5"
                    />
                  ) : (
                    <Paperclip className="w-4 h-4 text-sky-600 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{pendingComposerFile.name}</p>
                    <p className="text-[11px] text-gray-400">Canned attachment ready to send</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearPendingComposerMedia}
                    className="text-xs font-bold text-gray-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              )}

              <input
                ref={mediaInputRef}
                type="file"
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleSendAttachment(file);
                }}
              />

              <div
                className={`flex items-center min-h-[44px] gap-0.5 rounded-xl border bg-surface px-1 transition-all ${
                  sendingMedia
                    ? 'border-sky-300 ring-2 ring-emerald-100'
                    : 'border-black/5 focus-within:ring-2 focus-within:ring-sky-200 focus-within:border-sky-500'
                }`}
              >
                <textarea
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
                  className="flex-1 min-h-[36px] max-h-20 py-2.5 pl-2.5 pr-1 border-0 bg-transparent outline-none focus:outline-none text-sm font-medium leading-5 resize-none transition-all disabled:opacity-60"
                />

                <div className="flex items-center gap-0.5 shrink-0 pr-1">
                  <div className="relative" ref={composerActionsRef}>
                    <button
                      type="button"
                      disabled={sendingMedia}
                      onClick={() => setComposerActionsOpen((open) => !open)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
                        composerActionsOpen
                          ? 'bg-sky-50 text-sky-600'
                          : 'text-gray-400 hover:text-sky-600 hover:bg-sky-50'
                      }`}
                      title="More options"
                      aria-label="More options"
                      aria-expanded={composerActionsOpen}
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {composerActionsOpen && selectedContact && (
                      <div
                        role="menu"
                        className="absolute bottom-full right-0 mb-2 w-[min(240px,calc(100vw-2rem))] rounded-xl border border-black/5 bg-surface py-1.5 shadow-lg shadow-black/10 z-50"
                      >
                        {(contactChannel(selectedContact) === 'whatsapp' ||
                          contactChannel(selectedContact) === 'instagram') && (
                          <button
                            type="button"
                            role="menuitem"
                            disabled={sendingMedia}
                            onClick={() => {
                              setComposerActionsOpen(false);
                              mediaInputRef.current?.click();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors disabled:opacity-40"
                          >
                            <Paperclip className="w-4 h-4 shrink-0" />
                            Attach media
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
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors disabled:opacity-40"
                        >
                          <Sparkles className="w-4 h-4 shrink-0 text-sky-600" />
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
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors disabled:opacity-40"
                        >
                          <MessageSquareText className="w-4 h-4 shrink-0" />
                          Canned responses
                        </button>
                        {contactChannel(selectedContact) !== 'instagram' &&
                          contactChannel(selectedContact) !== 'messenger' && (
                            <button
                              type="button"
                              role="menuitem"
                              disabled={sendingMedia}
                              onClick={() => {
                                setComposerActionsOpen(false);
                                void handleTriggerTemplate();
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors disabled:opacity-40"
                            >
                              <FileText className="w-4 h-4 shrink-0" />
                              Templates
                            </button>
                          )}
                        <div className="border-t border-black/5 mt-1 pt-2 px-3 pb-1">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">
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
                                className="h-8 w-8 rounded-lg text-base hover:bg-sky-50 transition-colors disabled:opacity-40"
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
                    disabled={(!messageInput.trim() && !pendingComposerFile) || sendingMedia}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-channel-green hover:bg-[#20bd5a] disabled:opacity-40 text-white transition-all shadow-sm shadow-emerald-600/15 ml-0.5"
                    aria-label={sendingMedia ? 'Sending' : 'Send message'}
                  >
                    {sendingMedia ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {isXLargeUp && !selectedContact && (
        <section className="hidden xl:flex h-full w-[380px] shrink-0 items-center justify-center border-l border-black/5 bg-surface-muted p-4">
          <EmptyChatPanel message="Contact details appear when you select a chat." />
        </section>
      )}

      {selectedContact && isXLargeUp && (
        <InboxContactSidebar
          contact={selectedContact}
          conversationId={selectedConversationId}
          contactHandle={contactDisplayHandle(selectedContact)}
          assigneeLabel={activeAssigneeName}
          journeyProgress={journeyProgress}
          journeyInitialLoading={journeyInitialLoading}
          publishedJourneys={publishedJourneys}
          assignedJourneyId={
            decodeAssigneeValue(activeAssigneeValue).assigneeType === 'journey'
              ? decodeAssigneeValue(activeAssigneeValue).assigneeId
              : null
          }
          onAssignJourney={(journeyId) => {
            const nextValue = `journey:${journeyId}`;
            setActiveAssigneeValue(nextValue);
            void persistConversation({
              assigneeType: 'journey',
              assigneeId: journeyId,
            });
          }}
          onEditContact={() => void openEditContact()}
          onDeleteChat={() => void handleDeleteConversation()}
          onViewAudits={() => setAuditsOpen(true)}
        />
      )}

      {selectedContact && !isXLargeUp && detailsOpen && (
        <>
          <button
            type="button"
            aria-label="Close contact details"
            className="fixed inset-0 z-40 bg-black/35 xl:hidden"
            onClick={() => setDetailsOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[min(400px,92vw)] xl:hidden shadow-2xl">
            <InboxContactSidebar
              contact={selectedContact}
              conversationId={selectedConversationId}
              contactHandle={contactDisplayHandle(selectedContact)}
              assigneeLabel={activeAssigneeName}
              journeyProgress={journeyProgress}
              journeyInitialLoading={journeyInitialLoading}
              publishedJourneys={publishedJourneys}
              assignedJourneyId={
                decodeAssigneeValue(activeAssigneeValue).assigneeType === 'journey'
                  ? decodeAssigneeValue(activeAssigneeValue).assigneeId
                  : null
              }
              onAssignJourney={(journeyId) => {
                const nextValue = `journey:${journeyId}`;
                setActiveAssigneeValue(nextValue);
                void persistConversation({
                  assigneeType: 'journey',
                  assigneeId: journeyId,
                });
              }}
              onEditContact={() => void openEditContact()}
              onDeleteChat={() => void handleDeleteConversation()}
              onViewAudits={() => setAuditsOpen(true)}
              onClose={() => setDetailsOpen(false)}
            />
          </div>
        </>
      )}
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
    </div>
  );
};
