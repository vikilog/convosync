import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ConversationEvent } from '@/lib/conversationEvents'
import { httpClient } from '@/lib/httpClient'

export type { ConversationEvent }

export type InboxChannel = 'whatsapp' | 'instagram' | 'messenger' | 'telegram' | 'email'

export type ConversationContact = {
  id: string
  name: string
  phone: string
  email: string | null
  avatar: string | null
  tags: string[]
  automationsPaused: boolean
}

export type ConversationAssigneeType = 'user' | 'ai' | 'ai_agent' | 'rule_based' | 'journey' | null

export type Conversation = {
  id: string
  status: string
  channel: InboxChannel
  channelAccountId: string | null
  contactId: string
  contact: ConversationContact
  assignedTo: string | null
  assigneeType: ConversationAssigneeType
  assigneeId: string | null
  agent: { id: string; name: string } | null
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
  isFavorite: boolean
  labels: string[]
  createdAt: string
  updatedAt: string
}

export type TemplateMessageMetadata = {
  templateId: string
  templateName: string
  variables: string[]
  headerFormat: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | null
  header: string | null
  headerMediaStorageKey: string | null
  headerMediaMimeType: string | null
  headerMediaFileName: string | null
  footer: string | null
  buttonType: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'FLOW' | null
  buttonText: string | null
  buttonUrl: string | null
  buttonPhoneNumber: string | null
  sendError?: string
}

export type ConversationMessage = {
  id: string
  conversationId: string
  sender: string
  senderName: string | null
  content: string
  type: string
  status: string
  createdAt: string
  metadata: TemplateMessageMetadata | Record<string, unknown> | null
  deliveryError?: string
  clicked?: boolean
}

export type MessagesPage = {
  messages: ConversationMessage[]
  events: ConversationEvent[]
  hasMore?: boolean
  total?: number
}

export type ConversationStatus = 'open' | 'pending' | 'resolved'

export type WorkspaceMember = {
  id: string
  userId: string
  name: string
  email: string
  role: string
  avatar: string | null
  isOwner: boolean
}

export type AssignableAiAgent = {
  id: string
  name: string
  category: string
  isEnabled: boolean
  isPublished: boolean
}

export type AutomationOption = {
  id: string
  name: string
  status: string
}

export const RESENDABLE_MESSAGE_STATUSES = ['failed', 'bounced', 'rejected']

const listKey = ['realInbox', 'conversations'] as const
const messagesKey = (conversationId: string) => ['realInbox', 'messages', conversationId] as const
const membersKey = ['realInbox', 'members'] as const
const agentsKey = ['realInbox', 'assignableAgents'] as const
const automationsKey = (channel: InboxChannel) => ['realInbox', 'automations', channel] as const

export const inboxQueryKeys = {
  list: listKey,
  messages: messagesKey,
}

export function isAiHandlingAssignee(type: ConversationAssigneeType): boolean {
  return type === 'ai' || type === 'ai_agent'
}

export const realInboxService = {
  useList: () =>
    useQuery({
      queryKey: listKey,
      queryFn: () => httpClient.get<Conversation[]>('/conversations'),
      refetchInterval: 30_000,
    }),

  useMessages: (conversationId: string | null) =>
    useQuery({
      queryKey: messagesKey(conversationId ?? ''),
      queryFn: () =>
        httpClient.get<MessagesPage>(`/conversations/${conversationId}/messages?limit=50`),
      enabled: Boolean(conversationId),
      refetchInterval: 30_000,
    }),

  useLoadOlderMessages: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ conversationId, before }: { conversationId: string; before: string }) =>
        httpClient.get<MessagesPage>(
          `/conversations/${conversationId}/messages?limit=50&before=${encodeURIComponent(before)}`
        ),
      onSuccess: (page, { conversationId }) => {
        queryClient.setQueryData<MessagesPage>(messagesKey(conversationId), (prev) => {
          if (!prev) return page
          const seen = new Set(prev.messages.map((m) => m.id))
          return {
            messages: [...page.messages.filter((m) => !seen.has(m.id)), ...prev.messages],
            events: page.events?.length ? page.events : prev.events,
            hasMore: page.hasMore,
            total: page.total,
          }
        })
      },
    })
  },

  useTeamMembers: () =>
    useQuery({
      queryKey: membersKey,
      queryFn: () => httpClient.get<WorkspaceMember[]>('/workspace/members'),
    }),

  /** AI agents assignable in Inbox: published, enabled, and of an assignable category. */
  useAssignableAgents: () =>
    useQuery({
      queryKey: agentsKey,
      queryFn: async () => {
        const agents = await httpClient.get<AssignableAiAgent[]>('/agents')
        return agents.filter(
          (a) => a.isEnabled && a.isPublished && (a.category === 'ai_agent' || a.category === 'responsive')
        )
      },
    }),

  /** Published automations assignable for a conversation's channel — WhatsApp and Instagram only. */
  useAutomations: (channel: InboxChannel) =>
    useQuery({
      queryKey: automationsKey(channel),
      queryFn: async () => {
        const path = channel === 'instagram' ? '/instagram-journeys' : '/journeys'
        const journeys = await httpClient.get<AutomationOption[]>(path)
        return journeys.filter((j) => j.status === 'published')
      },
      enabled: channel === 'whatsapp' || channel === 'instagram',
    }),

  useOpenConversation: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ contactId, phoneNumberId }: { contactId: string; phoneNumberId?: string }) =>
        httpClient.post<Conversation>('/conversations/open', {
          contactId,
          ...(phoneNumberId ? { phoneNumberId } : {}),
        }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useSendInboxEmail: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (payload: {
        contactId: string
        subject: string
        text?: string
        html?: string
        templateId?: string
      }) =>
        httpClient.post<{ conversation: Conversation; message?: ConversationMessage }>(
          '/conversations/email/send',
          payload
        ),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useEmailTemplates: (enabled: boolean) =>
    useQuery({
      queryKey: ['realInbox', 'emailTemplates'],
      queryFn: () =>
        httpClient.get<
          Array<{
            id: string
            name: string
            subject: string
            htmlBody: string
            textBody?: string | null
            status: string
          }>
        >('/email/templates'),
      enabled,
    }),

  useSendMedia: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({
        conversationId,
        file,
        caption,
      }: {
        conversationId: string
        file: File
        caption?: string
      }) => {
        const form = new FormData()
        form.append('file', file)
        if (caption?.trim()) form.append('caption', caption.trim())
        return httpClient.post<ConversationMessage>(
          `/conversations/${conversationId}/messages/media`,
          form
        )
      },
      onSuccess: (_msg, variables) => {
        void queryClient.invalidateQueries({ queryKey: messagesKey(variables.conversationId) })
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useSendCarousel: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({
        conversationId,
        files,
        caption,
      }: {
        conversationId: string
        files: File[]
        caption?: string
      }) => {
        const form = new FormData()
        for (const file of files) form.append('file', file)
        if (caption?.trim()) form.append('caption', caption.trim())
        return httpClient.post<ConversationMessage>(
          `/conversations/${conversationId}/messages/carousel`,
          form
        )
      },
      onSuccess: (_msg, variables) => {
        void queryClient.invalidateQueries({ queryKey: messagesKey(variables.conversationId) })
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useSendMessage: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
        httpClient.post<ConversationMessage>(`/conversations/${conversationId}/messages`, { content }),
      onSuccess: (_msg, variables) => {
        void queryClient.invalidateQueries({ queryKey: messagesKey(variables.conversationId) })
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useSendTemplate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({
        conversationId,
        templateId,
        variables,
        headerMediaFile,
      }: {
        conversationId: string
        templateId: string
        variables: string[]
        headerMediaFile?: File | null
      }) => {
        if (headerMediaFile) {
          const form = new FormData()
          form.append('templateId', templateId)
          form.append('variables', JSON.stringify(variables))
          form.append('headerMedia', headerMediaFile)
          return httpClient.post<ConversationMessage>(
            `/conversations/${conversationId}/messages/template`,
            form
          )
        }
        return httpClient.post<ConversationMessage>(`/conversations/${conversationId}/messages/template`, {
          templateId,
          variables,
        })
      },
      onSuccess: (_msg, variables) => {
        void queryClient.invalidateQueries({ queryKey: messagesKey(variables.conversationId) })
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useResendMessage: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ messageId }: { conversationId: string; messageId: string }) =>
        httpClient.post<ConversationMessage>(`/conversations/messages/${messageId}/resend`),
      onSuccess: (_msg, variables) => {
        void queryClient.invalidateQueries({ queryKey: messagesKey(variables.conversationId) })
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useSetFavorite: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ conversationId, isFavorite }: { conversationId: string; isFavorite: boolean }) =>
        httpClient.put<Conversation>(`/conversations/${conversationId}`, { isFavorite }),
      onMutate: async ({ conversationId, isFavorite }) => {
        await queryClient.cancelQueries({ queryKey: listKey })
        const previous = queryClient.getQueryData<Conversation[]>(listKey)
        queryClient.setQueryData<Conversation[]>(listKey, (prev) =>
          prev?.map((c) => (c.id === conversationId ? { ...c, isFavorite } : c))
        )
        return { previous }
      },
      onError: (_err, _vars, ctx) => {
        if (ctx?.previous) queryClient.setQueryData(listKey, ctx.previous)
      },
      onSettled: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useSetStatus: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ conversationId, status }: { conversationId: string; status: ConversationStatus }) =>
        httpClient.put<Conversation>(`/conversations/${conversationId}`, { status }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useSetAssignee: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({
        conversationId,
        assigneeType,
        assigneeId,
      }: {
        conversationId: string
        assigneeType: Exclude<ConversationAssigneeType, 'ai' | 'rule_based'>
        assigneeId: string | null
      }) => httpClient.put<Conversation>(`/conversations/${conversationId}`, { assigneeType, assigneeId }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useDelete: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (conversationId: string) =>
        httpClient.del<{ success: boolean }>(`/conversations/${conversationId}`),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useTakeover: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (conversationId: string) =>
        httpClient.post<Conversation>(`/conversations/${conversationId}/takeover`),
      onSuccess: (_conv, conversationId) => {
        void queryClient.invalidateQueries({ queryKey: listKey })
        void queryClient.invalidateQueries({ queryKey: messagesKey(conversationId) })
      },
    })
  },

  useReleaseToAi: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (conversationId: string) =>
        httpClient.post<Conversation>(`/conversations/${conversationId}/release-to-ai`),
      onSuccess: (_conv, conversationId) => {
        void queryClient.invalidateQueries({ queryKey: listKey })
        void queryClient.invalidateQueries({ queryKey: messagesKey(conversationId) })
      },
    })
  },
}
