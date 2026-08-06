/**
 * ponytail: tiny self-check for subscription → PlanFeatureFlags shape.
 * Run: npx tsx src/lib/planEntitlements.check.ts
 */
import {
  channelAllowedByPlan,
  channelConnectBlockedReason,
  planFeaturesFromSubscription,
} from './planEntitlements.ts';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

// API shape before top-level channels fix — nested only
const nestedOnly = planFeaturesFromSubscription({
  features: { channels: 'WhatsApp + Instagram + Messenger' },
  aiCopilot: true,
});
assert(nestedOnly?.channels === 'WhatsApp + Instagram + Messenger', 'nested channels');
assert(channelAllowedByPlan(nestedOnly, 'instagram'), 'nested business instagram');
assert(
  channelConnectBlockedReason(nestedOnly, null, 'instagram') === null,
  'nested business not blocked'
);

// API shape after serialize fix — top-level channels
const topLevel = planFeaturesFromSubscription({
  channels: 'WhatsApp + Instagram',
  features: { channels: 'WhatsApp + Instagram' },
  aiCopilot: true,
});
assert(channelAllowedByPlan(topLevel, 'instagram'), 'top-level growth instagram');
assert(!channelAllowedByPlan(topLevel, 'messenger'), 'top-level growth no messenger');

// Missing channels → starter default
assert(!channelAllowedByPlan(planFeaturesFromSubscription({ aiCopilot: false }), 'instagram'), 'empty → no ig');

console.log('planEntitlements.check: ok');
