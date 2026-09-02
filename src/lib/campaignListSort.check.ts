/**
 * Runnable check for campaign list date sort.
 * Run: npx tsx frontend/src/lib/campaignListSort.check.ts
 */
import assert from 'node:assert/strict';
import type { CampaignRecord } from '../types.ts';
import {
  campaignWhenAt,
  compareIsoDates,
  nextCampaignListSort,
  sortCampaignsForList,
} from './campaignListSort.ts';

assert.equal(
  campaignWhenAt({ status: 'Scheduled', scheduledAt: '2026-01-02T00:00:00Z', sentAt: null }),
  '2026-01-02T00:00:00Z'
);
assert.equal(
  campaignWhenAt({ status: 'Completed', scheduledAt: '2026-01-02T00:00:00Z', sentAt: '2026-01-03T00:00:00Z' }),
  '2026-01-03T00:00:00Z'
);
assert.equal(campaignWhenAt({ status: 'Draft', scheduledAt: null, sentAt: null }), null);

assert.ok(compareIsoDates('2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z', 'asc') < 0);
assert.ok(compareIsoDates('2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z', 'desc') > 0);
assert.equal(compareIsoDates(null, '2026-01-01T00:00:00Z', 'desc'), 1);
assert.equal(compareIsoDates('2026-01-01T00:00:00Z', null, 'desc'), -1);

assert.deepEqual(nextCampaignListSort('created', 'desc', 'created'), { key: 'created', dir: 'asc' });
assert.deepEqual(nextCampaignListSort('created', 'asc', 'when'), { key: 'when', dir: 'desc' });

const stub = (partial: Partial<CampaignRecord> & Pick<CampaignRecord, 'id'>): CampaignRecord => ({
  name: partial.id,
  status: 'Draft',
  channel: 'whatsapp',
  segmentLabel: '',
  totalRecipients: 0,
  sentCount: 0,
  deliveredCount: 0,
  readCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
  sentAt: null,
  scheduledAt: null,
  ...partial,
});

const rows = [
  stub({ id: 'old', createdAt: '2026-01-01T00:00:00Z', sentAt: '2026-01-05T00:00:00Z' }),
  stub({ id: 'new', createdAt: '2026-01-10T00:00:00Z', sentAt: null }),
  stub({
    id: 'sched',
    status: 'Scheduled',
    createdAt: '2026-01-05T00:00:00Z',
    scheduledAt: '2026-02-01T00:00:00Z',
  }),
];

assert.deepEqual(
  sortCampaignsForList(rows, 'created', 'desc').map((c) => c.id),
  ['new', 'sched', 'old']
);
assert.deepEqual(
  sortCampaignsForList(rows, 'when', 'desc').map((c) => c.id),
  ['sched', 'old', 'new']
);

const statusRows = [
  stub({ id: 'a', status: 'Running' }),
  stub({ id: 'b', status: 'Draft' }),
  stub({ id: 'c', status: 'Completed' }),
];
assert.deepEqual(
  sortCampaignsForList(statusRows, 'status', 'asc').map((c) => c.id),
  ['c', 'b', 'a'] // Completed, Draft, Running — alphabetical
);
assert.deepEqual(
  sortCampaignsForList(statusRows, 'status', 'desc').map((c) => c.id),
  ['a', 'b', 'c']
);

const channelRows = [
  stub({ id: 'x', channel: 'whatsapp' }),
  stub({ id: 'y', channel: 'email' }),
  stub({ id: 'z', channel: 'instagram' }),
];
assert.deepEqual(
  sortCampaignsForList(channelRows, 'channel', 'asc').map((c) => c.id),
  ['y', 'z', 'x'] // email, instagram, whatsapp
);

console.log('campaignListSort.check.ts: ok');
