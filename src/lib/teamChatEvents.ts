export const TEAM_CHAT_UNREAD_TOTAL_EVENT = 'convosync:team-chat-unread-total';
export const TEAM_CHAT_UNREAD_CHANGED_EVENT = 'convosync:team-chat-unread-changed';
export const TEAM_CHAT_OPEN_PEER_EVENT = 'convosync:open-team-chat-peer';

/** Session-only unread counts (no server unread API yet). */
const unreadByPeer = new Map<string, number>();

export function getTeamChatUnreadTotal() {
  let total = 0;
  for (const n of unreadByPeer.values()) total += n;
  return total;
}

export function getTeamChatUnreadForPeer(peerUserId: string) {
  return unreadByPeer.get(peerUserId) ?? 0;
}

export function getTeamChatUnreadSnapshot() {
  return new Map(unreadByPeer);
}

function emitUnread() {
  if (typeof window === 'undefined') return;
  const total = getTeamChatUnreadTotal();
  window.dispatchEvent(
    new CustomEvent(TEAM_CHAT_UNREAD_TOTAL_EVENT, { detail: { total } })
  );
  window.dispatchEvent(new CustomEvent(TEAM_CHAT_UNREAD_CHANGED_EVENT));
}

export function incrementTeamChatUnread(peerUserId: string) {
  if (!peerUserId) return;
  unreadByPeer.set(peerUserId, (unreadByPeer.get(peerUserId) ?? 0) + 1);
  emitUnread();
}

export function clearTeamChatUnread(peerUserId: string) {
  if (!peerUserId || !unreadByPeer.has(peerUserId)) return;
  unreadByPeer.delete(peerUserId);
  emitUnread();
}

export function dispatchOpenTeamChatPeer(peerUserId: string) {
  window.dispatchEvent(
    new CustomEvent(TEAM_CHAT_OPEN_PEER_EVENT, { detail: { peerUserId } })
  );
}
