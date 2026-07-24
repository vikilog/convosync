import type { ChatMessage } from '../types';
import { formatMessageClock } from './formatDates';

export type ConversationEventApi = {
  id: string;
  type: string;
  actorType: string;
  actorId?: string | null;
  actorName?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

function eventLabel(event: ConversationEventApi): string {
  const name = event.actorName?.trim();
  switch (event.type) {
    case 'AI_ASSIGNED':
      return name ? `${name} assigned` : 'AI Agent assigned';
    case 'AI_HANDLING_STARTED':
      return name ? `${name} started handling this chat` : 'AI started handling this chat';
    case 'HUMAN_TAKEOVER':
      return `${name || 'Agent'} took over this chat`;
    case 'HUMAN_RELEASED_TO_AI':
      return `${name || 'Agent'} released this chat to AI`;
    case 'CONVERSATION_RESOLVED':
      return 'Conversation resolved';
    case 'CONVERSATION_REOPENED':
      return 'Conversation reopened';
    default:
      return event.type.replace(/_/g, ' ').toLowerCase();
  }
}

/** Map a ConversationEvent into a system ChatMessage for the timeline. */
export function mapConversationEventToMessage(event: ConversationEventApi): ChatMessage {
  const createdAt = String(event.createdAt ?? new Date().toISOString());
  const time = formatMessageClock(createdAt);
  const label = eventLabel(event);
  return {
    id: `event:${event.id}`,
    sender: 'system',
    senderName: 'System',
    content: `${label} · ${time}`,
    type: 'text',
    createdAt,
    timestamp: time,
  };
}

export function mergeMessagesAndEvents(
  messages: ChatMessage[],
  events: ConversationEventApi[]
): ChatMessage[] {
  const eventMsgs = events.map(mapConversationEventToMessage);
  return [...messages, ...eventMsgs].sort((a, b) => {
    const ta = new Date(a.createdAt ?? 0).getTime();
    const tb = new Date(b.createdAt ?? 0).getTime();
    return ta - tb;
  });
}
