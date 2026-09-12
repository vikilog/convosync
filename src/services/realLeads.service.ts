import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'

export type LeadSource = 'instagram' | 'whatsapp' | 'manual' | 'facebook'
export type LeadActivityType = 'stage_change' | 'dm_sent' | 'note' | 'created' | 'converted'

export type LeadActivity = {
  id: string
  type: LeadActivityType
  text: string
  at: string
  fromStage?: string
  toStage?: string
  stageId?: string
}

export type LeadOrigin = {
  username: string
  commentText: string
  postThumbnailUrl: string
  postCaption: string
  commentedAt: string
} | null

export type LeadRep = {
  id: string
  name: string
  avatarUrl: string | null
}

export type Lead = {
  id: string
  funnelId: string | null
  stageId: string | null
  contactId: string | null
  name: string | null
  phone: string | null
  email: string | null
  stage: string
  source: LeadSource
  requirement: string
  assignedRep: LeadRep | null
  createdAt: string
  updatedAt: string
  origin: LeadOrigin
  notes: string
  activity: LeadActivity[]
}

export type NewLeadInput = {
  name?: string
  requirement?: string
  source?: LeadSource
  socialCommentId?: string
  funnelId?: string
}

export type LeadUpdateInput = Partial<{
  stageId: string
  name: string | null
  phone: string | null
  email: string | null
  requirement: string
  notes: string
}>

export type ConvertLeadResult = {
  success: boolean
  created: boolean
  contactId: string
  lead: Lead
}

const listKey = (funnelId: string, source: string) => ['realLeads', funnelId, source] as const

function invalidateLeadQueries(queryClient: ReturnType<typeof useQueryClient>, funnelId: string | null) {
  void queryClient.invalidateQueries({ queryKey: ['realLeads'] })
  void queryClient.invalidateQueries({ queryKey: ['realLeadFunnels'] })
  if (funnelId) void queryClient.invalidateQueries({ queryKey: ['realLeadFunnels', 'insights', funnelId] })
}

export const realLeadsService = {
  useList: (funnelId: string | null, source: 'all' | LeadSource = 'all') =>
    useQuery({
      queryKey: listKey(funnelId ?? '', source),
      queryFn: () => {
        const params = new URLSearchParams()
        if (funnelId) params.set('funnelId', funnelId)
        if (source !== 'all') params.set('source', source)
        return httpClient.get<{ leads: Lead[] }>(`/leads?${params.toString()}`)
      },
      enabled: Boolean(funnelId),
    }),

  useCreate: (funnelId: string | null) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: NewLeadInput) =>
        httpClient.post<{ lead: Lead; created?: boolean; success?: boolean }>('/leads', {
          ...input,
          funnelId: input.funnelId ?? funnelId,
        }),
      onSuccess: () => invalidateLeadQueries(queryClient, funnelId),
    })
  },

  useUpdate: (funnelId: string | null) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: LeadUpdateInput }) =>
        httpClient.patch<{ lead: Lead }>(`/leads/${id}`, patch),
      onSuccess: () => invalidateLeadQueries(queryClient, funnelId),
    })
  },

  useConvertToContact: (funnelId: string | null) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.post<ConvertLeadResult>(`/leads/${id}/convert-to-contact`),
      onSuccess: () => {
        invalidateLeadQueries(queryClient, funnelId)
        void queryClient.invalidateQueries({ queryKey: ['realContacts'] })
      },
    })
  },
}
