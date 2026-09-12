import type { TeamChatMessage, TeamChatPeer } from '@/services/realTeamChat.service'

export function peerIdForMessage(payload: TeamChatMessage, selfId: string): string {
  return payload.sender.id === selfId ? payload.recipientUserId : payload.sender.id
}

export function sortTeamChatPeers(peers: TeamChatPeer[]): TeamChatPeer[] {
  return [...peers].sort((a, b) => {
    const at = a.lastMessage ? Date.parse(a.lastMessage.createdAt) : 0
    const bt = b.lastMessage ? Date.parse(b.lastMessage.createdAt) : 0
    if (at !== bt) return bt - at
    return a.name.localeCompare(b.name)
  })
}

export function applyTeamChatMessageToPeers(
  peers: TeamChatPeer[],
  payload: TeamChatMessage,
  selfId: string
): TeamChatPeer[] {
  const peerId = peerIdForMessage(payload, selfId)
  return sortTeamChatPeers(
    peers.map((p) =>
      p.userId === peerId
        ? {
            ...p,
            lastMessage: {
              id: payload.id,
              body: payload.body,
              createdAt: payload.createdAt,
              senderUserId: payload.sender.id,
            },
          }
        : p
    )
  )
}

export function applyTeamPresenceToPeers(
  peers: TeamChatPeer[],
  online: Array<{ userId: string }>
): TeamChatPeer[] {
  const onlineIds = new Set(online.map((u) => u.userId))
  return peers.map((p) => ({ ...p, online: onlineIds.has(p.userId) }))
}

export function appendTeamChatMessage(
  items: TeamChatMessage[],
  payload: TeamChatMessage
): TeamChatMessage[] {
  if (items.some((m) => m.id === payload.id)) return items
  const withoutOptimistic = items.filter(
    (m) => !(m.id.startsWith('optimistic:') && m.body === payload.body && m.sender.id === payload.sender.id)
  )
  return [...withoutOptimistic, payload]
}

export function previewBody(body: string, max = 48): string {
  const t = body.replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max)}…` : t
}
