/**
 * Smoke: step-note pure helpers — data parsing and zoom-aware drag math.
 * Run: npx tsx src/modules/flow-builder/StepNote.check.ts
 */
import assert from 'node:assert/strict';
import { readStepNote, computeDraggedOffset } from './StepNote.tsx';

assert.equal(readStepNote(undefined), undefined);
assert.equal(readStepNote({}), undefined);
assert.equal(readStepNote({ note: 'not an object' }), undefined);
assert.equal(readStepNote({ note: { offsetX: 1 } }), undefined, 'missing text -> no note');

const parsed = readStepNote({ note: { text: 'Remember to set the API key', offsetX: 10, offsetY: -5 } });
assert.deepEqual(parsed, { text: 'Remember to set the API key', offsetX: 10, offsetY: -5 });

const noOffsets = readStepNote({ note: { text: 'hi' } });
assert.deepEqual(noOffsets, { text: 'hi', offsetX: undefined, offsetY: undefined });

// Below drag threshold at zoom 1 -> not "moved" (click, not drag).
const tiny = computeDraggedOffset({ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 101, y: 101 }, 1);
assert.equal(tiny.moved, false);

// Past threshold -> moved, offset applied in flow-space.
const real = computeDraggedOffset({ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 120, y: 100 }, 1);
assert.equal(real.moved, true);
assert.equal(real.x, 20);
assert.equal(real.y, 0);

// Zoomed out 2x -> same screen delta halves in flow-space.
const zoomed = computeDraggedOffset({ x: 5, y: 5 }, { x: 0, y: 0 }, { x: 40, y: 0 }, 2);
assert.equal(zoomed.x, 25);
assert.equal(zoomed.moved, true);

console.log('StepNote.check: ok');
