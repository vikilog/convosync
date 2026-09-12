export const WEBHOOK_EVENTS = [
  'contact.created',
  'contact.updated',
  'message.received',
  'message.sent',
  'knowledge.synced',
  'knowledge.failed',
  'knowledge.rebuild.requested',
] as const

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]

export type IncomingWebhook = {
  id: string
  slug: string
  secret: string
  enabled: boolean
  subscribedEvents: WebhookEvent[]
  webhookUrl: string
  lastEventAt: string | null
}

export type OutgoingWebhook = {
  id: string
  name: string
  url: string
  secret: string | null
  enabled: boolean
  subscribedEvents: WebhookEvent[]
  maxRetries: number
  timeoutMs: number
}

export type WebhookLogDirection = 'incoming' | 'outgoing'
export type WebhookLogStatus = 'success' | 'failed' | 'pending' | 'retrying'

export type WebhookLog = {
  id: string
  direction: WebhookLogDirection
  eventType: string
  status: WebhookLogStatus | string
  statusCode: number | null
  attempt: number
  errorMessage: string | null
  createdAt: string
}

export type ActionMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type DeveloperAction = {
  id: string
  actionType: string
  name: string
  method: ActionMethod
  url: string
  headers: Record<string, string>
  timeoutMs: number
  enabled: boolean
}

export type AiConnectionStatus = 'connected' | 'syncing' | 'failed' | 'disconnected' | 'not_configured'

export type AiSyncDashboard = {
  connectionStatus: AiConnectionStatus
  lastSyncTime: string | null
  lastEventTime: string | null
  venueId: string | null
  knowledgeHealth: { services: number; products: number; customers: number; staff: number }
  pendingQueueJobs: number
  failedEvents: number
}

export type SyncEventStatus = 'completed' | 'failed' | 'pending' | 'processing'

export type SyncEvent = {
  id: string
  eventType: string
  status: SyncEventStatus
  errorMessage: string | null
  createdAt: string
  processedAt: string | null
}
