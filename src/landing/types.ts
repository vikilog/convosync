/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ChannelType = 'whatsapp' | 'instagram' | 'messenger' | 'telegram' | 'email' | 'livechat';

export interface Message {
  id: string;
  sender: 'customer' | 'agent' | 'ai';
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read' | 'replied';
}

export interface Conversation {
  id: string;
  customerName: string;
  customerAvatar?: string;
  channel: ChannelType;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  assignedTo: 'unassigned' | 'agent' | 'ai';
  messages: Message[];
  status: 'active' | 'resolved' | 'snoozed';
  metadataComments?: string;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  channel: ChannelType;
  status: 'approved' | 'pending' | 'rejected';
  bodyText: string;
  category: string;
}

export interface Campaign {
  id: string;
  name: string;
  templateId: string;
  targetAudience: string;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  repliedCount: number;
  status: 'draft' | 'scheduled' | 'sending' | 'completed';
  scheduledTime?: string;
}

export interface JourneyNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'agent';
  title: string;
  description: string;
  colorType: 'purple' | 'blue' | 'orange' | 'teal';
  nextNodes?: string[];
}

export interface AiAgentConfig {
  id: string;
  name: string;
  role: 'Lead Capture' | 'Customer Service' | 'Shop Assistant' | 'Custom';
  icon: string;
  accentColor: string;
  isActive: boolean;
  kbDocs: string[];
  description: string;
  stats: {
    resolutionRate: string;
    chatsHandled: string;
    satisfaction: string;
  };
  sampleQuestions: string[];
  systemPrompt: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  location: string;
  avatarUrl?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  description: string;
  features: string[];
  /** Short trust / value lines shown beside the feature list */
  proPoints?: string[];
  ctaText: string;
  isPopular?: boolean;
}

export interface UseCase {
  id: string;
  title: string;
  description: string;
  metrics: string;
  subFeatures: string;
  imageAlt: string;
}
