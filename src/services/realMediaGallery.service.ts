import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'

export type MediaType = 'image' | 'pdf' | 'video' | 'audio' | 'document'
export type MediaScope = 'customer' | 'partner' | 'both'

export const MEDIA_TYPE_LABEL: Record<MediaType, string> = {
  image: 'Images',
  pdf: 'PDFs',
  video: 'Videos',
  audio: 'Audio files',
  document: 'Documents',
}

/** Matches backend/src/modules/media-gallery/media-storage.ts MEDIA_MAX_BYTES exactly. */
export const MEDIA_MAX_BYTES: Record<MediaType, number> = {
  image: 5 * 1024 * 1024,
  video: 16 * 1024 * 1024,
  audio: 16 * 1024 * 1024,
  pdf: 100 * 1024 * 1024,
  document: 100 * 1024 * 1024,
}

export type MediaAsset = {
  id: string
  workspaceId: string
  type: MediaType
  url: string
  storageKey: string | null
  mimeType: string | null
  filename: string
  title: string
  description: string
  tags: string[]
  scope: MediaScope
  usage: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type MediaUsage = {
  usedBytes: number
  limitBytes: number | null
  storageGb?: number
}

export type NewMediaInput = {
  title: string
  description: string
  scope: MediaScope
  tags: string[]
  usage: string[]
  file: File
}

export type MediaUpdateInput = Partial<{
  title: string
  description: string
  tags: string[]
  scope: MediaScope
  usage: string[]
  isActive: boolean
}>

const listKey = ['realMediaGallery'] as const
const usageKey = ['realMediaGallery', 'usage'] as const

function buildUploadForm(input: NewMediaInput): FormData {
  const form = new FormData()
  form.append('title', input.title)
  form.append('description', input.description)
  form.append('scope', input.scope)
  if (input.usage.length) form.append('usage', JSON.stringify(input.usage))
  if (input.tags.length) form.append('tags', JSON.stringify(input.tags))
  form.append('file', input.file)
  return form
}

export const realMediaGalleryService = {
  useList: () =>
    useQuery({
      queryKey: listKey,
      queryFn: () => httpClient.get<MediaAsset[]>('/media-gallery'),
    }),

  useUsage: () =>
    useQuery({
      queryKey: usageKey,
      queryFn: () => httpClient.get<MediaUsage>('/media-gallery/usage'),
    }),

  useCreate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: NewMediaInput) =>
        httpClient.post<MediaAsset>('/media-gallery', buildUploadForm(input)),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
        void queryClient.invalidateQueries({ queryKey: usageKey })
      },
    })
  },

  useUpdate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: MediaUpdateInput }) =>
        httpClient.patch<MediaAsset>(`/media-gallery/${id}`, patch),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useRemove: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.del<{ success: boolean }>(`/media-gallery/${id}`),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
        void queryClient.invalidateQueries({ queryKey: usageKey })
      },
    })
  },

  useSignedUrl: () =>
    useMutation({
      mutationFn: (mediaId: string) =>
        httpClient.get<{ url: string; expiresIn: number; mediaId: string }>(
          `/media-gallery/${mediaId}/signed-url`
        ),
    }),

  fetchFileBlob: (mediaId: string) => httpClient.getBlob(`/media-gallery/${mediaId}/file`),

  fetchImageBlob: (mediaId: string) =>
    httpClient.getBlob(`/media-gallery/${mediaId}/file`).then((blob) => {
      if (!blob.type.startsWith('image/')) throw new Error('not-image')
      return blob
    }),
}
