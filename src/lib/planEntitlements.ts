/** Mirrors backend PlanFeatures channel / flag checks for UI gating. */

export const UNLIMITED_USAGE_LIMIT = 2_147_483_647;

export type PlanChannelKind = 'whatsapp' | 'instagram' | 'messenger' | 'email';

export type PlanFeatureFlags = {
  channels?: string;
  channelsUnlimited?: boolean;
  aiCopilot?: boolean;
  socialListening?: boolean;
  voiceAgent?: boolean;
  developers?: boolean;
  whatsappPay?: boolean;
  ctwaAds?: boolean;
  /** Media gallery storage quota (GB). Omitted = custom/unlimited. */
  storageGb?: number;
};

const STARTER_CHANNELS = 'WhatsApp only';

/** Normalize /workspace/subscription currentPlan (top-level + nested features.channels). */
export function planFeaturesFromSubscription(
  plan:
    | (PlanFeatureFlags & {
        features?: { channels?: string; channelsUnlimited?: boolean; storageGb?: number };
      })
    | null
    | undefined
): PlanFeatureFlags | null {
  if (!plan) return null;
  const nested = plan.features;
  return {
    channels: plan.channels ?? nested?.channels,
    channelsUnlimited: plan.channelsUnlimited ?? nested?.channelsUnlimited,
    aiCopilot: plan.aiCopilot,
    socialListening: plan.socialListening,
    voiceAgent: plan.voiceAgent,
    developers: plan.developers,
    whatsappPay: plan.whatsappPay,
    ctwaAds: plan.ctwaAds,
    storageGb: plan.storageGb ?? nested?.storageGb,
  };
}

export function isUnlimitedUsageLimit(limit: number | null | undefined): boolean {
  return limit == null || limit >= UNLIMITED_USAGE_LIMIT;
}

const INSTAGRAM_PLAN_TABS = new Set(['social-listening', 'leads']);

/** Omitted storageGb = custom/unlimited (Enterprise). Explicit 0 = no gallery. */
export function mediaGalleryAllowedByPlan(
  plan?: PlanFeatureFlags | null
): boolean {
  if (!plan) return false;
  if (plan.storageGb === undefined) return true;
  return plan.storageGb > 0;
}

/** Social Listening + Leads require Instagram on the workspace plan. */
export function tabAllowedByPlan(
  tab: string,
  plan?: PlanFeatureFlags | null
): boolean {
  if (tab === 'media-gallery') return mediaGalleryAllowedByPlan(plan);
  if (!INSTAGRAM_PLAN_TABS.has(tab)) return true;
  return channelAllowedByPlan(plan, 'instagram');
}

export function channelAllowedByPlan(
  plan: PlanFeatureFlags | null | undefined,
  channel: PlanChannelKind
): boolean {
  const features = plan ?? { channels: STARTER_CHANNELS };
  const label = (features.channels ?? STARTER_CHANNELS).toLowerCase();
  if (features.channelsUnlimited || label.includes('unlimited') || /\ball\b/.test(label)) {
    return true;
  }
  if (channel === 'email') {
    // ponytail: email always allowed by channel type; send volume is gated separately
    return true;
  }
  if (channel === 'whatsapp') return label.includes('whatsapp');
  if (channel === 'instagram') return label.includes('instagram');
  if (channel === 'messenger') return label.includes('messenger');
  return false;
}

export function planFeatureEnabled(
  plan: PlanFeatureFlags | null | undefined,
  flag: keyof Pick<
    PlanFeatureFlags,
    'aiCopilot' | 'socialListening' | 'voiceAgent' | 'developers' | 'whatsappPay' | 'ctwaAds'
  >
): boolean {
  return Boolean(plan?.[flag]);
}

export function isChannelCountLimitReached(usage: {
  used: number;
  limit: number | null;
  pending?: number | null;
} | null): boolean {
  if (!usage || usage.limit == null || isUnlimitedUsageLimit(usage.limit)) return false;
  const pending =
    typeof usage.pending === 'number' ? usage.pending : Math.max(0, usage.limit - usage.used);
  return pending <= 0;
}

export const PLAN_UPGRADE_PATH = '/settings/subscription';

export function channelConnectBlockedReason(
  plan: PlanFeatureFlags | null | undefined,
  usage: { used: number; limit: number | null; pending?: number | null } | null,
  channel: PlanChannelKind
): string | null {
  if (!channelAllowedByPlan(plan, channel)) {
    const label = plan?.channels ?? STARTER_CHANNELS;
    if (channel === 'instagram') {
      return `Instagram is not on your plan (${label}). Upgrade to connect Instagram.`;
    }
    if (channel === 'messenger') {
      return `Messenger is not on your plan (${label}). Upgrade to enable Messenger.`;
    }
    if (channel === 'email') {
      return `Email is not on your plan (${label}). Upgrade to enable email.`;
    }
    return `This channel is not included in your plan (${label}). Upgrade to connect.`;
  }
  // ponytail: email doesn't consume channelsLimit slots (WhatsApp-only still gets email)
  if (channel !== 'email' && isChannelCountLimitReached(usage)) {
    const limit = usage?.limit;
    return `Channel limit reached (${usage?.used ?? 0}${limit != null ? ` / ${limit}` : ''}). Upgrade to connect more channels.`;
  }
  return null;
}
