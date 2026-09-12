import type {
  InboxRule,
  InboxRuleConditions,
  InboxRuleInput,
} from '@/services/realWorkspaceSettings.service'

export const INBOX_RULE_CHANNELS = ['whatsapp', 'instagram', 'messenger'] as const
export type InboxRuleChannel = (typeof INBOX_RULE_CHANNELS)[number]

export const INBOX_RULE_DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
] as const

export type InboxRuleFormState = {
  name: string
  enabled: boolean
  channels: InboxRuleChannel[]
  contactTags: string[]
  businessHoursEnabled: boolean
  days: number[]
  start: string
  end: string
  timezone: string
  actionType: 'group' | 'user'
  actionGroupId: string
  actionUserId: string
}

export function emptyInboxRuleForm(timezone = ''): InboxRuleFormState {
  return {
    name: '',
    enabled: true,
    channels: [],
    contactTags: [],
    businessHoursEnabled: false,
    days: [1, 2, 3, 4, 5],
    start: '09:00',
    end: '18:00',
    timezone,
    actionType: 'group',
    actionGroupId: '',
    actionUserId: '',
  }
}

export function inboxRuleToForm(rule: InboxRule, fallbackTimezone = ''): InboxRuleFormState {
  const channels = (rule.conditions.channels ?? []).filter((c): c is InboxRuleChannel =>
    (INBOX_RULE_CHANNELS as readonly string[]).includes(c)
  )
  return {
    name: rule.name,
    enabled: rule.enabled,
    channels,
    contactTags: rule.conditions.contactTags ?? [],
    businessHoursEnabled: Boolean(rule.conditions.businessHours),
    days: rule.conditions.businessHours?.days ?? [1, 2, 3, 4, 5],
    start: rule.conditions.businessHours?.start ?? '09:00',
    end: rule.conditions.businessHours?.end ?? '18:00',
    timezone: rule.conditions.businessHours?.timezone ?? fallbackTimezone,
    actionType: rule.actionType,
    actionGroupId: rule.actionGroupId ?? '',
    actionUserId: rule.actionUserId ?? '',
  }
}

export function inboxRuleFormToInput(form: InboxRuleFormState): InboxRuleInput | { error: string } {
  if (!form.name.trim()) return { error: 'Rule name is required' }
  if (form.actionType === 'group' && !form.actionGroupId) return { error: 'Select a group for this rule' }
  if (form.actionType === 'user' && !form.actionUserId) return { error: 'Select a team member for this rule' }

  const conditions: InboxRuleConditions = {}
  if (form.channels.length) conditions.channels = form.channels
  if (form.contactTags.length) conditions.contactTags = form.contactTags
  if (form.businessHoursEnabled) {
    conditions.businessHours = {
      days: form.days,
      start: form.start,
      end: form.end,
      ...(form.timezone ? { timezone: form.timezone } : {}),
    }
  }

  return {
    name: form.name.trim(),
    enabled: form.enabled,
    conditions,
    actionType: form.actionType,
    actionGroupId: form.actionType === 'group' ? form.actionGroupId : null,
    actionUserId: form.actionType === 'user' ? form.actionUserId : null,
  }
}

export function inboxRuleSummary(
  rule: InboxRule,
  groups: { id: string; name: string }[],
  members: { userId: string; name: string }[]
): string {
  const parts: string[] = []
  if (rule.conditions.channels?.length) parts.push(rule.conditions.channels.join('/'))
  if (rule.conditions.contactTags?.length) parts.push(`tags: ${rule.conditions.contactTags.join(', ')}`)
  if (rule.conditions.businessHours) {
    const bh = rule.conditions.businessHours
    parts.push(`${bh.start}–${bh.end}${bh.timezone ? ` ${bh.timezone}` : ''}`)
  }
  const conditionText = parts.length ? parts.join(' · ') : 'Any conversation'
  const target =
    rule.actionType === 'group'
      ? (groups.find((g) => g.id === rule.actionGroupId)?.name ?? 'Deleted group')
      : (members.find((m) => m.userId === rule.actionUserId)?.name ?? 'Deleted member')
  return `${conditionText} → ${target}`
}
