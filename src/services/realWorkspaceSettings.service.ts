import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'

// ---------- Automation ----------

export type PersistentMenuItem = {
  id: string
  title: string
  type: 'postback' | 'web_url'
  payload?: string
  url?: string
}

export type PersistentMenuConfig = { enabled: boolean; items: PersistentMenuItem[] }

export type WorkspaceAutomationSettings = {
  automationsPaused: boolean
  defaultReplyEnabled: boolean
  defaultReplyText: string | null
  persistentMenu: PersistentMenuConfig
}

export type AutomationUpdateInput = Partial<{
  automationsPaused: boolean
  defaultReplyEnabled: boolean
  defaultReplyText: string | null
  persistentMenu: PersistentMenuConfig
  syncMenu: boolean
}>

const automationKey = ['realWorkspaceSettings', 'automation'] as const

// ---------- Inbox behavior ----------

export type InboxAssignmentMode = 'off' | 'basic' | 'advanced'

export type InboxBehaviorSettings = {
  mode: InboxAssignmentMode
  timezone: string | null
  effectiveTimezone: string
}

export type InboxGroupMember = { membershipId: string; userId: string; name: string; email: string }

export type InboxGroup = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  members: InboxGroupMember[]
}

export type InboxRuleConditions = {
  channels?: ('whatsapp' | 'instagram' | 'messenger')[]
  contactTags?: string[]
  businessHours?: {
    days: number[]
    start: string
    end: string
    timezone?: string
  }
}

export type InboxRule = {
  id: string
  workspaceId: string
  name: string
  enabled: boolean
  priority: number
  conditions: InboxRuleConditions
  actionType: 'group' | 'user'
  actionGroupId: string | null
  actionUserId: string | null
}

export type InboxRuleInput = {
  name: string
  enabled?: boolean
  conditions: InboxRuleConditions
  actionType: 'group' | 'user'
  actionGroupId?: string | null
  actionUserId?: string | null
}

const inboxBehaviorKey = ['realWorkspaceSettings', 'inboxBehavior'] as const
const inboxGroupsKey = ['realWorkspaceSettings', 'inboxGroups'] as const
const inboxRulesKey = ['realWorkspaceSettings', 'inboxRules'] as const

// ---------- Notifications (Human Handoff) ----------

export type NotificationEventType = 'human_handoff'

export type EmailRecipientsConfig = {
  workspaceEmail: boolean
  userIds: string[]
  extraEmails: string[]
}

export type WhatsAppNotifyConfig = {
  enabled: boolean
  phoneNumbers: string[]
  userIds: string[]
  templateId: string | null
  variableMap: Record<string, string>
}

export type NotificationChannels = {
  email: {
    enabled: boolean
    recipients: EmailRecipientsConfig
    subjectTemplate: string
    bodyTemplate: string
  }
  whatsapp: WhatsAppNotifyConfig
  inApp: { enabled: boolean }
}

export type NotificationPreference = {
  eventType: NotificationEventType
  enabled: boolean
  channels: NotificationChannels
}

const notificationsKey = ['realWorkspaceSettings', 'notifications'] as const

export const realWorkspaceSettingsService = {
  // Automation
  useAutomation: () =>
    useQuery({
      queryKey: automationKey,
      queryFn: () => httpClient.get<WorkspaceAutomationSettings>('/workspace/automation'),
    }),

  useUpdateAutomation: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (patch: AutomationUpdateInput) =>
        httpClient.patch<WorkspaceAutomationSettings>('/workspace/automation', patch),
      onSuccess: (data) => queryClient.setQueryData(automationKey, data),
    })
  },

  // Inbox behavior mode
  useInboxBehavior: () =>
    useQuery({
      queryKey: inboxBehaviorKey,
      queryFn: () => httpClient.get<InboxBehaviorSettings>('/workspace/inbox-behavior'),
    }),

  useUpdateInboxBehavior: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (patch: { mode?: InboxAssignmentMode; timezone?: string | null }) =>
        httpClient.patch<InboxBehaviorSettings>('/workspace/inbox-behavior', patch),
      onSuccess: (data) => queryClient.setQueryData(inboxBehaviorKey, data),
    })
  },

  // Inbox groups
  useInboxGroups: () =>
    useQuery({
      queryKey: inboxGroupsKey,
      queryFn: () => httpClient.get<{ groups: InboxGroup[] }>('/workspace/inbox-groups'),
    }),

  useCreateInboxGroup: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (name: string) => httpClient.post<InboxGroup>('/workspace/inbox-groups', { name }),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: inboxGroupsKey }),
    })
  },

  useUpdateInboxGroup: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        httpClient.patch<InboxGroup>(`/workspace/inbox-groups/${id}`, { name }),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: inboxGroupsKey }),
    })
  },

  useDeleteInboxGroup: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.del<{ success: boolean }>(`/workspace/inbox-groups/${id}`),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: inboxGroupsKey }),
    })
  },

  useAddInboxGroupMember: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ groupId, membershipId }: { groupId: string; membershipId: string }) =>
        httpClient.post<InboxGroup>(`/workspace/inbox-groups/${groupId}/members`, { membershipId }),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: inboxGroupsKey }),
    })
  },

  useRemoveInboxGroupMember: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ groupId, membershipId }: { groupId: string; membershipId: string }) =>
        httpClient.del<InboxGroup>(`/workspace/inbox-groups/${groupId}/members/${membershipId}`),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: inboxGroupsKey }),
    })
  },

  // Inbox rules
  useInboxRules: () =>
    useQuery({
      queryKey: inboxRulesKey,
      queryFn: () => httpClient.get<{ rules: InboxRule[] }>('/workspace/inbox-rules'),
    }),

  useCreateInboxRule: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: InboxRuleInput) => httpClient.post<InboxRule>('/workspace/inbox-rules', input),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: inboxRulesKey }),
    })
  },

  useUpdateInboxRule: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: Partial<InboxRuleInput> }) =>
        httpClient.patch<InboxRule>(`/workspace/inbox-rules/${id}`, patch),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: inboxRulesKey }),
    })
  },

  useDeleteInboxRule: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.del<{ success: boolean }>(`/workspace/inbox-rules/${id}`),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: inboxRulesKey }),
    })
  },

  useReorderInboxRules: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (orderedIds: string[]) =>
        httpClient.patch<{ rules: InboxRule[] }>('/workspace/inbox-rules/reorder', { orderedIds }),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: inboxRulesKey }),
    })
  },

  // Notifications / Human Handoff
  useNotifications: () =>
    useQuery({
      queryKey: notificationsKey,
      queryFn: () => httpClient.get<{ preferences: NotificationPreference[] }>('/workspace/notifications'),
    }),

  useUpdateNotification: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: {
        eventType: NotificationEventType
        enabled?: boolean
        channels?: NotificationChannels
      }) => httpClient.patch<{ preference: NotificationPreference }>('/workspace/notifications', input),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: notificationsKey }),
    })
  },
}
