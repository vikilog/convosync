import { Ban, CheckCheck, Clock, PauseCircle, XCircle } from 'lucide-react'
import type { TemplateStatus } from '@/lib/templatesMockData'
import type { TemplateStatus as RealTemplateStatus } from '@/services/realTemplates.service'

export const TEMPLATE_STATUS_ICON: Record<TemplateStatus, React.ComponentType<{ className?: string }>> = {
  Draft: Clock,
  Pending: Clock,
  Approved: CheckCheck,
  Rejected: XCircle,
  Paused: PauseCircle,
}

export function templateStatusBadgeVariant(
  status: TemplateStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'Approved':
      return 'default'
    case 'Pending':
      return 'secondary'
    case 'Rejected':
      return 'destructive'
    default:
      return 'outline'
  }
}

export const REAL_TEMPLATE_STATUS_ICON: Record<
  RealTemplateStatus,
  React.ComponentType<{ className?: string }>
> = {
  draft: Clock,
  pending: Clock,
  approved: CheckCheck,
  rejected: XCircle,
  paused: PauseCircle,
  disabled: Ban,
}

export function realTemplateStatusBadgeVariant(
  status: RealTemplateStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'approved':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'rejected':
    case 'disabled':
      return 'destructive'
    default:
      return 'outline'
  }
}
