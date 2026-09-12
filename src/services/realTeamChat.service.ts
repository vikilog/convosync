import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { useAuth } from '@/context/AuthContext'
import {
  appendTeamChatMessage,
  applyTeamChatMessageToPeers,
  applyTeamPresenceToPeers,
} from '@/lib/teamChatCache'
import { httpClient } from '@/lib/httpClient'

export type TeamChatMessage = {
  id: string
  body: string
  createdAt: string
  recipientUserId: string
  sender: { id: string; name: string; avatar: string | null }
}

export type TeamChatPeer = {
  userId: string
  name: string
  avatar: string | null
  online: boolean
  lastMessage: { id: string; body: string; createdAt: string; senderUserId: string } | null
}

export const teamChatQueryKeys = {
  peers: ['realTeamChat', 'peers'] as const,
  messages: (peerUserId: string) => ['realTeamChat', 'messages', peerUserId] as const,
}

const peersKey = teamChatQueryKeys.peers
const messagesKey = teamChatQueryKeys.messages

export function applyIncomingTeamChatMessage(
  queryClient: QueryClient,
  payload: TeamChatMessage,
  selfId: string
) {
  const peerId = payload.sender.id === selfId ? payload.recipientUserId : payload.sender.id
  queryClient.setQueryData<{ items: TeamChatMessage[] }>(messagesKey(peerId), (prev) => {
    if (!prev) return prev
    const items = appendTeamChatMessage(prev.items, payload)
    return items === prev.items ? prev : { items }
  })
  queryClient.setQueryData<{ peers: TeamChatPeer[] }>(peersKey, (prev) => {
    if (!prev) return prev
    return { peers: applyTeamChatMessageToPeers(prev.peers, payload, selfId) }
  })
}

export function applyIncomingTeamPresence(
  queryClient: QueryClient,
  payload: { online?: Array<{ userId: string }> }
) {
  const online = payload.online ?? []
  queryClient.setQueryData<{ peers: TeamChatPeer[] }>(peersKey, (prev) => {
    if (!prev) return prev
    return { peers: applyTeamPresenceToPeers(prev.peers, online) }
  })
}

export const realTeamChatService = {
  usePeers: () =>
    useQuery({
      queryKey: peersKey,
      queryFn: () => httpClient.get<{ peers: TeamChatPeer[] }>('/team-chat/peers'),
      refetchInterval: 15_000,
    }),

  useMessages: (peerUserId: string | null) =>
    useQuery({
      queryKey: messagesKey(peerUserId ?? ''),
      queryFn: () =>
        httpClient.get<{ items: TeamChatMessage[] }>(
          `/team-chat/messages?peerUserId=${encodeURIComponent(peerUserId ?? '')}&limit=50`
        ),
      enabled: Boolean(peerUserId),
      refetchInterval: 5_000,
    }),

  useSendMessage: () => {
    const queryClient = useQueryClient()
    const { user } = useAuth()
    return useMutation({
      mutationFn: ({ body, recipientUserId }: { body: string; recipientUserId: string }) =>
        httpClient.post<TeamChatMessage>('/team-chat/messages', { body, recipientUserId }),
      onMutate: async ({ body, recipientUserId }) => {
        if (!user) return { optimisticId: '' }
        const optimistic: TeamChatMessage = {
          id: `optimistic:${Date.now()}`,
          body,
          createdAt: new Date().toISOString(),
          recipientUserId,
          sender: { id: user.id, name: user.name, avatar: user.avatar },
        }
        applyIncomingTeamChatMessage(queryClient, optimistic, user.id)
        return { optimisticId: optimistic.id }
      },
      onSuccess: (msg, _vars, ctx) => {
        if (ctx?.optimisticId) {
          queryClient.setQueryData<{ items: TeamChatMessage[] }>(messagesKey(msg.recipientUserId), (prev) => {
            if (!prev) return prev
            return { items: prev.items.filter((m) => m.id !== ctx.optimisticId) }
          })
        }
        applyIncomingTeamChatMessage(queryClient, msg, msg.sender.id)
      },
      onError: (_err, variables, ctx) => {
        if (!ctx?.optimisticId) return
        queryClient.setQueryData<{ items: TeamChatMessage[] }>(
          messagesKey(variables.recipientUserId),
          (prev) => {
            if (!prev) return prev
            return { items: prev.items.filter((m) => m.id !== ctx.optimisticId) }
          }
        )
      },
    })
  },
}
