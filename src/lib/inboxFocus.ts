let activeConversationId = '';

export function setActiveInboxConversationId(conversationId: string) {
  activeConversationId = conversationId;
}

export function getActiveInboxConversationId() {
  return activeConversationId;
}
