export type AgentType = 'ai_agent' | 'responsive' | 'rule_based';

export type ToneOfVoice = 'professional' | 'humorous' | 'casual' | 'friendly';

export type FallbackLanguage =
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

/** @deprecated Use AgentActionType */
export type AgentAction = AgentActionType;

export interface AgentActionConfig {
  type: AgentActionType;
  enabled: boolean;
  instruction: string;
}

export type SkillStatus = 'draft' | 'live';

export type KnowledgeType = 'document' | 'online_data' | 'qna' | 'attachment';

export type KnowledgeStatus = 'processing' | 'ready' | 'failed';

export interface AgentProfileData {
  id: string;
  name: string;
  description: string;
  category: AgentType;
  isEnabled: boolean;
  isPublished: boolean;
  publishedAt?: string | null;
  avatarUrl?: string | null;
  toneOfVoice: ToneOfVoice;
  fallbackLanguage: FallbackLanguage;
  instructions: string;
  brandBackground: string;
  actions: AgentActionConfig[];
}

export interface AgentSkill {
  id: string;
  agentId: string;
  title: string;
  trigger: string;
  instructions: string;
  status: SkillStatus;
  createdAt: string;
}

export interface KnowledgeItem {
  id: string;
  agentId: string;
  type: KnowledgeType;
  title: string;
  content?: string | null;
  url?: string | null;
  fileUrl?: string | null;
  status: KnowledgeStatus;
  createdAt: string;
}

export const TONE_LABELS: Record<ToneOfVoice, string> = {
  professional: 'Professional',
  humorous: 'Humorous',
  casual: 'Casual',
  friendly: 'Friendly',
};

export const LANGUAGE_LABELS: Record<FallbackLanguage, string> = {
  english: 'English',
  hindi: 'Hindi',
  hinglish: 'Hinglish',
  spanish: 'Spanish',
  arabic: 'Arabic',
  french: 'French',
};

export const CATEGORY_LABELS: Record<AgentType, string> = {
  ai_agent: 'AI Agent',
  responsive: 'Responsive AI Agent',
  rule_based: 'Rule-based Agent',
};
