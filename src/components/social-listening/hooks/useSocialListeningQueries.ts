/**
 * Social Listening data via React Query — show cached data instantly,
 * refresh in background (focus / interval / invalidate after mutations).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import type { DashboardRange } from '../dashboard/StatCardRow';
import type { ReviewComment, ReviewStatus, SocialListeningPlatform } from '../types';

export const slKeys = {
  all: ['social-listening'] as const,
  accounts: () => [...slKeys.all, 'instagram-accounts'] as const,
  comments: (status: string, platform?: string) =>
    [...slKeys.all, 'comments', status, platform ?? 'all-platforms'] as const,
  stats: (range: string, platform?: string) =>
    [...slKeys.all, 'dashboard-stats', range, platform ?? 'all-platforms'] as const,
  intents: (range: string, platform?: string) =>
    [...slKeys.all, 'intent-breakdown', range, platform ?? 'all-platforms'] as const,
  attention: (platform?: string) =>
    [...slKeys.all, 'needs-attention', platform ?? 'all-platforms'] as const,
  activity: (platform?: string) => [...slKeys.all, 'activity', platform ?? 'all-platforms'] as const,
  topPosts: (range: string, platform?: string) =>
    [...slKeys.all, 'top-posts', range, platform ?? 'all-platforms'] as const,
  postAutomation: (postIdsKey: string) =>
    [...slKeys.all, 'post-automation', postIdsKey] as const,
  listeningProfile: (igId: string) => [...slKeys.all, 'profile', igId] as const,
  listeningMedia: (igId: string) => [...slKeys.all, 'media', igId] as const,
  mediaDetail: (mediaId: string, igId?: string) =>
    [...slKeys.all, 'media-detail', mediaId, igId ?? ''] as const,
  mediaComments: (mediaId: string, igId?: string) =>
    [...slKeys.all, 'media-comments', mediaId, igId ?? ''] as const,
  facebookPosts: () => [...slKeys.all, 'facebook-posts'] as const,
  facebookPostComments: (postId: string) =>
    [...slKeys.all, 'facebook-post-comments', postId] as const,
};

const STALE_MS = 30_000;
const REFETCH_MS = 60_000;

export type ApiReviewComment = {
  id: string;
  platform: ReviewComment['platform'];
  username: string;
  profilePicUrl: string | null;
  commentText: string;
  postThumbnailUrl: string;
  postCaption: string;
  intent: ReviewComment['intent'];
  confidence: number;
  status: ReviewStatus;
  suggestedDm: string;
  publicReplyText?: string | null;
  dmReplyText?: string | null;
  dmSentAt?: string | null;
  dmStatus?: string | null;
  dmError?: string | null;
  leadId?: string | null;
  createdAt: string;
};

export function mapApiReviewComment(c: ApiReviewComment): ReviewComment {
  return {
    id: c.id,
    platform: c.platform,
    username: c.username,
    profilePicUrl: c.profilePicUrl,
    commentText: c.commentText,
    postThumbnailUrl: c.postThumbnailUrl,
    postCaption: c.postCaption,
    intent: c.intent,
    confidence: c.confidence,
    status: c.status,
    suggestedDm: c.suggestedDm,
    publicReplyText: c.publicReplyText,
    dmReplyText: c.dmReplyText,
    dmSentAt: c.dmSentAt,
    dmStatus: c.dmStatus,
    dmError: c.dmError,
    leadId: c.leadId ?? null,
    createdAt: c.createdAt,
  };
}

export function useInvalidateSocialListening() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: slKeys.all });
}

export function useInstagramAccountsQuery() {
  return useQuery({
    queryKey: slKeys.accounts(),
    queryFn: async () => {
      const data = (await api.getInstagramAccounts()) as {
        accounts?: Array<{
          instagramUserId: string;
          username?: string | null;
          displayName?: string | null;
          pageName?: string | null;
          profilePicture?: string | null;
        }>;
      };
      return [...(data.accounts ?? [])].reverse();
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
  });
}

export function useSocialListeningComments(
  status: string = 'new',
  platform?: SocialListeningPlatform
) {
  return useQuery({
    queryKey: slKeys.comments(status, platform),
    queryFn: async () => {
      const res = await api.getSocialListeningComments({ status, platform });
      return res.comments.map(mapApiReviewComment);
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
  });
}

export function useDashboardStats(range: DashboardRange, platform?: SocialListeningPlatform) {
  return useQuery({
    queryKey: slKeys.stats(range, platform),
    queryFn: () => api.getSocialListeningDashboardStats(range, platform),
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
    placeholderData: (prev) => prev,
  });
}

export function useIntentBreakdown(range: DashboardRange, platform?: SocialListeningPlatform) {
  return useQuery({
    queryKey: slKeys.intents(range, platform),
    queryFn: async () => {
      const res = await api.getSocialListeningIntentBreakdown(range, platform);
      return res.items;
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
    placeholderData: (prev) => prev,
  });
}

export function useNeedsAttention(platform?: SocialListeningPlatform) {
  return useQuery({
    queryKey: slKeys.attention(platform),
    queryFn: async () => {
      const res = await api.getSocialListeningNeedsAttention(25, platform);
      return res.items;
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
  });
}

export function useSocialActivity(platform?: SocialListeningPlatform) {
  return useQuery({
    queryKey: slKeys.activity(platform),
    queryFn: async () => {
      const res = await api.getSocialListeningActivity(30, platform);
      return res.events;
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
  });
}

export function useTopPosts(range: DashboardRange, platform?: SocialListeningPlatform) {
  return useQuery({
    queryKey: slKeys.topPosts(range, platform),
    queryFn: async () => {
      const res = await api.getSocialListeningTopPosts(range, 8, platform);
      return res.posts;
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
    placeholderData: (prev) => prev,
  });
}

/** Page-level reach/engagement analytics for the Dashboard's Facebook view. */
export function useFacebookPageInsights(platform: SocialListeningPlatform) {
  return useQuery({
    queryKey: [...slKeys.all, 'facebook-page-insights'] as const,
    queryFn: () => api.getSocialListeningFacebookInsights(),
    enabled: platform === 'facebook',
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
  });
}

export type PostAutomationInfo = {
  autoResponseEnabled: boolean;
  leadFunnelId: string | null;
  commentAutomationJourneyId: string | null;
  commentAutomationJourneyName: string | null;
};

export function usePostAutomationMap(postIds: string[]) {
  const key = [...postIds].sort().join(',');
  return useQuery({
    queryKey: slKeys.postAutomation(key || 'empty'),
    queryFn: async () => {
      if (postIds.length === 0) return {} as Record<string, PostAutomationInfo>;
      const res = await api.getSocialListeningPostAutomation(postIds);
      return res.posts;
    },
    enabled: postIds.length > 0,
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
  });
}

/** Connected Facebook Page profile (picture/name/category/followers) for the Content tab's profile card. */
export function useFacebookPageProfile() {
  return useQuery({
    queryKey: [...slKeys.all, 'facebook-page-profile'] as const,
    queryFn: async () => {
      const res = await api.getFacebookPage();
      return res.connected ? res.page ?? null : null;
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
  });
}

export function useFacebookListeningPosts() {
  return useQuery({
    queryKey: slKeys.facebookPosts(),
    queryFn: async () => {
      const res = await api.getFacebookPosts();
      return res.posts;
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
  });
}

/** Classified/actionable comments for one Facebook post — same AI pipeline as Instagram, flat (no reply nesting). */
export function useFacebookPostComments(postId: string | null) {
  return useQuery({
    queryKey: slKeys.facebookPostComments(postId || ''),
    queryFn: async () => {
      const res = await api.getSocialListeningComments({ status: 'all', postId: postId! });
      return res.comments;
    },
    enabled: Boolean(postId),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const rows = query.state.data;
      if (!rows) return REFETCH_MS;
      const pending = rows.some((c) => c.classificationStatus === 'pending' || c.classificationStatus == null);
      return pending ? 2_500 : REFETCH_MS;
    },
  });
}

export function useListeningProfile(instagramUserId: string | null) {
  return useQuery({
    queryKey: slKeys.listeningProfile(instagramUserId || ''),
    queryFn: () => api.getInstagramListeningProfile(instagramUserId!),
    enabled: Boolean(instagramUserId),
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
  });
}

export function useListeningMedia(instagramUserId: string | null) {
  return useQuery({
    queryKey: slKeys.listeningMedia(instagramUserId || ''),
    queryFn: async () => {
      const res = await api.getInstagramListeningMedia({
        instagramUserId: instagramUserId!,
        limit: 24,
      });
      return { items: res.items, nextCursor: res.nextCursor };
    },
    enabled: Boolean(instagramUserId),
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
  });
}

export function useMediaDetail(mediaId: string | null, instagramUserId?: string) {
  return useQuery({
    queryKey: slKeys.mediaDetail(mediaId || '', instagramUserId),
    queryFn: () => api.getInstagramListeningMediaDetail(mediaId!, instagramUserId),
    enabled: Boolean(mediaId),
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
  });
}

export function useMediaComments(mediaId: string | null, instagramUserId?: string) {
  return useQuery({
    queryKey: slKeys.mediaComments(mediaId || '', instagramUserId),
    queryFn: async () => {
      const res = await api.getInstagramListeningComments(mediaId!, {
        instagramUserId,
        limit: 50,
      });
      return { comments: res.comments, nextCursor: res.nextCursor };
    },
    enabled: Boolean(mediaId),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const comments = query.state.data?.comments as Array<{
        classificationStatus?: string | null;
        replies?: unknown[];
      }> | undefined;
      if (!comments) return REFETCH_MS;
      const pending = (list: typeof comments): boolean => {
        for (const c of list || []) {
          if (c.classificationStatus === 'pending' || c.classificationStatus == null) {
            return true;
          }
          if (c.replies?.length && pending(c.replies as typeof comments)) return true;
        }
        return false;
      };
      return pending(comments) ? 2_500 : REFETCH_MS;
    },
  });
}

export function useSocialCommentAction() {
  const invalidate = useInvalidateSocialListening();
  return useMutation({
    mutationFn: ({
      id,
      action,
      message,
      hidden,
    }: {
      id: string;
      action:
        | 'approve_dm'
        | 'approve_reply'
        | 'escalate'
        | 'ignore'
        | 'review'
        | 'hide_comment'
        | 'delete_comment';
      message?: string;
      hidden?: boolean;
    }) => api.socialListeningCommentAction(id, { action, message, hidden }),
    onSettled: () => {
      invalidate();
    },
  });
}
