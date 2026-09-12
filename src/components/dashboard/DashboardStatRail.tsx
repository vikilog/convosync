import type { LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export type DashboardStat = {
  key: string
  icon: LucideIcon
  label: string
  value: React.ReactNode
  meta?: React.ReactNode
  spark?: number[]
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const w = 56
  const h = 18
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo || 1
  const step = w / (values.length - 1)
  const points = values.map((v, i) => {
    const x = i * step
    const y = 2 + (h - 4) * (1 - (v - lo) / span)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const [lastX, lastY] = points[points.length - 1].split(',')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted-foreground"
      />
      <circle cx={lastX} cy={lastY} r={1.6} className="fill-primary" />
    </svg>
  )
}

export function DashboardStatRail({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.key}>
          <CardHeader>
            <CardDescription>{stat.label}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{stat.value}</CardTitle>
            {stat.spark ? (
              <CardAction>
                <Sparkline values={stat.spark} />
              </CardAction>
            ) : stat.meta ? (
              <CardAction>
                <Badge variant="secondary">{stat.meta}</Badge>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardFooter className="text-muted-foreground text-xs">
            <stat.icon className="mr-1 size-3.5" />
            vs. last 7 days
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
