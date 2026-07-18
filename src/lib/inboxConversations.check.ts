/**
 * Self-check: conversation refresh path must not call metadata APIs.
 * Run: npx tsx frontend/src/lib/inboxConversations.check.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, 'inboxConversations.ts'), 'utf8');

assert.match(src, /getConversations/);
assert.doesNotMatch(src, /getTeamStats|getAgents|getJourneys|getMe|Accounts/);

const inboxView = readFileSync(join(dir, '../components/InboxView.tsx'), 'utf8');
assert.doesNotMatch(inboxView, /setInterval/);
assert.match(inboxView, /fetchInboxConversationRows/);
assert.match(inboxView, /useInboxAssigneeMeta/);

console.log('inboxConversations.check.ts: ok');
