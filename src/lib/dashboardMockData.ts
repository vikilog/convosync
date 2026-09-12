export type QuickCampaignStatus =
  'Running' | 'Active' | 'Draft' | 'Scheduled' | 'Completed' | 'Paused' | 'Failed'

export interface QuickCampaign {
  id: string
  name: string
  status: QuickCampaignStatus
  channel: 'whatsapp' | 'email' | 'instagram'
  date: string
  scheduledAt?: string | null
  sentCount: number
  deliveredCount: number
  audienceCount: string
  engagementMetric: string
}

export const RECENT_CAMPAIGNS: QuickCampaign[] = [
  {
    id: 'qc_1',
    name: 'Diwali Special Offer',
    status: 'Running',
    channel: 'whatsapp',
    date: '08 Jun',
    sentCount: 4500,
    deliveredCount: 4200,
    audienceCount: 'To 4,500 contacts',
    engagementMetric: '82% open rate',
  },
  {
    id: 'qc_2',
    name: 'Cart Abandonment - High Value',
    status: 'Active',
    channel: 'email',
    date: '07 Jun',
    sentCount: 124,
    deliveredCount: 118,
    audienceCount: 'Trigger-based',
    engagementMetric: '124 triggers today',
  },
  {
    id: 'qc_3',
    name: 'Welcome Series - New Users',
    status: 'Draft',
    channel: 'email',
    date: '06 Jun',
    sentCount: 0,
    deliveredCount: 0,
    audienceCount: 'Last edited 2h ago',
    engagementMetric: 'N/A',
  },
  {
    id: 'qc_4',
    name: 'Monthly Newsletter - Oct',
    status: 'Completed',
    channel: 'email',
    date: '20 Oct',
    sentCount: 8240,
    deliveredCount: 8100,
    audienceCount: 'Sent to 8,240 contacts',
    engagementMetric: 'Oct 20',
  },
]

export const UPCOMING_CAMPAIGNS: QuickCampaign[] = [
  {
    id: 'qc_5',
    name: 'Weekend Flash Sale',
    status: 'Scheduled',
    channel: 'whatsapp',
    date: '12 Jun',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
    sentCount: 0,
    deliveredCount: 0,
    audienceCount: 'To 6,200 contacts',
    engagementMetric: 'N/A',
  },
  {
    id: 'qc_6',
    name: 'Instagram Story Push',
    status: 'Scheduled',
    channel: 'instagram',
    date: '13 Jun',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 44).toISOString(),
    sentCount: 0,
    deliveredCount: 0,
    audienceCount: 'To 3,100 followers',
    engagementMetric: 'N/A',
  },
]

export type WaitingConversation = {
  id: string
  contactName: string
  contactAvatar?: string | null
  channel: 'whatsapp' | 'instagram' | 'messenger' | 'email' | string
  lastMessage: string
  lastMessageAt: string
}

export const WAITING_CONVERSATIONS: WaitingConversation[] = [
  {
    id: 'wc_1',
    contactName: 'Riya Sharma',
    channel: 'whatsapp',
    lastMessage: 'Is this available in blue?',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
  },
  {
    id: 'wc_2',
    contactName: 'Aman Verma',
    channel: 'instagram',
    lastMessage: 'Can I get a callback today?',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
  },
  {
    id: 'wc_3',
    contactName: 'Priya Nair',
    channel: 'email',
    lastMessage: 'Following up on the pricing plans email',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 96).toISOString(),
  },
  {
    id: 'wc_4',
    contactName: 'Karan Mehta',
    channel: 'whatsapp',
    lastMessage: 'Payment done, please confirm order',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 145).toISOString(),
  },
]

export type DashboardAgent = {
  id: string
  name: string
  role: string
  avatarUrl?: string | null
  isEnabled: boolean
}

export const DASHBOARD_AGENTS: DashboardAgent[] = [
  { id: 'ag_1', name: 'Sales Assistant', role: 'Lead qualification', isEnabled: true },
  { id: 'ag_2', name: 'Support Bot', role: 'Order & shipping FAQs', isEnabled: true },
  { id: 'ag_3', name: 'Feedback Collector', role: 'Post-purchase survey', isEnabled: false },
]

export type PlanChannelKind = 'whatsapp' | 'instagram' | 'messenger' | 'email' | 'telegram'

export type DashboardChannel = {
  kind: PlanChannelKind
  label: string
  connected: boolean
  allowedByPlan: boolean
  detail?: string
}

export const DASHBOARD_CHANNELS: DashboardChannel[] = [
  {
    kind: 'whatsapp',
    label: 'WhatsApp',
    connected: true,
    allowedByPlan: true,
    detail: '2 numbers connected',
  },
  { kind: 'instagram', label: 'Instagram', connected: true, allowedByPlan: true },
  { kind: 'messenger', label: 'Messenger', connected: false, allowedByPlan: true },
  { kind: 'email', label: 'Email', connected: false, allowedByPlan: false },
]

export type DashboardTeamMember = {
  id: string
  name: string
  role: string
  avatar?: string | null
  isOwner: boolean
  conversationsCount?: number
}

export const DASHBOARD_TEAM: DashboardTeamMember[] = [
  { id: 'tm_1', name: 'Vikas Swami', role: 'owner', isOwner: true, conversationsCount: 214 },
  { id: 'tm_2', name: 'Ananya Gupta', role: 'admin', isOwner: false, conversationsCount: 156 },
  { id: 'tm_3', name: 'Rohit Kumar', role: 'agent', isOwner: false, conversationsCount: 98 },
  { id: 'tm_4', name: 'Sneha Iyer', role: 'agent', isOwner: false, conversationsCount: 74 },
]

export const DASHBOARD_TOTALS = {
  totalContacts: 12480,
  messagesToday: 963,
  openConversations: 47,
  publishedAutomations: 9,
  draftAutomations: 3,
  automationRuns: 24810,
}
