export type Platform = 'instagram' | 'facebook'

export type IntentLabel = 'Interested' | 'Question' | 'Complaint' | 'Spam' | 'Neutral'

export type TriageSection = 'complaints' | 'sales' | 'questions' | 'low_confidence'

export const LOW_CONFIDENCE_THRESHOLD = 0.55

export function triageSectionFor(intent: IntentLabel, confidence: number): TriageSection {
  if (confidence < LOW_CONFIDENCE_THRESHOLD || intent === 'Spam' || intent === 'Neutral') {
    return 'low_confidence'
  }
  if (intent === 'Interested') return 'sales'
  if (intent === 'Complaint') return 'complaints'
  return 'questions'
}

export type ReviewStatus = 'pending' | 'approved' | 'ignored'

export type ReviewItem = {
  id: string
  platform: Platform
  username: string
  intent: IntentLabel
  confidence: number
  comment: string
  postCaption: string
  timeAgo: string
  status: ReviewStatus
  suggestedReply?: string
  suggestedDm?: string
  isLead?: boolean
}

export const REVIEW_ITEMS: ReviewItem[] = [
  {
    id: 'r1',
    platform: 'instagram',
    username: 'meera.joshi',
    intent: 'Complaint',
    confidence: 0.91,
    comment: 'Order #4821 arrived damaged, this is the second time. Really disappointed.',
    postCaption: 'New ceramic mug collection is here 🎉',
    timeAgo: '12m ago',
    status: 'pending',
    suggestedReply:
      "We're so sorry to hear that! Please DM us your order number and we'll sort a replacement right away.",
  },
  {
    id: 'r2',
    platform: 'instagram',
    username: 'aman.verma',
    intent: 'Interested',
    confidence: 0.88,
    comment: 'This looks amazing! Do you ship internationally?',
    postCaption: 'Diwali Special — 20% off storewide',
    timeAgo: '25m ago',
    status: 'pending',
    suggestedDm: 'Hey Aman! Yes we ship worldwide 🌍 Want me to share shipping rates for your country?',
  },
  {
    id: 'r3',
    platform: 'facebook',
    username: 'Priya Nair',
    intent: 'Question',
    confidence: 0.82,
    comment: 'What are your store timings on weekends?',
    postCaption: 'Weekend Flash Sale starts tomorrow!',
    timeAgo: '40m ago',
    status: 'pending',
    suggestedReply: 'Hi Priya! We are open 10 AM – 9 PM on both Saturday and Sunday 😊',
  },
  {
    id: 'r4',
    platform: 'instagram',
    username: 'karan.mehta',
    intent: 'Interested',
    confidence: 0.79,
    comment: 'Can I get this in size L? Also do you have COD?',
    postCaption: 'Black hoodie restock 🖤',
    timeAgo: '1h ago',
    status: 'pending',
    suggestedDm:
      'Hi Karan! Yes, size L is in stock and COD is available. Want me to help you place the order?',
  },
  {
    id: 'r5',
    platform: 'instagram',
    username: 'sneha_iyer',
    intent: 'Complaint',
    confidence: 0.74,
    comment: 'Been waiting 3 days for a reply to my DM, not cool.',
    postCaption: 'Behind the scenes at our studio ✨',
    timeAgo: '2h ago',
    status: 'pending',
    suggestedReply: "So sorry for the delay, Sneha! We're checking your DM right now.",
  },
  {
    id: 'r6',
    platform: 'facebook',
    username: 'Rahul Desai',
    intent: 'Spam',
    confidence: 0.31,
    comment: 'Check my page for the best deals 🔥🔥🔥 link in bio',
    postCaption: 'Customer love ❤️',
    timeAgo: '3h ago',
    status: 'pending',
  },
  {
    id: 'r7',
    platform: 'instagram',
    username: 'vivaan.shah',
    intent: 'Neutral',
    confidence: 0.42,
    comment: 'nice 👍',
    postCaption: 'New ceramic mug collection is here 🎉',
    timeAgo: '4h ago',
    status: 'pending',
  },
  {
    id: 'r8',
    platform: 'instagram',
    username: 'ananya.gupta',
    intent: 'Question',
    confidence: 0.86,
    comment: 'Is this available in blue?',
    postCaption: 'New ceramic mug collection is here 🎉',
    timeAgo: '6h ago',
    status: 'approved',
    suggestedReply: 'Yes! Blue just restocked — link in bio 💙',
  },
  {
    id: 'r9',
    platform: 'instagram',
    username: 'rohit.kumar',
    intent: 'Interested',
    confidence: 0.9,
    comment: 'Just placed an order, so excited!',
    postCaption: 'Diwali Special — 20% off storewide',
    timeAgo: '8h ago',
    status: 'approved',
    isLead: true,
  },
]

export type Post = {
  id: string
  platform: Platform
  caption: string
  likes: number
  comments: number
  isReel?: boolean
  automation: 'off' | 'agent' | 'auto' | 'both'
}

export const POSTS: Post[] = [
  {
    id: 'p1',
    platform: 'instagram',
    caption: 'New ceramic mug collection is here 🎉',
    likes: 842,
    comments: 34,
    automation: 'both',
  },
  {
    id: 'p2',
    platform: 'instagram',
    caption: 'Diwali Special — 20% off storewide',
    likes: 1204,
    comments: 61,
    automation: 'auto',
  },
  {
    id: 'p3',
    platform: 'instagram',
    caption: 'Behind the scenes at our studio ✨',
    likes: 530,
    comments: 18,
    isReel: true,
    automation: 'agent',
  },
  {
    id: 'p4',
    platform: 'instagram',
    caption: 'Black hoodie restock 🖤',
    likes: 690,
    comments: 27,
    automation: 'off',
  },
  {
    id: 'p5',
    platform: 'instagram',
    caption: 'Customer love ❤️',
    likes: 412,
    comments: 9,
    automation: 'both',
  },
  {
    id: 'p6',
    platform: 'instagram',
    caption: 'Packaging that feels like a gift 🎁',
    likes: 355,
    comments: 12,
    isReel: true,
    automation: 'agent',
  },
  {
    id: 'p7',
    platform: 'facebook',
    caption: 'Weekend Flash Sale starts tomorrow!',
    likes: 288,
    comments: 45,
    automation: 'off',
  },
  {
    id: 'p8',
    platform: 'facebook',
    caption: 'Meet the team behind ConvoSync Retail',
    likes: 190,
    comments: 8,
    automation: 'off',
  },
]

export const DASHBOARD_STATS = {
  comments: 612,
  pendingReview: REVIEW_ITEMS.filter((r) => r.status === 'pending').length,
  autoHandled: 214,
  leadsCreated: 18,
  autoDmsToday: 32,
  autoDmsMax: 50,
}

export const INTENT_BREAKDOWN: { intent: IntentLabel; count: number; color: string }[] = [
  { intent: 'Interested', count: 148, color: '#0d9488' },
  { intent: 'Question', count: 96, color: '#0284c7' },
  { intent: 'Complaint', count: 41, color: '#dc2626' },
  { intent: 'Spam', count: 63, color: '#64748b' },
  { intent: 'Neutral', count: 264, color: '#a8a29e' },
]

export const TOP_POSTS = POSTS.slice(0, 5).map((p, i) => ({
  ...p,
  engagementRate: [6.8, 5.4, 4.9, 4.1, 3.6][i],
}))
