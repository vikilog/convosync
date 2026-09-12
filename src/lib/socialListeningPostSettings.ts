export type IntentMode = 'auto' | 'review' | 'off'
export type ComplaintMode = 'review' | 'escalate_only'
export type SpamMode = 'auto_ignore' | 'review'
export type PublicReplyTone = 'friendly' | 'professional' | 'playful'
export type LeadCreationRule = 'interested_only' | 'interested_and_questions' | 'never'

export type PostAgentSettings = {
  autoResponseEnabled: boolean
  leadFunnelId: string | null
  interestedMode: IntentMode
  questionMode: IntentMode
  complaintMode: ComplaintMode
  spamMode: SpamMode
  confidenceThreshold: number
  publicReplyTone: PublicReplyTone
  dmAgentSkillId: string | null
  fallbackMessage: string | null
  leadCreationRule: LeadCreationRule
  maxAutoDmsPerDay: number
  workingHoursOnly: boolean
  workingHoursStart: string | null
  workingHoursEnd: string | null
  autoDmsSentToday: number
}

export type DmSkillOption = { id: string; title: string; agentId: string; agentName: string }

export const POST_AGENT_DEFAULTS: PostAgentSettings = {
  autoResponseEnabled: false,
  leadFunnelId: null,
  interestedMode: 'review',
  questionMode: 'review',
  complaintMode: 'review',
  spamMode: 'review',
  confidenceThreshold: 80,
  publicReplyTone: 'friendly',
  dmAgentSkillId: null,
  fallbackMessage: null,
  leadCreationRule: 'interested_only',
  maxAutoDmsPerDay: 50,
  workingHoursOnly: false,
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  autoDmsSentToday: 0,
}

function asMode<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

export function mapPostAgentSettings(raw: Record<string, unknown>): PostAgentSettings {
  return {
    autoResponseEnabled: Boolean(raw.autoResponseEnabled),
    leadFunnelId: (raw.leadFunnelId as string | null) ?? null,
    interestedMode: asMode(raw.interestedMode, ['auto', 'review', 'off'] as const, 'review'),
    questionMode: asMode(raw.questionMode, ['auto', 'review', 'off'] as const, 'review'),
    complaintMode: asMode(raw.complaintMode, ['review', 'escalate_only'] as const, 'review'),
    spamMode: asMode(raw.spamMode, ['auto_ignore', 'review'] as const, 'review'),
    confidenceThreshold: Number(raw.confidenceThreshold ?? 80),
    publicReplyTone: asMode(raw.publicReplyTone, ['friendly', 'professional', 'playful'] as const, 'friendly'),
    dmAgentSkillId: (raw.dmAgentSkillId as string | null) ?? null,
    fallbackMessage: (raw.fallbackMessage as string | null) ?? null,
    leadCreationRule: asMode(
      raw.leadCreationRule,
      ['interested_only', 'interested_and_questions', 'never'] as const,
      'interested_only',
    ),
    maxAutoDmsPerDay: Number(raw.maxAutoDmsPerDay ?? 50),
    workingHoursOnly: Boolean(raw.workingHoursOnly),
    workingHoursStart: (raw.workingHoursStart as string | null) || '09:00',
    workingHoursEnd: (raw.workingHoursEnd as string | null) || '18:00',
    autoDmsSentToday: Number(raw.autoDmsSentToday ?? 0),
  }
}

export function postAgentSettingsPayload(
  draft: PostAgentSettings,
  commentAutomationJourneyId: string,
): Record<string, unknown> {
  return {
    autoResponseEnabled: draft.autoResponseEnabled,
    leadFunnelId: draft.leadFunnelId,
    interestedMode: draft.interestedMode,
    questionMode: draft.questionMode,
    complaintMode: draft.complaintMode,
    spamMode: draft.spamMode,
    confidenceThreshold: draft.confidenceThreshold,
    publicReplyTone: draft.publicReplyTone,
    dmAgentSkillId: draft.dmAgentSkillId || null,
    fallbackMessage: draft.fallbackMessage?.trim() || null,
    leadCreationRule: draft.leadCreationRule,
    maxAutoDmsPerDay: draft.maxAutoDmsPerDay,
    workingHoursOnly: draft.workingHoursOnly,
    workingHoursStart: draft.workingHoursOnly ? draft.workingHoursStart : null,
    workingHoursEnd: draft.workingHoursOnly ? draft.workingHoursEnd : null,
    commentAutomationJourneyId: commentAutomationJourneyId || null,
  }
}
