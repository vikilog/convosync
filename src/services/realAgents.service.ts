import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { parseAgentFlowDefinition, type AgentFlowDefinition } from '@/lib/agentFlow'
import { parseIntentFallback, type IntentFallback } from '@/lib/agentWelcome'
import { httpClient } from '@/lib/httpClient'

export type { IntentFallback }

export type AgentCategory = 'ai_agent' | 'responsive' | 'rule_based'
export type ToneOfVoice = 'professional' | 'humorous' | 'casual' | 'friendly'
export type FallbackLanguage = 'english' | 'hindi' | 'hinglish' | 'spanish' | 'arabic' | 'french'
export type AgentActionType =
  'close_conversations' | 'escalate_to_human' | 'add_contact_tags' | 'update_contact_attributes'

export type AgentAction = { type: AgentActionType; enabled: boolean; instruction: string }

export type Agent = {
  id: string
  name: string
  description: string
  category: AgentCategory
  isEnabled: boolean
  isPublished: boolean
  publishedAt: string | null
  avatarUrl: string | null
  conversationsCount: number
  flowsCount: number
  toneOfVoice: ToneOfVoice
  fallbackLanguage: FallbackLanguage
  instructions: string
  brandBackground: string
  welcomeMessageEnabled: boolean
  welcomeMessageText: string | null
  intentFallback: IntentFallback
  actions: AgentAction[]
  escalationRules: Record<string, unknown> | null
  flowDefinition: AgentFlowDefinition | null
}

/** `matchThreshold` isn't a real column — it's escalationRules.similarityLowThreshold (0-1), shown as 0-100. */
export function getMatchThreshold(agent: Agent): number {
  const raw = agent.escalationRules?.similarityLowThreshold
  return Math.round((typeof raw === 'number' ? raw : 0.7) * 100)
}

export function mapAgentFromApi(raw: Agent | Record<string, unknown>): Agent {
  const agent = raw as Agent
  return {
    ...agent,
    description: agent.description ?? '',
    instructions: agent.instructions ?? '',
    brandBackground: agent.brandBackground ?? '',
    welcomeMessageEnabled: Boolean(agent.welcomeMessageEnabled),
    welcomeMessageText: agent.welcomeMessageText ? String(agent.welcomeMessageText) : null,
    intentFallback: parseIntentFallback(agent.intentFallback),
    actions: Array.isArray(agent.actions) ? agent.actions : [],
    avatarUrl: agent.avatarUrl ?? null,
    publishedAt: agent.publishedAt ?? null,
    conversationsCount: Number(agent.conversationsCount ?? 0),
    flowsCount: Number(agent.flowsCount ?? 0),
    flowDefinition: parseAgentFlowDefinition(agent.flowDefinition),
  }
}

export type AgentUpdateInput = Partial<{
  name: string
  description: string
  instructions: string
  brandBackground: string
  toneOfVoice: ToneOfVoice
  fallbackLanguage: FallbackLanguage
  actions: AgentAction[]
  isPublished: boolean
  isEnabled: boolean
  similarityLowThreshold: number
  avatarUrl: string | null
  flowDefinition: AgentFlowDefinition
  welcomeMessageEnabled: boolean
  welcomeMessageText: string | null
  intentFallback: IntentFallback
}>

export type SkillStatus = 'draft' | 'live'
export type AgentSkill = {
  id: string
  agentId: string
  title: string
  trigger: string
  instructions: string
  description: string | null
  knowledgeItemIds: string[]
  status: SkillStatus
  createdAt: string
}
export type SkillInput = {
  title: string
  trigger?: string
  instructions?: string
  description?: string | null
  knowledgeItemIds?: string[]
}
export type SkillUpdateInput = Partial<{
  title: string
  trigger: string
  instructions: string
  description: string | null
  knowledgeItemIds: string[]
  status: SkillStatus
}>

export type KnowledgeType = 'document' | 'online_data' | 'qna' | 'attachment'
export type KnowledgeStatus = 'processing' | 'ready' | 'failed'
export type KnowledgeItem = {
  id: string
  agentId: string
  type: KnowledgeType
  title: string
  content: string | null
  url: string | null
  fileUrl: string | null
  status: KnowledgeStatus
  createdAt: string
}
export type KnowledgeInput = {
  type: KnowledgeType
  title: string
  content?: string
  url?: string
  metadata?: Record<string, unknown>
}
export type KnowledgeUpdateInput = {
  title?: string
  content?: string | null
  url?: string | null
  metadata?: Record<string, unknown>
}

export type TestChatMessage = { role: 'user' | 'assistant'; content: string }
export type TestChatResult = {
  reply: string
  tokensUsed: number
  guarded: boolean
  escalate: boolean
}

export type PreviewChatResult = {
  reply: string
  conversationId: string
  fromCache: boolean
  tokensUsed: number
  costInr: number
  intent: string
  stage: string
  billingMode?: 'convosync' | 'byok'
}

export type RetrievalPath = 'cache' | 'direct' | 'rag' | 'full_llm' | 'escalate'
export type RetrievalStats = {
  total: number
  counts: Record<RetrievalPath, number>
  percentages: Record<RetrievalPath, number>
}

export type TokenStats = {
  totalTokens: number
  totalCostInr: number
  totalConversations: number
  cacheHits: number
  cacheSavingsPercent: number
  avgTokensPerConversation: number
}

const listKey = ['realAgents'] as const
const detailKey = (id: string) => ['realAgents', 'detail', id] as const
const skillsKey = (id: string) => ['realAgents', 'skills', id] as const
const knowledgeKey = (id: string) => ['realAgents', 'knowledge', id] as const
const retrievalKey = (id: string) => ['realAgents', 'retrieval', id] as const
const tokenStatsKey = (id: string) => ['realAgents', 'tokenStats', id] as const
const assignableInboxKey = ['realInbox', 'assignableAgents'] as const

function invalidateAgentCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  agentId?: string
) {
  void queryClient.invalidateQueries({ queryKey: listKey })
  void queryClient.invalidateQueries({ queryKey: assignableInboxKey })
  if (agentId) void queryClient.invalidateQueries({ queryKey: detailKey(agentId) })
}

export const realAgentsService = {
  useList: () =>
    useQuery({
      queryKey: listKey,
      queryFn: () => httpClient.get<Agent[]>('/agents').then((rows) => rows.map(mapAgentFromApi)),
    }),

  useGet: (id: string | undefined) =>
    useQuery({
      queryKey: detailKey(id ?? ''),
      queryFn: () => httpClient.get<Agent>(`/agents/${id}`).then(mapAgentFromApi),
      enabled: Boolean(id),
    }),

  useCreate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: { name: string; category: AgentCategory }) =>
        httpClient.post<Agent>('/agents', input).then(mapAgentFromApi),
      onSuccess: () => invalidateAgentCaches(queryClient),
    })
  },

  useUpdate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: AgentUpdateInput }) =>
        httpClient.put<Agent>(`/agents/${id}`, patch).then(mapAgentFromApi),
      onSuccess: (_data, variables) => invalidateAgentCaches(queryClient, variables.id),
    })
  },

  useToggle: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.post<Agent>(`/agents/${id}/toggle`).then(mapAgentFromApi),
      onSuccess: (_data, id) => invalidateAgentCaches(queryClient, id),
    })
  },

  useDuplicate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.post<Agent>(`/agents/${id}/duplicate`).then(mapAgentFromApi),
      onSuccess: () => invalidateAgentCaches(queryClient),
    })
  },

  useRemove: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.del<{ success: boolean }>(`/agents/${id}`),
      onSuccess: () => invalidateAgentCaches(queryClient),
    })
  },

  useSkills: (agentId: string | undefined) =>
    useQuery({
      queryKey: skillsKey(agentId ?? ''),
      queryFn: () =>
        httpClient.get<AgentSkill[]>(`/agents/${agentId}/skills`).then((rows) =>
          rows.map((s) => ({
            ...s,
            description: s.description ?? null,
            knowledgeItemIds: Array.isArray(s.knowledgeItemIds) ? s.knowledgeItemIds : [],
          }))
        ),
      enabled: Boolean(agentId),
    }),

  useCreateSkill: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ agentId, input }: { agentId: string; input: SkillInput }) =>
        httpClient.post<AgentSkill>(`/agents/${agentId}/skills`, input),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({ queryKey: skillsKey(variables.agentId) })
      },
    })
  },

  useUpdateSkill: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({
        agentId,
        skillId,
        patch,
      }: {
        agentId: string
        skillId: string
        patch: SkillUpdateInput
      }) => httpClient.put<AgentSkill>(`/agents/${agentId}/skills/${skillId}`, patch),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({ queryKey: skillsKey(variables.agentId) })
      },
    })
  },

  usePublishSkill: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ agentId, skillId }: { agentId: string; skillId: string }) =>
        httpClient.patch<AgentSkill>(`/agents/${agentId}/skills/${skillId}/publish`, {}),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({ queryKey: skillsKey(variables.agentId) })
      },
    })
  },

  useDeleteSkill: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ agentId, skillId }: { agentId: string; skillId: string }) =>
        httpClient.del<{ success: boolean }>(`/agents/${agentId}/skills/${skillId}`),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({ queryKey: skillsKey(variables.agentId) })
      },
    })
  },

  useKnowledge: (agentId: string | undefined) =>
    useQuery({
      queryKey: knowledgeKey(agentId ?? ''),
      queryFn: () => httpClient.get<KnowledgeItem[]>(`/agents/${agentId}/knowledge`),
      enabled: Boolean(agentId),
    }),

  useGetKnowledgeItem: (agentId: string | undefined, knowledgeId: string | undefined) =>
    useQuery({
      queryKey: [...knowledgeKey(agentId ?? ''), knowledgeId ?? ''],
      queryFn: () => httpClient.get<KnowledgeItem>(`/agents/${agentId}/knowledge/${knowledgeId}`),
      enabled: Boolean(agentId && knowledgeId),
    }),

  useCreateKnowledge: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ agentId, input }: { agentId: string; input: KnowledgeInput }) =>
        httpClient.post<KnowledgeItem>(`/agents/${agentId}/knowledge`, input),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({ queryKey: knowledgeKey(variables.agentId) })
      },
    })
  },

  useUpdateKnowledge: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({
        agentId,
        knowledgeId,
        patch,
      }: {
        agentId: string
        knowledgeId: string
        patch: KnowledgeUpdateInput
      }) => httpClient.put<KnowledgeItem>(`/agents/${agentId}/knowledge/${knowledgeId}`, patch),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({ queryKey: knowledgeKey(variables.agentId) })
      },
    })
  },

  useFetchUrlKnowledge: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ agentId, url }: { agentId: string; url: string }) =>
        httpClient
          .post<{ item: KnowledgeItem }>(`/agents/${agentId}/knowledge/fetch-url`, { url })
          .then((r) => r.item),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({ queryKey: knowledgeKey(variables.agentId) })
      },
    })
  },

  useUploadKnowledgeDocument: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ agentId, file }: { agentId: string; file: File }) => {
        const form = new FormData()
        form.append('title', file.name)
        form.append('file', file)
        return httpClient.post<KnowledgeItem>(`/agents/${agentId}/knowledge/upload`, form)
      },
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({ queryKey: knowledgeKey(variables.agentId) })
      },
    })
  },

  useDeleteKnowledge: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ agentId, knowledgeId }: { agentId: string; knowledgeId: string }) =>
        httpClient.del<{ success: boolean }>(`/agents/${agentId}/knowledge/${knowledgeId}`),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({ queryKey: knowledgeKey(variables.agentId) })
      },
    })
  },

  useRetrievalStats: (agentId: string | undefined) =>
    useQuery({
      queryKey: retrievalKey(agentId ?? ''),
      queryFn: () =>
        httpClient
          .get<{ success: boolean; data: RetrievalStats }>(`/agents/${agentId}/retrieval-stats`)
          .then((r) => r.data),
      enabled: Boolean(agentId),
    }),

  useTokenStats: (agentId: string | undefined) =>
    useQuery({
      queryKey: tokenStatsKey(agentId ?? ''),
      queryFn: () =>
        httpClient
          .get<{ success: boolean; data: TokenStats }>(`/agents/${agentId}/token-stats`)
          .then((r) => r.data),
      enabled: Boolean(agentId),
    }),

  useTestChat: (agentId: string | undefined) => {
    return useMutation({
      mutationFn: ({
        message,
        conversationHistory,
      }: {
        message: string
        conversationHistory: TestChatMessage[]
      }) => httpClient.post<TestChatResult>(`/agents/${agentId}/test`, { message, conversationHistory }),
    })
  },

  /** Preview chat — channel `preview` never sends a live customer message. */
  usePreviewChat: (agentId: string | undefined) =>
    useMutation({
      mutationFn: ({ message, conversationId }: { message: string; conversationId?: string }) =>
        httpClient
          .post<{ success: boolean; data: PreviewChatResult }>(`/agents/${agentId}/chat`, {
            message,
            conversationId,
            channel: 'preview',
          })
          .then((r) => r.data),
    }),
}
