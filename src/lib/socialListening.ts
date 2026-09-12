export type Platform = 'instagram' | 'facebook'

export type IntentLabel = 'Interested' | 'Question' | 'Complaint' | 'Spam' | 'Neutral'

export type TriageSection = 'complaints' | 'sales' | 'questions' | 'low_confidence'

export type ReviewStatus = 'pending' | 'approved' | 'ignored'

export type CommentAction =
  | 'approve_dm'
  | 'approve_reply'
  | 'escalate'
  | 'ignore'
  | 'review'
  | 'hide_comment'
  | 'delete_comment'

export type DashboardRange = 'today' | '7d' | '30d' | 'all'

export type ClassificationStatus = 'pending' | 'classified' | 'failed' | null

export const LOW_CONFIDENCE_THRESHOLD = 0.55

export const SECTION_ORDER: TriageSection[] = ['complaints', 'sales', 'questions', 'low_confidence']

export const INTENT_COLORS: Record<string, string> = {
  Interested: '#0d9488',
  Question: '#0284c7',
  Complaint: '#dc2626',
  Spam: '#64748b',
  Neutral: '#a8a29e',
}

export type ReviewComment = {
  id: string
  platform: Platform
  commentId: string
  postId: string
  username: string
  profilePicUrl: string | null
  commentText: string
  postThumbnailUrl: string
  postCaption: string
  intent: IntentLabel
  confidence: number
  status: ReviewStatus
  rawStatus: string
  classificationStatus: string
  classificationError: string | null
  suggestedDm: string
  publicReplyText?: string | null
  dmReplyText?: string | null
  dmSentAt?: string | null
  dmStatus?: string | null
  dmError?: string | null
  leadId?: string | null
  createdAt: string
  needsReview: boolean
}

export type ListeningMedia = {
  id: string
  caption: string | null
  mediaType: string
  mediaProductType: string | null
  mediaUrl: string | null
  thumbnailUrl: string | null
  permalink: string | null
  timestamp: string | null
  likeCount: number | null
  commentsCount: number | null
  isReel: boolean
}

export type ListeningComment = {
  id: string
  text: string
  username: string | null
  timestamp: string | null
  likeCount: number | null
  fromId: string | null
  socialCommentId?: string | null
  intent?: string | null
  intentLabel?: IntentLabel | null
  confidence?: number | null
  classificationStatus?: ClassificationStatus
  classificationError?: string | null
  reviewStatus?: ReviewStatus | null
  suggestedReply?: string | null
  status?: string | null
  publicReplyText?: string | null
  dmReplyText?: string | null
  dmSentAt?: string | null
  dmStatus?: string | null
  dmError?: string | null
  leadId?: string | null
  replies: ListeningComment[]
}

export type DashboardStats = {
  range: string
  totalComments: number
  pendingReview: number
  autoHandled: number
  leadsCreated: number
  autoDmsSentToday: number
  maxAutoDmsPerDay: number
  autoResponseEnabled: boolean
}

export type IntentBreakdownItem = { intent: string; label: string; count: number }

export type NeedsAttentionItem = {
  id: string
  kind: 'complaint' | 'interested' | 'question' | 'pending' | 'failed_dm'
  priority: number
  commentId: string
  postId: string
  username: string
  commentText: string
  postThumbnailUrl: string
  postCaption: string
  intent: IntentLabel
  confidence: number
  waitingSince: string
  dmError: string | null
  suggestedAction: 'approve_dm' | 'escalate' | 'retry_dm' | 'open_review'
}

export type ActivityEvent = {
  id: string
  eventType: string
  message: string
  relatedCommentId: string | null
  relatedLeadId: string | null
  meta: unknown
  createdAt: string
}

export type TopPost = {
  postId: string
  commentCount: number
  leadCount: number
  postThumbnailUrl: string
  postCaption: string
}

export type PostAutomationInfo = {
  autoResponseEnabled: boolean
  leadFunnelId: string | null
  commentAutomationJourneyId: string | null
  commentAutomationJourneyName: string | null
}

export type FacebookPost = {
  id: string
  message: string
  fullPicture?: string
  createdTime: string
  likesCount: number
  commentsCount: number
  sharesCount: number
  permalink: string
}

export type FacebookPageProfile = {
  id: string
  name: string
  category: string
  picture: string
  followersCount: number
  isConnected: boolean
}

export type InstagramListeningAccount = {
  instagramUserId: string
  username?: string | null
  displayName?: string | null
  pageName?: string | null
  profilePicture?: string | null
}

export type ListeningProfile = {
  instagramUserId: string
  pageId: string
  pageName: string | null
  username: string | null
  name: string | null
  biography: string | null
  website: string | null
  followersCount: number | null
  followsCount: number | null
  mediaCount: number | null
  profilePictureUrl: string | null
}

export function triageSectionFor(intent: IntentLabel, confidence: number): TriageSection {
  if (confidence < LOW_CONFIDENCE_THRESHOLD || intent === 'Spam' || intent === 'Neutral') {
    return 'low_confidence'
  }
  if (intent === 'Complaint') return 'complaints'
  if (intent === 'Interested') return 'sales'
  return 'questions'
}

export function triageSectionForComment(item: Pick<ReviewComment, 'intent' | 'confidence'>): TriageSection {
  return triageSectionFor(item.intent, item.confidence)
}

export function sortByNewest(a: { createdAt: string }, b: { createdAt: string }): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

export function priorityRank(id: TriageSection): number {
  return SECTION_ORDER.indexOf(id)
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (Number.isNaN(diff) || diff < 0) return ''
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export function formatCount(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function parseApiError(err: unknown): string {
  if (!(err instanceof Error)) return 'Something went wrong'
  try {
    const parsed = JSON.parse(err.message) as { error?: string; details?: string }
    return [parsed.error, parsed.details].filter(Boolean).join(' · ') || err.message
  } catch {
    return err.message
  }
}

export function commenterKey(c: { fromId?: string | null; username?: string | null; id: string }): string {
  if (c.fromId) return `id:${c.fromId}`
  if (c.username?.trim()) return `u:${c.username.trim().toLowerCase()}`
  return `solo:${c.id}`
}

export function findComment(list: ListeningComment[], id: string): ListeningComment | null {
  for (const c of list) {
    if (c.id === id) return c
    const nested = findComment(c.replies || [], id)
    if (nested) return nested
  }
  return null
}

export function findCommentBySocialId(list: ListeningComment[], socialCommentId: string): ListeningComment | null {
  for (const c of list) {
    if (c.socialCommentId === socialCommentId) return c
    const nested = findCommentBySocialId(c.replies || [], socialCommentId)
    if (nested) return nested
  }
  return null
}

export function facebookPostToMedia(post: FacebookPost): ListeningMedia {
  return {
    id: post.id,
    caption: post.message || null,
    mediaType: 'IMAGE',
    mediaProductType: null,
    mediaUrl: post.fullPicture || null,
    thumbnailUrl: post.fullPicture || null,
    permalink: post.permalink || null,
    timestamp: post.createdTime || null,
    likeCount: post.likesCount ?? null,
    commentsCount: post.commentsCount ?? null,
    isReel: false,
  }
}

export function reviewToListeningComment(c: ReviewComment): ListeningComment {
  return {
    id: c.commentId,
    socialCommentId: c.id,
    text: c.commentText,
    username: c.username || null,
    timestamp: c.createdAt,
    likeCount: null,
    fromId: null,
    intent: c.intent,
    intentLabel: c.intent,
    confidence: c.confidence,
    classificationStatus: (c.classificationStatus as ClassificationStatus) ?? 'classified',
    classificationError: c.classificationError,
    reviewStatus: c.status,
    suggestedReply: c.suggestedDm,
    status: c.rawStatus,
    publicReplyText: c.publicReplyText ?? null,
    dmReplyText: c.dmReplyText ?? null,
    dmSentAt: c.dmSentAt ?? null,
    dmStatus: c.dmStatus ?? null,
    dmError: c.dmError ?? null,
    leadId: c.leadId ?? null,
    replies: [],
  }
}
