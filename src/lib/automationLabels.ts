import type { AutomationChannel } from '@/services/realAutomations.service'

export function triggerLabel(channel: AutomationChannel, event?: string | null): string {
  if (!event) return 'No trigger'
  if (channel === 'instagram') {
    const events = event.split(',').map((s) => s.trim()).filter(Boolean)
    const hasDm = events.includes('dm.received')
    const hasComment = events.includes('comment.received')
    if (hasDm && hasComment) return 'DM + Comment'
    if (hasComment) return 'Comment'
    if (hasDm) return 'DM'
    return 'Trigger'
  }
  if (event === 'contact.created') return 'Welcome'
  if (event === 'contact.tag_added') return 'Tag added'
  if (event === 'message.received') return 'Keyword / message'
  if (event === 'conversation.opened') return 'Conversation'
  if (event === 'manual') return 'Manual'
  return event
    .split(',')[0]
    .split(/[._]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
