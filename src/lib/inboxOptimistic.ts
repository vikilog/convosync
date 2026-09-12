import type { QueryClient } from '@tanstack/react-query'

import { inboxQueryKeys, type ConversationMessage, type MessagesPage } from '@/services/realInbox.service'

export function patchInboxMessages(
  queryClient: QueryClient,
  conversationId: string,
  updater: (prev: ConversationMessage[]) => ConversationMessage[]
) {
  queryClient.setQueryData<MessagesPage>(inboxQueryKeys.messages(conversationId), (prev) => {
    if (!prev) return prev
    return { ...prev, messages: updater(prev.messages) }
  })
}

export function pendingAgentMessage(input: {
  pendingId: string
  conversationId: string
  senderName: string
  content: string
  type: string
  metadata: ConversationMessage['metadata']
}): ConversationMessage {
  return {
    id: input.pendingId,
    conversationId: input.conversationId,
    sender: 'agent',
    senderName: input.senderName,
    content: input.content,
    type: input.type,
    status: 'sending',
    createdAt: new Date().toISOString(),
    metadata: input.metadata,
  }
}
