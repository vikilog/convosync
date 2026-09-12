import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { AlertTriangle, Eye, MessageSquare, Send, Sparkles, Target, ThumbsUp, TrendingUp, Users } from 'lucide-react'

import { IntentBadge } from '@/components/social-listening/IntentBadge'
import { PlatformIcon } from '@/components/social-listening/platform-icon'
import { StatTile } from '@/components/stat-tile'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  useDashboardStats,
  useFacebookPageInsights,
  useFacebookPageProfile,
  useInstagramAccountsQuery,
  useIntentBreakdown,
  useInvalidateSocialListening,
  useNeedsAttention,
  useSocialActivity,
  useTopPosts,
} from '@/hooks/useSocialListeningQueries'
import { useKeepAliveActivation } from '@/components/KeepAlive'
import { INTENT_COLORS, formatCount, timeAgo, type DashboardRange, type Platform } from '@/lib/socialListening'

function useChartReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return ready
}

export function SocialListeningDashboard({
  platform,
  onOpenReview,
}: {
  platform: Platform
  onOpenReview?: () => void
}) {
  const navigate = useNavigate()
  const chartReady = useChartReady()
  const [range, setRange] = useState<DashboardRange>('7d')
  const invalidate = useInvalidateSocialListening()
  useKeepAliveActivation(() => {
    invalidate()
  })

  const accountsQ = useInstagramAccountsQuery()
  const facebookPageQ = useFacebookPageProfile()
  const statsQ = useDashboardStats(range, platform)
  const intentsQ = useIntentBreakdown(range, platform)
  const attentionQ = useNeedsAttention(platform)
  const activityQ = useSocialActivity(platform)
  const topPostsQ = useTopPosts(range, platform)
  const insightsQ = useFacebookPageInsights(platform)

  const connected =
    platform === 'facebook' ? facebookPageQ.data != null : (accountsQ.data?.length ?? 0) > 0
  const stats = statsQ.data
  const intents = (intentsQ.data ?? []).map((item) => ({
    ...item,
    color: INTENT_COLORS[item.label] || INTENT_COLORS[item.intent] || '#94a3b8',
  }))
  const insights = insightsQ.data?.insights

  const openMedia = (postId: string) => {
    navigate(`/social-listening/media/${encodeURIComponent(postId)}?platform=${platform}&tab=content`)
  }

  if (!accountsQ.isLoading && !facebookPageQ.isLoading && !connected) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <PlatformIcon platform={platform} className="size-8" />
        <p className="text-sm font-medium">
          Connect {platform === 'facebook' ? 'a Facebook Page' : 'Instagram'} to start
        </p>
        <Button onClick={() => navigate('/integrations')}>
          Connect {platform === 'facebook' ? 'Facebook' : 'Instagram'}
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
      <div className="flex items-center justify-end">
        <Select value={range} onValueChange={(v) => setRange(v as DashboardRange)}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {platform === 'facebook' ? (
        insights ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatTile label="Followers" value={formatCount(insights.pageFans)} icon={Users} />
            <StatTile label="Total Reach" value={formatCount(insights.pageImpressions)} icon={Eye} />
            <StatTile label="Engaged Users" value={formatCount(insights.pageEngagedUsers)} icon={TrendingUp} />
            <StatTile label="Engagements" value={formatCount(insights.pagePostEngagements)} icon={ThumbsUp} />
            <StatTile label="Page Views" value={formatCount(insights.pageViews)} icon={Eye} />
          </div>
        ) : insightsQ.data?.error ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-3 text-sm">
            {insightsQ.data.error}
          </p>
        ) : null
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="Comments" value={stats?.totalComments ?? '—'} icon={MessageSquare} />
        <button type="button" className="text-left" onClick={onOpenReview}>
          <StatTile
            label="Pending review"
            value={stats?.pendingReview ?? '—'}
            icon={AlertTriangle}
            tone="text-amber-600"
          />
        </button>
        <StatTile label="Auto-handled" value={stats?.autoHandled ?? '—'} icon={Sparkles} tone="text-primary" />
        <StatTile label="Leads created" value={stats?.leadsCreated ?? '—'} icon={Target} />
        <Card size="sm">
          <CardContent className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-xs">Auto-DMs today</p>
              <Send className="text-muted-foreground size-4" />
            </div>
            <p className="text-lg font-semibold tabular-nums">
              {stats ? `${stats.autoDmsSentToday}/${stats.maxAutoDmsPerDay}` : '—'}
            </p>
            {stats ? (
              <Progress
                value={
                  stats.maxAutoDmsPerDay > 0
                    ? (stats.autoDmsSentToday / stats.maxAutoDmsPerDay) * 100
                    : 0
                }
              />
            ) : (
              <Skeleton className="h-2 w-full" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Intent breakdown</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="h-48 w-48 shrink-0">
                {chartReady && intents.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={intents}
                        dataKey="count"
                        nameKey="label"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={2}
                        stroke="none"
                        isAnimationActive={false}
                      >
                        {intents.map((entry) => (
                          <Cell key={entry.intent} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
                    {intentsQ.isLoading ? 'Loading…' : 'No data'}
                  </div>
                )}
              </div>
              <div className="w-full space-y-2">
                {intents.map((entry) => (
                  <div key={entry.intent} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      {entry.label || entry.intent}
                    </span>
                    <span className="font-medium tabular-nums">{entry.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(attentionQ.data ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">No urgent items right now.</p>
            ) : (
              (attentionQ.data ?? []).slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openMedia(item.postId)}
                  className="hover:bg-muted/40 w-full space-y-1 rounded-lg border p-2.5 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold">@{item.username}</p>
                    <IntentBadge intent={item.intent} confidence={item.confidence} />
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-xs">{item.commentText}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(activityQ.data ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent activity.</p>
            ) : (
              (activityQ.data ?? []).slice(0, 8).map((event) => (
                <div key={event.id} className="flex items-start justify-between gap-2 text-sm">
                  <p className="min-w-0 truncate">{event.message}</p>
                  <span className="text-muted-foreground shrink-0 text-xs">{timeAgo(event.createdAt)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top posts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead>Leads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(topPostsQ.data ?? []).map((post) => (
                  <TableRow
                    key={post.postId}
                    className="cursor-pointer"
                    onClick={() => openMedia(post.postId)}
                  >
                    <TableCell className="max-w-xs truncate text-sm">
                      {post.postCaption || 'Untitled post'}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">{post.commentCount}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{post.leadCount}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
