import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'

/** Rows above this are treated as "Unlimited" — matches backend UNLIMITED_USAGE_LIMIT. */
export const UNLIMITED_USAGE_LIMIT = 2_147_483_647
export function isUnlimitedLimit(limit: number) {
  return limit >= UNLIMITED_USAGE_LIMIT
}

// ---------- Plans / Subscription ----------

export type TenantPlan = {
  id: string
  planId: string
  name: string
  labelColor: string
  price: number | null
  priceLabel?: string
  features: { contacts: string; teamMembers: string; aiAgents: string; channels: string }
  popular: boolean
  annualPrice?: number
  priceMonthlyPaise?: number
  priceAnnualPaise?: number
  priceMonthlyUsd?: number
  priceAnnualUsd?: number
  emailsPerMonth?: number
  walletCredits?: number
  aiCopilot?: boolean
  socialListening?: boolean
  voiceAgent?: boolean
  developers?: boolean
  prioritySupport?: boolean
  isCustom: boolean
  isActive: boolean
}

export type WorkspaceSubscription = {
  subscriptionStatus: string
  hasPlan: boolean
  currentPlanSlug: string | null
  currentPlan: TenantPlan | null
  trial: { isTrial?: boolean; trialDaysLeft?: number; planSlug?: string; planName?: string } | null
  plans: TenantPlan[]
  country: string
  currency: 'INR' | 'USD'
}

export type UsageMetric = { used: number; limit: number; pending: number }

export type WorkspaceBilling = {
  plan: { id: string; slug: string; name: string } | null
  billingSubscription: {
    id: string
    status: string
    billingCycle: string
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
  } | null
  usageSnapshot: {
    contacts: UsageMetric
    teamMembers: UsageMetric
    aiAgents: UsageMetric
    channels: UsageMetric
    campaigns: UsageMetric
    emails: UsageMetric
    aiTokens: UsageMetric & { inputTokens: number; outputTokens: number; costInr: number }
  }
  wallet: { balancePaise: number; balanceInr: number } | null
  razorpayKeyId: string | null
  fx: { usdInrRate: number } | null
}

const subscriptionKey = ['realBilling', 'subscription'] as const
const workspaceBillingKey = ['realBilling', 'workspace'] as const

export type CreateSubscriptionResult = {
  checkoutMode: 'subscription'
  subscriptionId: string
  keyId: string
  plan: { id: string; name: string; slug: string }
  billingCycle: string
  amountPaise: number
  currency: string
}

// ---------- Wallet ----------

export type WalletSummary = {
  balancePaise: number
  balanceInr: number
  lowBalanceThresholdPaise: number
  lowBalanceThresholdInr: number
  isLowBalance: boolean
  monthSpentPaise: number
  monthSpentInr: number
  platformMonthlyFeeInr: number
  topUpPresetsInr: number[]
  hasPaymentMethod: boolean
}

export type WalletTransaction = {
  id: string
  type: 'credit' | 'debit'
  category: string
  categoryLabel: string
  amountPaise: number
  amountInr: number
  balanceAfterInr: number
  description: string | null
  createdAt: string
}

const walletKey = ['realBilling', 'wallet'] as const
const walletTransactionsKey = ['realBilling', 'walletTransactions'] as const

export type CreateOrderResult = {
  orderId: string
  amountPaise: number
  currency: 'INR' | 'USD'
  keyId: string
  invoiceId: string
}

/** Matches backend/src/services/usageCost.constants.ts WALLET_CC_RATES — not a live endpoint. */
export const WALLET_USAGE_RATES: { feature: string; cost: string }[] = [
  { feature: 'WhatsApp Marketing message', cost: '1 CC' },
  { feature: 'WhatsApp Utility message', cost: '0.3 CC' },
  { feature: 'WhatsApp Authentication message', cost: '0.3 CC' },
  { feature: 'WhatsApp service (first 1,000/mo free)', cost: '0 CC' },
  { feature: 'Instagram message', cost: '0.01 CC' },
  { feature: 'Email', cost: '1 CC' },
  { feature: 'Journey trigger', cost: '0.1 CC' },
  { feature: 'AI Agent reply (estimate — metered per token)', cost: '~5 CC' },
]

// ---------- Usage ----------

export type WhatsAppUsageRow = {
  key: string
  label: string
  dot: string
  badge: string
  chartColor: string
  conversations: number
  rate: string
  grossCost: number
  billedCost: number
}

export type WorkspaceUsageCost = {
  month: string
  summary: {
    totalCostInr: number
    costChangePct: number
    whatsappMessagesSent: number
    whatsappCostInr: number
    aiTokensUsed: number
    aiCostInr: number
    emailsSent: number
    emailCostInr: number
  }
  wallet: { balanceInr: number; monthSpentInr: number; isLowBalance: boolean }
  whatsapp: {
    rows: WhatsAppUsageRow[]
    grossCostInr: number
    billedCostInr: number
    totalConversations: number
  }
  ai: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    dailyTokens: { day: number; tokens: number }[]
  }
  email: { sent: number; grossCostInr: number; billedCostInr: number }
}

// ---------- Invoices ----------

export type BillingTransaction = {
  id: string
  type: string
  amountPaise: number
  currency: string
  status: string
  description: string | null
  razorpayOrderId: string | null
  razorpayPaymentId: string | null
  razorpayInvoiceId: string | null
  paidAt: string | null
  createdAt: string
  source: 'invoice' | 'addon'
}

const invoicesKey = ['realBilling', 'invoices'] as const
const usageKey = (month?: string) => ['realBilling', 'usage', month ?? 'current'] as const

export const realBillingService = {
  useSubscription: () =>
    useQuery({
      queryKey: subscriptionKey,
      queryFn: () => httpClient.get<WorkspaceSubscription>('/workspace/subscription'),
    }),

  useWorkspaceBilling: () =>
    useQuery({
      queryKey: workspaceBillingKey,
      queryFn: () => httpClient.get<WorkspaceBilling>('/billing/workspace'),
    }),

  useCreateSubscription: () =>
    useMutation({
      mutationFn: (input: { planId: string; billingCycle?: 'monthly' | 'annual'; couponCode?: string }) =>
        httpClient.post<CreateSubscriptionResult>('/billing/subscription/create', input),
    }),

  useVerifySubscription: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: {
        razorpay_payment_id: string
        razorpay_subscription_id: string
        razorpay_signature: string
      }) => httpClient.post<{ ok: boolean }>('/billing/subscription/verify', input),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: subscriptionKey })
        void queryClient.invalidateQueries({ queryKey: workspaceBillingKey })
      },
    })
  },

  useCancelSubscription: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (cancelAtPeriodEnd: boolean = true) =>
        httpClient.post<{ ok: boolean }>('/billing/subscription/cancel', { cancelAtPeriodEnd }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: subscriptionKey })
        void queryClient.invalidateQueries({ queryKey: workspaceBillingKey })
      },
    })
  },

  // Wallet
  useWallet: () =>
    useQuery({
      queryKey: walletKey,
      queryFn: () => httpClient.get<WalletSummary>('/billing/wallet'),
    }),

  useWalletTransactions: (limit = 50) =>
    useQuery({
      queryKey: [...walletTransactionsKey, limit],
      queryFn: () =>
        httpClient.get<{ transactions: WalletTransaction[] }>(`/billing/wallet/transactions?limit=${limit}`),
    }),

  useUpdateWallet: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (patch: { lowBalanceThresholdPaise: number }) =>
        httpClient.patch<WalletSummary>('/billing/wallet', patch),
      onSuccess: (data) => queryClient.setQueryData(walletKey, data),
    })
  },

  useCreateOrder: () =>
    useMutation({
      mutationFn: (input: { purpose: 'wallet_topup'; amountPaise: number; description?: string }) =>
        httpClient.post<CreateOrderResult>('/billing/order/create', input),
    }),

  useVerifyOrder: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: {
        razorpay_order_id: string
        razorpay_payment_id: string
        razorpay_signature: string
      }) => httpClient.post<{ ok: boolean; wallet?: WalletSummary }>('/billing/order/verify', input),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: walletKey })
        void queryClient.invalidateQueries({ queryKey: walletTransactionsKey })
        void queryClient.invalidateQueries({ queryKey: invoicesKey })
      },
    })
  },

  // Usage
  useUsage: (month?: string) =>
    useQuery({
      queryKey: usageKey(month),
      queryFn: () => httpClient.get<WorkspaceUsageCost>(`/billing/usage${month ? `?month=${month}` : ''}`),
    }),

  // Invoices
  useInvoices: (limit = 50) =>
    useQuery({
      queryKey: [...invoicesKey, limit],
      queryFn: () =>
        httpClient.get<{ transactions: BillingTransaction[] }>(`/billing/invoices?limit=${limit}`),
    }),
}
