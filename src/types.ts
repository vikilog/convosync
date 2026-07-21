/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Shared Type Definitions

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export type ChatMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'location'
  | 'template';

export interface ChatMessageMedia {
  mimeType?: string;
  fileName?: string;
  caption?: string;
  storageKey?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  locationAddress?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'contact' | 'agent' | 'system';
  senderName: string;
  content: string;
  type?: ChatMessageType;
  media?: ChatMessageMedia;
  createdAt?: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  /** WhatsApp "delete for everyone" */
  revoked?: boolean;
  /** Optimistic local preview while outbound media is uploading */
  localPreviewUrl?: string;
}

export interface ContactAttribute {
  name: string;
  value: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone: string;
  phoneRaw: string;
  avatar?: string;
  lastActive: string;
  unreadCount: number;
  lastMessage: string;
  status: 'Open' | 'Pending' | 'Resolved';
  assignedAgent: string;
  source: string;
  channel?: 'whatsapp' | 'instagram' | 'messenger';
  /** Meta phone_number_id for WhatsApp inbox routing */
  channelAccountId?: string | null;
  handle?: string;
  courseInterest: string;
  location: string;
  tags: string[];
  journeyStatus: 'Ad Clicked' | 'WhatsApp Initiated' | 'In Discussion' | 'Converted';
  journeyDates: {
    adClicked?: string;
    whatsappInitiated?: string;
    inDiscussion?: string;
    converted?: string;
  };
  instagramBio?: string;
  instagramFollowerCount?: string;
  instagramFollowsCount?: string;
  instagramMediaCount?: string;
  instagramVerified?: boolean;
  instagramFollowsBusiness?: boolean;
  instagramBusinessFollowsUser?: boolean;
}

export interface Segment {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface CampaignTemplate {
  id?: string;
  name: string;
  category: 'Utility' | 'Marketing' | 'Authentication';
  status: 'Approved' | 'Pending' | 'Rejected' | 'Draft' | 'Paused' | 'Disabled';
  language?: string;
  lastUpdated: string;
  variables: string[];
  bodyPattern: string;
  buttons: string[];
  header?: string;
  headerFormat?: string;
  headerMediaStorageKey?: string;
  headerMediaMimeType?: string;
  headerMediaFileName?: string;
  footer?: string;
  buttonType?: string;
  buttonText?: string;
  buttonUrl?: string;
  buttonPhoneNumber?: string;
  rejectionReason?: string;
}

export interface EmailTemplateRecord {
  id?: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string | null;
  designJson?: Record<string, unknown> | null;
  variables: string[];
  status: 'draft' | 'active';
  createdAt?: string;
  updatedAt?: string;
}

export type CampaignRecordStatus = 'Draft' | 'Running' | 'Completed' | 'Failed';

export interface CampaignRecord {
  id: string;
  name: string;
  status: CampaignRecordStatus;
  channel: CampaignChannel;
  segmentLabel: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  createdAt: string;
  sentAt: string | null;
}

export interface CampaignRecipientInsight {
  messageId: string;
  conversationId: string;
  contactId: string;
  contactName: string;
  phone: string;
  email: string | null;
  status: string;
  sentAt: string;
  content: string;
  errorMessage?: string | null;
}

export interface CampaignInsights {
  totalRecipients: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  pending: number;
  deliveryRate: number;
  readRate: number;
}

export interface CampaignDetail {
  id: string;
  name: string;
  status: CampaignRecordStatus;
  channel: CampaignChannel;
  segmentLabel: string;
  audienceType: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  createdAt: string;
  sentAt: string | null;
  scheduledAt: string | null;
  template: {
    id: string;
    name: string;
    category?: string;
    language?: string;
    bodyPattern?: string;
    subject?: string;
    htmlBody?: string;
    textBody?: string | null;
    variables?: string[];
    status: string;
  } | null;
  variableMappings: Record<string, string>;
  insights: CampaignInsights;
  recipients: CampaignRecipientInsight[];
}

export interface AdAccount {
  id: string;
  name: string;
  currency: string;
  status: 'ACTIVE' | 'DISABLED';
  balance: number;
  spendCap?: number;
  timezone: string;
}

export interface MetaAdAccountOption {
  id: string;
  name: string;
  currency: string;
  status: 'ACTIVE' | 'DISABLED';
  source: 'page_business' | 'personal';
  campaignCount: number;
  isSelected: boolean;
}

export interface AdInsights {
  spend: number;
  impressions: number;
  clicks: number;
  cpm: number;
  cpc: number;
  ctr: number;
  reach: number;
  frequency: number;
  conversions?: number;
  roas?: number;
  dateStart: string;
  dateStop: string;
}

export type AdPlatform =
  | 'Facebook Feed'
  | 'Instagram Story'
  | 'Instagram Feed'
  | 'FB Marketplace'
  | 'WhatsApp Ads'
  | 'Audience Network';
export type AdStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED' | 'IN_PROCESS' | 'WITH_ISSUES';
export type AdObjective =
  | 'MESSAGES'
  | 'LEAD_GENERATION'
  | 'CONVERSIONS'
  | 'TRAFFIC'
  | 'BRAND_AWARENESS'
  | 'REACH';

export interface AdCampaign {
  id: string;
  name: string;
  status: AdStatus;
  objective: AdObjective;
  platform: AdPlatform;
  dailyBudget: number;
  lifetimeBudget?: number;
  startTime: string;
  endTime?: string;
  clicks: number;
  conversations: number;
  conversionMultiplier: number;
  insights: AdInsights;
  previewUrl: string;
  isCTWA: boolean;
  waConversationsStarted?: number;
}

export interface CreateCTWAAdPayload {
  campaignName: string;
  adAccountId: string;
  waPhoneNumberId: string;
  dailyBudget: number;
  startDate: string;
  endDate?: string;
  headline: string;
  description: string;
  imageUrl?: string;
  targeting: {
    ageMin: number;
    ageMax: number;
    locations: string[];
    interests: string[];
  };
}

export type FlowTriggerType = 'keyword' | 'click_button';

export type KeywordMatchRule = 'containing' | 'exact_match';

export type AgentFlowNodeType =
  | 'ask_question'
  | 'send_messages'
  | 'call_api'
  | 'agent_takeover'
  | 'unsubscribe'
  | 'add_tags'
  | 'send_shop_product'
  | 'branch';

export interface AgentFlowNode {
  id: string;
  type: AgentFlowNodeType;
  title: string;
  x: number;
  y: number;
}

export interface AgentFlowDefinition {
  name: string;
  status: 'active' | 'inactive';
  triggerType: FlowTriggerType | null;
  keywordMatchRule?: KeywordMatchRule;
  keywordList?: string[];
  nodes: AgentFlowNode[];
}

export type AgentCategory = 'ai_agent' | 'responsive' | 'rule_based';

export type AgentIntentFallback = 'silent' | 'automated_response' | 'transfer_human';

export type AgentToneOfVoice = 'professional' | 'humorous' | 'casual' | 'friendly';

export type AgentFallbackLanguage =
  | 'english'
  | 'hindi'
  | 'hinglish'
  | 'spanish'
  | 'arabic'
  | 'french';

export type AgentActionType =
  | 'close_conversations'
  | 'escalate_to_human'
  | 'add_contact_tags'
  | 'update_contact_attributes';

export interface AgentActionConfig {
  type: AgentActionType;
  enabled: boolean;
  instruction: string;
}

export interface AgentBot {
  id: string;
  name: string;
  category: AgentCategory;
  role: 'Lead Acquisition' | 'Order Support' | 'Collections' | 'General FAQ' | 'Feedback Collector';
  description: string;
  avatarUrl?: string | null;
  welcomeMessageEnabled: boolean;
  welcomeMessageText?: string | null;
  intentFallback: AgentIntentFallback;
  conversationCloseWaitMins: number;
  toneOfVoice?: AgentToneOfVoice;
  fallbackLanguage?: AgentFallbackLanguage;
  instructions?: string;
  brandBackground?: string;
  actions?: AgentActionConfig[];
  voiceAgentEnabled?: boolean;
  voiceSttProvider?: string;
  voiceTtsProvider?: string;
  voiceTtsVoiceId?: string | null;
  isPublished?: boolean;
  publishedAt?: string | null;
  conversationsCount: number;
  escalatedCount: number;
  flowsCount: number;
  flowDefinition?: AgentFlowDefinition | null;
  isEnabled: boolean;
  lastActive: string;
}

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  email: string;
  conversationsCount: number;
  csat: number;
  avgResponse: string;
  trend: string;
}

export type QuickCampaignStatus =
  | 'Running'
  | 'Active'
  | 'Draft'
  | 'Scheduled'
  | 'Completed'
  | 'Paused'
  | 'Failed';

export interface QuickCampaign {
  id: string;
  name: string;
  status: QuickCampaignStatus;
  channel: 'whatsapp' | 'email' | 'instagram';
  date: string;
  scheduledAt?: string | null;
  sentCount: number;
  deliveredCount: number;
  audienceCount: string;
  engagementMetric: string;
}

// ----------------------------------------------------------------------------
// HIGH-FIDELITY MOCK DATA
// ----------------------------------------------------------------------------

export const CURRENT_USER: UserProfile = {
  name: 'Vikas Sharma',
  email: 'vikas@convosync.io',
  role: 'Admin',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNh8W4QIUaPqGa12B6lyYPP1sKBFcEYqw1g9SpV4Ro5SsAhXuLNrI-NloR2HA4COlxiPWXqNSSmYc5kgeu3q0cW_jj2RZj4qupszOTaUfSSrMgGyQGHvvJ6EzXidX6m9GBA_-SnuD6jr3XHUFgfeosw-cpjpljFoz3QvozMbZDr1YBJxnlOAgBr3EBM3PV60NM4jo8T6SC4gk35NGyDyu9ASAAMe2gkab94E3dkCh2cn1SJIzAHKy3VJeiBWkVt9EuuVX-IHTRliKB'
};

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'agent_1',
    name: 'Ananya Patel',
    initials: 'AP',
    email: 'ananya@convosync.io',
    conversationsCount: 1240,
    csat: 4.8,
    avgResponse: '3m 15s',
    trend: '+12% vs last month'
  },
  {
    id: 'agent_2',
    name: 'Rahul Kumar',
    initials: 'RK',
    email: 'rahul.k@convosync.io',
    conversationsCount: 982,
    csat: 4.2,
    avgResponse: '5m 45s',
    trend: '-5% vs last month'
  },
  {
    id: 'agent_3',
    name: 'Sneha Das',
    initials: 'SD',
    email: 'sneha.das@convosync.io',
    conversationsCount: 1056,
    csat: 4.9,
    avgResponse: '2m 50s',
    trend: '+2% vs last month'
  }
];

export const GENERAL_AGENTS: string[] = ['Alex Rivera', 'Sarah Chen', 'Ananya Patel', 'Rahul Kumar', 'Sneha Das', 'Unassigned'];

export const MOCK_CONTACT_HISTORY: Record<string, ChatMessage[]> = {
  'c_rahul': [
    {
      id: 'm1',
      sender: 'contact',
      senderName: 'Rahul Sharma',
      content: 'Hey! I saw your ad for the UI Design Masterclass. Can you tell me more about the portfolio reviews?',
      timestamp: '12:38 PM'
    },
    {
      id: 'm2',
      sender: 'agent',
      senderName: 'Alex Rivera',
      content: 'Hello Rahul! 👋 Glad you reached out. Our portfolio reviews happen every Friday with senior designers from top firms. They provide 1-on-1 feedback on your layout, typography, and case study logic.',
      timestamp: '12:40 PM',
      status: 'read'
    },
    {
      id: 'm3',
      sender: 'contact',
      senderName: 'Rahul Sharma',
      content: "That sounds great. I'm also worried about the full payment. When can I expect the course syllabus for UI Design? Do you have EMIs?",
      timestamp: '12:45 PM'
    }
  ],
  'c_priya': [
    {
      id: 'p1',
      sender: 'contact',
      senderName: 'Priya Kapur',
      content: 'Hello, I wanted to submit the documentation required for registration.',
      timestamp: '11:15 AM'
    },
    {
      id: 'p2',
      sender: 'system',
      senderName: 'System',
      content: 'Priya Kapur uploaded document: registration_form.pdf',
      timestamp: '11:18 AM'
    },
    {
      id: 'p3',
      sender: 'contact',
      senderName: 'Priya Kapur',
      content: 'Shared a PDF document. Please verify if this matches the formatting guidelines.',
      timestamp: '11:20 AM'
    }
  ],
  'c_amit': [
    {
      id: 'a1',
      sender: 'contact',
      senderName: 'Amit Verma',
      content: 'Hi, is the batch starting this Saturday?',
      timestamp: 'Yesterday'
    },
    {
      id: 'a2',
      sender: 'agent',
      senderName: 'Alex Rivera',
      content: 'Yes Amit! Saturday at 10:00 AM IST. I have triggered the batch access details to your portal email as well.',
      timestamp: 'Yesterday',
      status: 'read'
    },
    {
      id: 'a3',
      sender: 'contact',
      senderName: 'Amit Verma',
      content: 'Thanks for the update. Will check it out.',
      timestamp: 'Yesterday'
    }
  ],
  'c_anjali': [
    {
      id: 'an1',
      sender: 'contact',
      senderName: 'Anjali Singh',
      content: 'Hello, looking forward to starting the module!',
      timestamp: '10:05 AM'
    },
    {
      id: 'an2',
      sender: 'agent',
      senderName: 'Sarah Chen',
      content: 'Welcome aboard Anjali! Feel free to ask if you have setup queries.',
      timestamp: '10:15 AM',
      status: 'read'
    }
  ],
  'c_rohan': [
    {
      id: 'r1',
      sender: 'contact',
      senderName: 'Rohan Verma',
      content: 'Is there any university student discount?',
      timestamp: '2 hours ago'
    }
  ]
};

export const MOCK_CONTACTS: Contact[] = [
  {
    id: 'c_rahul',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    phoneRaw: '9876543210',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGrREG7IJ5B6f-GvJdiGrsBZYOem8gFyzzz8aSCMiai71cOyODtYK5YazjGHBn5Ww4jePzhCPAg7BiJxDKr-KBuPq54MJM-_pWKbyUCnm3veDEG5Fd8x9PBkMcFAsGyRr6u2Vf5GNURDWJGH4i8k8LC7g-3fFgIOiGObRM31zlCFV7sVQfXHXeVcPmLWs-SJcTaZ2r7MnKNJtF4jIscban-rxzrCPIxnYsJW5rGKu7AuPwPTDgXBa4OB__kE9tr0pexeXSFeW4936X',
    lastActive: '2 mins ago',
    unreadCount: 2,
    lastMessage: 'When can I expect the course syllabus for UI Design? Do you have EMIs?',
    status: 'Open',
    assignedAgent: 'Alex Rivera',
    source: 'Instagram Ad',
    courseInterest: 'UI Design Masterclass',
    location: 'Bangalore, India',
    tags: ['Lead', 'Hot'],
    journeyStatus: 'In Discussion',
    journeyDates: {
      adClicked: 'Oct 24, 10:15 AM',
      whatsappInitiated: 'Oct 24, 12:38 PM',
      inDiscussion: 'Currently active',
      converted: 'Pending'
    }
  },
  {
    id: 'c_priya',
    name: 'Priya Kapur',
    phone: '+91 88888 77777',
    phoneRaw: '8888877777',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDc7Fi6Du3Ier0QA6_MpFNbQQ3aQWQg7j2LvhJOy8HArXVgGvG-FKZsZu8M9tr3aTn5GGMy7O5WL6ayskrpQjWVRDDQ64rJt0_yccke-OsQ3U8ntTE8IybTKYFz8wWzOYmnLyTVfKpcyONEWOv1I-lN_24AmDbfzVYqei5XhWLfQ6HOM06Cj5fYn1-8HS6kOAGFcZaw4O4WgbnnEx1khjetWKKsdQyg0JvJAoQjsTWWJZrx-l6Ha70KdQKlbIby8H6IYA6_Oqf9y2gp',
    lastActive: '11:20 AM',
    unreadCount: 0,
    lastMessage: 'Shared a PDF document',
    status: 'Pending',
    assignedAgent: 'Unassigned',
    source: 'Referral',
    courseInterest: 'Full Stack Web Dev',
    location: 'Mumbai, India',
    tags: ['Student'],
    journeyStatus: 'In Discussion',
    journeyDates: {
      adClicked: 'May 10, 09:00 AM',
      whatsappInitiated: 'May 10, 11:15 AM',
      inDiscussion: 'Currently Active',
      converted: 'Pending'
    }
  },
  {
    id: 'c_amit',
    name: 'Amit Verma',
    phone: '+91 70001 00007',
    phoneRaw: '7000100007',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMQWvU-89MI8CF5fyRRcQydyAywMpdpAR_tfEjNOCKSQGrYrCtUmJsfJ6rNGQjpwUqs_VZZmjGWr3RtBQ7StSLC2CEC7Md9-mycY-8SylQAMGaxWjBngMgadSuVoX2Ohd6CWR_72-lP8DcfVzuZ5f-gebNX8AcKh8tv7A1I5Si8-6KKURmGq-aNANWRgSWJ-blfmL-7VhhQ7Zh8mNw4QYagczHLSrYwHXFFhbzv5buoqbhHXf3VzsTeLalyYSB0ngPhLaZ2B3C2sHM',
    lastActive: 'Yesterday',
    unreadCount: 0,
    lastMessage: 'Thanks for the update. Will check it out.',
    status: 'Resolved',
    assignedAgent: 'Alex Rivera',
    source: 'LinkedIn',
    courseInterest: 'UI Design Masterclass',
    location: 'Delhi, India',
    tags: ['Hot'],
    journeyStatus: 'Converted',
    journeyDates: {
      adClicked: 'Oct 20, 02:30 PM',
      whatsappInitiated: 'Oct 20, 03:00 PM',
      inDiscussion: 'Oct 21, 10:15 AM',
      converted: 'Oct 22, 05:00 PM'
    }
  },
  {
    id: 'c_anjali',
    name: 'Anjali Singh',
    phone: '+91 98765 43211',
    phoneRaw: '9876543211',
    lastActive: 'Active 2m ago',
    unreadCount: 0,
    lastMessage: 'Hello, looking forward to starting the module!',
    status: 'Open',
    assignedAgent: 'Sarah Chen',
    source: 'Meta Ads',
    courseInterest: 'UI Design Masterclass',
    location: 'Pune, India',
    tags: ['Student', 'Hot'],
    journeyStatus: 'WhatsApp Initiated',
    journeyDates: {
      adClicked: 'Oct 24, 09:30 AM',
      whatsappInitiated: 'Oct 24, 10:05 AM'
    }
  },
  {
    id: 'c_rohan',
    name: 'Rohan Verma',
    phone: '+91 91234 56789',
    phoneRaw: '9123456789',
    lastActive: 'Active 15m ago',
    unreadCount: 0,
    lastMessage: 'Is there any university student discount?',
    status: 'Open',
    assignedAgent: 'Alex Rivera',
    source: 'Organic',
    courseInterest: 'UI Design Masterclass',
    location: 'Chennai, India',
    tags: ['University'],
    journeyStatus: 'WhatsApp Initiated',
    journeyDates: {
      whatsappInitiated: 'Oct 24, 12:00 PM'
    }
  },
  {
    id: 'c_sneha',
    name: 'Sneha Menon',
    phone: '+91 99000 88000',
    phoneRaw: '9900088000',
    lastActive: 'Active 1d ago',
    unreadCount: 0,
    lastMessage: 'Can you share details of payment schedule?',
    status: 'Resolved',
    assignedAgent: 'Alex Rivera',
    source: 'WhatsApp Ad',
    courseInterest: 'UX Research Program',
    location: 'Hyderabad, India',
    tags: ['Student'],
    journeyStatus: 'In Discussion',
    journeyDates: {
      whatsappInitiated: 'Oct 23, 04:00 PM',
      inDiscussion: 'Oct 24, 11:00 AM'
    }
  },
  {
    id: 'c_vikram',
    name: 'Vikram Joshi',
    phone: '+91 94444 33333',
    phoneRaw: '9444433333',
    lastActive: 'Active 3d ago',
    unreadCount: 0,
    lastMessage: 'Looking for EMI options',
    status: 'Resolved',
    assignedAgent: 'Sarah Chen',
    source: 'Search',
    courseInterest: 'Advanced UI Masterclass',
    location: 'Noida, India',
    tags: ['Hot'],
    journeyStatus: 'WhatsApp Initiated',
    journeyDates: {
      whatsappInitiated: 'Oct 21, 01:00 PM'
    }
  },
  {
    id: 'c_deepika',
    name: 'Deepika Rao',
    phone: '+91 92222 11111',
    phoneRaw: '9222211111',
    lastActive: 'Active 1w ago',
    unreadCount: 0,
    lastMessage: 'Completed layout assignments',
    status: 'Resolved',
    assignedAgent: 'Alex Rivera',
    source: 'Direct',
    courseInterest: 'UI Design Masterclass',
    location: 'Kolkata, India',
    tags: ['University'],
    journeyStatus: 'Converted',
    journeyDates: {
      whatsappInitiated: 'Oct 15, 10:00 AM',
      inDiscussion: 'Oct 16, 02:00 PM',
      converted: 'Oct 18, 04:30 PM'
    }
  },
  {
    id: 'c_sanjay',
    name: 'Sanjay Nair',
    phone: '+91 93333 44444',
    phoneRaw: '9333344444',
    lastActive: 'Active 2w ago',
    unreadCount: 0,
    lastMessage: 'Awaiting syllabus review',
    status: 'Resolved',
    assignedAgent: 'Sarah Chen',
    source: 'Meta Ads',
    courseInterest: 'Design Systems Pro',
    location: 'Cochin, India',
    tags: ['Student'],
    journeyStatus: 'WhatsApp Initiated',
    journeyDates: {
      whatsappInitiated: 'Oct 10, 09:30 AM'
    }
  }
];

export const MOCK_SEGMENTS: Segment[] = [
  { id: 'all_contacts', name: 'All Contacts', icon: 'groups', count: 12480 },
  { id: 'students', name: 'Students', icon: 'school', count: 3200 },
  { id: 'hot_leads', name: 'Hot Leads', icon: 'local_fire_department', count: 840 },
  { id: 'replied', name: 'Replied', icon: 'reply_all', count: 2100 }
];

export const MOCK_TEMPLATES: CampaignTemplate[] = [
  {
    name: 'order_confirmation_v2',
    category: 'Utility',
    status: 'Approved',
    lastUpdated: 'Updated 2 days ago',
    variables: ['First Name', 'Order Number'],
    bodyPattern: 'Hello {{1}}, your order #{{2}} has been confirmed and will be shipped shortly. Thank you for shopping with us! Track your package live using the button below.',
    buttons: ['Track Order', 'Contact Support']
  },
  {
    name: 'shipping_update',
    category: 'Utility',
    status: 'Approved',
    lastUpdated: 'Updated 1 week ago',
    variables: ['First Name', 'Carrier', 'Tracking ID'],
    bodyPattern: 'Hi {{1}}! Good news! Your package is with {{2}} under tracking ID: {{3}}. It is expected to arrive within 3-4 business days.',
    buttons: ['Track Shipment']
  },
  {
    name: 'welcome_discount_20',
    category: 'Marketing',
    status: 'Approved',
    lastUpdated: 'Updated 3 hours ago',
    variables: ['First Name', 'Discount Code'],
    bodyPattern: 'Hello {{1}}! Glad you registered. As a special greeting, use code {{2}} to get 20% off our UI/UX masterclasses code.',
    buttons: ['Apply Discount Now']
  }
];

export const MOCK_AD_ACCOUNT: AdAccount = {
  id: 'act_9482001',
  name: 'ConvoSync Ads Account',
  currency: 'INR',
  status: 'ACTIVE',
  balance: 12400,
  spendCap: 50000,
  timezone: 'Asia/Kolkata',
};

export const MOCK_AD_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'cam_1',
    name: 'UI Design Masterclass — Admissions Q4',
    status: 'ACTIVE',
    objective: 'MESSAGES',
    platform: 'Facebook Feed',
    dailyBudget: 1500,
    startTime: '2024-10-01',
    clicks: 2480,
    conversations: 452,
    conversionMultiplier: 18.2,
    isCTWA: true,
    waConversationsStarted: 452,
    insights: {
      spend: 18420,
      impressions: 124800,
      clicks: 2480,
      cpm: 147.6,
      cpc: 7.43,
      ctr: 1.99,
      reach: 89400,
      frequency: 1.4,
      conversions: 452,
      roas: 3.2,
      dateStart: '2024-10-01',
      dateStop: '2024-10-24',
    },
    previewUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDZHuZym5jSP8mVnBO9WOVqQ0_V8_eYUdIkIkQHliqcxU03sgTlmGHEB7ojqecrutz4WWoc1iB_iZcBUAAqZic12M6dSxShpyPeTRjupd5OzVcPTfuElBQNBzJUL8mRcVgZp5LUrhbgOj50CagpRqjGhVZnM7jmTD_2kqDbcy15FrEYhUm8ih1KQtGpHPVXRv8SlbDpfWR3FKbQL9vSlkfSmGOMId4TyvkEirhmXb9PwgJZAgwVG9xv99Vd4KqyWPa32ekOWor1-ukp',
  },
  {
    id: 'cam_2',
    name: 'Summer Run Collection — IG Story',
    status: 'ACTIVE',
    objective: 'MESSAGES',
    platform: 'Instagram Story',
    dailyBudget: 800,
    startTime: '2024-10-10',
    clicks: 1940,
    conversations: 380,
    conversionMultiplier: 19.6,
    isCTWA: true,
    waConversationsStarted: 380,
    insights: {
      spend: 9840,
      impressions: 82400,
      clicks: 1940,
      cpm: 119.4,
      cpc: 5.07,
      ctr: 2.35,
      reach: 64200,
      frequency: 1.28,
      conversions: 380,
      roas: 4.1,
      dateStart: '2024-10-10',
      dateStop: '2024-10-24',
    },
    previewUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDs1iZKzPwTZg9u06F_JSb0rdDd_fHWRqNMAXZLWeZSivcAdjQrCpgs2YMMR1WprerwJF8zUdqHj-9LqnAdbpVNLQT9VyTLtYWfTVGu85oLtuu1U9Bj34FuQqkFv1v0cdBN3z7vzieXMX56lwwPjZov50zi4E3zK2ZvcYUx7C2AjeRgmJop_eZcydJ-MI44UNuBvXbXhUr6j73hCcJTLI1bEmnrCktI-RToc2FhW5VdU73xi05g0OOq4mOpJ3X7XthX0ehXhNLe58CZ',
  },
  {
    id: 'cam_3',
    name: 'Tech-Wear Promo — Marketplace',
    status: 'PAUSED',
    objective: 'TRAFFIC',
    platform: 'FB Marketplace',
    dailyBudget: 500,
    startTime: '2024-09-15',
    clicks: 854,
    conversations: 92,
    conversionMultiplier: 10.8,
    isCTWA: false,
    insights: {
      spend: 4280,
      impressions: 38200,
      clicks: 854,
      cpm: 112.0,
      cpc: 5.01,
      ctr: 2.24,
      reach: 29800,
      frequency: 1.28,
      dateStart: '2024-09-15',
      dateStop: '2024-10-01',
    },
    previewUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAosCxxNFKCoe9MS3wP9wAOH79TYbrfVlnbP6wIEaI-jjsVy1n-cBD6asP0Wsqu5nfKD6HA1elhgF6yoapGoeN7Kck3E5euBa_h-hghtR4DOcMlMdBKrdcApzJIL1Q5Kp7cshLv4WpXnGQ4PgK4jr3licg8RGTBgJeGSt7XlTIkaP4swGRv5IAfZrX0yfDd1BgmjuVCx5dl0-bU8jhvwmrX5AnS3sqeBBS_0d7bYMPQFNE0TxYksy-8Tr9GKJdGo_cQVUDpBIPRDPaK',
  },
];

export const MOCK_AI_BOTS: AgentBot[] = [
  {
    id: 'bot_1',
    name: 'Aarav AI',
    category: 'responsive',
    role: 'Lead Acquisition',
    description: 'Qualifies inbound leads and books portfolio consultation demos.',
    welcomeMessageEnabled: false,
    intentFallback: 'silent',
    conversationCloseWaitMins: 10,
    conversationsCount: 1248,
    escalatedCount: 42,
    flowsCount: 1,
    isEnabled: true,
    lastActive: 'Active 2m ago'
  },
  {
    id: 'bot_2',
    name: 'Ishani Bot',
    category: 'ai_agent',
    role: 'Order Support',
    description: 'Provides billing status updates and resolves course syllabus requests.',
    welcomeMessageEnabled: true,
    intentFallback: 'automated_response',
    conversationCloseWaitMins: 5,
    conversationsCount: 3812,
    escalatedCount: 156,
    flowsCount: 2,
    isEnabled: true,
    lastActive: 'Active 15m ago'
  },
  {
    id: 'bot_3',
    name: 'Vihaan AI',
    category: 'rule_based',
    role: 'Collections',
    description: 'Manages EMI reminders, subscription installments, and automated payment receipts.',
    welcomeMessageEnabled: false,
    intentFallback: 'transfer_human',
    conversationCloseWaitMins: 10,
    conversationsCount: 0,
    escalatedCount: 0,
    flowsCount: 1,
    isEnabled: false,
    lastActive: 'Currently Paused'
  }
];

export const QUICK_CAMPAIGNS: QuickCampaign[] = [
  {
    id: 'qc_1',
    name: 'Diwali Special Offer',
    status: 'Running',
    channel: 'whatsapp',
    date: '08/06/2026',
    sentCount: 4500,
    deliveredCount: 4200,
    audienceCount: 'To 4,500 contacts',
    engagementMetric: '82% open rate',
  },
  {
    id: 'qc_2',
    name: 'Cart Abandonment - High Value',
    status: 'Active',
    channel: 'email',
    date: '07/06/2026',
    sentCount: 124,
    deliveredCount: 118,
    audienceCount: 'Trigger-based',
    engagementMetric: '124 triggers today',
  },
  {
    id: 'qc_3',
    name: 'Welcome Series - New Users',
    status: 'Draft',
    channel: 'email',
    date: '06/06/2026',
    sentCount: 0,
    deliveredCount: 0,
    audienceCount: 'Last edited 2h ago',
    engagementMetric: 'N/A',
  },
  {
    id: 'qc_4',
    name: 'Monthly Newsletter - Oct',
    status: 'Completed',
    channel: 'email',
    date: '20/10/2025',
    sentCount: 8240,
    deliveredCount: 8100,
    audienceCount: 'Sent to 8,240 contacts',
    engagementMetric: 'Oct 20',
  },
];

// ─── Facebook Page Types ───────────────────────────────

export interface FacebookPage {
  id: string;
  name: string;
  category: string;
  picture: string;
  accessToken: string;
  followersCount: number;
  isConnected: boolean;
}

export interface FacebookPost {
  id: string;
  message: string;
  fullPicture?: string;
  createdTime: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  reach?: number;
  permalink: string;
}

export interface FacebookComment {
  id: string;
  from: { name: string; picture?: string };
  message: string;
  createdTime: string;
  likeCount: number;
  canHide: boolean;
  canDelete: boolean;
  replies?: FacebookComment[];
}

export interface PageInsights {
  pageFans: number;
  pageFansDelta: number;
  pageImpressions: number;
  pageEngagedUsers: number;
  pagePostEngagements: number;
  pageViews: number;
}

export interface PageInsightsDailyPoint {
  date: string;
  label: string;
  reach: number;
  engagedUsers: number;
  postEngagements: number;
  pageViews: number;
  newFollowers: number;
}

export const MOCK_FACEBOOK_PAGE: FacebookPage = {
  id: '123456789',
  name: 'ConvoSync Official',
  category: 'Software Company',
  picture: '',
  accessToken: 'mock_token',
  followersCount: 4820,
  isConnected: true,
};

export const MOCK_FACEBOOK_POSTS: FacebookPost[] = [
  {
    id: 'post_1',
    message: '🚀 Excited to announce ConvoSync v2.0! Now with AI agents that handle 89% of customer queries automatically across WhatsApp, Instagram, and Telegram. Try it free today!',
    fullPicture: '',
    createdTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likesCount: 124,
    commentsCount: 38,
    sharesCount: 22,
    reach: 4200,
    permalink: '#',
  },
  {
    id: 'post_2',
    message: '💡 Did you know? Businesses using WhatsApp campaigns see 68% open rates vs 20% for email. ConvoSync makes it dead simple to run WhatsApp broadcasts to thousands of customers.',
    createdTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    likesCount: 89,
    commentsCount: 14,
    sharesCount: 31,
    reach: 3100,
    permalink: '#',
  },
  {
    id: 'post_3',
    message: '📊 Customer spotlight: ExamPilot EdTech reduced their support load by 70% using ConvoSync AI agents. Their admission enquiry bot now handles 800+ student queries daily — automatically.',
    createdTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    likesCount: 203,
    commentsCount: 47,
    sharesCount: 68,
    reach: 8900,
    permalink: '#',
  },
];

export const MOCK_FACEBOOK_COMMENTS: Record<string, FacebookComment[]> = {
  post_1: [
    {
      id: 'c1',
      from: { name: 'Rahul Sharma' },
      message: 'This is exactly what our team needed! How does the AI agent handle Hindi queries?',
      createdTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      likeCount: 3,
      canHide: true,
      canDelete: true,
    },
    {
      id: 'c2',
      from: { name: 'Priya Mehta' },
      message: 'We have been using ConvoSync for 3 months. The journey builder is incredible!',
      createdTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      likeCount: 7,
      canHide: true,
      canDelete: true,
    },
    {
      id: 'c3',
      from: { name: 'Spam Account' },
      message: 'CLICK HERE TO WIN FREE IPHONE!!!',
      createdTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      likeCount: 0,
      canHide: true,
      canDelete: true,
    },
  ],
  post_2: [
    {
      id: 'c4',
      from: { name: 'Anjali Singh' },
      message: 'Can we schedule WhatsApp campaigns in advance?',
      createdTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      likeCount: 1,
      canHide: true,
      canDelete: true,
    },
  ],
  post_3: [],
};

export const MOCK_PAGE_INSIGHTS: PageInsights = {
  pageFans: 4820,
  pageFansDelta: 124,
  pageImpressions: 28400,
  pageEngagedUsers: 3200,
  pagePostEngagements: 1840,
  pageViews: 6700,
};

// ─── Campaign Channel Types ─────────────────────────────

export type CampaignChannel = 'whatsapp' | 'email' | 'instagram';

export interface ChannelConfig {
  id: CampaignChannel;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  limit: string;
  available: boolean;
}

export const CAMPAIGN_CHANNELS: ChannelConfig[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'whatsapp',
    color: '#25D366',
    bgColor: '#E1F5EE',
    borderColor: '#A8E6CF',
    description: 'Send approved template messages to your WhatsApp contacts.',
    limit: '68% avg open rate',
    available: true,
  },
  {
    id: 'email',
    name: 'Email',
    icon: 'mail',
    color: '#064e3b',
    bgColor: '#e8f0ec',
    borderColor: '#a7c4b8',
    description: 'Send rich HTML email campaigns with subject lines and custom content.',
    limit: 'Unlimited volume',
    available: true,
  },
  {
    id: 'instagram',
    name: 'Instagram DM',
    icon: 'instagram',
    color: '#E1306C',
    bgColor: '#FDF0F7',
    borderColor: '#F5A7C7',
    description: 'Send direct messages to Instagram followers who have messaged you.',
    limit: '1,000 char limit',
    available: false,
  },
];

/** Channels shown in the new-campaign channel picker. */
export const SELECTABLE_CAMPAIGN_CHANNELS = CAMPAIGN_CHANNELS.filter((ch) => ch.available);

export interface EmailCampaignConfig {
  subject: string;
  previewText: string;
  senderName: string;
  senderEmail: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
}

export const DEFAULT_EMAIL_CONFIG: EmailCampaignConfig = {
  subject: '🎉 Special offer just for you!',
  previewText: 'Open to see your exclusive deal inside',
  senderName: 'ConvoSync Team',
  senderEmail: 'hello@convosync.io',
  body: `Hi {{first_name}},

We have an exciting update for you!

Our latest product is now available and we think you'll love it. As one of our valued customers, we're giving you early access.

Click the button below to learn more.

Best regards,
The ConvoSync Team`,
  ctaText: 'View Offer →',
  ctaUrl: 'https://convosync.io',
};

export interface InstagramCampaignConfig {
  message: string;
}

export const DEFAULT_INSTIGRAM_CONFIG: InstagramCampaignConfig = {
  message:
    'Hi {{first_name}}! 👋 Thanks for following us. We have something special for you — check out our latest collection! Reply to this message to learn more. 🛍️',
};
