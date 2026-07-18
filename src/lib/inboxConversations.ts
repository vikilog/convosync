/**
 * Conversations-only fetch for Inbox. Metadata (team/me/accounts/agents/journeys)
 * must not be loaded here — those live in React Query hooks.
 */
import { api } from './api';
import { dedupeInboxConversations } from './inboxDedupe';

export async function fetchInboxConversationRows(): Promise<Array<Record<string, unknown>>> {
  const convsRaw = (await api.getConversations()) as Array<Record<string, unknown>>;
  return dedupeInboxConversations(convsRaw);
}
