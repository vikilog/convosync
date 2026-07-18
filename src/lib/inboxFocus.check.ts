/**
 * Self-check: viewing-id helpers ignore selection when Inbox tab is hidden.
 * Run: npx tsx frontend/src/lib/inboxFocus.check.ts
 */
import assert from 'node:assert/strict';
import {
  isViewingInboxConversation,
  setActiveInboxConversationId,
  setInboxVisible,
  getViewingInboxConversationId,
} from './inboxFocus.ts';

setInboxVisible(true);
setActiveInboxConversationId('conv-a');
assert.equal(getViewingInboxConversationId(), 'conv-a');
assert.equal(isViewingInboxConversation('conv-a'), true);
assert.equal(isViewingInboxConversation('conv-b'), false);

setInboxVisible(false);
assert.equal(getViewingInboxConversationId(), '');
assert.equal(isViewingInboxConversation('conv-a'), false);

setInboxVisible(true);
assert.equal(isViewingInboxConversation('conv-a'), true);

console.log('inboxFocus.check.ts: ok');
