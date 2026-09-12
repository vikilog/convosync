import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { API_BASE_URL } from '@/lib/apiConfig'
import { mapCampaignDetailFromApi, mapCampaignFromApi } from '@/lib/campaignMappers'
import { httpClient } from '@/lib/httpClient'

export type CampaignChannel = 'whatsapp' | 'email' | 'instagram'
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'completed' | 'cancelled' | 'failed'
export type TagMatchMode = 'any' | 'all'
export type ReplyHandling = 'default' | 'journey' | 'ai_agent'

export type CampaignAudienceFilter = {
  channel?: CampaignChannel
  tag?: string
  tagMatchMode?: TagMatchMode
  segmentId?: string
  segmentIds?: string[]
  variableMappings?: Record<string, string>
  headerMediaStorageKey?: string
  headerMediaMimeType?: string
  headerMediaFileName?: string
  headerMediaAssetId?: string
  replyHandling?: ReplyHandling
  replyJourneyId?: string
  replyAgentId?: string
} | null

export type Campaign = {
  id: string
  name: string
  status: CampaignStatus
  totalRecipients: number
  sentCount: number
  deliveredCount: number
  readCount: number
  createdAt: string
  scheduledAt: string | null
  sentAt: string | null
  audienceType: string
  audienceFilter: CampaignAudienceFilter
  channel: CampaignChannel
  segmentLabel: string
}

export function campaignChannel(c: Campaign): CampaignChannel {
  return c.channel ?? c.audienceFilter?.channel ?? 'whatsapp'
}

export function campaignSegmentLabel(c: Campaign): string {
  return c.segmentLabel || 'All contacts'
}

export type CampaignInsights = {
  totalRecipients: number
  sent: number
  delivered: number
  read: number
  failed: number
  pending: number
  deliveryRate: number
  readRate: number
  successRate?: number
}

export type CampaignRecipient = {
  messageId: string
  conversationId: string
  contactId: string
  contactName: string
  phone: string
  email: string | null
  status: string
  sentAt: string
  deliveredAt: string | null
  readAt: string | null
  content: string
  errorMessage?: string | null
  retryCount?: number
}

export type CampaignAnalytics = {
  funnel: Array<{ key: string; label: string; count: number; pct: number }>
  successRate: number
  failureRate: number
  completion: {
    startedAt: string | null
    completedAt: string | null
    durationMs: number | null
    durationLabel: string | null
  }
  deliveryTrend: Array<{ at: string; cumulative: number }>
  lag: {
    available: boolean
    blockedReason: string | null
    sendToDelivered: {
      samples: number
      medianMs: number | null
      buckets: Array<{ label: string; count: number; minMs: number; maxMs: number | null }>
    }
    deliveredToRead: {
      samples: number
      medianMs: number | null
      buckets: Array<{ label: string; count: number; minMs: number; maxMs: number | null }>
    }
  }
  failureReasons: Array<{ reason: string; count: number; pct: number }>
}

export type CampaignTemplateInfo = {
  id: string
  name: string
  category?: string
  language?: string
  bodyPattern?: string
  subject?: string
  htmlBody?: string
  textBody?: string
  variables?: string[]
  status: string
}

export type CampaignDetail = {
  campaign: Campaign
  channel: CampaignChannel
  segmentLabel: string
  audienceType: string
  segmentIds: string[]
  tagMatchMode: TagMatchMode
  template: CampaignTemplateInfo | null
  variableMappings: Record<string, string>
  headerMediaStorageKey: string | null
  headerMediaMimeType: string | null
  headerMediaFileName: string | null
  headerMediaAssetId: string | null
  replyHandling: ReplyHandling | null
  replyJourneyId: string | null
  replyAgentId: string | null
  insights: CampaignInsights
  analytics: CampaignAnalytics | null
  recipients: CampaignRecipient[]
}

export type AudienceSegment = { id: string; name: string; count: number; icon: string }

export type CampaignAudienceResponse = {
  channel: CampaignChannel
  total: number
  excludedCount?: number
  segments: AudienceSegment[]
}

export type AudienceContactRow = {
  id: string
  name: string
  phone: string
  email: string | null
  tags: string[]
  source: string | null
}

export type CampaignAudienceContactsResponse = {
  channel: CampaignChannel
  segmentId: string
  segmentIds?: string[]
  total: number
  truncated: boolean
  limit: number
  contacts: AudienceContactRow[]
}

export type EmailCampaignTemplate = {
  id: string
  name: string
  subject: string
  htmlBody: string
  textBody?: string | null
  variables: string[]
  status: 'draft' | 'active'
}

export type CampaignWriteInput = {
  name: string
  templateId: string
  channel: CampaignChannel
  audienceType: 'all' | 'segment' | 'tag'
  audienceFilter: Record<string, unknown>
  scheduledAt?: string
}

/** @deprecated use CampaignWriteInput — kept so existing sheet callers still type-check */
export type NewCampaignInput = CampaignWriteInput

export type HeaderMediaUpload = {
  headerFormat: 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  headerMediaHandle: string
  headerMediaStorageKey: string
  headerMediaMimeType: string
  headerMediaFileName: string | null
}

const listKey = ['realCampaigns'] as const
const detailKey = (id: string) => ['realCampaigns', 'detail', id] as const
const audienceKey = (channel: CampaignChannel) => ['realCampaigns', 'audience', channel] as const
const audienceContactsKey = (channel: CampaignChannel, segmentKey: string, match: TagMatchMode) =>
  ['realCampaigns', 'audienceContacts', channel, segmentKey, match] as const

const campaignQueryOpts = { refetchOnWindowFocus: true as const }

function qs(params: Record<string, string>): string {
  return new URLSearchParams(params).toString()
}

export function templateHeaderMediaUrl(storageKey: string): string {
  return `${API_BASE_URL}/templates/header-media/${storageKey.split('/').map(encodeURIComponent).join('/')}`
}

function invalidateCampaigns(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  void queryClient.invalidateQueries({ queryKey: listKey })
  if (id) void queryClient.invalidateQueries({ queryKey: detailKey(id) })
}

export const realCampaignsService = {
  useList: () =>
    useQuery({
      queryKey: listKey,
      queryFn: async () => {
        const raw = await httpClient.get<Record<string, unknown>[]>('/campaigns')
        return raw.map(mapCampaignFromApi)
      },
      ...campaignQueryOpts,
    }),

  useGet: (id: string | null) =>
    useQuery({
      queryKey: detailKey(id ?? ''),
      queryFn: async () => {
        const raw = await httpClient.get<Record<string, unknown>>(`/campaigns/${id}`)
        return mapCampaignDetailFromApi(raw)
      },
      enabled: Boolean(id),
      ...campaignQueryOpts,
    }),

  useAudience: (channel: CampaignChannel, enabled = true) =>
    useQuery({
      queryKey: audienceKey(channel),
      queryFn: () =>
        httpClient.get<CampaignAudienceResponse>(`/contacts/campaign-audience?${qs({ channel })}`),
      enabled,
    }),

  useAudienceContacts: (
    channel: CampaignChannel,
    segmentIds: string[],
    tagMatchMode: TagMatchMode,
    enabled = true
  ) =>
    useQuery({
      queryKey: audienceContactsKey(channel, segmentIds.join('\0'), tagMatchMode),
      queryFn: () => {
        const params: Record<string, string> = {
          channel,
          segmentId: segmentIds[0] ?? 'all',
        }
        if (segmentIds.length > 1) {
          params.segmentIds = JSON.stringify(segmentIds)
          params.matchMode = tagMatchMode
        }
        return httpClient.get<CampaignAudienceContactsResponse>(
          `/contacts/campaign-audience/contacts?${qs(params)}`
        )
      },
      enabled,
    }),

  useEmailTemplates: (enabled = true) =>
    useQuery({
      queryKey: ['realCampaigns', 'emailTemplates'],
      queryFn: async () => {
        const raw = await httpClient.get<Record<string, unknown>[]>('/email/templates')
        return raw.map(
          (row): EmailCampaignTemplate => ({
            id: String(row.id ?? ''),
            name: String(row.name ?? ''),
            subject: String(row.subject ?? ''),
            htmlBody: String(row.htmlBody ?? ''),
            textBody: row.textBody != null ? String(row.textBody) : null,
            variables: Array.isArray(row.variables) ? row.variables.map(String) : [],
            status: row.status === 'active' ? 'active' : 'draft',
          })
        )
      },
      enabled,
    }),

  useCreate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: CampaignWriteInput) => httpClient.post<Campaign>('/campaigns', input),
      onSuccess: () => invalidateCampaigns(queryClient),
    })
  },

  useUpdate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, ...data }: CampaignWriteInput & { id: string }) =>
        httpClient.patch<Campaign>(`/campaigns/${id}`, data),
      onSuccess: (_data, vars) => invalidateCampaigns(queryClient, vars.id),
    })
  },

  useSend: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.post<Campaign>(`/campaigns/${id}/send`),
      onSuccess: (_data, id) => invalidateCampaigns(queryClient, id),
    })
  },

  useCancel: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.post<Campaign>(`/campaigns/${id}/cancel`),
      onSuccess: (_data, id) => invalidateCampaigns(queryClient, id),
    })
  },

  useResume: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.post<Campaign>(`/campaigns/${id}/resume`),
      onSuccess: (_data, id) => invalidateCampaigns(queryClient, id),
    })
  },

  useResendFailed: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) =>
        httpClient.post<{ total: number; resent: number; failed: number }>(`/campaigns/${id}/resend-failed`),
      onSuccess: (_data, id) => invalidateCampaigns(queryClient, id),
    })
  },

  useResendRecipient: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ campaignId, messageId }: { campaignId: string; messageId: string }) =>
        httpClient.post<{ messageId: string; ok: boolean; error?: string }>(
          `/campaigns/${campaignId}/recipients/${messageId}/resend`
        ),
      onSuccess: (_data, vars) => invalidateCampaigns(queryClient, vars.campaignId),
    })
  },

  useRemove: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.del<{ success: boolean }>(`/campaigns/${id}`),
      onSuccess: () => invalidateCampaigns(queryClient),
    })
  },

  useUploadHeaderMedia: () =>
    useMutation({
      mutationFn: (file: File) => {
        const form = new FormData()
        form.append('file', file)
        return httpClient.post<HeaderMediaUpload>('/templates/header-media?persistOnly=1', form)
      },
    }),
}
