import { Ban, CheckCircle2, Clock, FileText, PlayCircle, XCircle } from 'lucide-react'
import type { CampaignStatus } from '@/services/realCampaigns.service'

export const CAMPAIGN_STATUS_ICON: Record<CampaignStatus, React.ComponentType<{ className?: string }>> = {
  draft: FileText,
  scheduled: Clock,
  running: PlayCircle,
  completed: CheckCircle2,
  cancelled: Ban,
  failed: XCircle,
}

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  running: 'Running',
  completed: 'Completed',
  cancelled: 'Cancelled',
  failed: 'Failed',
}

export function badgeVariantForStatus(
  status: CampaignStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'running':
    case 'scheduled':
      return 'default'
    case 'completed':
      return 'secondary'
    case 'failed':
      return 'destructive'
    default:
      return 'outline'
  }
}
