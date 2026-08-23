export type ReviewStatus = 'pending' | 'approved' | 'ignored';

export type IntentLabel =
  | 'Interested'
  | 'Question'
  | 'Complaint'
  | 'Spam'
  | 'Neutral';

/** Triage buckets shown on the review queue (priority order). */
export type TriageSectionId =
  | 'complaints'
  | 'sales'
  | 'questions'
  | 'low_confidence';

export type SocialListeningPlatform = 'instagram' | 'facebook';

export type ReviewComment = {
  id: string;
  platform: SocialListeningPlatform;
  username: string;
  profilePicUrl: string | null;
  commentText: string;
  postThumbnailUrl: string;
  postCaption: string;
  intent: IntentLabel;
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

export type SortMode = 'priority' | 'newest';
export type ViewMode = 'detailed' | 'cards' | 'compact';
export type IntentFilter = 'all' | TriageSectionId;

/** Below this, item lands in Low Confidence regardless of labeled intent. */
export const LOW_CONFIDENCE_THRESHOLD = 0.55;

export function triageSectionFor(item: ReviewComment): TriageSectionId {
  if (
    item.confidence < LOW_CONFIDENCE_THRESHOLD ||
    item.intent === 'Spam' ||
    item.intent === 'Neutral'
  ) {
    return 'low_confidence';
  }
  if (item.intent === 'Complaint') return 'complaints';
  if (item.intent === 'Interested') return 'sales';
  if (item.intent === 'Question') return 'questions';
  return 'low_confidence';
}

export function sortByNewest(a: ReviewComment, b: ReviewComment): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
