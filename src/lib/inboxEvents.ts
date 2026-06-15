export const INBOX_UNREAD_TOTAL_EVENT = 'convosync:inbox-unread-total';
export const INBOX_MESSAGE_NOTIFICATION_EVENT = 'convosync:inbox-message-notification';
export const INBOX_OPEN_CONVERSATION_EVENT = 'convosync:open-inbox-conversation';

export function dispatchInboxUnreadTotal(total: number) {
  window.dispatchEvent(
    new CustomEvent(INBOX_UNREAD_TOTAL_EVENT, { detail: { total: Math.max(0, total) } })
  );
}

export function dispatchInboxMessageNotification(detail: {
  conversationId: string;
  contactName: string;
  preview: string;
  channel?: string;
}) {
  window.dispatchEvent(
    new CustomEvent(INBOX_MESSAGE_NOTIFICATION_EVENT, { detail })
  );
}

export function dispatchOpenInboxConversation(conversationId: string) {
  window.dispatchEvent(
    new CustomEvent(INBOX_OPEN_CONVERSATION_EVENT, { detail: { conversationId } })
  );
}

export async function fetchInboxUnreadTotal(): Promise<number> {
  const { api } = await import('./api');
  const convs = (await api.getConversations()) as Array<{ unreadCount?: number }>;
  return convs.reduce((sum, conv) => sum + Number(conv.unreadCount ?? 0), 0);
}
