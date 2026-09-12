import { useMemo } from 'react'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ChartPoint } from '@/lib/chartUtils'
import { isChartEmpty } from '@/lib/chartUtils'

interface MessagePerformanceChartProps {
  data: ChartPoint[]
  onNewCampaign: () => void
  onRangeChange: (days: 7 | 14 | 30) => void
  activeRange: 7 | 14 | 30
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  const labels: Record<string, string> = { sent: 'Sent', delivered: 'Delivered', read: 'Read' }
  const colors: Record<string, string> = {
    sent: 'bg-foreground',
    delivered: 'bg-primary',
    read: 'bg-muted-foreground',
  }

  return (
    <div className="bg-popover rounded-md border px-3 py-2 shadow-sm">
      <p className="text-popover-foreground mb-2 text-xs font-semibold">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-8 text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${colors[entry.dataKey] ?? 'bg-muted-foreground'}`} />
              {labels[entry.dataKey] ?? entry.dataKey}
            </span>
            <span className="text-popover-foreground font-semibold tabular-nums">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MessagePerformanceChart({
  data,
  onNewCampaign,
  onRangeChange,
  activeRange,
}: MessagePerformanceChartProps) {
  const empty = useMemo(() => isChartEmpty(data), [data])

  return (
    <Card className="h-full">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Message performance</CardTitle>
          <CardDescription>Sent vs. delivered vs. read</CardDescription>
        </div>
        <CardAction>
          <Tabs value={String(activeRange)} onValueChange={(v) => onRangeChange(Number(v) as 7 | 14 | 30)}>
            <TabsList>
              <TabsTrigger value="7">7D</TabsTrigger>
              <TabsTrigger value="14">14D</TabsTrigger>
              <TabsTrigger value="30">30D</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="text-muted-foreground mb-3 flex items-center gap-5 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="bg-foreground h-2 w-2 rounded-full" />
            Sent
          </span>
          <span className="flex items-center gap-1.5">
            <span className="bg-primary h-2 w-2 rounded-full" />
            Delivered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="bg-muted-foreground h-2 w-2 rounded-full" />
            Read
          </span>
        </div>

        {empty ? (
          <div className="flex h-60 flex-col items-center justify-center rounded-lg border border-dashed text-center">
            <p className="text-sm font-medium">No message data yet</p>
            <p className="text-muted-foreground mt-1 max-w-xs text-sm">
              Run a campaign to populate this chart.
            </p>
            <Button className="mt-4" size="sm" onClick={onNewCampaign}>
              <Plus />
              Create campaign
            </Button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="sentFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity={0.12} className="text-foreground" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity={0} className="text-foreground" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                width={32}
                className="text-muted-foreground"
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="sent"
                stroke="var(--color-foreground)"
                strokeWidth={1.5}
                fill="url(#sentFill)"
                dot={false}
                activeDot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="delivered"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="read"
                stroke="var(--color-muted-foreground)"
                strokeWidth={1.2}
                strokeDasharray="3 3"
                dot={false}
                activeDot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
