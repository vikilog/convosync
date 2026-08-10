/**
 * Self-check: viewing-id helpers ignore selection when Team Chat tab is hidden.
 * Run: npx tsx frontend/src/lib/teamChatFocus.check.ts
 */
import assert from 'node:assert/strict';
import {
  isViewingTeamChatPeer,
  setActiveTeamChatPeerId,
  setTeamChatVisible,
  getViewingTeamChatPeerId,
} from './teamChatFocus.ts';

setTeamChatVisible(true);
setActiveTeamChatPeerId('user-a');
assert.equal(getViewingTeamChatPeerId(), 'user-a');
assert.equal(isViewingTeamChatPeer('user-a'), true);
assert.equal(isViewingTeamChatPeer('user-b'), false);

setTeamChatVisible(false);
assert.equal(getViewingTeamChatPeerId(), '');
assert.equal(isViewingTeamChatPeer('user-a'), false);

setTeamChatVisible(true);
assert.equal(isViewingTeamChatPeer('user-a'), true);

console.log('teamChatFocus.check.ts: ok');
