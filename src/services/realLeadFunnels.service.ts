import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'

export type LeadFunnelStage = { id: string; name: string; position: number; isFinal: boolean }

export type LeadFunnel = {
  id: string
  name: string
  description: string
  goal: string
  leadCount: number
  stages: LeadFunnelStage[]
  createdAt: string
  updatedAt: string
}

export type FunnelInsights = {
  funnelId: string
  funnelName: string
  entered: number
  converted: number
  conversionRate: number
  stageMoves: number
  avgDaysToConvert: number | null
  byStage: { stageId: string; name: string; isFinal: boolean; count: number }[]
}

export type FunnelWriteInput = { name: string; description?: string; goal?: string }

const listKey = ['realLeadFunnels'] as const
const insightsKey = (id: string) => ['realLeadFunnels', 'insights', id] as const

function invalidateFunnels(queryClient: ReturnType<typeof useQueryClient>, funnelId?: string | null) {
  void queryClient.invalidateQueries({ queryKey: listKey })
  if (funnelId) void queryClient.invalidateQueries({ queryKey: insightsKey(funnelId) })
}

export const realLeadFunnelsService = {
  useList: () =>
    useQuery({
      queryKey: listKey,
      queryFn: () => httpClient.get<{ funnels: LeadFunnel[] }>('/lead-funnels'),
    }),

  useInsights: (id: string | null) =>
    useQuery({
      queryKey: insightsKey(id ?? ''),
      queryFn: () =>
        httpClient
          .get<{ insights: FunnelInsights }>(`/lead-funnels/${id}/insights`)
          .then((res) => res.insights),
      enabled: Boolean(id),
    }),

  useCreate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: FunnelWriteInput) => httpClient.post<{ funnel: LeadFunnel }>('/lead-funnels', input),
      onSuccess: () => invalidateFunnels(queryClient),
    })
  },

  useUpdate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: Partial<FunnelWriteInput> }) =>
        httpClient.patch<{ funnel: LeadFunnel }>(`/lead-funnels/${id}`, patch),
      onSuccess: (_res, vars) => invalidateFunnels(queryClient, vars.id),
    })
  },

  useCreateStage: (funnelId: string | null) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: { name: string; isFinal?: boolean }) =>
        httpClient.post<{ stage: LeadFunnelStage }>(`/lead-funnels/${funnelId}/stages`, input),
      onSuccess: () => invalidateFunnels(queryClient, funnelId),
    })
  },

  useUpdateStage: (funnelId: string | null) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ stageId, patch }: { stageId: string; patch: { name?: string; isFinal?: boolean } }) =>
        httpClient.patch<{ stage: LeadFunnelStage }>(`/lead-funnels/${funnelId}/stages/${stageId}`, patch),
      onSuccess: () => invalidateFunnels(queryClient, funnelId),
    })
  },

  useDeleteStage: (funnelId: string | null) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (stageId: string) => httpClient.del<{ success: boolean }>(`/lead-funnels/${funnelId}/stages/${stageId}`),
      onSuccess: () => {
        invalidateFunnels(queryClient, funnelId)
        void queryClient.invalidateQueries({ queryKey: ['realLeads'] })
      },
    })
  },
}
