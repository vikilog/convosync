import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'

export type InAppNotification = {
  id: string
  type: string
  category: string
  title: string
  message: string
  severity: string
  createdAt: string
  unread: boolean
  entityType: string | null
  entityId: string | null
  forBell?: boolean
}

type NotificationsPage = { items: InAppNotification[] }

const unreadKey = ['inAppNotifications', 'unread'] as const
const listKey = (category: string) => ['inAppNotifications', 'list', category] as const

export const notificationsService = {
  useUnreadCount: () =>
    useQuery({
      queryKey: unreadKey,
      queryFn: () => httpClient.get<{ unread: number }>('/in-app-notifications/unread-count'),
    }),

  useList: (category: 'all' | 'campaigns' | 'system', enabled: boolean) =>
    useQuery({
      queryKey: listKey(category),
      queryFn: () => {
        const qs = new URLSearchParams({ limit: '40' })
        if (category !== 'all') qs.set('category', category)
        return httpClient.get<NotificationsPage>(`/in-app-notifications?${qs}`)
      },
      enabled,
    }),

  useActivity: (enabled: boolean) =>
    useQuery({
      queryKey: ['inAppNotifications', 'activity'],
      queryFn: () =>
        httpClient.get<{ items: InAppNotification[] }>('/in-app-notifications/activity?limit=40'),
      enabled,
    }),

  useMarkRead: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.post(`/in-app-notifications/${id}/read`, {}),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['inAppNotifications'] })
      },
    })
  },

  useMarkAllRead: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: () => httpClient.post('/in-app-notifications/read-all', {}),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['inAppNotifications'] })
      },
    })
  },
}
