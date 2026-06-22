export type InboxChannel = 'whatsapp' | 'instagram' | 'messenger';

export type InboxScope = {
  mode: 'all' | 'restricted';
  channels?: InboxChannel[];
  accounts?: Partial<Record<InboxChannel, string[]>>;
};

export const FULL_INBOX_SCOPE: InboxScope = { mode: 'all' };

const INBOX_CHANNELS: InboxChannel[] = ['whatsapp', 'instagram', 'messenger'];

export function parseInboxScope(value: unknown): InboxScope | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.mode !== 'all' && record.mode !== 'restricted') return null;
  const channels = Array.isArray(record.channels)
    ? record.channels.filter((c): c is InboxChannel => typeof c === 'string' && INBOX_CHANNELS.includes(c as InboxChannel))
    : undefined;
  const accounts: Partial<Record<InboxChannel, string[]>> = {};
  if (record.accounts && typeof record.accounts === 'object' && !Array.isArray(record.accounts)) {
    const raw = record.accounts as Record<string, unknown>;
    for (const ch of INBOX_CHANNELS) {
      const list = raw[ch];
      if (Array.isArray(list)) {
        const ids = list.filter((id): id is string => typeof id === 'string' && id.length > 0);
        if (ids.length > 0) accounts[ch] = [...new Set(ids)];
      }
    }
  }
  return {
    mode: record.mode,
    channels: channels?.length ? channels : undefined,
    accounts: Object.keys(accounts).length ? accounts : undefined,
  };
}

export function resolveEffectiveInboxScope(role: string, scope: unknown): InboxScope {
  if (role === 'admin') return FULL_INBOX_SCOPE;
  return parseInboxScope(scope) ?? FULL_INBOX_SCOPE;
}

function restrictedChannelAccess(scope: InboxScope): Map<InboxChannel, string[] | 'all'> {
  const access = new Map<InboxChannel, string[] | 'all'>();
  const channels = scope.channels ?? [];
  const accounts = scope.accounts ?? {};
  for (const ch of INBOX_CHANNELS) {
    const ids = accounts[ch];
    if (ids && ids.length > 0) access.set(ch, ids);
    else if (channels.includes(ch)) access.set(ch, 'all');
  }
  return access;
}

export function isInboxChannelAllowed(channel: InboxChannel, scope: InboxScope): boolean {
  if (scope.mode === 'all') return true;
  return restrictedChannelAccess(scope).has(channel);
}

export function isConversationInInboxScope(
  conversation: { channel: string; channelAccountId?: string | null },
  scope: InboxScope
): boolean {
  if (scope.mode === 'all') return true;
  const ch = conversation.channel as InboxChannel;
  if (!INBOX_CHANNELS.includes(ch)) return false;
  const allowed = restrictedChannelAccess(scope).get(ch);
  if (!allowed) return false;
  if (allowed === 'all') return true;
  if (!conversation.channelAccountId) return false;
  return allowed.includes(conversation.channelAccountId);
}

export function formatInboxScopeSummary(scope: InboxScope): string {
  if (scope.mode === 'all') return 'All inboxes';
  const parts: string[] = [];
  const access = restrictedChannelAccess(scope);
  for (const [ch, allowed] of access) {
    const label = ch === 'whatsapp' ? 'WhatsApp' : ch === 'instagram' ? 'Instagram' : 'Messenger';
    if (allowed === 'all') parts.push(label);
    else parts.push(`${label} (${allowed.length})`);
  }
  return parts.length ? parts.join(', ') : 'No inbox access';
}

export function defaultRestrictedInboxScope(): InboxScope {
  return { mode: 'restricted', channels: ['whatsapp', 'instagram', 'messenger'] };
}
