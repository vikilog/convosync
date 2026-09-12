/** Session nav badges. Distinct keys so Inbox and Team Chat can update independently. */

export type NavUnreadKey = 'inboxUnread' | 'teamChatUnread'

export const NAV_UNREAD_CHANGED_EVENT = 'convosync:nav-unread-changed'

const totals: Record<NavUnreadKey, number> = {
  inboxUnread: 0,
  teamChatUnread: 0,
}

export function getNavUnread(key: NavUnreadKey): number {
  return totals[key]
}

export function getNavUnreadSnapshot(): Record<NavUnreadKey, number> {
  return { ...totals }
}

export function sumUnreadForNav(
  conversations: Array<{ id: string; unreadCount?: number }>,
  excludeConversationId?: string | null
): number {
  return conversations.reduce((sum, conv) => {
    if (excludeConversationId && conv.id === excludeConversationId) return sum
    return sum + Number(conv.unreadCount ?? 0)
  }, 0)
}

export function setNavUnread(key: NavUnreadKey, total: number): void {
  const next = Math.max(0, Math.floor(total))
  if (totals[key] === next) return
  totals[key] = next
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(NAV_UNREAD_CHANGED_EVENT, { detail: getNavUnreadSnapshot() })
  )
}
