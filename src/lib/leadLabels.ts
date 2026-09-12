import type { LeadSource } from '@/services/realLeads.service'

export const SOURCE_LABEL: Record<LeadSource, string> = {
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  manual: 'Manual',
  facebook: 'Facebook',
}

export const SOURCE_BADGE: Record<LeadSource, { label: string; className: string }> = {
  instagram: { label: 'IG', className: 'bg-[#fce8f0] text-[#C13584] border-transparent' },
  whatsapp: { label: 'WA', className: 'bg-emerald-50 text-emerald-700 border-transparent' },
  manual: { label: 'Manual', className: '' },
  facebook: { label: 'FB', className: 'bg-blue-50 text-blue-700 border-transparent' },
}

export function timeAgo(iso: string, nowMs: number = Date.now()): string {
  const diff = Math.max(0, nowMs - new Date(iso).getTime())
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
