/**
 * ponytail: inbox list must stay newest-first after dedupe;
 * WhatsApp threads for different business numbers must not collapse.
 * Run: npx tsx frontend/src/lib/inboxDedupe.check.ts
 */
import assert from 'node:assert/strict';
import {
  dedupeInboxThreads,
  sortInboxByLatestMessage,
  whatsappInboxDedupeKey,
} from './inboxDedupe.ts';

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

const sameCustomerTwoBizNumbers = dedupeInboxThreads([
  {
    conversationId: 'wa-cloud',
    id: 'contact-1',
    phone: '+918800066888',
    channel: 'whatsapp',
    channelAccountId: 'phone-number-id-cloud',
    lastMessageAt: '2026-01-01T10:00:00.000Z',
  },
  {
    conversationId: 'wa-coex',
    id: 'contact-1',
    phone: '8800066888',
    channel: 'whatsapp',
    channelAccountId: 'phone-number-id-coex',
    lastMessageAt: '2026-01-01T11:00:00.000Z',
  },
]);
assert.equal(sameCustomerTwoBizNumbers.length, 2);
assert.notEqual(
  whatsappInboxDedupeKey({
    channel: 'whatsapp',
    channelAccountId: 'phone-number-id-cloud',
    contact: { id: 'c', phone: '+918800066888' },
  }),
  whatsappInboxDedupeKey({
    channel: 'whatsapp',
    channelAccountId: 'phone-number-id-coex',
    contact: { id: 'c', phone: '+918800066888' },
  })
);

console.log('inboxDedupe.check.ts: ok');
