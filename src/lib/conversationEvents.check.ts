/**
 * Self-check: conversation handover event labels + merge order.
 * Run: npx tsx frontend/src/lib/conversationEvents.check.ts
 */
import assert from 'node:assert/strict';
import { mapConversationEventToMessage, mergeMessagesAndEvents } from './conversationEvents.ts';

const takeover = mapConversationEventToMessage({
  id: 'e1',
  type: 'HUMAN_TAKEOVER',
  actorType: 'HUMAN',
  actorName: 'Priya',
  createdAt: '2026-07-23T10:00:00.000Z',
});
assert.equal(takeover.sender, 'system');
assert.match(takeover.content, /Priya took over this chat/);
assert.match(takeover.id, /^event:e1$/);

const assigned = mapConversationEventToMessage({
  id: 'e0',
  type: 'AI_ASSIGNED',
  actorType: 'SYSTEM',
  actorName: 'Support Bot',
  createdAt: '2026-07-23T09:00:00.000Z',
});
assert.match(assigned.content, /Support Bot assigned/);

const merged = mergeMessagesAndEvents(
  [
    {
      id: 'm1',
      sender: 'contact',
      senderName: 'Guest',
      content: 'hi',
      createdAt: '2026-07-23T09:30:00.000Z',
      timestamp: '9:30',
    },
  ],
  [
    {
      id: 'e0',
      type: 'AI_ASSIGNED',
      actorType: 'SYSTEM',
      actorName: 'Support Bot',
      createdAt: '2026-07-23T09:00:00.000Z',
    },
    {
      id: 'e1',
      type: 'HUMAN_TAKEOVER',
      actorType: 'HUMAN',
      actorName: 'Priya',
      createdAt: '2026-07-23T10:00:00.000Z',
    },
  ]
);
assert.deepEqual(
  merged.map((m) => m.id),
  ['event:e0', 'm1', 'event:e1']
);

console.log('conversationEvents.check.ts: ok');
