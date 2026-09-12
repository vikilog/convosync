import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'

export type WhatsAppFlow = {
  id: string
  name: string
  status: string
  flowJson: unknown
  categories: string[]
  metaFlowId: string | null
  createdAt: string
  updatedAt: string
}

export type WhatsAppFlowInput = {
  name: string
  flowJson: unknown
  categories?: string[]
}

const listKey = ['realFlows'] as const

export const realFlowsService = {
  useList: () =>
    useQuery({
      queryKey: listKey,
      queryFn: () => httpClient.get<{ items: WhatsAppFlow[] }>('/whatsapp-flows'),
      retry: false,
    }),

  useGet: (id: string | null) =>
    useQuery({
      queryKey: [...listKey, id],
      queryFn: () => httpClient.get<{ item: WhatsAppFlow }>(`/whatsapp-flows/${id}`),
      enabled: Boolean(id),
    }),

  useCreate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: WhatsAppFlowInput) =>
        httpClient.post<{ item: WhatsAppFlow }>('/whatsapp-flows', input),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useUpdate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: Partial<WhatsAppFlowInput> }) =>
        httpClient.put<{ item: WhatsAppFlow }>(`/whatsapp-flows/${id}`, patch),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  usePublish: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.post<{ item: WhatsAppFlow }>(`/whatsapp-flows/${id}/publish`),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useSendTest: () =>
    useMutation({
      mutationFn: ({ id, phone }: { id: string; phone: string }) =>
        httpClient.post<{ ok: boolean }>(`/whatsapp-flows/${id}/send-test`, { phone }),
    }),

  useRemove: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.del<{ ok: boolean }>(`/whatsapp-flows/${id}`),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },
}
