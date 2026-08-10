/** Peer open in the visible Team Chat tab (KeepAlive-hidden does not count). */
let activePeerUserId = '';
let teamChatVisible = false;

export function setTeamChatVisible(visible: boolean) {
  teamChatVisible = visible;
}

export function setActiveTeamChatPeerId(peerUserId: string) {
  activePeerUserId = peerUserId;
}

export function getActiveTeamChatPeerId() {
  return activePeerUserId;
}

/** Peer id to treat as "currently reading" for toast skip + unread exclusion. */
export function getViewingTeamChatPeerId() {
  return teamChatVisible ? activePeerUserId : '';
}

export function isViewingTeamChatPeer(peerUserId: string) {
  return Boolean(peerUserId) && getViewingTeamChatPeerId() === peerUserId;
}
