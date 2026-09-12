import { AlertTriangle } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { CampaignAnalytics as Analytics, CampaignChannel } from '@/services/realCampaigns.service'

function formatMedian(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return '—'
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  if (ms < 60 * 60_000) {
    const m = Math.floor(ms / 60_000)
    const s = Math.round((ms % 60_000) / 1000)
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }
  const h = Math.floor(ms / (60 * 60_000))
  const m = Math.round((ms % (60 * 60_000)) / 60_000)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Kpi({ label, value, hint, danger }: { label: string; value: string; hint?: string; danger?: boolean }) {
  return (
    <div className="min-w-0 p-4">
      <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${danger ? 'text-destructive' : ''}`}>{value}</p>
      {hint ? <p className="text-muted-foreground mt-1 text-[11px]">{hint}</p> : null}
    </div>
  )
}

export function CampaignAnalytics({ channel, analytics }: { channel: CampaignChannel; analytics: Analytics }) {
  const readLabel = channel === 'email' ? 'Opened' : 'Read'
  const lagBlocked = !analytics.lag.available
  const funnel = analytics.funnel.filter((s) => s.count > 0)
  const maxFunnel = funnel.reduce((m, s) => Math.max(m, s.count), 0)

  return (
    <section className="rounded-lg border" aria-labelledby="campaign-analytics-heading">
      <header className="border-b px-4 py-3">
        <h3 id="campaign-analytics-heading" className="text-sm font-medium">
          Analytics
        </h3>
        <p className="text-muted-foreground text-xs">Delivery funnel, rates, and timing</p>
      </header>

      <div className="grid grid-cols-2 divide-y border-b sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <Kpi label="Success rate" value={`${analytics.successRate}%`} hint="Delivered+ / total recipients" />
        <Kpi
          label="Failure rate"
          value={`${analytics.failureRate}%`}
          danger={analytics.failureRate > 0}
          hint="Failed / total recipients"
        />
        <Kpi
          label="Completion time"
          value={analytics.completion.durationLabel ?? '—'}
          hint={
            analytics.completion.completedAt
              ? `Last dispatch ${formatDate(analytics.completion.completedAt)}`
              : 'Pending until all recipients are sent'
          }
        />
        <Kpi
          label="Started"
          value={formatDate(analytics.completion.startedAt)}
          hint="Scheduled (fallback: sent / created)"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2">
        <div className="space-y-3 border-b px-4 py-4 xl:border-r xl:border-b-0">
          <h4 className="text-sm font-medium">Status funnel</h4>
          {funnel.length === 0 ? (
            <p className="text-muted-foreground text-sm">No delivery data yet</p>
          ) : (
            funnel.map((step) => (
              <div key={step.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{step.label}</span>
                  <span className="tabular-nums">
                    {step.count.toLocaleString()} <span className="text-muted-foreground">{step.pct}%</span>
                  </span>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-sm">
                  <div
                    className={`h-full rounded-sm ${step.key === 'failed' ? 'bg-destructive' : 'bg-primary'}`}
                    style={{ width: `${maxFunnel > 0 ? Math.max((step.count / maxFunnel) * 100, 2) : 0}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
        <div className="space-y-2 px-4 py-4">
          <h4 className="text-sm font-medium">Failure reasons</h4>
          {analytics.failureReasons.length === 0 ? (
            <p className="text-muted-foreground text-sm">No failures logged</p>
          ) : (
            analytics.failureReasons.map((row) => (
              <div key={row.reason} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 break-words">{row.reason}</span>
                <span className="text-muted-foreground shrink-0 tabular-nums">
                  {row.count} {row.pct}%
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {lagBlocked && analytics.lag.blockedReason ? (
        <div className="flex items-start gap-2 border-t px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p className="text-muted-foreground">{analytics.lag.blockedReason}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 divide-y border-t xl:grid-cols-2 xl:divide-x xl:divide-y-0">
        <LagChart
          title="Send → delivered lag"
          series={analytics.lag.sendToDelivered}
          blocked={lagBlocked}
        />
        <LagChart
          title={`Delivered → ${readLabel.toLowerCase()} lag`}
          series={analytics.lag.deliveredToRead}
          blocked={lagBlocked}
        />
      </div>
    </section>
  )
}

function LagChart({
  title,
  series,
  blocked,
}: {
  title: string
  series: Analytics['lag']['sendToDelivered']
  blocked: boolean
}) {
  const hasData = series.samples > 0 && !blocked
  return (
    <div className="px-4 py-4">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h4 className="text-sm font-medium">{title}</h4>
          <p className="text-muted-foreground text-[11px]">
            {hasData ? `${series.samples} sample${series.samples === 1 ? '' : 's'}` : 'Timeline pending'}
          </p>
        </div>
        <p className="text-sm tabular-nums">{formatMedian(series.medianMs)}</p>
      </div>
      <div className="h-40">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series.buckets} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip />
              <Bar dataKey="count" name="Recipients" fill="var(--color-primary)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground flex h-full items-center justify-center text-sm">
            Waiting for timeline
          </p>
        )}
      </div>
    </div>
  )
}
