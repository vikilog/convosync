import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { API_BASE_URL } from '@/lib/apiConfig'
import { httpClient } from '@/lib/httpClient'

export type WebWidget = {
  token: string
  enabled: boolean
  botName: string
  greeting: string
  accentColor: string
  agentId: string | null
  updatedAt: string
}

export type WebWidgetUpdateInput = Partial<{
  enabled: boolean
  botName: string
  greeting: string
  accentColor: string
  agentId: string | null
}>

const key = ['realWebWidget'] as const

/** API_BASE_URL already ends in /api — the embed script is served from /api/widget.js. */
export function webWidgetScriptOrigin() {
  return API_BASE_URL.replace(/\/api\/?$/, '')
}

export function buildWidgetEmbedSnippet(widget: WebWidget) {
  return `<script src="${webWidgetScriptOrigin()}/api/widget.js" data-token="${widget.token}" defer></script>`
}

export const realWebWidgetService = {
  useGet: () =>
    useQuery({
      queryKey: key,
      queryFn: () => httpClient.get<{ item: WebWidget }>('/web-widget'),
    }),

  useUpdate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (patch: WebWidgetUpdateInput) => httpClient.put<{ item: WebWidget }>('/web-widget', patch),
      onSuccess: (data) => queryClient.setQueryData(key, data),
    })
  },

  useRegenerateToken: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: () => httpClient.post<{ item: WebWidget }>('/web-widget/regenerate-token', {}),
      onSuccess: (data) => queryClient.setQueryData(key, data),
    })
  },
}
