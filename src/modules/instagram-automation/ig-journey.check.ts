/**
 * Runnable check: IG keyword matching + starter graph node types + auto-layout.
 * Run: npx tsx src/modules/instagram-automation/ig-journey.check.ts
 */
import assert from 'node:assert/strict';
import { matchesKeyword } from './lib/keywordMatch.ts';
import { layoutIgFlow } from './lib/layoutIgFlow.ts';
import {
  nextAvailableTriggerEvent,
  normalizeIgTriggerEvents,
} from './lib/triggerEvents.ts';
import { createStarterGraph, graphToFlow } from './hooks/useIgJourneyGraph.ts';
import { IG_STEP_CATALOG } from './stepCatalog.ts';
import { filterPaletteItems, PALETTE_ITEMS } from './components/stepCatalogUtils.ts';
import {
  IG_SEND_AS_MODES,
  isComingSoonBlockType,
  isContentAllowedForSendAs,
  normalizeIgSendMessageBlocks,
  resolveIgSendAs,
} from './types.ts';
import { mirrorTextFromBlocks } from './components/blocks/SendMessageBlocks.tsx';

assert.equal(matchesKeyword('Hello World', 'hello'), true);
assert.equal(matchesKeyword('Hello World', 'WORLD'), true);
assert.equal(matchesKeyword('Hello World', 'xyz'), false);
assert.equal(matchesKeyword('anything', ''), true);
assert.equal(matchesKeyword('anything', '   '), true);
assert.equal(matchesKeyword('Price please', 'price'), true);

const starter = createStarterGraph();
assert.equal(starter.nodes.length, 2);
assert.equal(starter.nodes[0].type, 'TRIGGER');
assert.equal(starter.nodes[1].type, 'END');
assert.equal(starter.edges.length, 1);
const starterFlow = graphToFlow(starter);
assert.equal(starterFlow.edges[0]?.type, 'curved');
assert.equal(starterFlow.edges[0]?.style?.strokeWidth, 1.5);

// Catalog + trigger = 17 IG node types
assert.equal(IG_STEP_CATALOG.length + 1, 17);
assert.ok(IG_STEP_CATALOG.some((s) => s.type === 'ADD_TO_FUNNEL'));
const condStep = IG_STEP_CATALOG.find((s) => s.type === 'CONDITION');
assert.ok(condStep);
assert.equal(condStep!.label, 'Condition');
assert.ok(
  filterPaletteItems(PALETTE_ITEMS, { query: 'condition', hasTrigger: true }).some(
    (s) => s.type === 'CONDITION'
  ),
  'CONDITION findable when searching "condition"'
);

assert.deepEqual(normalizeIgTriggerEvents({ event: 'comment.received' }), [
  'comment.received',
]);
assert.deepEqual(
  normalizeIgTriggerEvents({ events: ['dm.received', 'comment.received'] }),
  ['dm.received', 'comment.received']
);
assert.equal(nextAvailableTriggerEvent(['dm.received']), 'comment.received');
assert.equal(
  nextAvailableTriggerEvent(['dm.received', 'comment.received']),
  null
);

const messy = graphToFlow({
  nodes: [
    { id: 't', type: 'TRIGGER', data: {}, positionX: 400, positionY: 300 },
    { id: 'a', type: 'ASK_QUESTION', data: {}, positionX: 10, positionY: 500 },
    { id: 'c', type: 'CONDITION', data: {}, positionX: 900, positionY: 20 },
    { id: 'y', type: 'SEND_MESSAGE', data: {}, positionX: 50, positionY: 10 },
    { id: 'n', type: 'SEND_MESSAGE', data: {}, positionX: 80, positionY: 900 },
    { id: 'e', type: 'END', data: {}, positionX: 1, positionY: 1 },
  ],
  edges: [
    { id: 'e1', sourceNodeId: 't', targetNodeId: 'a', conditionValue: null },
    { id: 'e2', sourceNodeId: 'a', targetNodeId: 'c', conditionValue: null },
    { id: 'e3', sourceNodeId: 'c', targetNodeId: 'y', conditionValue: 'yes' },
    { id: 'e4', sourceNodeId: 'c', targetNodeId: 'n', conditionValue: 'no' },
    { id: 'e5', sourceNodeId: 'y', targetNodeId: 'e', conditionValue: null },
    { id: 'e6', sourceNodeId: 'n', targetNodeId: 'e', conditionValue: null },
  ],
});
const laid = layoutIgFlow(messy.nodes, messy.edges);
const byId = Object.fromEntries(laid.map((n) => [n.id, n.position]));
assert.ok(byId.t.x < byId.a.x && byId.a.x < byId.c.x, 'left-to-right ranks');
assert.ok(byId.y.y < byId.n.y, 'yes branch above no');
assert.equal(byId.y.x, byId.n.x, 'yes/no same column');

// Cyclic graphs must not hang (regression: unbounded BFS rank queue).
const cyclic = graphToFlow({
  nodes: [
    { id: 'a', type: 'TRIGGER', data: {}, positionX: 0, positionY: 0 },
    { id: 'b', type: 'SEND_MESSAGE', data: {}, positionX: 0, positionY: 0 },
    { id: 'c', type: 'CONDITION', data: {}, positionX: 0, positionY: 0 },
  ],
  edges: [
    { id: 'e1', sourceNodeId: 'a', targetNodeId: 'b', conditionValue: null },
    { id: 'e2', sourceNodeId: 'b', targetNodeId: 'c', conditionValue: null },
    { id: 'e3', sourceNodeId: 'c', targetNodeId: 'b', conditionValue: null },
  ],
});
assert.equal(layoutIgFlow(cyclic.nodes, cyclic.edges).length, 3);

// Send as: exactly 2 canonical modes, clean labels, backward compat for legacy 'dm'.
assert.deepEqual(IG_SEND_AS_MODES, ['private_reply', 'window_24h']);
assert.equal(resolveIgSendAs(undefined), 'window_24h');
assert.equal(resolveIgSendAs({ sendAs: 'dm' }), 'window_24h', 'legacy value still reads as 24h window');
assert.equal(resolveIgSendAs({ sendAs: 'private_reply' }), 'private_reply');
assert.equal(isContentAllowedForSendAs('private_reply', 'text'), true);
assert.equal(isContentAllowedForSendAs('private_reply', 'buttons'), true);
assert.equal(isContentAllowedForSendAs('private_reply', 'image'), false);
assert.equal(isContentAllowedForSendAs('window_24h', 'image'), true);
assert.equal(isContentAllowedForSendAs('dm', 'image'), true, 'legacy dm behaves like window_24h');

// Content-block picker: migrate-on-read + sendAs gating (mirrors backend ig-journey.types.ts).
assert.deepEqual(normalizeIgSendMessageBlocks({ text: 'hi' }), [
  { id: 'legacy_text', type: 'text', text: 'hi' },
]);
assert.deepEqual(
  normalizeIgSendMessageBlocks({ blocks: [{ id: 'b1', type: 'text', text: 'from blocks' }] }),
  [{ id: 'b1', type: 'text', text: 'from blocks' }]
);
assert.equal(isComingSoonBlockType('dynamic'), true);
assert.equal(isComingSoonBlockType('data_collection'), true);
assert.equal(isComingSoonBlockType('image'), false);

// mirrorTextFromBlocks — keeps `data.text` in sync for legacy readers (canvas mini-card,
// PhonePreviewStrip) that only know about `text`, not `blocks`.
assert.equal(
  mirrorTextFromBlocks([
    { id: 'i', type: 'image', mediaId: 'm1' },
    { id: 't', type: 'text', text: 'hello' },
  ]),
  'hello'
);
assert.equal(mirrorTextFromBlocks([{ id: 'i', type: 'image', mediaId: 'm1' }]), '');

console.log('ig-journey check ok');
