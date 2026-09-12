export type ConversationEvent = {
  id: string
  type: string
  actorType: string
  actorId?: string | null
  actorName?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
}

export function conversationEventLabel(event: ConversationEvent): string {
  const name = event.actorName?.trim()
  switch (event.type) {
    case 'AI_ASSIGNED':
      return name ? `${name} assigned` : 'AI Agent assigned'
    case 'AI_HANDLING_STARTED':
      return name ? `${name} started handling this chat` : 'AI started handling this chat'
    case 'HUMAN_TAKEOVER':
      return `${name || 'Agent'} took over this chat`
    case 'HUMAN_RELEASED_TO_AI':
      return `${name || 'Agent'} released this chat to AI`
    case 'CONVERSATION_RESOLVED':
      return 'Conversation resolved'
    case 'CONVERSATION_REOPENED':
      return 'Conversation reopened'
    default:
      return event.type.replace(/_/g, ' ').toLowerCase()
  }
}

export function mergeMessagesAndEvents<T extends { createdAt: string }>(
  messages: T[],
  events: ConversationEvent[]
): Array<{ createdAt: string; kind: 'message'; message: T } | { createdAt: string; kind: 'event'; event: ConversationEvent }> {
  const items: Array<
    | { createdAt: string; kind: 'message'; message: T }
    | { createdAt: string; kind: 'event'; event: ConversationEvent }
  > = [
    ...messages.map((message) => ({ createdAt: message.createdAt, kind: 'message' as const, message })),
    ...events.map((event) => ({ createdAt: event.createdAt, kind: 'event' as const, event })),
  ]
  return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}
