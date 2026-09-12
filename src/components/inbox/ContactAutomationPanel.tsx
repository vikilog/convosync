import { useEffect, useState } from 'react'
import { Check, ChevronDown, Loader2, PauseCircle, RotateCcw, Route, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  realAutomationsService,
  type AutomationChannel,
  type ContactJourneyProgress,
  type JourneyProgressStep,
} from '@/services/realAutomations.service'

const STATUS_BADGE: Record<string, { label: string; className: string; pulse?: boolean }> = {
  running: { label: 'Running', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', pulse: true },
  waiting: { label: 'Waiting', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed: { label: 'Done', className: 'bg-sky-50 text-sky-600 border-sky-100' },
  failed: { label: 'Failed', className: 'bg-red-50 text-destructive border-red-200' },
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Resuming soon…'
  const totalSec = Math.ceil(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  if (days > 0) return `${days}d ${hours}h ${minutes}m left`
  if (hours > 0) return `${hours}h ${minutes}m left`
  if (minutes > 0) return `${minutes}m ${seconds}s left`
  return `${seconds}s left`
}

function WaitRemaining({ waitUntil }: { waitUntil: string }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(waitUntil).getTime() - Date.now()))
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, new Date(waitUntil).getTime() - Date.now()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [waitUntil])
  return (
    <span className="mt-1 inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-amber-800">
      <PauseCircle className="size-3 shrink-0" />
      {formatRemaining(remaining)}
    </span>
  )
}

function StatusBadgePill({ status, paused }: { status: string; paused?: boolean }) {
  const badge = paused
    ? { label: 'Paused', className: 'bg-muted text-muted-foreground border-border', pulse: false }
    : (STATUS_BADGE[status] ?? { label: status, className: 'bg-muted text-muted-foreground border-transparent' })
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${badge.className}`}
    >
      {badge.pulse ? (
        <span className="size-1.5 animate-pulse rounded-full bg-current" />
      ) : status === 'waiting' || paused ? (
        <PauseCircle className="size-3" />
      ) : status === 'failed' ? (
        <XCircle className="size-3" />
      ) : status === 'completed' ? (
        <Check className="size-3" />
      ) : (
        <Route className="size-3" />
      )}
      {badge.label}
    </span>
  )
}

function StepDot({ state }: { state: JourneyProgressStep['state'] }) {
  if (state === 'done') {
    return (
      <span className="bg-channel-green absolute -left-[21px] top-0.5 flex size-3.5 items-center justify-center rounded-full">
        <Check className="size-2 text-white" strokeWidth={3} />
      </span>
    )
  }
  if (state === 'current') {
    return (
      <span className="bg-channel-green ring-emerald-100 absolute -left-[21px] top-0.5 flex size-3.5 items-center justify-center rounded-full ring-2">
        <span className="size-1 animate-pulse rounded-full bg-white" />
      </span>
    )
  }
  if (state === 'failed') {
    return (
      <span className="bg-destructive absolute -left-[21px] top-0.5 flex size-3.5 items-center justify-center rounded-full">
        <XCircle className="size-2 text-white" />
      </span>
    )
  }
  return <span className="border-background bg-muted-foreground/30 absolute -left-[21px] top-0.5 size-3.5 rounded-full border-2" />
}

function JourneySteps({ progress }: { progress: ContactJourneyProgress }) {
  const doneCount = progress.steps.filter((s) => s.state === 'done').length
  return (
    <div>
      <p className="text-muted-foreground mb-2 text-xs font-semibold">
        {doneCount} of {progress.steps.length} steps completed
      </p>
      <div className="before:bg-border relative max-h-40 space-y-2 overflow-y-auto py-0.5 pr-1 pl-5 before:absolute before:top-2 before:bottom-2 before:left-[6px] before:w-px">
        {progress.steps.map((step) => (
          <div key={step.nodeId} className="relative text-left">
            <StepDot state={step.state} />
            <p
              className={`text-sm leading-tight font-medium ${
                step.state === 'current'
                  ? 'text-sky-600'
                  : step.state === 'failed'
                    ? 'text-destructive'
                    : step.state === 'done'
                      ? 'text-foreground'
                      : 'text-muted-foreground'
              }`}
            >
              {step.label}
            </p>
            {step.detail ? <p className="text-muted-foreground mt-0.5 text-xs">{step.detail}</p> : null}
            {step.state === 'current' && step.type === 'WAIT' && step.waitUntil ? (
              <WaitRemaining waitUntil={step.waitUntil} />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

const CHANNEL_AUTOMATION_LABEL: Record<AutomationChannel, string> = {
  whatsapp: 'WhatsApp Automation',
  instagram: 'Instagram Automation',
}

export function ContactAutomationPanel({
  contactId,
  channel,
  assignedJourneyId = null,
  publishedJourneys = [],
  automationsPaused = false,
  onAssignJourney,
}: {
  contactId: string
  channel: AutomationChannel
  assignedJourneyId?: string | null
  publishedJourneys?: Array<{ id: string; name: string }>
  automationsPaused?: boolean
  onAssignJourney?: (journeyId: string) => void
}) {
  const { data: progress, isLoading } = realAutomationsService.useContactProgress(contactId, channel)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (progress) setExpanded(true)
  }, [progress?.executionId])

  if (isLoading && !progress) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 rounded-xl border p-3 text-xs">
        <Loader2 className="size-3.5 animate-spin" />
        Loading automation…
      </div>
    )
  }

  if (!progress && !assignedJourneyId) return null

  const isActive = progress?.status === 'running' || progress?.status === 'waiting'
  const currentStep = progress?.steps.find((s) => s.state === 'current')
  const assignedName = publishedJourneys.find((j) => j.id === assignedJourneyId)?.name ?? 'Assigned journey'
  const restartJourneyId = assignedJourneyId ?? progress?.journeyId ?? null
  const canRestart = Boolean(onAssignJourney && restartJourneyId)
  const pausedWaiting = Boolean(automationsPaused && progress?.status === 'waiting')

  return (
    <div className={`overflow-hidden rounded-xl border ${isActive ? 'border-sky-200' : ''}`}>
      <div className="flex items-start gap-1 p-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
          aria-expanded={expanded}
        >
          <span
            className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${
              isActive ? 'bg-sky-50 text-sky-600' : 'bg-muted text-muted-foreground'
            }`}
          >
            <Route className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground text-xs font-bold">{CHANNEL_AUTOMATION_LABEL[channel]}</p>
              {progress ? <StatusBadgePill status={progress.status} paused={pausedWaiting} /> : null}
            </div>
            {progress ? (
              <>
                <p className="mt-1 truncate text-sm font-semibold" title={progress.journeyName}>
                  {progress.journeyName}
                </p>
                {!expanded && currentStep?.type === 'WAIT' && currentStep.waitUntil ? (
                  <WaitRemaining waitUntil={currentStep.waitUntil} />
                ) : null}
              </>
            ) : (
              <p className="mt-1 truncate text-sm font-semibold" title={assignedName}>
                {assignedName}
              </p>
            )}
          </div>
          <ChevronDown
            className={`text-muted-foreground mt-1 size-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
        {canRestart ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Restart automation"
            aria-label="Restart automation"
            onClick={() => {
              if (!restartJourneyId || !onAssignJourney) return
              onAssignJourney(restartJourneyId)
            }}
          >
            <RotateCcw />
          </Button>
        ) : null}
      </div>

      {expanded ? (
        <div className="border-t px-3 pt-3 pb-3">
          {progress ? (
            <JourneySteps progress={progress} />
          ) : (
            <p className="text-muted-foreground py-3 text-center text-xs">
              When a journey runs for this contact, live steps will show here.
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}
