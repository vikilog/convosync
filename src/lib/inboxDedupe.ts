/** Inbox dedupe — mirrors backend whatsappInboxDedupeKey / dedupeConversationsByContact. */

export function whatsappCanonicalDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function whatsappInboxPhoneKey(phone: string): string | null {
  const canonical = whatsappCanonicalDigits(phone);
  return canonical ? `wa:${canonical}` : null;
}

function conversationInboxKey(conv: {
  id?: string;
  channelAccountId?: string | null;
  contact?: { id?: string } | null;
}): string {
  const contactId = conv.contact?.id;
  if (!contactId) return '';
  const accountId = conv.channelAccountId ? String(conv.channelAccountId) : '';
  return accountId ? `${contactId}:${accountId}` : `${contactId}:${conv.id ?? ''}`;
}

export function whatsappInboxDedupeKey(conv: {
  id?: string;
  channel?: string;
  channelAccountId?: string | null;
  contact?: { id?: string; phone?: string } | null;
}): string {
  if (conv.channel !== 'whatsapp') {
    return conversationInboxKey(conv);
  }

  const contactPhone = conv.contact?.phone ?? '';
  if (contactPhone && !contactPhone.startsWith('lid:') && !contactPhone.startsWith('group:')) {
    const key = whatsappInboxPhoneKey(contactPhone);
    if (key) return key;
  }

  return conversationInboxKey(conv);
}

function pickPreferredConversation(
  a: { status?: unknown; lastMessageAt?: unknown },
  b: { status?: unknown; lastMessageAt?: unknown }
) {
  const rank = (status: unknown) => (String(status) === 'resolved' ? 0 : 1);
  const rankA = rank(a.status);
  const rankB = rank(b.status);
  if (rankA !== rankB) return rankA > rankB ? a : b;

  const time = (row: { lastMessageAt?: unknown }) => {
    const parsed = Date.parse(String(row.lastMessageAt ?? ''));
    return Number.isNaN(parsed) ? 0 : parsed;
  };
  return time(a) >= time(b) ? a : b;
}

export function dedupeInboxConversations<T extends Record<string, unknown>>(convs: T[]): T[] {
  const byKey = new Map<string, T>();

  for (const conv of convs) {
    const key = whatsappInboxDedupeKey({
      id: conv.id ? String(conv.id) : undefined,
      channel: conv.channel ? String(conv.channel) : undefined,
      channelAccountId:
        conv.channelAccountId != null ? String(conv.channelAccountId) : null,
      contact: conv.contact as { id?: string; phone?: string } | undefined,
    });
    if (!key) continue;

    const existing = byKey.get(key);
    byKey.set(key, existing ? (pickPreferredConversation(existing, conv) as T) : conv);
  }

  return sortInboxByLatestMessage(Array.from(byKey.values()));
}

export type InboxDedupeThread = {
  conversationId: string;
  channel?: string;
  phone: string;
  id: string;
  channelAccountId?: string | null;
  status?: string;
  lastMessageAt?: string;
  lastActive?: string;
  unreadCount?: number;
  lastMessage?: string;
};

function latestMessageMs(row: { lastMessageAt?: unknown }): number {
  if (row.lastMessageAt == null || row.lastMessageAt === '') return 0;
  const parsed =
    row.lastMessageAt instanceof Date
      ? row.lastMessageAt.getTime()
      : Date.parse(String(row.lastMessageAt));
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Newest activity first — WhatsApp-style inbox order. */
export function sortInboxByLatestMessage<T extends { lastMessageAt?: unknown }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => latestMessageMs(b) - latestMessageMs(a));
}

export function inboxThreadDedupeKey(thread: InboxDedupeThread): string {
  return whatsappInboxDedupeKey({
    id: thread.conversationId,
    channel: thread.channel ?? 'whatsapp',
    channelAccountId: thread.channelAccountId,
    contact: { id: thread.id, phone: thread.phone },
  });
}

export function dedupeInboxThreads<T extends InboxDedupeThread>(threads: T[]): T[] {
  const byKey = new Map<string, T>();

  for (const thread of threads) {
    const key = inboxThreadDedupeKey(thread);
    if (!key) continue;

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, thread);
      continue;
    }

    const rank = (status: unknown) => (String(status) === 'resolved' ? 0 : 1);
    const rankExisting = rank(existing.status);
    const rankCurrent = rank(thread.status);
    if (rankCurrent > rankExisting) {
      byKey.set(key, thread);
      continue;
    }
    if (rankCurrent < rankExisting) continue;

    if (latestMessageMs(thread) >= latestMessageMs(existing)) {
      byKey.set(key, thread);
    }
  }

  return sortInboxByLatestMessage(Array.from(byKey.values()));
}
