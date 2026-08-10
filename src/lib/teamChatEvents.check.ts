/**
 * Self-check: session unread map increments / clears / totals.
 * Run: npx tsx frontend/src/lib/teamChatEvents.check.ts
 */
import assert from 'node:assert/strict';
import {
  clearTeamChatUnread,
  getTeamChatUnreadForPeer,
  getTeamChatUnreadTotal,
  incrementTeamChatUnread,
} from './teamChatEvents.ts';

// ponytail: module state persists in process — clear known peers first
clearTeamChatUnread('p1');
clearTeamChatUnread('p2');

assert.equal(getTeamChatUnreadTotal(), 0);
incrementTeamChatUnread('p1');
incrementTeamChatUnread('p1');
incrementTeamChatUnread('p2');
assert.equal(getTeamChatUnreadForPeer('p1'), 2);
assert.equal(getTeamChatUnreadForPeer('p2'), 1);
assert.equal(getTeamChatUnreadTotal(), 3);
clearTeamChatUnread('p1');
assert.equal(getTeamChatUnreadForPeer('p1'), 0);
assert.equal(getTeamChatUnreadTotal(), 1);

console.log('teamChatEvents.check.ts: ok');
