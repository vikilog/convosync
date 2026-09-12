export type InstagramSyncPhase =
  | 'started'
  | 'list_page'
  | 'messages_fetch'
  | 'thread_saved'
  | 'completed'
  | 'error'

export type InstagramSyncProgressPayload = {
  workspaceId: string
  phase: InstagramSyncPhase
  loadedConversations: number
  syncedConversations: number
  importedMessages: number
  pageNumber?: number
  message?: string
  warning?: string
  hasMore?: boolean
}

const IG_HAS_MORE_KEY = 'convosync_ig_inbox_has_more'

export function readInstagramHasMore(): boolean {
  try {
    return sessionStorage.getItem(IG_HAS_MORE_KEY) === '1'
  } catch {
    return false
  }
}

export function writeInstagramHasMore(hasMore: boolean) {
  try {
    sessionStorage.setItem(IG_HAS_MORE_KEY, hasMore ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export function formatInstagramSyncProgress(p: InstagramSyncProgressPayload): string {
  if (p.phase === 'started') return 'Instagram sync started…'
  if (p.phase === 'error') return p.message || 'Instagram sync failed'
  if (p.phase === 'completed') {
    const parts = [`Done: ${p.syncedConversations} chat(s) saved, ${p.importedMessages} message(s).`]
    if (p.warning) parts.push(p.warning)
    if (p.hasMore) parts.push('More chats available — scroll down and tap Load more.')
    return parts.join(' ')
  }
  if (p.message) return p.message
  return `Loaded ${p.loadedConversations} from Meta · ${p.syncedConversations} saved · ${p.importedMessages} message(s)`
}
