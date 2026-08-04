/**
 * Run: npx tsx src/modules/flow-builder/walkVisiblePreviewSteps.check.ts
 */
import assert from 'node:assert/strict';
import type { Edge, Node } from '@xyflow/react';
import { walkVisiblePreviewSteps } from './walkVisiblePreviewSteps.ts';

const nodes: Node[] = [
  { id: 't', type: 'TRIGGER', position: { x: 0, y: 0 }, data: { event: 'dm.received' } },
  {
    id: 'm1',
    type: 'SEND_MESSAGE',
    position: { x: 0, y: 0 },
    data: { text: 'Welcome!' },
  },
  { id: 'w', type: 'WAIT', position: { x: 0, y: 0 }, data: { amount: 1, unit: 'hours' } },
  {
    id: 'q',
    type: 'ASK_QUESTION',
    position: { x: 0, y: 0 },
    data: {
      text: 'Pick one',
      quickReplies: [{ title: 'Hair wash' }, { title: 'Body wax' }, { title: 'Beard' }],
    },
  },
  { id: 'tag', type: 'UPDATE_TAG', position: { x: 0, y: 0 }, data: { tags: ['x'] } },
  { id: 'end', type: 'END', position: { x: 0, y: 0 }, data: {} },
];

const edges: Edge[] = [
  { id: 'e1', source: 't', target: 'm1' },
  { id: 'e2', source: 'm1', target: 'w' },
  { id: 'e3', source: 'w', target: 'q' },
  { id: 'e4', source: 'q', target: 'tag' },
  { id: 'e5', source: 'tag', target: 'end' },
];

const steps = walkVisiblePreviewSteps(nodes, edges);
assert.equal(steps.length, 2);
assert.equal(steps[0].text, 'Welcome!');
assert.equal(steps[1].quickReplies.length, 3);
assert.equal(steps[1].quickReplies[0].title, 'Hair wash');

// CONDITION follows yes
const condNodes: Node[] = [
  { id: 't', type: 'TRIGGER', position: { x: 0, y: 0 }, data: {} },
  { id: 'c', type: 'CONDITION', position: { x: 0, y: 0 }, data: {} },
  { id: 'yes', type: 'SEND_MESSAGE', position: { x: 0, y: 0 }, data: { text: 'yes path' } },
  { id: 'no', type: 'SEND_MESSAGE', position: { x: 0, y: 0 }, data: { text: 'no path' } },
];
const condEdges: Edge[] = [
  { id: 'a', source: 't', target: 'c' },
  { id: 'b', source: 'c', target: 'yes', sourceHandle: 'yes' },
  { id: 'c', source: 'c', target: 'no', sourceHandle: 'no' },
];
assert.equal(walkVisiblePreviewSteps(condNodes, condEdges)[0]?.text, 'yes path');

// BUTTONS shows as phone preview with button titles as quick replies
const btnNodes: Node[] = [
  { id: 't', type: 'TRIGGER', position: { x: 0, y: 0 }, data: {} },
  {
    id: 'b',
    type: 'BUTTONS',
    position: { x: 0, y: 0 },
    data: {
      text: 'Pick',
      buttons: [
        { id: 'btn_a', title: 'Option A' },
        { id: 'btn_b', title: 'Option B' },
      ],
    },
  },
];
const btnEdges: Edge[] = [{ id: 'e', source: 't', target: 'b' }];
const btnSteps = walkVisiblePreviewSteps(btnNodes, btnEdges);
assert.equal(btnSteps.length, 1);
assert.equal(btnSteps[0].type, 'BUTTONS');
assert.equal(btnSteps[0].quickReplies[0].title, 'Option A');

console.log('walkVisiblePreviewSteps.check: ok');
