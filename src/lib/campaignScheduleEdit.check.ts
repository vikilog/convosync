/**
 * Runnable check for scheduled-campaign edit gate + wizard seed.
 * Run: npx tsx frontend/src/lib/campaignScheduleEdit.check.ts
 */
import assert from 'node:assert/strict';
import {
  isScheduledCampaignEditable,
  SCHEDULED_CAMPAIGN_EDIT_LEAD_MS,
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

console.log('campaignScheduleEdit.check: ok');
