/**
 * Runnable check for scheduled-campaign edit gate + wizard seed.
 * Run: npx tsx frontend/src/lib/campaignScheduleEdit.check.ts
 */
import assert from 'node:assert/strict';
import {
  isFailedCampaignRelaunchable,
  isScheduledCampaignEditable,
  minScheduleTimeFor,
  SCHEDULED_CAMPAIGN_EDIT_LEAD_MS,
  todayLocal,
  wizardSeedFromCampaignDetail,
} from './campaignScheduleEdit.ts';

const now = Date.now();
assert.equal(
  isScheduledCampaignEditable('scheduled', new Date(now + SCHEDULED_CAMPAIGN_EDIT_LEAD_MS + 1_000), now),
  true
);
assert.equal(
  isScheduledCampaignEditable('Scheduled', new Date(now + SCHEDULED_CAMPAIGN_EDIT_LEAD_MS + 1_000), now),
  true
);
assert.equal(
  isScheduledCampaignEditable('scheduled', new Date(now + SCHEDULED_CAMPAIGN_EDIT_LEAD_MS), now),
  false
);
assert.equal(isScheduledCampaignEditable('scheduled', new Date(now + 5 * 60 * 1000), now), false);
assert.equal(isScheduledCampaignEditable('draft', new Date(now + 60 * 60 * 1000), now), false);
assert.equal(isScheduledCampaignEditable('scheduled', null, now), false);

const seed = wizardSeedFromCampaignDetail({
  channel: 'whatsapp',
  audienceType: 'segment',
  segmentIds: ['tag:vip', 'tag:leads'],
  template: { id: 't1', name: 'hello' },
  variableMappings: { '1': 'first_name' },
  headerMediaStorageKey: 'media/key',
  headerMediaMimeType: 'image/png',
  headerMediaFileName: 'x.png',
  headerMediaAssetId: null,
  name: 'Promo',
  scheduledAt: new Date(now + 3_600_000).toISOString(),
});
assert.ok(seed);
assert.equal(seed.audienceType, 'segment');
assert.deepEqual(seed.segmentIds, ['tag:vip', 'tag:leads']);
assert.equal(seed.templateId, 't1');
assert.equal(seed.variableMappings['1'], 'first_name');
assert.equal(wizardSeedFromCampaignDetail({ ...seed!, scheduledAt: null, segmentIds: [] }), null);

assert.equal(isFailedCampaignRelaunchable('failed'), true);
assert.equal(isFailedCampaignRelaunchable('Failed'), true);
assert.equal(isFailedCampaignRelaunchable('scheduled'), false);
assert.equal(isFailedCampaignRelaunchable(null), false);

// A failed campaign with no schedule (sent immediately) still seeds — relaunch
// isn't gated on having had a schedule.
const failedSeed = wizardSeedFromCampaignDetail({
  status: 'failed',
  channel: 'whatsapp',
  audienceType: 'all',
  segmentIds: [],
  template: { id: 't2', name: 'retry-me' },
  variableMappings: {},
  headerMediaStorageKey: null,
  headerMediaMimeType: null,
  headerMediaFileName: null,
  headerMediaAssetId: null,
  name: 'Failed campaign',
  scheduledAt: null,
});
assert.ok(failedSeed);
assert.equal(failedSeed.scheduledAt, null);
assert.equal(failedSeed.templateId, 't2');

// todayLocal must always be "today", even late at night — this is what
// previously broke: the date <input> min used defaultScheduleLocal() (now +
// 1h), which rolls to tomorrow's date near midnight and blocks picking a
// legitimately-future time later today.
const lateNight = new Date(2026, 0, 15, 23, 45).getTime(); // Jan 15, 11:45pm local
assert.equal(todayLocal(lateNight), '2026-01-15');
const midday = new Date(2026, 0, 15, 12, 0).getTime();
assert.equal(todayLocal(midday), '2026-01-15');

// minScheduleTimeFor: only constrains the time input when the selected date is today.
assert.equal(minScheduleTimeFor('2026-01-15', midday), '12:00');
assert.equal(minScheduleTimeFor('2026-01-16', midday), undefined);
assert.equal(minScheduleTimeFor('2026-01-14', midday), undefined);

console.log('campaignScheduleEdit.check: ok');
