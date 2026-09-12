import { AlertTriangle, Check, Eye } from 'lucide-react'

import { LOW_CONFIDENCE_THRESHOLD, triageSectionFor, type IntentLabel, type TriageSection } from '@/lib/socialListening'

export type TriageTheme = {
  label: string
  border: string
  bg: string
  text: string
  dot: string
  actionLabel: string
  actionIcon: React.ComponentType<{ className?: string }>
}

export const TRIAGE_THEME: Record<TriageSection, TriageTheme> = {
  complaints: {
    label: 'Complaints',
    border: 'border-l-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    text: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500',
    actionLabel: 'Escalate to Support',
    actionIcon: AlertTriangle,
  },
  sales: {
    label: 'Sales Interest',
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    actionLabel: 'Approve & Send DM',
    actionIcon: Check,
  },
  questions: {
    label: 'Questions',
    border: 'border-l-sky-500',
    bg: 'bg-sky-50 dark:bg-sky-950/20',
    text: 'text-sky-700 dark:text-sky-400',
    dot: 'bg-sky-500',
    actionLabel: 'Approve & Reply',
    actionIcon: Check,
  },
  low_confidence: {
    label: 'Low Confidence / Unclear',
    border: 'border-l-slate-400',
    bg: 'bg-muted/50',
    text: 'text-muted-foreground',
    dot: 'bg-slate-400',
    actionLabel: 'Review',
    actionIcon: Eye,
  },
}

export type PrimaryActionKind = 'approve_dm' | 'approve_reply' | 'escalate' | 'review'

export function primaryActionFor(section: TriageSection): { kind: PrimaryActionKind; label: string } {
  switch (section) {
    case 'sales':
      return { kind: 'approve_dm', label: TRIAGE_THEME.sales.actionLabel }
    case 'questions':
      return { kind: 'approve_reply', label: TRIAGE_THEME.questions.actionLabel }
    case 'complaints':
      return { kind: 'escalate', label: TRIAGE_THEME.complaints.actionLabel }
    case 'low_confidence':
      return { kind: 'review', label: TRIAGE_THEME.low_confidence.actionLabel }
  }
}

export function primaryActionForComment(input: {
  intentLabel: IntentLabel | null
  confidence: number | null
  classificationStatus: string | null
  status: string | null
}): { kind: PrimaryActionKind | 'ignore_only'; label: string } | null {
  if (input.status && input.status !== 'new') return null
  if (input.classificationStatus !== 'classified' || !input.intentLabel) return null
  const section = triageSectionFor(input.intentLabel, input.confidence ?? 0)
  if (section === 'low_confidence' && (input.intentLabel === 'Spam' || input.intentLabel === 'Neutral')) {
    return { kind: 'ignore_only', label: 'Ignore' }
  }
  if (
    section === 'low_confidence' &&
    input.confidence != null &&
    input.confidence < LOW_CONFIDENCE_THRESHOLD
  ) {
    return primaryActionFor(section)
  }
  return primaryActionFor(section)
}
