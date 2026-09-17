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

export type VoiceProviderName = 'plivo' | 'telnyx'

export type VirtualNumberStatus = {
  stage: VirtualNumberStage
  label?: string | null
  provider?: VoiceProviderName
  requestedAt?: string
  approvedAt?: string | null
  rejectedAt?: string | null
  rejectionReason?: string | null
  selectedNumber?: {
    number: string
    city: string | null
    priceInrPaise: number | null
    priceMinor?: number | null
    currency?: string | null
  } | null
  razorpayOrderId?: string | null
  paidAt?: string | null
  activeNumber?: { number: string; city: string | null; plivoNumberId: string | null } | null
  purchaseError?: string | null
  releasedAt?: string | null
  missedCallAutoReplyEnabled?: boolean
  missedCallMessage?: string | null
  missedCallTemplateId?: string | null
  userMissedCallAutoReplyEnabled?: boolean
  userMissedCallMessage?: string | null
  userMissedCallTemplateId?: string | null
}

/** One number the workspace actually owns — a workspace can hold several. */
export type OwnedNumber = {
  id: string
  label: string | null
  description: string | null
  provider: VoiceProviderName
  number: string | null
  rawNumber: string | null
  city: string | null
  plivoNumberId: string | null
  activatedAt: string | null
  missedCallAutoReplyEnabled: boolean
  missedCallMessage: string | null
  missedCallTemplateId: string | null
  userMissedCallAutoReplyEnabled: boolean
  userMissedCallMessage: string | null
  userMissedCallTemplateId: string | null
  /** Preference only for now — turning this on doesn't yet trigger recording or a
   * wallet debit; the actual per-call billing wiring is a separate follow-up. */
  transcriptionEnabled: boolean
  /** Same "preference only for now" status as transcriptionEnabled. */
  recordingStorageEnabled: boolean
}

export type CallPricing = {
  countryIso: string
  countryName: string
  outboundPerMinInrPaise: number
  markupRate: number
  /** 'admin' = super-admin-configured rate (VirtualNumberCallPricing); otherwise a live
   * provider pricing-API call, or 'mock' when the provider integration is disabled. */
  source: VoiceProviderName | 'mock' | 'admin'
}

export type AvailableNumber = {
  number: string
  displayNumber: string
  city: string | null
  type: string
  /** Legacy — only meaningful when currency is "INR". Prefer priceMinor + currency. */
  priceInrPaise: number | null
  priceMinor: number
  currency: string
}

export type AddOnRate = {
  addOnType: 'recording' | 'transcription' | 'storage'
  currency: string
  ratePerMinMinor: number
} | null

export type AddOnPricing = {
  provider: VoiceProviderName
  recording: AddOnRate
  transcription: AddOnRate
  storage: AddOnRate
}

export type TaxInfo = { countryIso: string | null; taxLabel: string; taxRatePercent: number }

export type AvailableNumbersPage = {
  source: VoiceProviderName | 'mock'
  numbers: AvailableNumber[]
  totalCount: number
  hasMore: boolean
}

/** Area-code prefixes offered in the picker, by provider — India (Plivo) supports
 * city-level prefix search; Telnyx-routed countries show a flat number list instead. */
export const NUMBER_PREFIXES_BY_PROVIDER: Record<VoiceProviderName, readonly { label: string; value: string }[]> = {
  plivo: [
    { label: '022 · Mumbai', value: '22' },
    { label: '080 · Bengaluru', value: '80' },
    { label: '160 · Other', value: '160' },
  ],
  telnyx: [],
}

const STATUS_KEY = ['virtualNumber', 'status']
const NUMBERS_KEY = ['virtualNumber', 'numbers']

export const virtualNumberService = {
  /** Drives the acquire-a-number wizard — the single latest request for this workspace.
   * Polls while `paid` (payment done, waiting on a super-admin to allocate the actual
   * carrier number) since that transition happens out-of-band, in a separate admin
   * session — nothing on this client would otherwise know to refetch. */
  useStatus: () =>
    useQuery({
      queryKey: STATUS_KEY,
      queryFn: () => httpClient.get<VirtualNumberStatus>('/virtual-number'),
      refetchInterval: (query) => (query.state.data?.stage === 'paid' ? 5000 : false),
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
          priceMinor: number.priceMinor,
          currency: number.currency,
        }),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: STATUS_KEY }),
    })
  },

  /** Creates the Razorpay order, opens checkout, then verifies + activates on success.
   * `addOns` are the checkout page's add-on checkboxes — preference only for now, see
   * transcriptionEnabled's doc comment in schema.prisma. */
  usePayAndActivate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async (addOns?: { transcriptionEnabled?: boolean; recordingStorageEnabled?: boolean }) => {
        const order = await httpClient.post<{
          orderId: string
          amountMinor: number
          baseAmountMinor: number
          gstMinor: number
          currency: string
          keyId: string
        }>('/virtual-number/pay/create-order')

        const response = await openRazorpayCheckout({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amountMinor,
          currency: order.currency,
          name: 'ConvoSync',
          description: 'Virtual number activation',
          theme: { color: '#16a34a' },
        })

        return httpClient.post<VirtualNumberStatus>('/virtual-number/pay/verify', {
          razorpay_order_id: response.razorpay_order_id ?? order.orderId,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          transcriptionEnabled: addOns?.transcriptionEnabled ?? false,
          recordingStorageEnabled: addOns?.recordingStorageEnabled ?? false,
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

  /** Recording/transcription reference rates for the workspace's number provider —
   * informational (usage-based, billed separately), shown on the checkout page. */
  useAddOnPricing: (enabled: boolean) =>
    useQuery({
      queryKey: ['virtualNumber', 'addonPricing'],
      queryFn: () => httpClient.get<AddOnPricing>('/virtual-number/addon-pricing'),
      enabled,
    }),

  /** Country-specific checkout tax (label + rate) — same resolution /pay/create-order
   * uses, so the preview shown here always matches what's actually charged. */
  useTaxInfo: (enabled: boolean) =>
    useQuery({
      queryKey: ['virtualNumber', 'taxInfo'],
      queryFn: () => httpClient.get<TaxInfo>('/virtual-number/tax-info'),
      enabled,
    }),

  useUpdateSettings: (id: string | undefined) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (body: {
        label?: string
        description?: string
        missedCallAutoReplyEnabled?: boolean
        missedCallMessage?: string
        missedCallTemplateId?: string | null
        userMissedCallAutoReplyEnabled?: boolean
        userMissedCallMessage?: string
        userMissedCallTemplateId?: string | null
        transcriptionEnabled?: boolean
        recordingStorageEnabled?: boolean
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

  /** SIP/WebRTC login for the workspace's shared browser-calling identity (Plivo Browser SDK
   * or Telnyx WebRTC SDK, per `provider`) — one login covers every number the workspace owns. */
  useBrowserCredentials: (enabled: boolean) =>
    useQuery({
      queryKey: ['virtualNumber', 'browserCredentials'],
      queryFn: () =>
        httpClient.get<{ username: string; password: string; provider: VoiceProviderName }>(
          '/virtual-number/browser-credentials',
        ),
      enabled,
      staleTime: Infinity,
      retry: 1,
    }),
}
