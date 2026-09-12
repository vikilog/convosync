import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'

import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { realTemplatesService } from '@/services/realTemplates.service'

const RANGES = [7, 30, 90] as const
type Range = (typeof RANGES)[number]

function formatDay(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function pct(numerator: number, denominator: number): string {
  if (denominator <= 0) return '—'
  return `${Math.round((numerator / denominator) * 100)}%`
}

export function TemplateInsightsPanel({ initialId = null }: { initialId?: string | null }) {
  const { data: templates = [], isLoading: templatesLoading } = realTemplatesService.useList()
  const [selectedId, setSelectedId] = useState<string | null>(initialId)
  const [range, setRange] = useState<Range>(30)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (initialId) setSelectedId(initialId)
  }, [initialId])

  const {
    data: insights,
    isLoading: insightsLoading,
    isError,
  } = realTemplatesService.useInsights(selectedId, range)

  const insightEligible = templates.filter((t) => t.status === 'approved' || t.status === 'paused')
  const filtered = insightEligible.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
  const selected = templates.find((t) => t.id === selectedId) ?? null

  return (
    <div className="flex h-full min-h-0 flex-1">
      <div className="flex w-72 shrink-0 flex-col border-r">
        <div className="shrink-0 border-b p-3">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates…" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {templatesLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={`hover:bg-muted/60 flex w-full flex-col border-b px-3 py-2.5 text-left ${
                  selectedId === t.id ? 'bg-muted' : ''
                }`}
              >
                <span className="truncate text-sm font-medium">{t.name}</span>
                <span className="text-muted-foreground text-xs capitalize">{t.category}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {!selected ? (
          <EmptyState
            icon={BarChart3}
            title="Pick a template"
            description="Select a WhatsApp template to see its delivery and read performance."
            className="h-full rounded-none border-none"
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Template insights</p>
                <p className="text-muted-foreground text-xs">{selected.name}</p>
              </div>
              <div className="flex gap-1">
                {RANGES.map((r) => (
                  <Button
                    key={r}
                    size="sm"
                    variant={range === r ? 'default' : 'outline'}
                    onClick={() => setRange(r)}
                  >
                    {r} days
                  </Button>
                ))}
              </div>
            </div>

            {insightsLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : isError ? (
              <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-xl border p-4 text-sm">
                This template hasn't been submitted to Meta yet, so there's no insight data.
              </div>
            ) : insights ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border p-3">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      Sent
                    </p>
                    <p className="text-2xl font-semibold">{insights.totals.sent.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      Delivered
                    </p>
                    <p className="text-2xl font-semibold">{insights.totals.delivered.toLocaleString()}</p>
                    <p className="text-muted-foreground text-xs">
                      {pct(insights.totals.delivered, insights.totals.sent)} of sent
                    </p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      Read
                    </p>
                    <p className="text-2xl font-semibold">{insights.totals.read.toLocaleString()}</p>
                    <p className="text-muted-foreground text-xs">
                      {pct(insights.totals.read, insights.totals.delivered)} of delivered
                    </p>
                  </div>
                </div>

                {Object.keys(insights.totals.clicked).length > 0 ? (
                  <div className="rounded-xl border p-3">
                    <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                      Button clicks
                    </p>
                    <div className="space-y-1">
                      {Object.entries(insights.totals.clicked).map(([label, count]) => (
                        <div key={label} className="flex items-center justify-between text-sm">
                          <span>{label}</span>
                          <span className="font-medium">{count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="overflow-hidden rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-muted-foreground text-xs uppercase">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Date</th>
                        <th className="px-3 py-2 text-right font-medium">Sent</th>
                        <th className="px-3 py-2 text-right font-medium">Delivered</th>
                        <th className="px-3 py-2 text-right font-medium">Read</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {insights.dataPoints.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-muted-foreground px-3 py-6 text-center">
                            No activity in this range.
                          </td>
                        </tr>
                      ) : (
                        insights.dataPoints.map((p) => (
                          <tr key={p.start}>
                            <td className="px-3 py-2">{formatDay(p.start)}</td>
                            <td className="px-3 py-2 text-right">{p.sent}</td>
                            <td className="px-3 py-2 text-right">{p.delivered}</td>
                            <td className="px-3 py-2 text-right">{p.read}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
