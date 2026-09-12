import { httpClient } from '@/lib/httpClient'
import type {
  ActivityEvent,
  CommentAction,
  DashboardRange,
  DashboardStats,
  FacebookPageProfile,
  FacebookPost,
  IntentBreakdownItem,
  InstagramListeningAccount,
  ListeningComment,
  ListeningMedia,
  ListeningProfile,
  NeedsAttentionItem,
  Platform,
  PostAutomationInfo,
  ReviewComment,
  TopPost,
} from '@/lib/socialListening'

function qs(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) q.set(key, value)
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

export type CommentActionResult = {
  success: boolean
  id: string
  status: string
  reviewStatus: string
  replyId: string | null
  publicReplyText?: string
  dmReplyText?: string
  dmStatus?: 'sent' | 'failed' | 'skipped'
  dmError?: string | null
  dmMessageId?: string | null
  leadId?: string | null
}

export type CreatedLead = { id: string }

export const socialListeningApi = {
  getInstagramAccounts: () =>
    httpClient.get<{ accounts?: InstagramListeningAccount[] }>('/instagram/accounts'),

  getListeningProfile: (instagramUserId?: string) =>
    httpClient.get<{ profile: ListeningProfile }>(
      `/instagram/listening/profile${qs({ instagramUserId })}`,
    ),

  getListeningMedia: (opts: { instagramUserId?: string; after?: string; limit?: number }) =>
    httpClient.get<{ items: ListeningMedia[]; nextCursor: string | null }>(
      `/instagram/listening/media${qs({
        instagramUserId: opts.instagramUserId,
        after: opts.after,
        limit: opts.limit != null ? String(opts.limit) : undefined,
      })}`,
    ),

  getMediaDetail: (mediaId: string, instagramUserId?: string) =>
    httpClient.get<{ media: ListeningMedia }>(
      `/instagram/listening/media/${encodeURIComponent(mediaId)}${qs({ instagramUserId })}`,
    ),

  getMediaComments: (mediaId: string, opts?: { instagramUserId?: string; after?: string; limit?: number }) =>
    httpClient.get<{ comments: ListeningComment[]; nextCursor: string | null; classifying?: number }>(
      `/instagram/listening/media/${encodeURIComponent(mediaId)}/comments${qs({
        instagramUserId: opts?.instagramUserId,
        after: opts?.after,
        limit: opts?.limit != null ? String(opts.limit) : undefined,
      })}`,
    ),

  replyListeningComment: (commentId: string, message: string, instagramUserId?: string) =>
    httpClient.post<{ success: boolean; id: string }>(
      `/instagram/listening/comments/${encodeURIComponent(commentId)}/reply`,
      { message, ...(instagramUserId ? { instagramUserId } : {}) },
    ),

  getComments: (params?: { status?: string; postId?: string; platform?: Platform }) =>
    httpClient.get<{ comments: ReviewComment[]; threshold: number }>(
      `/social-listening/comments${qs({
        status: params?.status,
        postId: params?.postId,
        platform: params?.platform,
      })}`,
    ),

  classifyComment: (id: string) =>
    httpClient.post<{
      id: string
      intent: string | null
      confidence: number | null
      classificationStatus: string
      classificationError: string | null
      suggestedReply: string | null
    }>(`/social-listening/comments/${encodeURIComponent(id)}/classify`, {}),

  commentAction: (
    id: string,
    data: { action: CommentAction; message?: string; instagramUserId?: string; hidden?: boolean },
  ) => httpClient.post<CommentActionResult>(`/social-listening/comments/${encodeURIComponent(id)}/action`, data),

  retryDm: (id: string, instagramUserId?: string) =>
    httpClient.post<{
      dmStatus: 'sent' | 'failed'
      dmError: string | null
      dmMessageId: string | null
      dmReplyText: string
    }>(`/social-listening/comments/${encodeURIComponent(id)}/retry-dm`, {
      ...(instagramUserId ? { instagramUserId } : {}),
    }),

  getDashboardStats: (range: DashboardRange, platform?: Platform) =>
    httpClient.get<DashboardStats>(`/social-listening/dashboard/stats${qs({ range, platform })}`),

  getIntentBreakdown: (range: DashboardRange, platform?: Platform) =>
    httpClient.get<{ range: string; items: IntentBreakdownItem[] }>(
      `/social-listening/dashboard/intent-breakdown${qs({ range, platform })}`,
    ),

  getNeedsAttention: (limit = 25, platform?: Platform) =>
    httpClient.get<{ items: NeedsAttentionItem[] }>(
      `/social-listening/dashboard/needs-attention${qs({ limit: String(limit), platform })}`,
    ),

  getActivity: (limit = 30, platform?: Platform) =>
    httpClient.get<{ events: ActivityEvent[] }>(
      `/social-listening/dashboard/activity${qs({ limit: String(limit), platform })}`,
    ),

  getTopPosts: (range: DashboardRange, limit = 8, platform?: Platform) =>
    httpClient.get<{ range: string; posts: TopPost[] }>(
      `/social-listening/dashboard/top-posts${qs({ range, limit: String(limit), platform })}`,
    ),

  getFacebookInsights: () =>
    httpClient.get<{
      connected: boolean
      error?: string
      insights?: {
        pageFans: number
        pageFansDelta: number
        pageImpressions: number
        pageEngagedUsers: number
        pagePostEngagements: number
        pageViews: number
      }
    }>('/social-listening/dashboard/facebook-insights'),

  getPostAutomation: (postIds: string[]) =>
    httpClient.get<{ posts: Record<string, PostAutomationInfo> }>(
      `/social-listening/posts/automation${qs({ postIds: postIds.join(',') })}`,
    ),

  getPostSettings: (postId: string) =>
    httpClient.get<{
      settings: Record<string, unknown> & {
        leadFunnelId: string | null
        commentAutomationJourneyId: string | null
        commentAutomationJourneyName: string | null
      }
      dmSkillOptions: Array<{ id: string; title: string; agentId: string; agentName: string }>
    }>(`/social-listening/posts/${encodeURIComponent(postId)}/settings`),

  updatePostSettings: (postId: string, data: Record<string, unknown>) =>
    httpClient.patch<{
      success: boolean
      settings: Record<string, unknown> & {
        leadFunnelId: string | null
        commentAutomationJourneyId: string | null
        commentAutomationJourneyName: string | null
      }
    }>(`/social-listening/posts/${encodeURIComponent(postId)}/settings`, data),

  getFacebookPage: () =>
    httpClient.get<{ connected: boolean; page?: FacebookPageProfile }>('/facebook/pages'),

  getFacebookPosts: () => httpClient.get<{ posts: FacebookPost[] }>('/facebook/posts'),

  getFacebookPostComments: (postId: string) =>
    httpClient.get<{ comments: unknown[] }>(`/facebook/posts/${encodeURIComponent(postId)}/comments`),

  createLead: (data: { socialCommentId: string; funnelId: string }) =>
    httpClient.post<{ success: boolean; created: boolean; lead: CreatedLead | null }>('/leads', data),
}
