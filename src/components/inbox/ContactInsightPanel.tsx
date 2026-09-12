import { useState } from 'react'
import { AlertTriangle, Loader2, RefreshCw, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { realContactsService } from '@/services/realContacts.service'

function ScorePill({ label, value, accent }: { label: string; value: number | null; accent: string }) {
  return (
    <div className="rounded-xl border px-2.5 py-2 text-center">
      <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold tabular-nums ${accent}`}>{value == null ? '—' : value}</p>
    </div>
  )
}

export function ContactInsightPanel({ contactId }: { contactId: string }) {
  const { data, isLoading, error, refetch } = realContactsService.useInsightsLatest(contactId)
  const compute = realContactsService.useComputeInsights()
  const [statusNote, setStatusNote] = useState<string | null>(null)
  const insight = data?.insight ?? null
  const excludeFromInsights = Boolean(data?.excludeFromInsights)
  const genuine = insight?.isGenuineCustomerInteraction !== false
  const showScores = Boolean(insight && genuine)

  const handlePrepare = async () => {
    if (excludeFromInsights) return
    setStatusNote('Queued… analyzing chat + call history')
    try {
      const res = await compute.mutateAsync(contactId)
      if (!res.queued && res.reason?.startsWith('coalesced')) setStatusNote('Already running…')
      const before = insight?.computedAt ? new Date(insight.computedAt).getTime() : 0
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 2500))
        const latest = await refetch()
        const next = latest.data?.insight
        if (next && new Date(next.computedAt).getTime() > before) {
          setStatusNote(null)
          return
        }
      }
      setStatusNote('Still processing — refresh in a minute')
    } catch (err) {
      setStatusNote(err instanceof Error ? err.message : 'Failed to prepare insight')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold">
          <Sparkles className="size-3.5" />
          Customer insight
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={compute.isPending || excludeFromInsights}
          onClick={() => void handlePrepare()}
        >
          {compute.isPending ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
          {insight ? 'Re-run' : 'Prepare insight'}
        </Button>
      </div>

      {excludeFromInsights ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-900">
          This contact is excluded from AI insights. Turn off “Exclude from AI insights” in Edit contact to enable.
        </p>
      ) : null}

      {isLoading ? <Skeleton className="h-32 w-full" /> : null}
      {error ? (
        <p className="text-destructive text-xs">{error instanceof Error ? error.message : 'Failed to load insight'}</p>
      ) : null}
      {statusNote ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-sky-700">
          <Loader2 className="size-3 animate-spin" />
          {statusNote}
        </p>
      ) : null}

      {!isLoading && !insight && !error && !excludeFromInsights ? (
        <div className="rounded-xl border border-dashed p-5 text-center">
          <Sparkles className="text-muted-foreground mx-auto size-5" />
          <p className="mt-2 text-sm font-medium">No insight yet</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Past calls and chats are ready to analyze. Tap Prepare insight to run now.
          </p>
        </div>
      ) : null}

      {insight ? (
        <div className="space-y-3 rounded-xl border p-3">
          <p className="text-muted-foreground text-[10px] font-semibold">
            {new Date(insight.computedAt).toLocaleString()} · {insight.modelVersion}
            {insight.basedOnCallSessionIds.length ? ` · ${insight.basedOnCallSessionIds.length} call(s)` : ''}
          </p>
          {!genuine ? (
            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-950">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <span>This doesn’t appear to be a genuine customer interaction — scores not computed.</span>
            </div>
          ) : null}
          {showScores ? (
            <div className="grid grid-cols-2 gap-2">
              <ScorePill label="Health" value={insight.healthScore} accent="text-emerald-700" />
              <ScorePill label="Churn risk" value={insight.churnRiskScore} accent="text-amber-700" />
              <ScorePill label="Purchase intent" value={insight.purchaseIntentScore} accent="text-sky-700" />
              <ScorePill label="Sentiment" value={insight.sentimentScore} accent="text-violet-700" />
            </div>
          ) : null}
          <div>
            <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">Summary</p>
            <p className="mt-1 text-sm leading-relaxed">{insight.summary}</p>
          </div>
          {genuine && insight.recommendedAction ? (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2">
              <p className="text-[11px] font-semibold tracking-wide text-emerald-700 uppercase">Recommended action</p>
              <p className="mt-0.5 text-sm text-emerald-950">{insight.recommendedAction}</p>
            </div>
          ) : null}
          {genuine && insight.painPoints.length > 0 ? (
            <div>
              <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">Pain points</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs">
                {insight.painPoints.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {genuine && insight.interests.length > 0 ? (
            <div>
              <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">Interests</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs">
                {insight.interests.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
