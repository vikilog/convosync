import { useQuery } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'

export type DashboardTotals = {
  totalContacts: number
  messagesToday: number
  deliveryRate: number
  activeJourneys: number
  pausedJourneys: number
  openConversations: number
}

export type MessagePerformancePoint = { date: string; sent: number; delivered: number; read: number }

export type DashboardTeamMember = {
  id: string
  name: string
  initials: string
  email: string
  role: string
  isOwner: boolean
  conversationsCount: number
  csat: number
  avgResponse: string
  trend: string
}

export type DashboardCampaignChannel = 'whatsapp' | 'email' | 'instagram'
export type DashboardCampaignStatus =
  'Running' | 'Active' | 'Draft' | 'Scheduled' | 'Completed' | 'Paused' | 'Failed'

export type DashboardCampaign = {
  id: string
  name: string
  status: DashboardCampaignStatus
  channel: DashboardCampaignChannel
  sentCount: number
  deliveredCount: number
  audienceCount: string
  engagementMetric: string
  createdAt: string
  sentAt: string | null
  scheduledAt: string | null
}

export type DashboardAiAgent = {
  id: string
  name: string
  role: string
  avatarUrl: string | null
  isEnabled: boolean
}

const dashboardQuery = {
  refetchOnWindowFocus: true,
} as const

export const dashboardService = {
  useTotals: () =>
    useQuery({
      queryKey: ['dashboard', 'totals'],
      queryFn: () => httpClient.get<DashboardTotals>('/analytics/dashboard'),
      ...dashboardQuery,
    }),

  useMessagePerformance: (days: 7 | 14 | 30) =>
    useQuery({
      queryKey: ['dashboard', 'messages', days],
      queryFn: () => httpClient.get<MessagePerformancePoint[]>(`/analytics/messages?days=${days}`),
      ...dashboardQuery,
    }),

  useTeam: () =>
    useQuery({
      queryKey: ['dashboard', 'team'],
      queryFn: () => httpClient.get<DashboardTeamMember[]>('/analytics/team'),
      ...dashboardQuery,
    }),

  useRecentCampaigns: () =>
    useQuery({
      queryKey: ['dashboard', 'campaigns', 'recent'],
      queryFn: () => httpClient.get<DashboardCampaign[]>('/analytics/campaigns'),
      ...dashboardQuery,
    }),

  useUpcomingCampaigns: () =>
    useQuery({
      queryKey: ['dashboard', 'campaigns', 'upcoming'],
      queryFn: () => httpClient.get<DashboardCampaign[]>('/analytics/campaigns/upcoming'),
      ...dashboardQuery,
    }),

  useAiAgents: () =>
    useQuery({
      queryKey: ['dashboard', 'agents'],
      queryFn: () => httpClient.get<DashboardAiAgent[]>('/agents'),
      ...dashboardQuery,
    }),
}
