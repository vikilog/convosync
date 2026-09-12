import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'

export type WorkspaceTagRecord = {
  id: string
  name: string
  folder: string | null
  createdAt: string
  updatedAt: string
}

const tagsKey = ['workspaceTags'] as const

export const workspaceTagsService = {
  useList: () =>
    useQuery({
      queryKey: tagsKey,
      queryFn: () =>
        httpClient.get<{ items: WorkspaceTagRecord[] }>('/workspace/tags').then((r) => r.items),
    }),

  useCreate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: { name: string; folder?: string | null }) =>
        httpClient.post<WorkspaceTagRecord>('/workspace/tags', input),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: tagsKey }),
    })
  },

  useUpdate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: { name?: string; folder?: string | null } }) =>
        httpClient.patch<WorkspaceTagRecord>(`/workspace/tags/${id}`, patch),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: tagsKey }),
    })
  },

  useRemove: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.del<{ success: boolean }>(`/workspace/tags/${id}`),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: tagsKey }),
    })
  },
}
