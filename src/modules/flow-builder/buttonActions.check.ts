/**
 * Run: npx tsx src/modules/flow-builder/buttonActions.check.ts
 */
import assert from 'node:assert/strict';
import {
  BUTTON_PRESS_ACTIONS,
  PERFORM_ACTIONS,
  buildButtonDestination,
} from './buttonActions.js';

// Every top-level card except the "perform_actions" submenu resolves to a real destination.
for (const card of BUTTON_PRESS_ACTIONS) {
  if (card.id === 'perform_actions') {
    assert.equal(buildButtonDestination(card.id, { channel: 'whatsapp' }), null);
    continue;
  }
  const dest = buildButtonDestination(card.id, { channel: 'whatsapp' });
  assert.ok(dest, `${card.id} should resolve to a destination`);
  assert.equal(typeof dest!.nodeType, 'string');
}

// Every Perform Actions submenu item resolves too.
for (const card of PERFORM_ACTIONS) {
  const dest = buildButtonDestination(card.id, { channel: 'instagram' });
  assert.ok(dest, `${card.id} should resolve to a destination`);
}

// Card ids are unique across both lists (no accidental id collision between menu levels).
const ids = [...BUTTON_PRESS_ACTIONS.map((c) => c.id), ...PERFORM_ACTIONS.map((c) => c.id)];
assert.equal(ids.length, new Set(ids).size, 'action ids must be unique');

// Open website is the Meta-constrained one: never a raw button type, always a SEND_MESSAGE
// carrying a channel-specific CTA shape (WA cta_url interactive, IG card/web_url button).
const waWebsite = buildButtonDestination('open_website', { channel: 'whatsapp', buttonTitle: 'Buy now' });
assert.equal(waWebsite?.nodeType, 'SEND_MESSAGE');
assert.equal(waWebsite?.data.messageMode, 'cta_url');
assert.equal(waWebsite?.data.ctaLabel, 'Buy now');

const igWebsite = buildButtonDestination('open_website', { channel: 'instagram', buttonTitle: 'Buy now' });
assert.equal(igWebsite?.nodeType, 'SEND_MESSAGE');
const igBlocks = igWebsite?.data.blocks as Array<{ type: string; buttonUrl?: string }>;
assert.equal(igBlocks[0].type, 'card');
assert.equal(igBlocks[0].buttonUrl, '');

// AI Step reuses the existing ASSIGN_TO 'ai' assignee type — no new assignee kind invented.
assert.deepEqual(buildButtonDestination('ai_step', { channel: 'whatsapp' }), {
  nodeType: 'ASSIGN_TO',
  data: { assigneeType: 'ai' },
});

// Escalate to human hands back to the unassigned human queue (distinct from AI Step).
assert.deepEqual(buildButtonDestination('escalate_to_human', { channel: 'whatsapp' }), {
  nodeType: 'ASSIGN_TO',
  data: { assigneeType: 'unassigned' },
});

// Perform Actions itself is a submenu, not a destination.
assert.equal(buildButtonDestination('perform_actions', { channel: 'whatsapp' }), null);

console.log('buttonActions.check: ok');
