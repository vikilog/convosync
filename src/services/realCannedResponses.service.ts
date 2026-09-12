import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'

export type CannedResponse = {
  id: string
  title: string
  content: string
  shortcut: string | null
  mediaFileName: string | null
  mediaStorageKey: string | null
  mediaMimeType: string | null
  createdAt: string
  updatedAt: string
}

export type CannedResponseInput = {
  title: string
  content: string
  shortcut?: string | null
}

export type CannedSaveOptions = {
  file?: File | null
  removeMedia?: boolean
}

const listKey = ['realCannedResponses'] as const

function saveCannedResponse(
  id: string | null,
  data: CannedResponseInput,
  options?: CannedSaveOptions
): Promise<CannedResponse> {
  const hasFile = Boolean(options?.file)
  const useMultipart = hasFile || Boolean(options?.removeMedia)
  if (!useMultipart) {
    return id
      ? httpClient.put<CannedResponse>(`/canned-responses/${id}`, data)
      : httpClient.post<CannedResponse>('/canned-responses', data)
  }
  const form = new FormData()
  form.append('title', data.title)
  form.append('content', data.content)
  form.append('shortcut', data.shortcut?.trim() ?? '')
  if (options?.removeMedia) form.append('removeMedia', 'true')
  if (options?.file) form.append('file', options.file)
  return id
    ? httpClient.put<CannedResponse>(`/canned-responses/${id}`, form)
    : httpClient.post<CannedResponse>('/canned-responses', form)
}

export const realCannedResponsesService = {
  useList: () =>
    useQuery({
      queryKey: listKey,
      queryFn: () => httpClient.get<CannedResponse[]>('/canned-responses'),
    }),

  useCreate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ input, media }: { input: CannedResponseInput; media?: CannedSaveOptions }) =>
        saveCannedResponse(null, input, media),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useUpdate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({
        id,
        patch,
        media,
      }: {
        id: string
        patch: CannedResponseInput
        media?: CannedSaveOptions
      }) => saveCannedResponse(id, patch, media),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  fetchMedia: (id: string) => httpClient.getBlob(`/canned-responses/${id}/media`),

  useRemove: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.del<{ success: boolean }>(`/canned-responses/${id}`),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },
}
