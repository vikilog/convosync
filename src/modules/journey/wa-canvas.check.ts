/**
 * Smoke: WA ManyChat-style canvas — every journey node type maps to a card
 * component, graph edges are curved, WA theme tokens present.
 * Run: npx tsx src/modules/journey/wa-canvas.check.ts
 */
import assert from 'node:assert/strict';
import { journeyNodeTypes } from './reactflow/nodes/JourneyNodes.tsx';
import { graphToFlow, createStarterGraph } from './hooks/useJourneyGraph.ts';
import { FLOW_CHANNEL_THEMES } from '../flow-builder/channelTheme.ts';
import { walkVisiblePreviewSteps } from '../flow-builder/walkVisiblePreviewSteps.ts';
import { STEP_VISUALS } from './components/stepIcons.tsx';
import type { JourneyNodeType } from './types.ts';

const ALL_TYPES = Object.keys(journeyNodeTypes) as JourneyNodeType[];

assert.ok(ALL_TYPES.includes('UPDATE_LIFECYCLE'), 'WA-only UPDATE_LIFECYCLE registered');
assert.ok(ALL_TYPES.includes('SEND_CAPI'), 'WA integration stub registered');
assert.ok(ALL_TYPES.includes('ADD_TO_FUNNEL'));
assert.ok(ALL_TYPES.includes('RANDOMIZER'));
assert.ok(ALL_TYPES.includes('BUTTONS'));
assert.ok(ALL_TYPES.includes('GOTO_STEP'));

for (const type of ALL_TYPES) {
  assert.equal(typeof journeyNodeTypes[type], 'function', `${type} must be a React node component`);
  assert.ok(STEP_VISUALS[type]?.icon, `${type} needs stepIcons mapping`);
}

assert.ok(FLOW_CHANNEL_THEMES.whatsapp.iconChipBg.includes('#25D366'));
assert.equal(FLOW_CHANNEL_THEMES.whatsapp.channelLabel, 'WhatsApp');

const starter = createStarterGraph();
const flow = graphToFlow(starter);
assert.equal(flow.edges[0]?.type, 'curved');
assert.equal(flow.edges[0]?.style?.strokeWidth, 1.5);

// Preview strip still walks message steps (card migration must not break data walk).
const previewGraph = graphToFlow({
  nodes: [
    { id: 't', type: 'TRIGGER', data: { event: 'message.received' }, positionX: 0, positionY: 0 },
    {
      id: 'm',
      type: 'SEND_MESSAGE',
      data: { messageMode: 'text', text: 'Hello WA' },
      positionX: 200,
      positionY: 0,
    },
    {
      id: 'life',
      type: 'UPDATE_LIFECYCLE',
      data: { stage: 'lead' },
      positionX: 400,
      positionY: 0,
    },
    { id: 'e', type: 'END', data: {}, positionX: 600, positionY: 0 },
  ],
  edges: [
    { id: 'e1', sourceNodeId: 't', targetNodeId: 'm', conditionValue: null },
    { id: 'e2', sourceNodeId: 'm', targetNodeId: 'life', conditionValue: null },
    { id: 'e3', sourceNodeId: 'life', targetNodeId: 'e', conditionValue: null },
  ],
});
const steps = walkVisiblePreviewSteps(previewGraph.nodes, previewGraph.edges);
assert.equal(steps.length, 1);
assert.equal(steps[0].text, 'Hello WA');

console.log(`wa-canvas.check: ok (${ALL_TYPES.length} node types)`);
