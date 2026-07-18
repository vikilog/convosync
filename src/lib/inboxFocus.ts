/** Conversation open in the visible Inbox tab (KeepAlive-hidden does not count). */
let activeConversationId = '';
let inboxVisible = false;

export function setInboxVisible(visible: boolean) {
  inboxVisible = visible;
}

export function setActiveInboxConversationId(conversationId: string) {
  activeConversationId = conversationId;
}

export function getActiveInboxConversationId() {
  return activeConversationId;
}

/** Id to treat as "currently reading" for toast skip + unread exclusion. */
export function getViewingInboxConversationId() {
  return inboxVisible ? activeConversationId : '';
}

export function isViewingInboxConversation(conversationId: string) {
  return Boolean(conversationId) && getViewingInboxConversationId() === conversationId;
}
