import { useMemo, useState } from 'react'
import { ArrowLeft, Loader2, Pencil, RefreshCw, RotateCcw, X } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { CampaignAnalytics } from '@/components/campaigns/CampaignAnalytics'
import { FAILED_STATUSES, CampaignRecipientsTable } from '@/components/campaigns/CampaignRecipientsTable'
import { badgeVariantForStatus, CAMPAIGN_STATUS_LABEL } from '@/components/campaigns/campaign-status'
import { CHANNEL_LABEL, ChannelIcon } from '@/components/channel-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  isFailedCampaignRelaunchable,
  isScheduledCampaignEditable,
  SCHEDULED_CAMPAIGN_EDIT_BLOCKED_HINT,
} from '@/lib/campaignScheduleEdit'
import { realCampaignsService } from '@/services/realCampaigns.service'

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function CampaignDetailView({
  campaignId,
  onBack,
  onEdit,
}: {
  campaignId: string
  onBack?: () => void
  onEdit?: (id: string) => void
}) {
  const { data, isLoading, error, refetch, isFetching } = realCampaignsService.useGet(campaignId)
  const resendFailed = realCampaignsService.useResendFailed()
  const resendOne = realCampaignsService.useResendRecipient()
  const [showFailedOnly, setShowFailedOnly] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const campaign = data?.campaign
  const failedRecipients = useMemo(
    () => (data?.recipients ?? []).filter((r) => FAILED_STATUSES.has(r.status.toLowerCase())),
    [data?.recipients]
  )

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  if (error || !data || !campaign) {
    return (
      <div className="space-y-3 p-4">
        {onBack ? (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft /> Back
          </Button>
        ) : null}
        <p className="text-destructive text-sm">{error instanceof Error ? error.message : 'Campaign not found'}</p>
      </div>
    )
  }

  const insights = data.insights
  const canEdit = isScheduledCampaignEditable(campaign.status, campaign.scheduledAt)
  const canRelaunch = isFailedCampaignRelaunchable(campaign.status)
  const isEmail = data.channel === 'email'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            {onBack ? (
              <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back to campaigns">
                <ArrowLeft />
              </Button>
            ) : null}
            <ChannelIcon channel={data.channel} className="size-4" />
            <h2 className="truncate text-base font-medium">{campaign.name}</h2>
            <Badge variant={badgeVariantForStatus(campaign.status)}>{CAMPAIGN_STATUS_LABEL[campaign.status]}</Badge>
            <Badge variant="outline">{CHANNEL_LABEL[data.channel]}</Badge>
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span>Recipients {insights.totalRecipients.toLocaleString()}</span>
            <span>Sent {insights.sent.toLocaleString()}</span>
            <span>
              Delivered {insights.delivered.toLocaleString()}
              {insights.deliveryRate > 0 ? ` (${insights.deliveryRate}%)` : ''}
            </span>
            <span>
              {isEmail ? 'Opened' : 'Read'} {insights.read.toLocaleString()}
              {isEmail && insights.readRate > 0 ? ` (${insights.readRate}%)` : ''}
            </span>
            {insights.failed > 0 ? (
              <button type="button" className="text-destructive underline" onClick={() => setShowFailedOnly(true)}>
                Failed {insights.failed.toLocaleString()}
              </button>
            ) : (
              <span>Failed 0</span>
            )}
            {insights.successRate != null || data.analytics ? (
              <span>Success {(data.analytics?.successRate ?? insights.successRate ?? 0).toLocaleString()}%</span>
            ) : null}
          </div>
          {actionError ? <p className="text-destructive text-xs">{actionError}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {canEdit && onEdit ? (
            <Button size="sm" variant="outline" onClick={() => onEdit(campaign.id)}>
              <Pencil /> Edit
            </Button>
          ) : campaign.status === 'scheduled' && !canEdit ? (
            <Button size="sm" variant="outline" disabled title={SCHEDULED_CAMPAIGN_EDIT_BLOCKED_HINT}>
              <Pencil /> Edit
            </Button>
          ) : null}
          {canRelaunch && onEdit ? (
            <Button size="sm" variant="outline" onClick={() => onEdit(campaign.id)}>
              <RotateCcw /> Relaunch
            </Button>
          ) : null}
          <Button size="icon-sm" variant="outline" onClick={() => void refetch()} aria-label="Refresh">
            <RefreshCw className={isFetching ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {data.analytics ? <CampaignAnalytics channel={data.channel} analytics={data.analytics} /> : null}

        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-sm font-medium">Details</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground text-xs">Audience</dt>
              <dd>{data.segmentLabel}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Template</dt>
              <dd>{data.template?.name ?? '—'}</dd>
            </div>
            {isEmail ? (
              <div>
                <dt className="text-muted-foreground text-xs">Subject</dt>
                <dd>{data.template?.subject ?? '—'}</dd>
              </div>
            ) : (
              <div>
                <dt className="text-muted-foreground text-xs">Category</dt>
                <dd>{data.template?.category ?? '—'}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground text-xs">Created</dt>
              <dd>{formatDateTime(campaign.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Scheduled</dt>
              <dd>{campaign.scheduledAt ? formatDateTime(campaign.scheduledAt) : 'Immediate'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Sent</dt>
              <dd>{formatDateTime(campaign.sentAt)}</dd>
            </div>
          </dl>
        </div>

        {data.analytics && data.analytics.deliveryTrend.length > 0 ? (
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 text-sm font-medium">Delivery pace</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.analytics.deliveryTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis
                    dataKey="at"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) =>
                      new Date(v).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                    }
                  />
                  <YAxis tick={{ fontSize: 11 }} width={32} />
                  <Tooltip labelFormatter={(v) => formatDateTime(typeof v === 'string' ? v : undefined)} />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="var(--color-primary)"
                    fill="var(--color-primary)"
                    fillOpacity={0.15}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        <section className="overflow-hidden rounded-lg border">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h3 className="text-sm font-medium">Recipients</h3>
              <p className="text-muted-foreground text-xs">Per-message delivery status</p>
            </div>
            <span className="text-muted-foreground text-xs tabular-nums">
              {data.recipients.length > 0
                ? `${data.recipients.length} logged`
                : `${campaign.sentCount} sent`}
            </span>
          </div>
          <CampaignRecipientsTable
            channel={data.channel}
            recipients={data.recipients}
            sentCount={campaign.sentCount}
            status={campaign.status}
          />
        </section>
      </div>

      {showFailedOnly ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-background flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-medium">Failed recipients ({failedRecipients.length})</h3>
                <p className="text-muted-foreground text-xs">Resend uses the original payload</p>
              </div>
              <div className="flex items-center gap-2">
                {failedRecipients.length > 0 ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={resendFailed.isPending}
                    onClick={() => {
                      setActionError(null)
                      resendFailed.mutate(campaignId, {
                        onError: (err) =>
                          setActionError(err instanceof Error ? err.message : 'Resend all failed'),
                      })
                    }}
                  >
                    {resendFailed.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    Resend All
                  </Button>
                ) : null}
                <Button size="icon-sm" variant="ghost" onClick={() => setShowFailedOnly(false)} aria-label="Close">
                  <X />
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <CampaignRecipientsTable
                channel={data.channel}
                recipients={failedRecipients}
                sentCount={failedRecipients.length}
                status={campaign.status}
                showActions
                resendingId={resendOne.variables?.messageId ?? null}
                onResend={(messageId) => {
                  setActionError(null)
                  resendOne.mutate(
                    { campaignId, messageId },
                    { onError: (err) => setActionError(err instanceof Error ? err.message : 'Resend failed') }
                  )
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
