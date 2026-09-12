import { Coins } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  audienceCountryFromSegmentIds,
  browserTimeZoneLabel,
  formatZonedOffset,
  formatZonedTime,
} from '@/lib/campaignAudienceTz'
import { formatCc } from '@/lib/campaignCost'
import { minScheduleTimeFor, todayLocal } from '@/lib/campaignScheduleEdit'
import type { CampaignChannel, ReplyHandling } from '@/services/realCampaigns.service'

export function ReviewStep({
  cost,
  audienceCount,
  editingScheduled,
  isScheduled,
  onScheduled,
  scheduledDate,
  scheduledTime,
  onDate,
  onTime,
  segmentIds,
  audienceType,
  channel,
  replyHandling,
  onReply,
  replyJourneyId,
  onJourney,
  replyAgentId,
  onAgent,
  journeys,
  agents,
  templateName,
}: {
  cost: { show: boolean; cc: number; rateLabel: string }
  audienceCount: number
  editingScheduled: boolean
  isScheduled: boolean
  onScheduled: (v: boolean) => void
  scheduledDate: string
  scheduledTime: string
  onDate: (v: string) => void
  onTime: (v: string) => void
  segmentIds: string[]
  audienceType: 'all' | 'segment'
  channel: CampaignChannel
  replyHandling: ReplyHandling
  onReply: (v: ReplyHandling) => void
  replyJourneyId: string | null
  onJourney: (id: string | null) => void
  replyAgentId: string | null
  onAgent: (id: string | null) => void
  journeys: Array<{ id: string; name: string }>
  agents: Array<{ id: string; name: string }>
  templateName?: string
}) {
  const tzHint = audienceCountryFromSegmentIds(audienceType === 'all' ? [] : segmentIds)
  return (
    <>
      {cost.show ? (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Coins className="size-4" />
            <div>
              <p className="text-sm font-medium">Estimated cost</p>
              <p className="text-muted-foreground text-xs">
                {audienceCount.toLocaleString()} contacts · {cost.rateLabel}
              </p>
            </div>
          </div>
          <span className="text-sm font-semibold">{formatCc(cost.cc)}</span>
        </div>
      ) : null}
      <label className="flex items-center justify-between rounded-lg border p-3">
        <span className="text-sm font-medium">Schedule for later</span>
        <Checkbox
          checked={isScheduled || editingScheduled}
          disabled={editingScheduled}
          onCheckedChange={(v) => onScheduled(v === true)}
        />
      </label>
      {isScheduled || editingScheduled ? (
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={scheduledDate} min={todayLocal()} onChange={(e) => onDate(e.target.value)} />
          <Input
            type="time"
            value={scheduledTime}
            min={minScheduleTimeFor(scheduledDate)}
            onChange={(e) => onTime(e.target.value)}
          />
          <p className="text-muted-foreground col-span-2 text-xs">
            Times shown in your browser timezone
            {browserTimeZoneLabel() ? ` (${browserTimeZoneLabel()})` : ''}.
          </p>
          {tzHint ? (
            <p className="text-muted-foreground col-span-2 text-xs">
              Audience timezone: {tzHint.name} ({formatZonedOffset(tzHint.tz)}). Current time there:{' '}
              {formatZonedTime(new Date(), tzHint.tz)}
            </p>
          ) : null}
        </div>
      ) : null}
      {channel !== 'email' ? (
        <div className="space-y-2 rounded-lg border p-3">
          <p className="text-sm font-medium">When they reply</p>
          <div className="grid grid-cols-3 gap-2">
            {(['default', 'journey', 'ai_agent'] as const).map((id) => (
              <Button
                key={id}
                size="sm"
                variant={replyHandling === id ? 'default' : 'outline'}
                onClick={() => onReply(id)}
              >
                {id === 'default' ? 'Default' : id === 'journey' ? 'Automation' : 'AI agent'}
              </Button>
            ))}
          </div>
          {replyHandling === 'journey' && replyJourneyId ? (
            <Select value={replyJourneyId} onValueChange={(v) => onJourney(v || null)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an automation…" />
              </SelectTrigger>
              <SelectContent>
                {journeys.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {replyHandling === 'journey' && !replyJourneyId ? (
            <Select onValueChange={(v) => onJourney(v || null)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an automation…" />
              </SelectTrigger>
              <SelectContent>
                {journeys.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {replyHandling === 'ai_agent' && replyAgentId ? (
            <Select value={replyAgentId} onValueChange={(v) => onAgent(v || null)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an agent…" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {replyHandling === 'ai_agent' && !replyAgentId ? (
            <Select onValueChange={(v) => onAgent(v || null)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an agent…" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      ) : null}
      <div className="space-y-1 rounded-lg border p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Audience</span>
          <span>{audienceCount.toLocaleString()} contacts</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Template</span>
          <span>{templateName ?? '—'}</span>
        </div>
      </div>
    </>
  )
}
