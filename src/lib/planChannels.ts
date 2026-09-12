import type { PlanChannelKind } from '@/lib/dashboardMockData'

const STARTER_CHANNELS = 'WhatsApp only'
const UNLIMITED_USAGE_LIMIT = 2_147_483_647

export function channelAllowedByPlan(
  channelsLabel: string | null | undefined,
  channel: PlanChannelKind
): boolean {
  const label = (channelsLabel ?? STARTER_CHANNELS).toLowerCase()
  if (label.includes('unlimited') || /\ball\b/.test(label)) return true
  // ponytail: email/telegram aren't named on starter plan strings; send volume is gated separately
  if (channel === 'email' || channel === 'telegram') return true
  return label.includes(channel)
}

export function isChannelCountLimitReached(usage: {
  used: number
  limit: number | null
  pending?: number | null
} | null): boolean {
  if (!usage || usage.limit == null || usage.limit >= UNLIMITED_USAGE_LIMIT) return false
  const pending =
    typeof usage.pending === 'number' ? usage.pending : Math.max(0, usage.limit - usage.used)
  return pending <= 0
}

export function channelConnectBlockedReason(
  channelsLabel: string | null | undefined,
  usage: { used: number; limit: number | null; pending?: number | null } | null,
  channel: PlanChannelKind
): string | null {
  if (!channelAllowedByPlan(channelsLabel, channel)) {
    const label = channelsLabel ?? STARTER_CHANNELS
    if (channel === 'instagram') {
      return `Instagram is not on your plan (${label}). Upgrade to connect Instagram.`
    }
    if (channel === 'messenger') {
      return `Messenger is not on your plan (${label}). Upgrade to enable Messenger.`
    }
    return `This channel is not included in your plan (${label}). Upgrade to connect.`
  }
  if (channel !== 'email' && channel !== 'telegram' && isChannelCountLimitReached(usage)) {
    const limit = usage?.limit
    return `Channel limit reached (${usage?.used ?? 0}${limit != null ? ` / ${limit}` : ''}). Upgrade to connect more channels.`
  }
  return null
}

export function pathForIntegrationsChannel(kind: PlanChannelKind): string {
  return `/integrations?channel=${kind}`
}

export function pathForCampaign(id: string): string {
  return `/campaigns?id=${encodeURIComponent(id)}`
}

export function pathForNewCampaign(): string {
  return '/campaigns?new=1'
}

export function pathForSettingsSection(section: 'users' | 'subscription' | 'profile'): string {
  return `/settings?section=${section}`
}

export function waitingOldestFirst<T extends { unreadCount: number; lastMessageAt?: string | null }>(
  conversations: T[]
): T[] {
  return conversations
    .filter((c) => c.unreadCount > 0 && c.lastMessageAt)
    .sort(
      (a, b) =>
        new Date(a.lastMessageAt as string).getTime() - new Date(b.lastMessageAt as string).getTime()
    )
}
