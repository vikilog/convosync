import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'

export type KnowledgeConfig = {
  venueId: string | null
  connectionStringMasked: string | null
  hasConnectionString: boolean
  updatedAt: string | null
}

export type KnowledgeSyncStatus = 'pending' | 'syncing' | 'success' | 'failed'

export type KnowledgeRecord = {
  venueId: string
  status: KnowledgeSyncStatus
  syncedAt: string | null
  errorMessage: string | null
  data: Record<string, unknown>
}

export type KnowledgeCollection = {
  name: string
  synced: boolean
  documentsFound: number | null
}

const configKey = ['aiKnowledge', 'config'] as const
const recordKey = (venueId: string) => ['aiKnowledge', 'record', venueId] as const

export const aiKnowledgeService = {
  useConfig: () =>
    useQuery({
      queryKey: configKey,
      queryFn: () => httpClient.get<KnowledgeConfig>('/ai-knowledge/config'),
    }),

  useRecord: (venueId: string | null) =>
    useQuery({
      queryKey: recordKey(venueId ?? ''),
      queryFn: () => httpClient.get<KnowledgeRecord>(`/ai-knowledge/${encodeURIComponent(venueId ?? '')}`),
      enabled: Boolean(venueId),
    }),

  useSaveConfig: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: { venueId: string; connectionString?: string }) =>
        httpClient.put<KnowledgeConfig>('/ai-knowledge/config', input),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: configKey }),
    })
  },

  useListCollections: () =>
    useMutation({
      mutationFn: (input: { connectionString: string; venueId: string }) =>
        httpClient.post<{ collections: KnowledgeCollection[] }>('/ai-knowledge/collections', input),
    }),

  useSyncCollection: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: { connectionString: string; venueId: string; collectionName: string }) =>
        httpClient.post<{ documentsFound: number; data: Record<string, unknown> }>(
          '/ai-knowledge/sync/collection',
          input
        ),
      onSuccess: (_data, vars) => {
        void queryClient.invalidateQueries({ queryKey: configKey })
        void queryClient.invalidateQueries({ queryKey: recordKey(vars.venueId) })
      },
    })
  },
}
