import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'
import { openRazorpayCheckout } from '@/lib/razorpay'

export type VirtualNumberStage =
  | 'not_requested'
  | 'pending_approval'
  | 'rejected'
  | 'approved'
  | 'number_selected'
  | 'paid'
  | 'active'
  | 'released'

export type VirtualNumberStatus = {
  stage: VirtualNumberStage
  label?: string | null
  requestedAt?: string
  approvedAt?: string | null
  rejectedAt?: string | null
  rejectionReason?: string | null
  selectedNumber?: { number: string; city: string | null; priceInrPaise: number | null } | null
  razorpayOrderId?: string | null
  paidAt?: string | null
  activeNumber?: { number: string; city: string | null; plivoNumberId: string | null } | null
  purchaseError?: string | null
  releasedAt?: string | null
  missedCallAutoReplyEnabled?: boolean
  missedCallMessage?: string | null
}

/** One number the workspace actually owns — a workspace can hold several. */
export type OwnedNumber = {
  id: string
  label: string | null
  description: string | null
  number: string | null
  rawNumber: string | null
  city: string | null
  plivoNumberId: string | null
  activatedAt: string | null
  missedCallAutoReplyEnabled: boolean
  missedCallMessage: string | null
}

export type CallPricing = {
  countryIso: string
  countryName: string
  outboundPerMinInrPaise: number
  markupRate: number
  source: 'plivo' | 'mock'
}

export type AvailableNumber = {
  number: string
  displayNumber: string
  city: string | null
  type: string
  priceInrPaise: number
}

export type AvailableNumbersPage = {
  source: 'plivo' | 'mock'
  numbers: AvailableNumber[]
  totalCount: number
  hasMore: boolean
}

/** Prefixes offered in the picker — same set Plivo's own console shows for India. */
export const NUMBER_PREFIXES = [
  { label: '022 · Mumbai', value: '22' },
  { label: '080 · Bengaluru', value: '80' },
  { label: '160 · Other', value: '160' },
] as const

const STATUS_KEY = ['virtualNumber', 'status']
const NUMBERS_KEY = ['virtualNumber', 'numbers']

export const virtualNumberService = {
  /** Drives the acquire-a-number wizard — the single latest request for this workspace. */
  useStatus: () =>
    useQuery({
      queryKey: STATUS_KEY,
      queryFn: () => httpClient.get<VirtualNumberStatus>('/virtual-number'),
    }),

  /** Every number this workspace actually owns — used by Calls, Settings, and browser calling. */
  useNumbers: () =>
    useQuery({
      queryKey: NUMBERS_KEY,
      queryFn: () => httpClient.get<{ numbers: OwnedNumber[] }>('/virtual-number/numbers'),
    }),

  useRequestAccess: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (body?: { label?: string; description?: string }) =>
        httpClient.post<VirtualNumberStatus>('/virtual-number/request-access', body),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: STATUS_KEY }),
    })
  },

  useAvailableNumbers: (enabled: boolean, pattern?: string) =>
    useInfiniteQuery({
      queryKey: ['virtualNumber', 'availableNumbers', pattern ?? 'all'],
      queryFn: ({ pageParam }) => {
        const params = new URLSearchParams({ offset: String(pageParam), limit: '9' })
        if (pattern) params.set('pattern', pattern)
        return httpClient.get<AvailableNumbersPage>(`/virtual-number/available-numbers?${params}`)
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.hasMore ? allPages.reduce((sum, p) => sum + p.numbers.length, 0) : undefined,
      enabled,
    }),

  useSelectNumber: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (number: AvailableNumber) =>
        httpClient.post<VirtualNumberStatus>('/virtual-number/select-number', {
          number: number.number,
          displayNumber: number.displayNumber,
          city: number.city,
          priceInrPaise: number.priceInrPaise,
        }),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: STATUS_KEY }),
    })
  },

  /** Creates the Razorpay order, opens checkout, then verifies + activates on success. */
  usePayAndActivate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async () => {
        const order = await httpClient.post<{
          orderId: string
          amountPaise: number
          currency: string
          keyId: string
        }>('/virtual-number/pay/create-order')

        const response = await openRazorpayCheckout({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amountPaise,
          currency: order.currency,
          name: 'ConvoSync',
          description: 'Virtual number activation',
          theme: { color: '#16a34a' },
        })

        return httpClient.post<VirtualNumberStatus>('/virtual-number/pay/verify', {
          razorpay_order_id: response.razorpay_order_id ?? order.orderId,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        })
      },
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: STATUS_KEY })
        void queryClient.invalidateQueries({ queryKey: NUMBERS_KEY })
      },
    })
  },

  usePricing: (id: string | undefined) =>
    useQuery({
      queryKey: ['virtualNumber', 'pricing', id],
      queryFn: () => httpClient.get<CallPricing>(`/virtual-number/${id}/pricing`),
      enabled: Boolean(id),
    }),

  useUpdateSettings: (id: string | undefined) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (body: {
        label?: string
        description?: string
        missedCallAutoReplyEnabled?: boolean
        missedCallMessage?: string
      }) => httpClient.patch<VirtualNumberStatus>(`/virtual-number/${id}/settings`, body),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: NUMBERS_KEY }),
    })
  },

  /** Permanently releases the number back to Plivo — irreversible, stops billing immediately. */
  useReleaseNumber: (id: string | undefined) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: () => httpClient.post<VirtualNumberStatus>(`/virtual-number/${id}/release`),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: NUMBERS_KEY }),
    })
  },

  /** SIP/WebRTC login for the workspace's shared browser-calling identity (Plivo Browser SDK) —
   * one login covers every number the workspace owns. */
  useBrowserCredentials: (enabled: boolean) =>
    useQuery({
      queryKey: ['virtualNumber', 'browserCredentials'],
      queryFn: () => httpClient.get<{ username: string; password: string }>('/virtual-number/browser-credentials'),
      enabled,
      staleTime: Infinity,
      retry: 1,
    }),
}
