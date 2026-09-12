import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
  ActionMethod,
  AiConnectionStatus,
  AiSyncDashboard,
  DeveloperAction,
  IncomingWebhook,
  OutgoingWebhook,
  SyncEvent,
  WebhookEvent,
  WebhookLog,
} from '@/lib/developersMockData'
import { httpClient } from '@/lib/httpClient'

export type {
  ActionMethod,
  AiConnectionStatus,
  AiSyncDashboard,
  DeveloperAction,
  IncomingWebhook,
  OutgoingWebhook,
  SyncEvent,
  WebhookEvent,
  WebhookLog,
}

const incomingKey = ['developer-webhooks-incoming'] as const
const outgoingKey = ['developer-webhooks-outgoing'] as const
const logsKey = ['developer-webhooks-logs'] as const
const actionsKey = ['developer-actions'] as const
const dashKey = ['developer-ai-sync'] as const
const eventsKey = ['developer-ai-sync-events'] as const

export type IncomingWebhookPatch = {
  enabled?: boolean
  subscribedEvents?: WebhookEvent[]
  regenerateSecret?: boolean
}

export type NewOutgoingWebhookInput = {
  name: string
  url: string
  secret?: string
  enabled?: boolean
  subscribedEvents: WebhookEvent[]
  maxRetries?: number
  timeoutMs?: number
}

export type UpsertDeveloperActionInput = {
  actionType: string
  name: string
  method: ActionMethod
  url: string
  headers: Record<string, string>
  timeoutMs: number
  enabled: boolean
}

export const realDevelopersService = {
  useIncomingWebhook: () =>
    useQuery({
      queryKey: incomingKey,
      queryFn: () => httpClient.get<IncomingWebhook>('/developers/webhooks/incoming'),
    }),

  useUpdateIncomingWebhook: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (patch: IncomingWebhookPatch) =>
        httpClient.put<IncomingWebhook>('/developers/webhooks/incoming', patch),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: incomingKey })
      },
    })
  },

  useOutgoingWebhooks: () =>
    useQuery({
      queryKey: outgoingKey,
      queryFn: () => httpClient.get<OutgoingWebhook[]>('/developers/webhooks/outgoing'),
    }),

  useCreateOutgoingWebhook: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: NewOutgoingWebhookInput) =>
        httpClient.post<OutgoingWebhook>('/developers/webhooks/outgoing', input),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: outgoingKey })
      },
    })
  },

  useRemoveOutgoingWebhook: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.del(`/developers/webhooks/outgoing/${id}`),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: outgoingKey })
      },
    })
  },

  useWebhookLogs: () =>
    useQuery({
      queryKey: logsKey,
      queryFn: () => httpClient.get<WebhookLog[]>('/developers/webhooks/logs'),
    }),

  useDeveloperActions: () =>
    useQuery({
      queryKey: actionsKey,
      queryFn: () => httpClient.get<DeveloperAction[]>('/developers/actions'),
    }),

  useUpsertDeveloperAction: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: UpsertDeveloperActionInput) =>
        httpClient.put<DeveloperAction>('/developers/actions', input),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: actionsKey })
      },
    })
  },

  useAiSync: () =>
    useQuery({
      queryKey: dashKey,
      queryFn: () => httpClient.get<AiSyncDashboard>('/developers/ai-sync'),
      refetchInterval: 8000,
    }),

  useAiSyncEvents: () =>
    useQuery({
      queryKey: eventsKey,
      queryFn: () => httpClient.get<SyncEvent[]>('/developers/ai-sync/events'),
      refetchInterval: 8000,
    }),

  useRebuildKnowledge: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: () => httpClient.post<{ message?: string }>('/developers/ai-sync/rebuild', {}),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: dashKey })
        void queryClient.invalidateQueries({ queryKey: eventsKey })
      },
    })
  },
}
