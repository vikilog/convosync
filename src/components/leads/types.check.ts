import { moveLeadToStage, type Lead } from './types';

const sample: Lead[] = [
  {
    id: 'a',
    funnelId: 'f1',
    stageId: 's1',
    name: 'Test',
    phone: null,
    email: null,
    stage: 'New',
    source: 'manual',
    requirement: 'x',
    assignedRep: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    origin: null,
    notes: '',
    activity: [],
  },
];

const moved = moveLeadToStage(sample, 'a', 's2', 'Contacted');
console.assert(moved[0].stageId === 's2', 'stageId should update');
console.assert(moved[0].stage === 'Contacted', 'stage name should update');
console.assert(moved[0].activity[0]?.type === 'stage_change', 'activity should log move');
console.assert(sample[0].stageId === 's1', 'original array must stay immutable');

const same = moveLeadToStage(moved, 'a', 's2', 'Contacted');
console.assert(same[0] === moved[0], 'noop when stage unchanged');

console.log('leads/types.check.ts: ok');
