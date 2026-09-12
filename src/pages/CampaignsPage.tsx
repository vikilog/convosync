import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  PlayCircle,
  Plus,
  Rocket,
  Search,
  XCircle,
} from 'lucide-react'

import { CampaignListActions } from '@/components/campaigns/CampaignListActions'
import { CampaignDetailSheet } from '@/components/campaigns/CampaignDetailSheet'
import {
  CAMPAIGN_STATUS_ICON,
  CAMPAIGN_STATUS_LABEL,
  badgeVariantForStatus,
} from '@/components/campaigns/campaign-status'
import { NewCampaignSheet } from '@/components/campaigns/NewCampaignSheet'
import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { EmptyState } from '@/components/common/EmptyState'
import { StatTile } from '@/components/stat-tile'
import { ChannelIcon } from '@/components/channel-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { campaignWhenAt, nextCampaignListSort, sortCampaignsForList, type CampaignListSortDir, type CampaignListSortKey } from '@/lib/campaignListSort'
import { canDeleteCampaign } from '@/lib/campaignScheduleEdit'
import { ApiError } from '@/lib/httpClient'
import {
  campaignChannel,
  campaignSegmentLabel,
  realCampaignsService,
  type Campaign,
  type CampaignChannel,
  type CampaignStatus,
} from '@/services/realCampaigns.service'

const STATUS_OPTIONS: { id: 'all' | CampaignStatus; label: string }[] = [
  { id: 'all', label: 'All statuses' },
  { id: 'draft', label: 'Draft' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'running', label: 'Running' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'failed', label: 'Failed' },
]

const CHANNEL_OPTIONS: { id: 'all' | CampaignChannel; label: string }[] = [
  { id: 'all', label: 'All channels' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'Email' },
  { id: 'instagram', label: 'Instagram' },
]

const PAGE_SIZE = 25

function formatDateShort(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function reportError(err: unknown) {
  window.alert(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
}

export function CampaignsPage() {
  const confirm = useConfirm()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: campaigns = [] } = realCampaignsService.useList()
  const sendCampaign = realCampaignsService.useSend()
  const cancelCampaign = realCampaignsService.useCancel()
  const resumeCampaign = realCampaignsService.useResume()
  const resendFailed = realCampaignsService.useResendFailed()
  const removeCampaign = realCampaignsService.useRemove()

  const [statusFilter, setStatusFilter] = useState<'all' | CampaignStatus>('all')
  const [channelFilter, setChannelFilter] = useState<'all' | CampaignChannel>('all')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<CampaignListSortKey>('created')
  const [sortDir, setSortDir] = useState<CampaignListSortDir>('desc')
  const [page, setPage] = useState(1)
  const [openCampaignId, setOpenCampaignId] = useState<string | null>(searchParams.get('id'))
  const [newOpen, setNewOpen] = useState(searchParams.get('new') === '1')
  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) setOpenCampaignId(id)
  }, [searchParams])

  useEffect(() => {
    if (searchParams.get('new') === '1') setNewOpen(true)
  }, [searchParams])

  const clearParam = (key: string) => {
    if (!searchParams.has(key)) return
    const next = new URLSearchParams(searchParams)
    next.delete(key)
    setSearchParams(next, { replace: true })
  }

  const stats = useMemo(
    () => ({
      total: campaigns.length,
      running: campaigns.filter((c) => c.status === 'running').length,
      scheduled: campaigns.filter((c) => c.status === 'scheduled').length,
      completed: campaigns.filter((c) => c.status === 'completed').length,
      failed: campaigns.filter((c) => c.status === 'failed').length,
    }),
    [campaigns]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return campaigns.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (channelFilter !== 'all' && campaignChannel(c) !== channelFilter) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        campaignSegmentLabel(c).toLowerCase().includes(q) ||
        campaignChannel(c).includes(q)
      )
    })
  }, [campaigns, statusFilter, channelFilter, query])

  const sorted = useMemo(
    () =>
      sortCampaignsForList(
        filtered.map((c) => ({ ...c, channel: campaignChannel(c) })),
        sortKey,
        sortDir
      ),
    [filtered, sortKey, sortDir]
  )

  useEffect(() => {
    setPage(1)
  }, [query, sortKey, sortDir, statusFilter, channelFilter])

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const displayed = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const deleteCampaign = async (campaign: Campaign) => {
    if (!canDeleteCampaign(campaign.status, campaign.scheduledAt)) return
    const ok = await confirm({
      title: `Delete "${campaign.name}"?`,
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) removeCampaign.mutate(campaign.id, { onError: reportError })
  }

  const openRelaunch = (id: string) => {
    navigate('/campaigns/new', { state: { editCampaignId: id } })
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="shrink-0 space-y-4 border-b p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Total campaigns" value={stats.total} icon={Rocket} />
          <StatTile label="Running" value={stats.running} icon={PlayCircle} tone="text-blue-600" />
          <StatTile label="Scheduled" value={stats.scheduled} icon={Clock} tone="text-amber-600" />
          <StatTile label="Completed" value={stats.completed} icon={CheckCircle2} tone="text-primary" />
          <StatTile
            label="Failed"
            value={stats.failed}
            icon={XCircle}
            tone={stats.failed > 0 ? 'text-destructive' : undefined}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, segment, channel…"
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | CampaignStatus)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={channelFilter}
              onValueChange={(v) => setChannelFilter(v as 'all' | CampaignChannel)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => navigate('/campaigns/new')}>
              <Plus />
              New campaign
            </Button>
            <NewCampaignSheet
              open={newOpen}
              onOpenChange={(open) => {
                setNewOpen(open)
                if (!open) {
                  setEditId(null)
                  clearParam('new')
                }
              }}
              editCampaignId={editId}
              showTrigger={false}
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Rocket}
            title="No campaigns found"
            description="Try changing the filters or create a new campaign."
            className="h-full rounded-none border-none"
          />
        ) : (
          <>
            <Table>
              <TableHeader className="bg-background sticky top-0 z-10">
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <SortHead
                    label="Channel"
                    active={sortKey === 'channel'}
                    dir={sortDir}
                    onClick={() => {
                      const next = nextCampaignListSort(sortKey, sortDir, 'channel')
                      setSortKey(next.key)
                      setSortDir(next.dir)
                    }}
                  />
                  <TableHead>Audience</TableHead>
                  <TableHead>Progress</TableHead>
                  <SortHead
                    label="Status"
                    active={sortKey === 'status'}
                    dir={sortDir}
                    onClick={() => {
                      const next = nextCampaignListSort(sortKey, sortDir, 'status')
                      setSortKey(next.key)
                      setSortDir(next.dir)
                    }}
                  />
                  <SortHead
                    label="Created"
                    active={sortKey === 'created'}
                    dir={sortDir}
                    onClick={() => {
                      const next = nextCampaignListSort(sortKey, sortDir, 'created')
                      setSortKey(next.key)
                      setSortDir(next.dir)
                    }}
                  />
                  <SortHead
                    label="When"
                    active={sortKey === 'when'}
                    dir={sortDir}
                    onClick={() => {
                      const next = nextCampaignListSort(sortKey, sortDir, 'when')
                      setSortKey(next.key)
                      setSortDir(next.dir)
                    }}
                  />
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((campaign) => {
                  const StatusIcon = CAMPAIGN_STATUS_ICON[campaign.status]
                  const channel = campaignChannel(campaign)
                  const pct =
                    campaign.totalRecipients > 0
                      ? Math.min(100, Math.round((campaign.sentCount / campaign.totalRecipients) * 100))
                      : 0
                  const whenAt = campaignWhenAt(campaign)

                  return (
                    <TableRow
                      key={campaign.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    >
                      <TableCell>
                        <p className="text-sm font-medium">{campaign.name}</p>
                        <p className="text-muted-foreground text-xs">{campaignSegmentLabel(campaign)}</p>
                      </TableCell>
                      <TableCell>
                        <ChannelIcon channel={channel} className="size-4" />
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {campaign.totalRecipients.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-[9rem] items-center gap-2">
                          <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
                            />
                          </div>
                          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                            {campaign.sentCount.toLocaleString()}/{campaign.totalRecipients.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={badgeVariantForStatus(campaign.status)} className="gap-1">
                          <StatusIcon className="size-3" />
                          {CAMPAIGN_STATUS_LABEL[campaign.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDateShort(campaign.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatDateShort(whenAt)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <CampaignListActions
                          campaign={campaign}
                          onSend={() => sendCampaign.mutate(campaign.id, { onError: reportError })}
                          onPause={() => cancelCampaign.mutate(campaign.id, { onError: reportError })}
                          onCancel={() => cancelCampaign.mutate(campaign.id, { onError: reportError })}
                          onResume={() => resumeCampaign.mutate(campaign.id, { onError: reportError })}
                          onRelaunch={() => openRelaunch(campaign.id)}
                          onResendFailed={() => resendFailed.mutate(campaign.id, { onError: reportError })}
                          onDelete={() => void deleteCampaign(campaign)}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
              <p className="text-muted-foreground text-xs">
                Showing {sorted.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, sorted.length)} of {sorted.length}
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ArrowLeft /> Prev
                </Button>
                <span className="text-muted-foreground text-xs">
                  Page {safePage} of {pageCount}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ArrowRight />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <CampaignDetailSheet
        campaignId={openCampaignId}
        onOpenChange={(open) => {
          if (!open) {
            setOpenCampaignId(null)
            clearParam('id')
          }
        }}
        onEdit={(id) => {
          setOpenCampaignId(null)
          clearParam('id')
          openRelaunch(id)
        }}
      />
    </div>
  )
}

function SortHead({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: CampaignListSortDir
  onClick: () => void
}) {
  return (
    <TableHead aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1">
        {label}
        {active ? dir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" /> : null}
      </button>
    </TableHead>
  )
}
