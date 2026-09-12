import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { DashboardRange, Platform } from '@/lib/socialListening'
import { socialListeningApi } from '@/services/socialListening.service'

export const slKeys = {
  all: ['social-listening'] as const,
  accounts: () => [...slKeys.all, 'instagram-accounts'] as const,
  comments: (status: string, platform?: string) =>
    [...slKeys.all, 'comments', status, platform ?? 'all-platforms'] as const,
  stats: (range: string, platform?: string) =>
    [...slKeys.all, 'dashboard-stats', range, platform ?? 'all-platforms'] as const,
  intents: (range: string, platform?: string) =>
    [...slKeys.all, 'intent-breakdown', range, platform ?? 'all-platforms'] as const,
  attention: (platform?: string) => [...slKeys.all, 'needs-attention', platform ?? 'all-platforms'] as const,
  activity: (platform?: string) => [...slKeys.all, 'activity', platform ?? 'all-platforms'] as const,
  topPosts: (range: string, platform?: string) =>
    [...slKeys.all, 'top-posts', range, platform ?? 'all-platforms'] as const,
  postAutomation: (postIdsKey: string) => [...slKeys.all, 'post-automation', postIdsKey] as const,
  postSettings: (postId: string) => [...slKeys.all, 'post-settings', postId] as const,
  listeningProfile: (igId: string) => [...slKeys.all, 'profile', igId] as const,
  listeningMedia: (igId: string) => [...slKeys.all, 'media', igId] as const,
  mediaDetail: (mediaId: string, igId?: string) => [...slKeys.all, 'media-detail', mediaId, igId ?? ''] as const,
  mediaComments: (mediaId: string, igId?: string) =>
    [...slKeys.all, 'media-comments', mediaId, igId ?? ''] as const,
  facebookPosts: () => [...slKeys.all, 'facebook-posts'] as const,
  facebookPage: () => [...slKeys.all, 'facebook-page'] as const,
  facebookPostComments: (postId: string) => [...slKeys.all, 'facebook-post-comments', postId] as const,
  facebookInsights: () => [...slKeys.all, 'facebook-page-insights'] as const,
}

const STALE_MS = 30_000
const REFETCH_MS = 60_000

export function useInvalidateSocialListening() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: slKeys.all })
}

export function useInstagramAccountsQuery() {
  return useQuery({
    queryKey: slKeys.accounts(),
    queryFn: async () => {
      const data = await socialListeningApi.getInstagramAccounts()
      return [...(data.accounts ?? [])].reverse()
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
  })
}

export function useSocialListeningComments(status = 'new', platform?: Platform) {
  return useQuery({
    queryKey: slKeys.comments(status, platform),
    queryFn: async () => {
      const res = await socialListeningApi.getComments({ status, platform })
      return res.comments
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
  })
}

export function useDashboardStats(range: DashboardRange, platform?: Platform) {
  return useQuery({
    queryKey: slKeys.stats(range, platform),
    queryFn: () => socialListeningApi.getDashboardStats(range, platform),
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
    placeholderData: (prev) => prev,
  })
}

export function useIntentBreakdown(range: DashboardRange, platform?: Platform) {
  return useQuery({
    queryKey: slKeys.intents(range, platform),
    queryFn: async () => (await socialListeningApi.getIntentBreakdown(range, platform)).items,
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
    placeholderData: (prev) => prev,
  })
}

export function useNeedsAttention(platform?: Platform) {
  return useQuery({
    queryKey: slKeys.attention(platform),
    queryFn: async () => (await socialListeningApi.getNeedsAttention(25, platform)).items,
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
  })
}

export function useSocialActivity(platform?: Platform) {
  return useQuery({
    queryKey: slKeys.activity(platform),
    queryFn: async () => (await socialListeningApi.getActivity(30, platform)).events,
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
  })
}

export function useTopPosts(range: DashboardRange, platform?: Platform) {
  return useQuery({
    queryKey: slKeys.topPosts(range, platform),
    queryFn: async () => (await socialListeningApi.getTopPosts(range, 8, platform)).posts,
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
    placeholderData: (prev) => prev,
  })
}

export function useFacebookPageInsights(platform: Platform) {
  return useQuery({
    queryKey: slKeys.facebookInsights(),
    queryFn: () => socialListeningApi.getFacebookInsights(),
    enabled: platform === 'facebook',
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
  })
}

export function usePostAutomationMap(postIds: string[]) {
  const key = [...postIds].sort().join(',')
  return useQuery({
    queryKey: slKeys.postAutomation(key || 'empty'),
    queryFn: async () => {
      if (postIds.length === 0) return {} as Record<string, import('@/lib/socialListening').PostAutomationInfo>
      return (await socialListeningApi.getPostAutomation(postIds)).posts
    },
    enabled: postIds.length > 0,
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
  })
}

export function useFacebookPageProfile() {
  return useQuery({
    queryKey: slKeys.facebookPage(),
    queryFn: async () => {
      const res = await socialListeningApi.getFacebookPage()
      return res.connected ? (res.page ?? null) : null
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
  })
}

export function useFacebookListeningPosts() {
  return useQuery({
    queryKey: slKeys.facebookPosts(),
    queryFn: async () => (await socialListeningApi.getFacebookPosts()).posts,
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
  })
}

export function useFacebookPostComments(postId: string | null) {
  return useQuery({
    queryKey: slKeys.facebookPostComments(postId || ''),
    queryFn: async () => {
      await socialListeningApi.getFacebookPostComments(postId!).catch(() => null)
      return (await socialListeningApi.getComments({ status: 'all', postId: postId! })).comments
    },
    enabled: Boolean(postId),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const rows = query.state.data
      if (!rows) return REFETCH_MS
      const pending = rows.some((c) => c.classificationStatus === 'pending' || c.classificationStatus == null)
      return pending ? 2_500 : REFETCH_MS
    },
  })
}

export function useListeningProfile(instagramUserId: string | null) {
  return useQuery({
    queryKey: slKeys.listeningProfile(instagramUserId || ''),
    queryFn: () => socialListeningApi.getListeningProfile(instagramUserId!),
    enabled: Boolean(instagramUserId),
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
  })
}

export function useListeningMedia(instagramUserId: string | null) {
  return useQuery({
    queryKey: slKeys.listeningMedia(instagramUserId || ''),
    queryFn: async () => {
      const res = await socialListeningApi.getListeningMedia({ instagramUserId: instagramUserId!, limit: 24 })
      return { items: res.items, nextCursor: res.nextCursor }
    },
    enabled: Boolean(instagramUserId),
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
  })
}

export function useMediaDetail(mediaId: string | null, instagramUserId?: string) {
  return useQuery({
    queryKey: slKeys.mediaDetail(mediaId || '', instagramUserId),
    queryFn: () => socialListeningApi.getMediaDetail(mediaId!, instagramUserId),
    enabled: Boolean(mediaId),
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
  })
}

export function useMediaComments(mediaId: string | null, instagramUserId?: string) {
  return useQuery({
    queryKey: slKeys.mediaComments(mediaId || '', instagramUserId),
    queryFn: async () => {
      const res = await socialListeningApi.getMediaComments(mediaId!, { instagramUserId, limit: 50 })
      return { comments: res.comments, nextCursor: res.nextCursor }
    },
    enabled: Boolean(mediaId),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const comments = query.state.data?.comments
      if (!comments) return REFETCH_MS
      const pending = (list: typeof comments): boolean => {
        for (const c of list || []) {
          if (c.classificationStatus === 'pending' || c.classificationStatus == null) return true
          if (c.replies?.length && pending(c.replies)) return true
        }
        return false
      }
      return pending(comments) ? 2_500 : REFETCH_MS
    },
  })
}

export function usePostSettings(postId: string | null) {
  return useQuery({
    queryKey: slKeys.postSettings(postId || ''),
    queryFn: () => socialListeningApi.getPostSettings(postId!),
    enabled: Boolean(postId),
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
  })
}

export function useUpdatePostSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: Record<string, unknown> }) =>
      socialListeningApi.updatePostSettings(postId, data),
    onSuccess: (res, { postId }) => {
      qc.setQueryData(slKeys.postSettings(postId), (prev) =>
        prev ? { ...prev, settings: res.settings } : prev,
      )
      void qc.invalidateQueries({ queryKey: [...slKeys.all, 'post-automation'] })
    },
  })
}

export function useSocialCommentAction() {
  const invalidate = useInvalidateSocialListening()
  return useMutation({
    mutationFn: ({
      id,
      action,
      message,
      hidden,
      instagramUserId,
    }: {
      id: string
      action: import('@/lib/socialListening').CommentAction
      message?: string
      hidden?: boolean
      instagramUserId?: string
    }) => socialListeningApi.commentAction(id, { action, message, hidden, instagramUserId }),
    onSettled: () => {
      invalidate()
    },
  })
}
