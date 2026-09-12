import type {
  AgentActionType,
  AgentCategory,
  FallbackLanguage,
  KnowledgeType,
  ToneOfVoice,
} from '@/services/realAgents.service'

export const CATEGORY_LABELS: Record<AgentCategory, string> = {
  ai_agent: 'AI Agent',
  responsive: 'Responsive AI Agent',
  rule_based: 'Rule-based Agent',
}

export const TONE_LABELS: Record<ToneOfVoice, string> = {
  professional: 'Professional',
  humorous: 'Humorous',
  casual: 'Casual',
  friendly: 'Friendly',
}

export const LANGUAGE_LABELS: Record<FallbackLanguage, string> = {
  english: 'English',
  hindi: 'Hindi',
  hinglish: 'Hinglish',
  spanish: 'Spanish',
  arabic: 'Arabic',
  french: 'French',
}

export const ACTION_LABELS: Record<AgentActionType, string> = {
  close_conversations: 'Close conversations',
  escalate_to_human: 'Escalate to human agents',
  add_contact_tags: 'Add contact tags',
  update_contact_attributes: 'Update contact attributes',
}

export const KNOWLEDGE_TYPE_LABELS: Record<KnowledgeType, string> = {
  document: 'Document',
  online_data: 'Online data',
  qna: 'Q&A',
  attachment: 'Attachment',
}
