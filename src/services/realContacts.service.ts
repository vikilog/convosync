import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'

export type Contact = {
  id: string
  name: string
  phone: string
  email: string | null
  avatar: string | null
  source: string | null
  tags: string[]
  customFields: Record<string, unknown> | null
  journeyStatus: string | null
  excludeFromInsights: boolean
  automationsPaused: boolean
  lastCampaignId: string | null
  lastCampaignAt: string | null
  workspaceId: string
  createdAt: string
  updatedAt: string
}

export type ContactListFilter = 'all' | 'unsubscribe' | 'blocklist'
export type ContactChannelFilter = 'whatsapp' | 'instagram' | 'messenger' | 'telegram'

export type TagsMatchMode = 'all' | 'any'

export type ContactListParams = {
  search?: string
  list?: ContactListFilter
  channel?: ContactChannelFilter
  tags?: string[]
  tagsMatch?: TagsMatchMode
  dateFrom?: string
  dateTo?: string
  limit?: number
  cursor?: string | null
}

export type ContactListResponse = { items: Contact[]; nextCursor: string | null; hasMore: boolean }

export type ContactStats = {
  all: number
  unsubscribe: number
  blocklist: number
  withEmail: number
  channels: { whatsapp: number; instagram: number; messenger: number }
  sources: { source: string; count: number }[]
  topTags: { tag: string; count: number }[]
  countries: { country: string; count: number }[]
}

export type GrowthRange = 'today' | 'yesterday' | 'week' | 'month' | 'custom'
export type ContactGrowth = {
  range: string
  mode: string
  timeZone: string
  total: number
  createdByDay: { date: string; label: string; count: number }[]
}

export type NewContactInput = {
  name: string
  phone: string
  email?: string
  source?: string
  tags?: string[]
  ownerId?: string
  customFields?: Record<string, string>
}

export type ContactUpdateInput = Partial<
  Pick<Contact, 'name' | 'phone' | 'email' | 'tags' | 'customFields' | 'excludeFromInsights'>
>

export type LeadJourneySnapshot = {
  version: 1
  leadId: string
  funnelId: string | null
  funnelName: string
  enteredAt: string
  convertedAt: string
  finalStage: string
  source: string
  origin?: { username: string; commentText: string; postCaption: string } | null
  timeline?: Array<{
    at: string
    type: string
    text: string
    fromStage?: string
    toStage?: string
  }>
  [key: string]: unknown
}

export type ContactOverviewChannel = {
  contactId: string
  channel: 'whatsapp' | 'instagram' | 'messenger' | 'telegram'
  name: string
  phone: string
  email: string | null
  source: string | null
  conversationCount: number
}

export type ContactOverviewCampaign = {
  id: string
  title: string
  subtitle?: string
  status?: string
  timestamp: string
}

export type ContactOverviewComment = {
  id: string
  postId: string
  commentText: string
  postCaption: string | null
  postThumbnailUrl: string | null
  commentedAt: string
  intent: string | null
  status: string
  commenterUsername: string | null
}

export type ContactOverview = {
  contact: Contact & { channel?: 'whatsapp' | 'instagram' | 'messenger' | 'telegram'; linkGroupId?: string | null }
  channels: ContactOverviewChannel[]
  stats: {
    campaigns: number
    journeys: number
    bots: number
    aiReplies: number
    templates: number
    conversations: number
    instagramComments: number
  }
  campaigns: ContactOverviewCampaign[]
  instagramComments: ContactOverviewComment[]
  journey: LeadJourneySnapshot | null
}

export type ContactLinkChannel = {
  contactId: string
  channel: 'whatsapp' | 'instagram' | 'messenger' | 'telegram'
  name: string
  phone: string
  email: string | null
  source: string | null
}

export type ContactLinks = {
  groupId: string | null
  channels: ContactLinkChannel[]
}

export type ContactImportResult = {
  created: number
  updated: number
  skipped: number
  errors: { row: number; phone: string; error: string }[]
}

export type ContactInsight = {
  insightId: string
  contactId: string
  isGenuineCustomerInteraction: boolean
  healthScore: number | null
  churnRiskScore: number | null
  purchaseIntentScore: number | null
  sentimentScore: number | null
  summary: string
  painPoints: string[]
  interests: string[]
  recommendedAction: string | null
  modelVersion: string
  computedAt: string
  basedOnConversationIds: string[]
  basedOnCallSessionIds: string[]
}

function listQueryKey(params: ContactListParams) {
  return ['realContacts', 'list', params] as const
}

export const realContactsService = {
  useList: (params: ContactListParams = {}) =>
    useQuery({
      queryKey: listQueryKey(params),
      refetchOnWindowFocus: true,
      queryFn: () => {
        const q = new URLSearchParams()
        if (params.search) q.set('search', params.search)
        if (params.list) q.set('list', params.list)
        if (params.channel) q.set('channel', params.channel)
        if (params.tags && params.tags.length > 0) {
          q.set('tags', params.tags.join(','))
          q.set('tagsMatch', params.tagsMatch ?? 'any')
        }
        if (params.dateFrom) q.set('dateFrom', params.dateFrom)
        if (params.dateTo) q.set('dateTo', params.dateTo)
        if (params.limit) q.set('limit', String(params.limit))
        else q.set('limit', '25')
        if (params.cursor) q.set('cursor', params.cursor)
        return httpClient.get<ContactListResponse>(`/contacts?${q.toString()}`)
      },
    }),

  /** Cursor-paginated contact list for pickers (e.g. dialing from the contact base). */
  useInfiniteList: (params: Omit<ContactListParams, 'cursor'> = {}, enabled = true) =>
    useInfiniteQuery({
      queryKey: [...listQueryKey(params), 'infinite'],
      queryFn: ({ pageParam }) => {
        const q = new URLSearchParams()
        if (params.search) q.set('search', params.search)
        if (params.list) q.set('list', params.list)
        if (params.channel) q.set('channel', params.channel)
        q.set('limit', String(params.limit ?? 25))
        if (pageParam) q.set('cursor', pageParam)
        return httpClient.get<ContactListResponse>(`/contacts?${q.toString()}`)
      },
      initialPageParam: '',
      getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined),
      enabled,
    }),

  useTags: () =>
    useQuery({
      queryKey: ['realContacts', 'tags'],
      queryFn: () => httpClient.get<{ tags: string[] }>('/contacts/tags'),
    }),

  useStats: () =>
    useQuery({
      queryKey: ['realContacts', 'stats'],
      queryFn: () => httpClient.get<ContactStats>('/contacts/stats'),
    }),

  useGrowth: (range: GrowthRange, dates?: { dateFrom?: string; dateTo?: string }) =>
    useQuery({
      queryKey: ['realContacts', 'growth', range, dates?.dateFrom, dates?.dateTo],
      enabled: range !== 'custom' || Boolean(dates?.dateFrom && dates?.dateTo),
      queryFn: () => {
        const q = new URLSearchParams()
        q.set('range', range)
        q.set('tz', Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata')
        if (range === 'custom' && dates?.dateFrom) q.set('dateFrom', dates.dateFrom)
        if (range === 'custom' && dates?.dateTo) q.set('dateTo', dates.dateTo)
        return httpClient.get<ContactGrowth>(`/contacts/growth?${q.toString()}`)
      },
    }),

  useGet: (id: string | undefined) =>
    useQuery({
      queryKey: ['realContacts', 'detail', id],
      queryFn: () => httpClient.get<Contact>(`/contacts/${id}`),
      enabled: Boolean(id),
    }),

  useLeadJourney: (id: string | undefined) =>
    useQuery({
      queryKey: ['realContacts', 'leadJourney', id],
      queryFn: () => httpClient.get<{ journey: LeadJourneySnapshot | null }>(`/contacts/${id}/lead-journey`),
      enabled: Boolean(id),
    }),

  useInsightsLatest: (id: string | undefined) =>
    useQuery({
      queryKey: ['realContacts', 'insights', id],
      queryFn: () =>
        httpClient.get<{ insight: ContactInsight | null; excludeFromInsights: boolean }>(
          `/contacts/${id}/insights/latest`
        ),
      enabled: Boolean(id),
    }),

  useComputeInsights: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) =>
        httpClient.post<{ queued: boolean; reason: string | null; jobId: string | null }>(
          `/contacts/${id}/insights/compute`
        ),
      onSuccess: (_res, id) => {
        void queryClient.invalidateQueries({ queryKey: ['realContacts', 'insights', id] })
      },
    })
  },

  useOverview: (id: string | undefined) =>
    useQuery({
      queryKey: ['realContacts', 'overview', id],
      queryFn: () => httpClient.get<ContactOverview>(`/contacts/${id}/overview`),
      enabled: Boolean(id),
    }),

  useLinks: (id: string | undefined) =>
    useQuery({
      queryKey: ['realContacts', 'links', id],
      queryFn: () => httpClient.get<ContactLinks>(`/contacts/${id}/links`),
      enabled: Boolean(id),
    }),

  useLinkChannel: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, otherContactId }: { id: string; otherContactId: string }) =>
        httpClient.post<ContactLinks>(`/contacts/${id}/links`, { otherContactId }),
      onSuccess: (_res, { id }) => {
        void queryClient.invalidateQueries({ queryKey: ['realContacts', 'overview', id] })
        void queryClient.invalidateQueries({ queryKey: ['realContacts', 'links', id] })
      },
    })
  },

  useUnlinkChannel: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, otherContactId }: { id: string; otherContactId: string }) =>
        httpClient.del<ContactLinks>(`/contacts/${id}/links/${otherContactId}`),
      onSuccess: (_res, { id }) => {
        void queryClient.invalidateQueries({ queryKey: ['realContacts', 'overview', id] })
        void queryClient.invalidateQueries({ queryKey: ['realContacts', 'links', id] })
      },
    })
  },

  useImport: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (contacts: unknown[]) =>
        httpClient.post<ContactImportResult>('/contacts/import', { contacts }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realContacts'] })
      },
    })
  },

  useOpenInbox: () =>
    useMutation({
      mutationFn: (input: string | { contactId: string; phoneNumberId?: string }) => {
        const contactId = typeof input === 'string' ? input : input.contactId
        const phoneNumberId = typeof input === 'string' ? undefined : input.phoneNumberId
        return httpClient.post<{ id: string }>('/conversations/open', {
          contactId,
          ...(phoneNumberId ? { phoneNumberId } : {}),
        })
      },
    }),

  useCreate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: NewContactInput) => httpClient.post<Contact>('/contacts', input),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realContacts'] })
      },
    })
  },

  useUpdate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: ContactUpdateInput }) =>
        httpClient.put<Contact>(`/contacts/${id}`, patch),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realContacts'] })
        // Inbox conversation rows embed a denormalized copy of the contact — keep it in sync.
        void queryClient.invalidateQueries({ queryKey: ['realInbox'] })
      },
    })
  },

  useRemove: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.del<{ success: boolean }>(`/contacts/${id}`),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realContacts'] })
      },
    })
  },

  useCountByTag: () =>
    useMutation({
      mutationFn: (tag: string) =>
        httpClient.get<{ tag: string; count: number }>(
          `/contacts/by-tag/count?tag=${encodeURIComponent(tag)}`
        ),
    }),

  useDeleteByTag: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (tag: string) =>
        httpClient.del<{
          success: boolean
          tag: string
          deleted: number
          failed: number
          errors: unknown[]
        }>('/contacts/by-tag', { tag }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realContacts'] })
      },
    })
  },

  useSetAutomationPaused: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, paused }: { id: string; paused: boolean }) =>
        httpClient.post<{ id: string; automationsPaused: boolean }>(`/contacts/${id}/automation-pause`, {
          paused,
        }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realContacts'] })
      },
    })
  },
}
