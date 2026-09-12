import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { CampaignChannel, CampaignRecipient, CampaignStatus } from '@/services/realCampaigns.service'

const FAILED_STATUSES = new Set(['failed', 'bounced', 'rejected'])

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function destOf(row: CampaignRecipient, channel: CampaignChannel): string {
  if (channel === 'email') return row.email ?? '—'
  if (channel === 'instagram') return row.phone.startsWith('ig:') ? row.phone.slice(3) : row.phone
  return row.phone
}

export function CampaignRecipientsTable({
  channel,
  recipients,
  sentCount,
  status,
  showActions,
  resendingId,
  onResend,
}: {
  channel: CampaignChannel
  recipients: CampaignRecipient[]
  sentCount: number
  status: CampaignStatus
  showActions?: boolean
  resendingId?: string | null
  onResend?: (messageId: string) => void
}) {
  if (recipients.length === 0) {
    return (
      <div className="text-muted-foreground p-8 text-center text-sm">
        {status === 'draft' || status === 'scheduled'
          ? status === 'scheduled'
            ? 'This campaign is scheduled. Delivery logs appear after it runs.'
            : 'This campaign has not been sent.'
          : 'No delivery logs yet. Try refresh if you just sent.'}
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead>{channel === 'email' ? 'Email' : channel === 'instagram' ? 'Instagram' : 'Phone'}</TableHead>
            {channel === 'email' ? <TableHead>Subject</TableHead> : null}
            <TableHead>Status</TableHead>
            <TableHead>Sent at</TableHead>
            <TableHead>Delivered at</TableHead>
            <TableHead>Read at</TableHead>
            {showActions ? <TableHead>Action</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipients.map((row) => {
            const canResend = FAILED_STATUSES.has(row.status.toLowerCase())
            return (
              <TableRow key={row.messageId}>
                <TableCell className="font-medium">{row.contactName}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">{destOf(row, channel)}</TableCell>
                {channel === 'email' ? (
                  <TableCell className="text-muted-foreground text-xs">{row.content || '—'}</TableCell>
                ) : null}
                <TableCell>
                  <span className="text-xs capitalize">{row.status.replace('_', ' ')}</span>
                  {row.errorMessage ? (
                    <p className="text-destructive mt-1 truncate text-xs" title={row.errorMessage}>
                      {row.errorMessage}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{formatDate(row.sentAt)}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{formatDate(row.deliveredAt)}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{formatDate(row.readAt)}</TableCell>
                {showActions ? (
                  <TableCell>
                    {canResend && onResend ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={resendingId === row.messageId}
                        onClick={() => onResend(row.messageId)}
                      >
                        {resendingId === row.messageId ? <Loader2 className="size-3.5 animate-spin" /> : null}
                        Resend
                      </Button>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                ) : null}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {recipients.length < sentCount && sentCount > 0 ? (
        <p className="text-muted-foreground border-t px-4 py-2 text-xs">
          Showing {recipients.length} of {sentCount} sent
        </p>
      ) : null}
    </div>
  )
}

export { FAILED_STATUSES }
