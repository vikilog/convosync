import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'

export type AutomationChannel = 'whatsapp' | 'instagram'
export type AutomationStatus = 'draft' | 'published'

export type Automation = {
  id: string
  name: string
  channel: AutomationChannel
  status: AutomationStatus
  triggerEvent: string | null
  stepCount: number
  runs: number
  updatedAt: string
}

type RawJourney = {
  id: string
  name: string
  status: string
  triggerEvent: string | null
  updatedAt: string
  _count?: { executions?: number; nodes?: number }
}

function toAutomation(raw: RawJourney, channel: AutomationChannel): Automation {
  return {
    id: raw.id,
    name: raw.name,
    channel,
    status: raw.status === 'published' ? 'published' : 'draft',
    triggerEvent: raw.triggerEvent,
    stepCount: raw._count?.nodes ?? 0,
    runs: raw._count?.executions ?? 0,
    updatedAt: raw.updatedAt,
  }
}

export type JourneyGraphNode = {
  id: string
  type: string
  data: Record<string, unknown>
  positionX: number
  positionY: number
}

export type JourneyGraphEdge = {
  id: string
  sourceNodeId: string
  targetNodeId: string
  conditionValue: string | null
}

export type JourneyGraph = { nodes: JourneyGraphNode[]; edges: JourneyGraphEdge[] }

export type JourneyStepState = 'done' | 'current' | 'pending' | 'failed'

export type JourneyProgressStep = {
  nodeId: string
  type: string
  label: string
  state: JourneyStepState
  detail?: string
  waitUntil?: string | null
}

export type ContactJourneyProgress = {
  executionId: string
  journeyId: string
  journeyName: string
  status: string
  currentNodeId: string | null
  startedAt: string
  lastExecutedAt: string | null
  waitUntil?: string | null
  steps: JourneyProgressStep[]
}

type ContactProgressResponse = ContactJourneyProgress | { active: false }

const basePath = (channel: AutomationChannel) =>
  channel === 'instagram' ? '/instagram-journeys' : '/journeys'

const listKey = ['realAutomations'] as const
const itemKey = (id: string, channel: AutomationChannel) =>
  ['realAutomations', 'item', channel, id] as const
const graphKey = (id: string, channel: AutomationChannel) =>
  ['realAutomations', 'graph', channel, id] as const
const analyticsKey = (id: string) => ['realAutomations', 'analytics', id] as const
const progressKey = (contactId: string, channel: AutomationChannel) =>
  ['realAutomations', 'progress', channel, contactId] as const

export type JourneyAnalytics = {
  metrics: Record<'sent' | 'delivered' | 'read' | 'clicked' | 'replied', number>
  executions: Record<string, number>
}

const liveQuery = { refetchOnWindowFocus: true as const }

/** Refetch automations when the browser tab becomes visible again (old KeepAlive equivalent). */
export function useAutomationsKeepAlive() {
  const queryClient = useQueryClient()
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        void queryClient.invalidateQueries({ queryKey: listKey })
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [queryClient])
}

function invalidateAutomation(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
  channel?: AutomationChannel
) {
  void queryClient.invalidateQueries({ queryKey: listKey })
  if (id && channel) {
    void queryClient.invalidateQueries({ queryKey: itemKey(id, channel) })
    void queryClient.invalidateQueries({ queryKey: graphKey(id, channel) })
  }
  if (id) void queryClient.invalidateQueries({ queryKey: analyticsKey(id) })
}

export const realAutomationsService = {
  useList: () =>
    useQuery({
      queryKey: listKey,
      ...liveQuery,
      queryFn: async () => {
        const [wa, ig] = await Promise.all([
          httpClient.get<RawJourney[]>('/journeys'),
          httpClient.get<RawJourney[]>('/instagram-journeys').catch(() => []),
        ])
        return [...wa.map((j) => toAutomation(j, 'whatsapp')), ...ig.map((j) => toAutomation(j, 'instagram'))]
      },
    }),

  useGet: (id: string | undefined, channel: AutomationChannel) =>
    useQuery({
      queryKey: itemKey(id ?? '', channel),
      ...liveQuery,
      queryFn: async () => {
        const raw = await httpClient.get<RawJourney>(`${basePath(channel)}/${id}`)
        return toAutomation(raw, channel)
      },
      enabled: Boolean(id),
    }),

  usePublish: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, channel }: { id: string; channel: AutomationChannel }) =>
        httpClient.post(`${basePath(channel)}/${id}/publish`),
      onSuccess: (_data, variables) => {
        invalidateAutomation(queryClient, variables.id, variables.channel)
      },
    })
  },

  useUpdate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({
        id,
        channel,
        name,
        status,
      }: {
        id: string
        channel: AutomationChannel
        name?: string
        status?: AutomationStatus
      }) => httpClient.put<RawJourney>(`${basePath(channel)}/${id}`, { name, status }),
      onSuccess: (_data, variables) => {
        invalidateAutomation(queryClient, variables.id, variables.channel)
      },
    })
  },

  /** Pause = PUT status draft (existing update API — no unpublish route). */
  usePause: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, channel }: { id: string; channel: AutomationChannel }) =>
        httpClient.put<RawJourney>(`${basePath(channel)}/${id}`, { status: 'draft' }),
      onSuccess: (_data, variables) => {
        invalidateAutomation(queryClient, variables.id, variables.channel)
      },
    })
  },

  useAnalytics: (id: string | undefined, enabled = true) =>
    useQuery({
      queryKey: analyticsKey(id ?? ''),
      ...liveQuery,
      queryFn: () => httpClient.get<JourneyAnalytics>(`/journeys/${id}/analytics`),
      enabled: Boolean(id) && enabled,
    }),

  /** Existing /journeys/trigger — starts matching published WA journeys for a contact. */
  useTrigger: () =>
    useMutation({
      mutationFn: (input: { event: string; contactId: string; payload?: Record<string, unknown> }) =>
        httpClient.post<{ ok: boolean }>('/journeys/trigger', input),
    }),

  useRemove: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, channel }: { id: string; channel: AutomationChannel }) =>
        httpClient.del(`${basePath(channel)}/${id}`),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useCreate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ name, channel }: { name: string; channel: AutomationChannel }) =>
        httpClient.post<{ id: string }>(basePath(channel), { name }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useGraph: (id: string | undefined, channel: AutomationChannel) =>
    useQuery({
      queryKey: graphKey(id ?? '', channel),
      ...liveQuery,
      queryFn: () => httpClient.get<JourneyGraph>(`${basePath(channel)}/${id}/graph`),
      enabled: Boolean(id),
    }),

  useSaveGraph: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, channel, graph }: { id: string; channel: AutomationChannel; graph: JourneyGraph }) =>
        httpClient.put<JourneyGraph>(`${basePath(channel)}/${id}/graph`, graph),
      onSuccess: (_data, variables) => {
        queryClient.setQueryData(graphKey(variables.id, variables.channel), variables.graph)
        void queryClient.invalidateQueries({ queryKey: listKey })
        void queryClient.invalidateQueries({ queryKey: itemKey(variables.id, variables.channel) })
      },
    })
  },

  /** Latest journey run for a contact — only whatsapp/instagram have journeys. */
  useContactProgress: (contactId: string | undefined, channel: AutomationChannel) =>
    useQuery({
      queryKey: progressKey(contactId ?? '', channel),
      queryFn: async () => {
        const res = await httpClient.get<ContactProgressResponse>(
          `${basePath(channel)}/contacts/${contactId}/progress`
        )
        return 'executionId' in res ? res : null
      },
      enabled: Boolean(contactId),
      refetchInterval: (query) => {
        const status = query.state.data?.status
        return status === 'running' || status === 'waiting' ? 5000 : 30000
      },
    }),
}
