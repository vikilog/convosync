/**
 * ponytail: inbox list must stay newest-first after dedupe.
 * Run: npx tsx frontend/src/lib/inboxDedupe.check.ts
 */
import assert from 'node:assert/strict';
import { dedupeInboxThreads, sortInboxByLatestMessage } from './inboxDedupe.ts';

const sorted = sortInboxByLatestMessage([
  { lastMessageAt: '2026-01-01T10:00:00.000Z' },
  { lastMessageAt: '2026-01-01T12:00:00.000Z' },
  { lastMessageAt: '2026-01-01T11:00:00.000Z' },
]);
assert.equal(sorted[0].lastMessageAt, '2026-01-01T12:00:00.000Z');
assert.equal(sorted[2].lastMessageAt, '2026-01-01T10:00:00.000Z');

const deduped = dedupeInboxThreads([
  {
    conversationId: 'c1',
    id: 'u1',
    phone: 'ig:1',
    channel: 'instagram',
    lastMessageAt: '2026-01-01T10:00:00.000Z',
  },
  {
    conversationId: 'c2',
    id: 'u2',
    phone: 'ig:2',
    channel: 'instagram',
    lastMessageAt: '2026-01-01T12:00:00.000Z',
  },
]);
assert.equal(deduped[0].conversationId, 'c2');

console.log('inboxDedupe.check.ts: ok');
