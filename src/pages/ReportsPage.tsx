import { useEffect, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Calendar, Clock, MessageCircle, ThumbsUp, TrendingUp } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { realWorkspaceMembersService } from '@/services/realWorkspaceMembers.service'
import { csatForMember, HOURLY_DENSITY, REPORTS_RANGE_LABEL, type ReportsRange } from '@/lib/reportsMockData'

const KPI_CARDS = [
  {
    label: 'Conversations handled',
    value: '4,842',
    trend: '+14% vs last week',
    icon: MessageCircle,
    tone: 'bg-sky-50 text-sky-600',
  },
  {
    label: 'Resolution rate',
    value: '92.4%',
    trend: '+1.2% in resolution',
    icon: Clock,
    tone: 'bg-[#e6f7ec] text-channel-green',
  },
  {
    label: 'Avg CSAT index',
    value: '4.7 / 5.0',
    trend: '98% positive feedback',
    icon: ThumbsUp,
    tone: 'bg-amber-50 text-amber-600',
  },
  {
    label: 'Inbound qualified rate',
    value: '1,240',
    trend: '+8.4% qualified',
    icon: TrendingUp,
    tone: 'bg-sky-50 text-sky-600',
  },
] as const

/** Mount the chart a frame after first paint — avoids near-zero Bar geometry on first render. */
function useChartReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return ready
}

export function ReportsPage() {
  const chartReady = useChartReady()
  const [range, setRange] = useState<ReportsRange>('today')
  const { data: members = [] } = realWorkspaceMembersService.useList()

  const leaderboard = [...members].sort((a, b) => csatForMember(b.id) - csatForMember(a.id))

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-base font-semibold">Reports &amp; operational intelligence</h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Analyze conversation metrics, response times, and agent resolution ratings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="text-muted-foreground size-3.5" />
          <Select value={range} onValueChange={(v) => setRange(v as ReportsRange)}>
            <SelectTrigger size="sm" className="w-40">
              <SelectValue>{REPORTS_RANGE_LABEL[range]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map((kpi) => (
          <Card key={kpi.label} size="sm">
            <CardContent className="space-y-2">
              <div className={`flex size-9 items-center justify-center rounded-xl ${kpi.tone}`}>
                <kpi.icon className="size-4" />
              </div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {kpi.label}
              </p>
              <p className="font-mono text-xl font-bold tabular-nums">{kpi.value}</p>
              <p className="text-channel-green text-xs font-semibold">{kpi.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardContent>
            <div className="mb-4">
              <h4 className="text-sm font-semibold">Response loops hourly density</h4>
              <p className="text-muted-foreground text-xs">
                Activity volume distributed across operating hours
              </p>
            </div>
            <div className="mb-3 flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="bg-primary size-2 rounded-full" />
                Volume
              </span>
              <span className="flex items-center gap-1.5">
                <span className="bg-channel-green size-2 rounded-full" />
                Qualified
              </span>
            </div>
            {chartReady ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={HOURLY_DENSITY} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip cursor={{ fill: 'var(--muted)' }} />
                  <Bar
                    dataKey="volume"
                    fill="var(--color-primary)"
                    radius={[3, 3, 0, 0]}
                    isAnimationActive={false}
                  />
                  <Bar dataKey="qualified" fill="#25d366" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px]" />
            )}
          </CardContent>
        </Card>

        <Card className="flex h-[400px] flex-col lg:col-span-4">
          <CardContent className="flex min-h-0 flex-1 flex-col">
            <p className="text-muted-foreground mb-3 shrink-0 text-xs font-semibold tracking-wide uppercase">
              Agent lead conversion
            </p>
            <div className="min-h-0 flex-1 divide-y overflow-y-auto">
              {leaderboard.map((member) => {
                const csat = csatForMember(member.id)
                return (
                  <div key={member.id} className="flex items-center justify-between gap-2 py-3 first:pt-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-xs font-bold text-sky-600">
                        {member.name
                          .split(' ')
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{member.name}</p>
                        <p className="text-muted-foreground text-xs">CSAT: {csat.toFixed(1)} / 5.0</p>
                      </div>
                    </div>
                    <span className="text-channel-green shrink-0 rounded-xl border border-[#25d366]/20 bg-[#e6f7ec] px-2.5 py-1 font-mono text-xs font-bold">
                      {csat >= 4.8 ? 'Top tier' : 'Active'}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
