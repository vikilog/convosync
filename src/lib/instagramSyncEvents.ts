export type InstagramSyncPhase =
  | 'started'
  | 'list_page'
  | 'messages_fetch'
  | 'thread_saved'
  | 'completed'
  | 'error';

export type InstagramSyncProgressPayload = {
  workspaceId: string;
  phase: InstagramSyncPhase;
  loadedConversations: number;
  syncedConversations: number;
  importedMessages: number;
  pageNumber?: number;
  message?: string;
  warning?: string;
  hasMore?: boolean;
};

export function formatInstagramSyncProgress(p: InstagramSyncProgressPayload): string {
  if (p.phase === 'started') return 'Instagram sync started…';
  if (p.phase === 'error') return p.message || 'Instagram sync failed';
  if (p.phase === 'completed') {
    const parts = [
      `Done: ${p.syncedConversations} chat(s) saved, ${p.importedMessages} message(s).`,
    ];
    if (p.warning) parts.push(p.warning);
    if (p.hasMore) parts.push('More chats available — tap Fetch again.');
    return parts.join(' ');
  }
  if (p.message) return p.message;
  return `Loaded ${p.loadedConversations} from Meta · ${p.syncedConversations} saved · ${p.importedMessages} message(s)`;
}
