import assert from 'node:assert/strict';
import {
  formatMessagingWindowRemaining,
  messagingWindowFromLastInbound,
} from './messagingWindow.ts';

const NOW = Date.parse('2026-08-10T12:00:00.000Z');
const H = 60 * 60 * 1000;

assert.equal(messagingWindowFromLastInbound(null, NOW), null);
assert.equal(messagingWindowFromLastInbound('', NOW), null);

const open = messagingWindowFromLastInbound(new Date(NOW - 2 * H).toISOString(), NOW);
assert.ok(open);
assert.equal(open.open, true);
assert.ok(open.remainingMs > 21 * H && open.remainingMs < 23 * H);

const closed = messagingWindowFromLastInbound(new Date(NOW - 25 * H).toISOString(), NOW);
assert.ok(closed);
assert.equal(closed.open, false);

assert.equal(formatMessagingWindowRemaining(0), 'Expired');
assert.equal(formatMessagingWindowRemaining(-1), 'Expired');
assert.match(formatMessagingWindowRemaining(3 * H + 12 * 60 * 1000), /^3h 12m left$/);

console.log('messagingWindow.check.ts: ok');
