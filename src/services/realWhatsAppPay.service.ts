import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'

export type PayRequestFilter = 'ALL' | 'draft' | 'sent' | 'paid'

export type WhatsAppPayRequest = {
  id: string
  contactId: string | null
  contactName: string
  contactPhone: string
  amountPaise: number
  currency: string
  description: string
  status: string
  paymentLinkUrl: string | null
  sentAt: string | null
  paidAt: string | null
  expiresAt: string | null
  createdByName: string | null
  createdAt: string
}

export type WhatsAppPaySummary = {
  totalCollectedPaise: number
  pendingCount: number
  paidCount: number
  sentCount: number
  requestCount: number
  razorpayConfigured: boolean
}

export type NewWhatsAppPayInput = {
  contactId?: string
  contactName: string
  contactPhone: string
  amountPaise: number
  description: string
  sendMode?: 'plain' | 'template'
  templateId?: string
  templateVariables?: string[]
}

const rootKey = ['realWhatsAppPay'] as const

function invalidatePay(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: rootKey })
}

export const realWhatsAppPayService = {
  useSummary: () =>
    useQuery({
      queryKey: [...rootKey, 'summary'] as const,
      queryFn: () => httpClient.get<WhatsAppPaySummary>('/whatsapp-pay/summary'),
    }),

  useList: (status: PayRequestFilter) =>
    useQuery({
      queryKey: [...rootKey, 'requests', status] as const,
      queryFn: () => {
        const q = status === 'ALL' ? '' : `?status=${encodeURIComponent(status)}`
        return httpClient.get<{ requests: WhatsAppPayRequest[] }>(`/whatsapp-pay/requests${q}`)
      },
    }),

  useCreate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: NewWhatsAppPayInput) =>
        httpClient.post<{ request: { id: string } }>('/whatsapp-pay/requests', input),
      onSuccess: () => invalidatePay(queryClient),
    })
  },

  useSend: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) =>
        httpClient.post<{ request: { id: string; status: string } }>(`/whatsapp-pay/requests/${id}/send`, {}),
      onSuccess: () => invalidatePay(queryClient),
    })
  },

  useCancel: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) =>
        httpClient.post<{ request: { id: string; status: string } }>(`/whatsapp-pay/requests/${id}/cancel`, {}),
      onSuccess: () => invalidatePay(queryClient),
    })
  },

  useRefresh: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) =>
        httpClient.post<{ request: { id: string; status: string } }>(`/whatsapp-pay/requests/${id}/refresh`, {}),
      onSuccess: () => invalidatePay(queryClient),
    })
  },
}
