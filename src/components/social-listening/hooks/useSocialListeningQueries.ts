/**
 * Social Listening data via React Query — show cached data instantly,
 * refresh in background (focus / interval / invalidate after mutations).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import type { DashboardRange } from '../dashboard/StatCardRow';
import type { ReviewComment, ReviewStatus } from '../types';

export const slKeys = {
  all: ['social-listening'] as const,
  accounts: () => [...slKeys.all, 'ig-accounts'] as const,
  comments: (status: string) => [...slKeys.all, 'comments', status] as const,
  stats: (range: string) => [...slKeys.all, 'dashboard-stats', range] as const,
  intents: (range: string) => [...slKeys.all, 'intent-breakdown', range] as const,
  attention: () => [...slKeys.all, 'needs-attention'] as const,
  activity: () => [...slKeys.all, 'activity'] as const,
  topPosts: (range: string) => [...slKeys.all, 'top-posts', range] as const,
  postAutomation: (postIdsKey: string) =>
    [...slKeys.all, 'post-automation', postIdsKey] as const,
  listeningProfile: (igId: string) => [...slKeys.all, 'profile', igId] as const,
  listeningMedia: (igId: string) => [...slKeys.all, 'media', igId] as const,
  mediaDetail: (mediaId: string, igId?: string) =>
    [...slKeys.all, 'media-detail', mediaId, igId ?? ''] as const,
  mediaComments: (mediaId: string, igId?: string) =>
    [...slKeys.all, 'media-comments', mediaId, igId ?? ''] as const,
};

const STALE_MS = 30_000;
const REFETCH_MS = 60_000;

export type ApiReviewComment = {
  id: string;
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

export function useSocialListeningComments(status: string = 'new') {
  return useQuery({
    queryKey: slKeys.comments(status),
    queryFn: async () => {
      const res = await api.getSocialListeningComments({ status });
      return res.comments.map(mapApiReviewComment);
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
  });
}

export function useDashboardStats(range: DashboardRange) {
  return useQuery({
    queryKey: slKeys.stats(range),
    queryFn: () => api.getSocialListeningDashboardStats(range),
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
    placeholderData: (prev) => prev,
  });
}

export function useIntentBreakdown(range: DashboardRange) {
  return useQuery({
    queryKey: slKeys.intents(range),
    queryFn: async () => {
      const res = await api.getSocialListeningIntentBreakdown(range);
      return res.items;
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
    placeholderData: (prev) => prev,
  });
}

export function useNeedsAttention() {
  return useQuery({
    queryKey: slKeys.attention(),
    queryFn: async () => {
      const res = await api.getSocialListeningNeedsAttention(25);
      return res.items;
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
  });
}

export function useSocialActivity() {
  return useQuery({
    queryKey: slKeys.activity(),
    queryFn: async () => {
      const res = await api.getSocialListeningActivity(30);
      return res.events;
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
  });
}

export function useTopPosts(range: DashboardRange) {
  return useQuery({
    queryKey: slKeys.topPosts(range),
    queryFn: async () => {
      const res = await api.getSocialListeningTopPosts(range);
      return res.posts;
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_MS,
    placeholderData: (prev) => prev,
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
    }: {
      id: string;
      action: 'approve_dm' | 'approve_reply' | 'escalate' | 'ignore' | 'review';
      message?: string;
    }) => api.socialListeningCommentAction(id, { action, message }),
    onSettled: () => {
      invalidate();
    },
  });
}
