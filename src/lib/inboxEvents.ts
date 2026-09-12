import { httpClient } from '@/lib/httpClient'
import { isConversationInInboxScope, type InboxScope } from '@/lib/inboxScope'
import { sumUnreadForNav } from '@/lib/navUnread'
import type { Conversation } from '@/services/realInbox.service'

export const INBOX_MESSAGE_NOTIFICATION_EVENT = 'convosync:inbox-message-notification'
export const INBOX_OPEN_CONVERSATION_EVENT = 'convosync:open-inbox-conversation'

let pendingOpenConversationId = ''

export function dispatchOpenInboxConversation(conversationId: string) {
  if (!conversationId) return
  pendingOpenConversationId = conversationId
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(INBOX_OPEN_CONVERSATION_EVENT, { detail: { conversationId } })
  )
}

/** Consume a toast-open that arrived before Inbox mounted. */
export function consumePendingOpenInboxConversation() {
  const id = pendingOpenConversationId
  pendingOpenConversationId = ''
  return id
}

export function dispatchInboxMessageNotification(detail: {
  conversationId: string
  contactName: string
  preview: string
}) {
  if (!detail.conversationId || typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(INBOX_MESSAGE_NOTIFICATION_EVENT, { detail }))
}

export async function fetchInboxUnreadTotal(
  excludeConversationId?: string | null,
  scope?: InboxScope
): Promise<number> {
  const convs = await httpClient.get<Conversation[]>('/conversations')
  const scoped = scope ? convs.filter((c) => isConversationInInboxScope(c, scope)) : convs
  return sumUnreadForNav(scoped, excludeConversationId)
}
