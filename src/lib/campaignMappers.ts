import type {
  Campaign,
  CampaignAnalytics,
  CampaignChannel,
  CampaignDetail,
  CampaignInsights,
  CampaignRecipient,
  CampaignStatus,
} from '@/services/realCampaigns.service'

export function mapCampaignStatus(raw: string): CampaignStatus {
  const s = raw.toLowerCase()
  if (
    s === 'draft' ||
    s === 'scheduled' ||
    s === 'running' ||
    s === 'completed' ||
    s === 'cancelled' ||
    s === 'failed'
  ) {
    return s
  }
  return 'draft'
}

export function channelFromFilter(filter: Record<string, unknown> | null | undefined): CampaignChannel {
  const channel = filter?.channel
  return channel === 'email' || channel === 'instagram' ? channel : 'whatsapp'
}

export function segmentIdsFromFilter(filter: Record<string, unknown> | null | undefined): string[] {
  if (!filter) return ['all']
  if (Array.isArray(filter.segmentIds)) return filter.segmentIds.map(String)
  if (typeof filter.segmentId === 'string' && filter.segmentId.trim()) return [filter.segmentId.trim()]
  if (typeof filter.tag === 'string' && filter.tag.trim()) return [`tag:${filter.tag.trim()}`]
  return ['all']
}

export function segmentLabelFromFilter(
  audienceType: string | undefined,
  filter: Record<string, unknown> | null | undefined
): string {
  const ids = segmentIdsFromFilter(filter)
  const tags = ids.filter((id) => id.startsWith('tag:')).map((id) => id.slice(4).trim()).filter(Boolean)
  if ((audienceType ?? 'all') === 'all' || ids.includes('all')) return 'All contacts'
  if (tags.length === 1) return `Tag: ${tags[0]}`
  if (tags.length > 1) return `Tags: ${tags.join(', ')}`
  return 'All contacts'
}

export function mapCampaignFromApi(raw: Record<string, unknown>): Campaign {
  const filter = (raw.audienceFilter ?? {}) as Record<string, unknown>
  return {
    id: String(raw.id),
    name: String(raw.name),
    status: mapCampaignStatus(String(raw.status ?? 'draft')),
    totalRecipients: Number(raw.totalRecipients ?? 0),
    sentCount: Number(raw.sentCount ?? 0),
    deliveredCount: Number(raw.deliveredCount ?? 0),
    readCount: Number(raw.readCount ?? 0),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    scheduledAt: raw.scheduledAt ? String(raw.scheduledAt) : null,
    sentAt: raw.sentAt ? String(raw.sentAt) : null,
    audienceType: String(raw.audienceType ?? 'all'),
    audienceFilter: (raw.audienceFilter as Campaign['audienceFilter']) ?? null,
    channel: channelFromFilter(filter),
    segmentLabel: segmentLabelFromFilter(String(raw.audienceType ?? 'all'), filter),
  }
}

function mapLagSeries(raw: unknown): CampaignAnalytics['lag']['sendToDelivered'] {
  const s = (raw ?? {}) as Record<string, unknown>
  const bucketsRaw = Array.isArray(s.buckets) ? s.buckets : []
  return {
    samples: Number(s.samples ?? 0),
    medianMs: s.medianMs == null ? null : Number(s.medianMs),
    buckets: bucketsRaw.map((b) => {
      const row = (b ?? {}) as Record<string, unknown>
      return {
        label: String(row.label ?? ''),
        count: Number(row.count ?? 0),
        minMs: Number(row.minMs ?? 0),
        maxMs: row.maxMs == null ? null : Number(row.maxMs),
      }
    }),
  }
}

export function mapCampaignAnalytics(raw: unknown): CampaignAnalytics | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const a = raw as Record<string, unknown>
  const funnelRaw = Array.isArray(a.funnel) ? a.funnel : []
  const completion = (a.completion ?? {}) as Record<string, unknown>
  const lag = (a.lag ?? {}) as Record<string, unknown>
  const reasonsRaw = Array.isArray(a.failureReasons) ? a.failureReasons : []
  const trendRaw = Array.isArray(a.deliveryTrend) ? a.deliveryTrend : []

  return {
    funnel: funnelRaw.map((step) => {
      const s = (step ?? {}) as Record<string, unknown>
      return {
        key: String(s.key ?? ''),
        label: String(s.label ?? ''),
        count: Number(s.count ?? 0),
        pct: Number(s.pct ?? 0),
      }
    }),
    successRate: Number(a.successRate ?? 0),
    failureRate: Number(a.failureRate ?? 0),
    completion: {
      startedAt: completion.startedAt ? String(completion.startedAt) : null,
      completedAt: completion.completedAt ? String(completion.completedAt) : null,
      durationMs: completion.durationMs == null ? null : Number(completion.durationMs),
      durationLabel: completion.durationLabel ? String(completion.durationLabel) : null,
    },
    deliveryTrend: trendRaw.map((p) => {
      const row = (p ?? {}) as Record<string, unknown>
      return { at: String(row.at ?? ''), cumulative: Number(row.cumulative ?? 0) }
    }),
    lag: {
      available: Boolean(lag.available),
      blockedReason: lag.blockedReason ? String(lag.blockedReason) : null,
      sendToDelivered: mapLagSeries(lag.sendToDelivered),
      deliveredToRead: mapLagSeries(lag.deliveredToRead),
    },
    failureReasons: reasonsRaw.map((r) => {
      const row = (r ?? {}) as Record<string, unknown>
      return {
        reason: String(row.reason ?? ''),
        count: Number(row.count ?? 0),
        pct: Number(row.pct ?? 0),
      }
    }),
  }
}

function stringRecord(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string') out[key] = value
  }
  return out
}

export function mapCampaignDetailFromApi(raw: Record<string, unknown>): CampaignDetail {
  const campaignRaw = (raw.campaign ?? {}) as Record<string, unknown>
  const campaign = mapCampaignFromApi(campaignRaw)
  const filter = (campaignRaw.audienceFilter ?? {}) as Record<string, unknown>
  const channel =
    raw.channel === 'email' || raw.channel === 'instagram'
      ? raw.channel
      : campaign.channel

  const insightsRaw = (raw.insights ?? {}) as Record<string, unknown>
  const insights: CampaignInsights = {
    totalRecipients: Number(insightsRaw.totalRecipients ?? campaign.totalRecipients),
    sent: Number(insightsRaw.sent ?? campaign.sentCount),
    delivered: Number(insightsRaw.delivered ?? campaign.deliveredCount),
    read: Number(insightsRaw.read ?? campaign.readCount),
    failed: Number(insightsRaw.failed ?? 0),
    pending: Number(insightsRaw.pending ?? 0),
    deliveryRate: Number(insightsRaw.deliveryRate ?? 0),
    readRate: Number(insightsRaw.readRate ?? 0),
    successRate: insightsRaw.successRate != null ? Number(insightsRaw.successRate) : undefined,
  }

  const templateRaw = raw.template as Record<string, unknown> | null | undefined
  const template = templateRaw
    ? {
        id: String(templateRaw.id),
        name: String(templateRaw.name),
        category: templateRaw.category != null ? String(templateRaw.category) : undefined,
        language: templateRaw.language != null ? String(templateRaw.language) : undefined,
        bodyPattern: templateRaw.bodyPattern != null ? String(templateRaw.bodyPattern) : undefined,
        subject: templateRaw.subject != null ? String(templateRaw.subject) : undefined,
        htmlBody: templateRaw.htmlBody != null ? String(templateRaw.htmlBody) : undefined,
        textBody: templateRaw.textBody != null ? String(templateRaw.textBody) : undefined,
        variables: Array.isArray(templateRaw.variables) ? templateRaw.variables.map(String) : undefined,
        status: String(templateRaw.status ?? ''),
      }
    : null

  const variableMappings = stringRecord(raw.variableMappings ?? filter.variableMappings)

  const recipients: CampaignRecipient[] = ((raw.recipients ?? []) as Record<string, unknown>[]).map((r) => ({
    messageId: String(r.messageId),
    conversationId: String(r.conversationId ?? ''),
    contactId: String(r.contactId ?? ''),
    contactName: String(r.contactName ?? ''),
    phone: String(r.phone ?? ''),
    email: r.email ? String(r.email) : null,
    status: String(r.status ?? ''),
    sentAt: String(r.sentAt ?? ''),
    deliveredAt: r.deliveredAt ? String(r.deliveredAt) : null,
    readAt: r.readAt ? String(r.readAt) : null,
    content: String(r.content ?? ''),
    errorMessage: r.errorMessage != null ? String(r.errorMessage) : null,
    retryCount: typeof r.retryCount === 'number' ? r.retryCount : undefined,
  }))

  const segmentIds = segmentIdsFromFilter(filter)
  const tagMatchMode = filter.tagMatchMode === 'all' ? 'all' : 'any'

  return {
    campaign: {
      ...campaign,
      channel,
      segmentLabel: String(raw.segmentLabel ?? campaign.segmentLabel),
    },
    channel,
    segmentLabel: String(raw.segmentLabel ?? campaign.segmentLabel),
    audienceType: campaign.audienceType,
    segmentIds,
    tagMatchMode,
    template,
    variableMappings,
    headerMediaStorageKey: typeof filter.headerMediaStorageKey === 'string' ? filter.headerMediaStorageKey : null,
    headerMediaMimeType: typeof filter.headerMediaMimeType === 'string' ? filter.headerMediaMimeType : null,
    headerMediaFileName: typeof filter.headerMediaFileName === 'string' ? filter.headerMediaFileName : null,
    headerMediaAssetId: typeof filter.headerMediaAssetId === 'string' ? filter.headerMediaAssetId : null,
    replyHandling:
      filter.replyHandling === 'journey' || filter.replyHandling === 'ai_agent' ? filter.replyHandling : null,
    replyJourneyId: typeof filter.replyJourneyId === 'string' ? filter.replyJourneyId : null,
    replyAgentId: typeof filter.replyAgentId === 'string' ? filter.replyAgentId : null,
    insights,
    analytics: mapCampaignAnalytics(raw.analytics),
    recipients,
  }
}
