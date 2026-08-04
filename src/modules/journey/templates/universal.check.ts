/**
 * Runnable check: journey templates (ConvoSync + universal) build valid graphs.
 * Run: npx tsx src/modules/journey/templates/universal.check.ts
 */
import assert from 'node:assert/strict';
import {
  CONVOSYNC_JOURNEY_TEMPLATES,
  JOURNEY_TEMPLATES,
  UNIVERSAL_JOURNEY_TEMPLATES,
  getJourneyTemplate,
} from './index.ts';

assert.equal(UNIVERSAL_JOURNEY_TEMPLATES.length, 5);
assert.equal(CONVOSYNC_JOURNEY_TEMPLATES.length, 2);
assert.equal(JOURNEY_TEMPLATES.length, 7);
assert.ok(JOURNEY_TEMPLATES[0].id.startsWith('convosync_'));

for (const t of JOURNEY_TEMPLATES) {
  const g = t.buildGraph();
  assert.ok(g.nodes.length >= 3, `${t.id}: expected multi-step graph`);
  assert.equal(g.nodes[0].type, 'TRIGGER');
  assert.equal(g.nodes[g.nodes.length - 1].type, 'END');
  assert.equal(g.edges.length, g.nodes.length - 1);
  const ids = new Set(g.nodes.map((n) => n.id));
  assert.equal(ids.size, g.nodes.length, `${t.id}: duplicate node ids`);
  for (const e of g.edges) {
    assert.ok(ids.has(e.sourceNodeId));
    assert.ok(ids.has(e.targetNodeId));
  }
}

const care = getJourneyTemplate('convosync_customer_care')!.buildGraph();
assert.ok(
  (care.nodes[0].data.channels as string[]).includes('whatsapp'),
  'customer care triggers all channels'
);
assert.ok(
  care.nodes.some((n) => n.type === 'ASK_QUESTION'),
  'customer care asks intent'
);
assert.ok(
  care.nodes.some((n) => n.type === 'OPEN_CONVERSATION'),
  'customer care opens conversation'
);

const a = getJourneyTemplate('welcome_reply')!.buildGraph();
const b = getJourneyTemplate('welcome_reply')!.buildGraph();
assert.notEqual(a.nodes[0].id, b.nodes[0].id, 'fresh ids per build');

console.log('universal.check: ok');
