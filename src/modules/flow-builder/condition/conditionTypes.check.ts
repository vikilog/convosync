/**
 * Run: npx tsx src/modules/flow-builder/condition/conditionTypes.check.ts
 */
import assert from 'node:assert/strict';
import {
  CONDITION_TYPE_REGISTRY,
  conditionDefFor,
  conditionTypeDef,
  conditionTypesForChannel,
  normalizeConditionGroup,
  summarizeConditionGroup,
  systemFieldDef,
} from './conditionTypes.js';

// Legacy single-condition object → 1-item list, combinator "all" (matches backend exactly).
const legacy = normalizeConditionGroup({ field: 'contact.name', operator: 'contains', value: 'Sam' });
assert.equal(legacy.combinator, 'all');
assert.deepEqual(legacy.conditions, [
  { type: 'field', field: 'contact.name', operator: 'contains', value: 'Sam' },
]);

// New shape passes through.
const multi = normalizeConditionGroup({
  combinator: 'any',
  conditions: [
    { type: 'tag', field: '', operator: '=', value: 'vip' },
    { type: 'tag', field: '', operator: '=', value: 'lead' },
  ],
});
assert.equal(multi.combinator, 'any');
assert.equal(multi.conditions.length, 2);

// Empty data never throws.
assert.deepEqual(normalizeConditionGroup(undefined), { conditions: [], combinator: 'all' });

// follows_account is Instagram-only in the registry (hidden on WhatsApp).
assert.ok(conditionTypesForChannel('instagram').some((d) => d.type === 'follows_account'));
assert.ok(!conditionTypesForChannel('whatsapp').some((d) => d.type === 'follows_account'));
assert.ok(conditionTypesForChannel('whatsapp').some((d) => d.type === 'tag'));

// Canvas summary: single row vs multi-row w/ combinator joiner.
assert.equal(
  summarizeConditionGroup({ conditions: [{ type: 'tag', field: '', operator: '=', value: 'vip' }] }),
  'Tag = vip'
);
assert.equal(
  summarizeConditionGroup({
    combinator: 'any',
    conditions: [
      { type: 'tag', field: '', operator: '=', value: 'vip' },
      { type: 'channel', field: '', operator: '=', value: 'instagram' },
    ],
  }),
  'Tag = vip OR +1 more'
);
assert.equal(summarizeConditionGroup(null), '');

// Recommended tab = Tag, Email, Follows your account (spec's exact shortlist).
const recommended = CONDITION_TYPE_REGISTRY.filter((d) => d.recommended).map((d) => d.key);
assert.deepEqual(recommended.sort(), ['email_known', 'follows_account', 'tag'].sort());

// Every registry row has a unique picker key (react list key + dedupe for system_field fan-out).
const keys = CONDITION_TYPE_REGISTRY.map((d) => d.key);
assert.equal(keys.length, new Set(keys).size, 'registry keys must be unique');

// system_field fan-out: conditionTypeDef('system_field') is ambiguous (first match only);
// systemFieldDef(fieldKey) / conditionDefFor(condition) disambiguate correctly.
assert.equal(systemFieldDef('firstName')?.label, 'First Name');
assert.equal(systemFieldDef('ig.followerCount')?.label, 'Follower Count');
assert.equal(systemFieldDef('nonexistent'), undefined);
assert.equal(
  conditionDefFor({ type: 'system_field', field: 'ig.username' })?.label,
  'Username'
);
assert.equal(conditionDefFor({ type: 'tag', field: '' })?.label, 'Tag');

// Instagram-nested system fields are IG-only; hidden on WhatsApp.
assert.ok(!conditionTypesForChannel('whatsapp').some((d) => d.fieldKey === 'ig.followerCount'));
assert.ok(conditionTypesForChannel('instagram').some((d) => d.fieldKey === 'ig.followerCount'));

// Coming-soon rows are visible (present in the registry / searchable) but never resolve via
// conditionTypeDef, which the editor uses to accept an already-inserted condition's type —
// this is the "never inserted" guarantee (the picker itself also disables the click).
const comingSoonRows = CONDITION_TYPE_REGISTRY.filter((d) => d.status === 'coming_soon');
assert.ok(comingSoonRows.some((d) => d.label === 'Segment'));
assert.ok(comingSoonRows.some((d) => d.label === 'Opted-In Through Widget'));
assert.ok(comingSoonRows.some((d) => d.label === 'Subscribed'));
assert.ok(!comingSoonRows.some((d) => d.label === 'Sequence subscription'), 'Sequences omitted, not stubbed');
for (const row of comingSoonRows) {
  assert.ok(row.comingSoonNote, `${row.label} should explain why it is coming soon`);
}

// current_time: JSON-encoded window round-trips through summarizeCondition.
assert.equal(
  summarizeConditionGroup({
    conditions: [
      {
        type: 'current_time',
        field: '',
        operator: '=',
        value: JSON.stringify({ startTime: '09:00', endTime: '18:00' }),
      },
    ],
  }),
  'Current time within 09:00–18:00'
);

// conditionTypeDef ignores coming_soon rows even if they happened to share a type.
assert.equal(conditionTypeDef('field')?.status, undefined);

console.log('conditionTypes.check: ok');
