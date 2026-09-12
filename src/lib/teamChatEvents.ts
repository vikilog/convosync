import { setNavUnread } from '@/lib/navUnread'

export const TEAM_CHAT_UNREAD_TOTAL_EVENT = 'convosync:team-chat-unread-total'
export const TEAM_CHAT_UNREAD_CHANGED_EVENT = 'convosync:team-chat-unread-changed'
export const TEAM_CHAT_OPEN_PEER_EVENT = 'convosync:open-team-chat-peer'

/** Session-only unread counts (no server unread API yet). */
const unreadByPeer = new Map<string, number>()

export function getTeamChatUnreadTotal() {
  let total = 0
  for (const n of unreadByPeer.values()) total += n
  return total
}

export function getTeamChatUnreadForPeer(peerUserId: string) {
  return unreadByPeer.get(peerUserId) ?? 0
}

export function getTeamChatUnreadSnapshot() {
  return new Map(unreadByPeer)
}

function emitUnread() {
  const total = getTeamChatUnreadTotal()
  setNavUnread('teamChatUnread', total)
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(TEAM_CHAT_UNREAD_TOTAL_EVENT, { detail: { total } }))
  window.dispatchEvent(new CustomEvent(TEAM_CHAT_UNREAD_CHANGED_EVENT))
}

export function incrementTeamChatUnread(peerUserId: string) {
  if (!peerUserId) return
  unreadByPeer.set(peerUserId, (unreadByPeer.get(peerUserId) ?? 0) + 1)
  emitUnread()
}

export function clearTeamChatUnread(peerUserId: string) {
  if (!peerUserId || !unreadByPeer.has(peerUserId)) return
  unreadByPeer.delete(peerUserId)
  emitUnread()
}

let pendingOpenPeerId = ''

export function dispatchOpenTeamChatPeer(peerUserId: string) {
  if (!peerUserId) return
  pendingOpenPeerId = peerUserId
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(TEAM_CHAT_OPEN_PEER_EVENT, { detail: { peerUserId } }))
}

/** Consume a toast-open that arrived before Team Chat mounted. */
export function consumePendingOpenTeamChatPeer() {
  const id = pendingOpenPeerId
  pendingOpenPeerId = ''
  return id
}
