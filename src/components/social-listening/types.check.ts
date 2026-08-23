import {
  LOW_CONFIDENCE_THRESHOLD,
  sortByNewest,
  triageSectionFor,
  type ReviewComment,
} from './types';

const base = (partial: Partial<ReviewComment> & Pick<ReviewComment, 'id' | 'intent' | 'confidence'>): ReviewComment => ({
  platform: 'instagram',
  username: 'u',
  profilePicUrl: null,
  commentText: 'x',
  postThumbnailUrl: '',
  postCaption: '',
  status: 'pending',
  suggestedDm: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...partial,
});

console.assert(triageSectionFor(base({ id: '1', intent: 'Complaint', confidence: 0.8 })) === 'complaints');
console.assert(triageSectionFor(base({ id: '2', intent: 'Interested', confidence: 0.7 })) === 'sales');
console.assert(triageSectionFor(base({ id: '3', intent: 'Question', confidence: 0.7 })) === 'questions');
console.assert(
  triageSectionFor(base({ id: '4', intent: 'Interested', confidence: LOW_CONFIDENCE_THRESHOLD - 0.01 })) ===
    'low_confidence'
);
console.assert(triageSectionFor(base({ id: '5', intent: 'Spam', confidence: 0.9 })) === 'low_confidence');

const sorted = sortByNewest(
  base({ id: 'a', intent: 'Question', confidence: 0.7, createdAt: '2026-01-01T00:00:00.000Z' }),
  base({ id: 'b', intent: 'Question', confidence: 0.7, createdAt: '2026-01-02T00:00:00.000Z' })
);
console.assert(sorted > 0, 'newer should sort first when used as b-a comparator result for a,b');

console.log('social-listening/types.check.ts: ok');
