import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Ban, Globe, Mail, Tag, UserX, Users } from 'lucide-react'

import { ChannelIcon, CHANNEL_LABEL } from '@/components/channel-icon'
import { StatTile } from '@/components/stat-tile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useConnectedInboxChannels } from '@/hooks/useConnectedInboxChannels'
import { realContactsService, type GrowthRange } from '@/services/realContacts.service'

const DASH_CHANNELS = ['whatsapp', 'instagram', 'messenger'] as const
type DashChannel = (typeof DASH_CHANNELS)[number]

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India',
  US: 'United States',
  GB: 'United Kingdom',
  AE: 'United Arab Emirates',
  CA: 'Canada',
  AU: 'Australia',
}

const CHANNEL_COLOR: Record<'whatsapp' | 'instagram' | 'messenger', string> = {
  whatsapp: '#25d366',
  instagram: '#C13584',
  messenger: '#1877F2',
}

const SOURCE_PALETTE = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#0f766e', '#115e59', '#134e4a']

const RANGE_TABS: { id: GrowthRange; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: '7D' },
  { id: 'month', label: '30D' },
  { id: 'custom', label: 'Custom' },
]

/** Mount the chart a frame after first paint so ResponsiveContainer measures
 * the settled grid layout instead of a pre-layout size (avoids near-zero
 * Pie/Bar geometry on first render — see UsagePanel/SocialListeningDashboard). */
function useChartReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return ready
}

function ChartCard({
  title,
  subtitle,
  action,
  className,
  children,
}: {
  title: React.ReactNode
  subtitle?: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>{title}</CardTitle>
          {subtitle ? <p className="text-muted-foreground text-xs">{subtitle}</p> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function ContactsDashboard() {
  const chartReady = useChartReady()
  const channels = useConnectedInboxChannels()
  const [growthRange, setGrowthRange] = useState<GrowthRange>('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const { data: stats, isLoading: statsLoading, isError: statsError } = realContactsService.useStats()
  const { data: growthData, isLoading: growthLoading } = realContactsService.useGrowth(growthRange, {
    dateFrom: customFrom,
    dateTo: customTo,
  })

  const connected = new Set<DashChannel>(
    channels.isLoading
      ? DASH_CHANNELS
      : channels.connected.filter((ch): ch is DashChannel => (DASH_CHANNELS as readonly string[]).includes(ch))
  )
  const customReady = growthRange !== 'custom' || (Boolean(customFrom) && Boolean(customTo))

  if (statsLoading) {
    return (
      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (statsError || !stats) {
    return <div className="text-destructive p-4 text-sm">Couldn't load contact stats.</div>
  }

  const growth = growthData?.createdByDay ?? []
  const growthTotal = growthData?.total ?? 0

  const channelPie = DASH_CHANNELS
    .filter((channel) => connected.has(channel) && stats.channels[channel] > 0)
    .map((channel) => ({ channel, value: stats.channels[channel] }))
  const channelLegend = DASH_CHANNELS.filter((channel) => connected.has(channel)).map((channel) => ({
    channel,
    value: stats.channels[channel],
  }))

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatTile label="Total contacts" value={stats.all} icon={Users} />
        <StatTile label="With email" value={stats.withEmail} icon={Mail} />
        {connected.has('whatsapp') ? (
          <StatTile label="WhatsApp" value={stats.channels.whatsapp} icon={Users} tone="text-channel-green" />
        ) : null}
        {connected.has('instagram') ? (
          <StatTile label="Instagram" value={stats.channels.instagram} icon={Users} tone="text-[#C13584]" />
        ) : null}
        {connected.has('messenger') ? (
          <StatTile label="Messenger" value={stats.channels.messenger} icon={Users} tone="text-[#1877F2]" />
        ) : null}
        <StatTile label="Unsubscribed" value={stats.unsubscribe} icon={UserX} />
        <StatTile label="Blocklist" value={stats.blocklist} icon={Ban} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          title="New contacts"
          subtitle={`+${growthTotal} new`}
          className="xl:col-span-2"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Tabs value={growthRange} onValueChange={(v) => setGrowthRange(v as GrowthRange)}>
                <TabsList>
                  {RANGE_TABS.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              {growthRange === 'custom' ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Input
                    type="date"
                    value={customFrom}
                    max={customTo || undefined}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    aria-label="Growth from"
                    className="w-[9.5rem]"
                  />
                  <Input
                    type="date"
                    value={customTo}
                    min={customFrom || undefined}
                    onChange={(e) => setCustomTo(e.target.value)}
                    aria-label="Growth to"
                    className="w-[9.5rem]"
                  />
                </div>
              ) : null}
            </div>
          }
        >
          {growthLoading ? (
            <div className="h-[220px]" />
          ) : !customReady ? (
            <div className="flex h-56 items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground text-sm">Pick a from and to date</p>
            </div>
          ) : growthTotal === 0 ? (
            <div className="flex h-56 items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground text-sm">No new contacts in this range</p>
            </div>
          ) : chartReady ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={growth} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="contactGrowthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  interval={growth.length > 14 ? Math.ceil(growth.length / 8) : 0}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  width={28}
                  allowDecimals={false}
                  className="text-muted-foreground"
                />
                <Tooltip cursor={{ stroke: 'var(--border)' }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="New contacts"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#contactGrowthFill)"
                  dot={false}
                  activeDot={{ r: 3 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px]" />
          )}
        </ChartCard>

        <ChartCard title="By channel" subtitle={channelLegend.map((c) => CHANNEL_LABEL[c.channel]).join(' · ') || 'No channels'}>
          {channelPie.length === 0 ? (
            <div className="flex h-44 items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground text-sm">No channel data</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="h-[180px] w-[180px]">
                {chartReady ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelPie}
                        dataKey="value"
                        nameKey="channel"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={2}
                        stroke="none"
                        isAnimationActive={false}
                      >
                        {channelPie.map((entry) => (
                          <Cell key={entry.channel} fill={CHANNEL_COLOR[entry.channel]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
              <div className="flex w-full flex-wrap justify-center gap-3">
                {channelLegend.map((entry) => (
                  <span key={entry.channel} className="flex items-center gap-1.5 text-xs">
                    <ChannelIcon channel={entry.channel} className="size-3.5" />
                    {CHANNEL_LABEL[entry.channel]}
                    <span className="font-semibold tabular-nums">{entry.value}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Top sources" subtitle="Where contacts came from">
          {stats.sources.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground text-sm">No source data yet</p>
            </div>
          ) : chartReady ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={stats.sources}
                layout="vertical"
                margin={{ left: 8, right: 8, top: 4, bottom: 4 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="source"
                  width={96}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <Tooltip cursor={{ fill: 'var(--muted)' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                  {stats.sources.map((entry, i) => (
                    <Cell key={entry.source} fill={SOURCE_PALETTE[i % SOURCE_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px]" />
          )}
        </ChartCard>

        <ChartCard
          title={
            <span className="flex items-center gap-1.5">
              <Tag className="size-4" />
              Top tags
            </span>
          }
          subtitle="Most used labels"
        >
          {stats.topTags.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground text-sm">No tags yet</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {stats.topTags.map((tag) => {
                const pct = stats.all > 0 ? Math.round((tag.count / stats.all) * 100) : 0
                return (
                  <li key={tag.tag} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate capitalize">{tag.tag}</span>
                      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                        {tag.count} · {pct}%
                      </span>
                    </div>
                    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </ChartCard>
      </div>

      {stats.countries.length > 1 ? (
        <ChartCard
          title={
            <span className="flex items-center gap-1.5">
              <Globe className="size-4" />
              By country
            </span>
          }
          subtitle={`Contacts across ${stats.countries.length} countries`}
        >
          {chartReady ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.countries} margin={{ left: -20, right: 8, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis
                  dataKey="country"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  width={28}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)' }}
                  formatter={(value, _name, entry) => {
                    const countryCode = (entry as { payload?: { country?: string } }).payload?.country ?? ''
                    return [`${value} contacts`, COUNTRY_NAMES[countryCode] ?? countryCode]
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  {stats.countries.map((entry, i) => (
                    <Cell key={entry.country} fill={SOURCE_PALETTE[i % SOURCE_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px]" />
          )}
        </ChartCard>
      ) : null}
    </div>
  )
}
