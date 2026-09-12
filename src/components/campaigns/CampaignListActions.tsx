import { Ban, MoreHorizontal, Pause, PlayCircle, RotateCcw, Send, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { canDeleteCampaign, canResumeCampaign } from '@/lib/campaignScheduleEdit'
import type { Campaign } from '@/services/realCampaigns.service'

export function CampaignListActions({
  campaign,
  onSend,
  onPause,
  onCancel,
  onResume,
  onRelaunch,
  onResendFailed,
  onDelete,
}: {
  campaign: Campaign
  onSend: () => void
  onPause: () => void
  onCancel: () => void
  onResume: () => void
  onRelaunch: () => void
  onResendFailed: () => void
  onDelete: () => void
}) {
  const deletable = canDeleteCampaign(campaign.status, campaign.scheduledAt)
  const resumable = canResumeCampaign(campaign.status, campaign.scheduledAt)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Campaign actions">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {campaign.status === 'draft' || campaign.status === 'scheduled' ? (
          <DropdownMenuItem onClick={onSend}>
            <Send />
            Send now
          </DropdownMenuItem>
        ) : null}
        {campaign.status === 'scheduled' ? (
          <DropdownMenuItem onClick={onPause}>
            <Pause />
            Pause
          </DropdownMenuItem>
        ) : null}
        {campaign.status === 'running' ? (
          <DropdownMenuItem onClick={onCancel}>
            <Ban />
            Cancel
          </DropdownMenuItem>
        ) : null}
        {campaign.status === 'cancelled' && resumable ? (
          <DropdownMenuItem onClick={onResume}>
            <PlayCircle />
            Resume
          </DropdownMenuItem>
        ) : null}
        {campaign.status === 'failed' ? (
          <>
            <DropdownMenuItem onClick={onRelaunch}>
              <RotateCcw />
              Relaunch
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onResendFailed}>
              <RotateCcw />
              Resend failed
            </DropdownMenuItem>
          </>
        ) : null}
        {deletable ? (
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled>
            <Trash2 />
            {campaign.status === 'running' ? 'Cannot delete while sending' : 'Too close to send time'}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
