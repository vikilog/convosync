import { useCallback, useMemo, useRef, useState } from 'react'
import { LayoutGrid, List, Rows3 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import { AddLeadDialog, type FunnelOption } from '@/components/social-listening/AddLeadDialog'
import { BulkActionBar } from '@/components/social-listening/BulkActionBar'
import { IntentSection } from '@/components/social-listening/IntentSection'
import { ReviewCard, ReviewCardTile, ReviewRow } from '@/components/social-listening/ReviewItemViews'
import { TRIAGE_THEME, primaryActionFor } from '@/components/social-listening/intentConfig'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { slKeys, useInvalidateSocialListening, useSocialListeningComments } from '@/hooks/useSocialListeningQueries'
import { realLeadFunnelsService } from '@/services/realLeadFunnels.service'
import { socialListeningApi } from '@/services/socialListening.service'
import {
  SECTION_ORDER,
  parseApiError,
  priorityRank,
  sortByNewest,
  triageSectionForComment,
  type Platform,
  type ReviewComment,
  type ReviewStatus,
  type TriageSection,
} from '@/lib/socialListening'

type ViewMode = 'list' | 'cards' | 'compact'
type IntentFilter = 'all' | TriageSection

const FILTER_TABS: { id: IntentFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'complaints', label: 'Complaints' },
  { id: 'sales', label: 'Sales' },
  { id: 'questions', label: 'Questions' },
  { id: 'low_confidence', label: 'Unclear' },
]

export function SocialListeningReview({ platform }: { platform: Platform }) {
  const qc = useQueryClient()
  const confirm = useConfirm()
  const invalidate = useInvalidateSocialListening()
  const pendingQ = useSocialListeningComments('new', platform)
  const allQ = useSocialListeningComments('all', platform)
  const funnelsQ = realLeadFunnelsService.useList()

  const items = pendingQ.data ?? []
  const recentHandled = useMemo(
    () => (allQ.data ?? []).filter((c) => c.status !== 'pending').sort(sortByNewest).slice(0, 12),
    [allQ.data],
  )

  const [filter, setFilter] = useState<IntentFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [sort, setSort] = useState<'priority' | 'newest'>('priority')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detailId, setDetailId] = useState<string | null>(null)
  const [queueError, setQueueError] = useState('')
  const [addLeadId, setAddLeadId] = useState<string | null>(null)
  const [funnelId, setFunnelId] = useState('')
  const [addLeadBusy, setAddLeadBusy] = useState(false)
  const [addLeadError, setAddLeadError] = useState('')
  const runningRef = useRef<Set<string>>(new Set())
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set())

  const pending = useMemo(() => items.filter((i) => i.status === 'pending'), [items])
  const sectionCounts = useMemo(() => {
    const counts: Record<TriageSection, number> = { complaints: 0, sales: 0, questions: 0, low_confidence: 0 }
    pending.forEach((i) => {
      counts[triageSectionForComment(i)]++
    })
    return counts
  }, [pending])

  const filtered = useMemo(() => {
    const base = filter === 'all' ? pending : pending.filter((i) => triageSectionForComment(i) === filter)
    const list = [...base]
    if (sort === 'newest') list.sort(sortByNewest)
    else {
      list.sort((a, b) => {
        const pr = priorityRank(triageSectionForComment(a)) - priorityRank(triageSectionForComment(b))
        return pr !== 0 ? pr : sortByNewest(a, b)
      })
    }
    return list
  }, [pending, filter, sort])

  const patchPendingCache = useCallback(
    (ids: string[], status: ReviewStatus) => {
      const idSet = new Set(ids)
      qc.setQueryData<ReviewComment[]>(slKeys.comments('new', platform), (prev) =>
        (prev ?? []).map((i) => (idSet.has(i.id) ? { ...i, status } : i)),
      )
    },
    [qc, platform],
  )

  const runQueueAction = async (
    ids: string[],
    action: 'approve_dm' | 'approve_reply' | 'escalate' | 'ignore',
  ) => {
    const targetIds = ids.filter((id) => !runningRef.current.has(id))
    if (targetIds.length === 0) return
    for (const id of targetIds) runningRef.current.add(id)
    setRunningIds(new Set(runningRef.current))
    setQueueError('')
    const reviewStatus: ReviewStatus = action === 'ignore' ? 'ignored' : 'approved'
    patchPendingCache(targetIds, reviewStatus)
    setSelected((prev) => {
      const next = new Set(prev)
      targetIds.forEach((id) => next.delete(id))
      return next
    })
    const results = await Promise.allSettled(
      targetIds.map((id) => socialListeningApi.commentAction(id, { action })),
    )
    const failedIds = targetIds.filter((_, i) => results[i].status === 'rejected')
    if (failedIds.length > 0) {
      patchPendingCache(failedIds, 'pending')
      setSelected((prev) => {
        const next = new Set(prev)
        failedIds.forEach((id) => next.add(id))
        return next
      })
      setQueueError(
        failedIds.length === targetIds.length
          ? 'Action failed — the item was put back in the queue.'
          : `${failedIds.length} of ${targetIds.length} failed and were put back in the queue.`,
      )
    }
    for (const id of targetIds) runningRef.current.delete(id)
    setRunningIds(new Set(runningRef.current))
    invalidate()
  }

  const onPrimary = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    const section = triageSectionForComment(item)
    if (section === 'low_confidence') {
      setDetailId(id)
      return
    }
    const kind = primaryActionFor(section).kind
    if (kind === 'approve_dm') {
      const ok = await confirm({
        title: 'Send this DM now?',
        description: 'This messages the customer and cannot be undone.',
        confirmLabel: 'Send DM',
      })
      if (!ok) return
    }
    void runQueueAction([id], kind === 'approve_dm' ? 'approve_dm' : kind === 'escalate' ? 'escalate' : 'approve_reply')
  }

  const selectedItems = filtered.filter((i) => selected.has(i.id))
  const selectedSections = new Set(selectedItems.map((i) => triageSectionForComment(i)))
  const mixedIntents = selectedSections.size > 1
  const primarySection = selectedSections.size === 1 ? [...selectedSections][0] : 'questions'
  const detailItem = items.find((i) => i.id === detailId) ?? recentHandled.find((i) => i.id === detailId) ?? null
  const funnels: FunnelOption[] = (funnelsQ.data?.funnels ?? []).map((f) => ({ id: f.id, name: f.name }))

  const confirmAddLead = async () => {
    if (!addLeadId || !funnelId) return
    setAddLeadBusy(true)
    setAddLeadError('')
    try {
      await socialListeningApi.createLead({ socialCommentId: addLeadId, funnelId })
      setAddLeadId(null)
      invalidate()
    } catch (err) {
      setAddLeadError(parseApiError(err))
    } finally {
      setAddLeadBusy(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_TABS.map((tab) => {
            const count = tab.id === 'all' ? pending.length : sectionCounts[tab.id]
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {tab.label} ({count})
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => setSort(v as 'priority' | 'newest')}>
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
          <div className="inline-flex items-center rounded-lg border p-0.5">
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setViewMode('list')} aria-label="List view">
              <List />
            </Button>
            <Button variant={viewMode === 'cards' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setViewMode('cards')} aria-label="Cards view">
              <LayoutGrid />
            </Button>
            <Button variant={viewMode === 'compact' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setViewMode('compact')} aria-label="Compact view">
              <Rows3 />
            </Button>
          </div>
        </div>
      </div>

      {pendingQ.error || queueError ? (
        <p className="text-destructive px-4 pt-3 text-sm">{queueError || parseApiError(pendingQ.error)}</p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {pendingQ.isLoading && !pendingQ.data ? (
          <p className="text-muted-foreground text-sm">Loading review queue…</p>
        ) : filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-12 text-center">
            <p className="text-sm font-medium">You're all caught up 🎉</p>
            <p className="text-muted-foreground text-xs">No comments waiting for review in this filter.</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-3">
            {(filter === 'all' ? SECTION_ORDER : [filter]).map((section) => {
              const sectionItems = filtered.filter((i) => triageSectionForComment(i) === section)
              if (sectionItems.length === 0) return null
              return (
                <IntentSection key={section} section={section} count={sectionItems.length} defaultOpen={section !== 'low_confidence'}>
                  {sectionItems.map((item) => (
                    <ReviewCard
                      key={item.id}
                      item={item}
                      onApprove={() => void onPrimary(item.id)}
                      onIgnore={() => void runQueueAction([item.id], 'ignore')}
                    />
                  ))}
                </IntentSection>
              )
            })}
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <ReviewCardTile
                key={item.id}
                item={item}
                onOpen={() => setDetailId(item.id)}
                onApprove={() => void onPrimary(item.id)}
                onIgnore={() => void runQueueAction([item.id], 'ignore')}
              />
            ))}
          </div>
        ) : (
          <div className="bg-card overflow-hidden rounded-xl border">
            {filtered.map((item) => (
              <ReviewRow
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                onToggleSelect={() =>
                  setSelected((prev) => {
                    const next = new Set(prev)
                    if (next.has(item.id)) next.delete(item.id)
                    else next.add(item.id)
                    return next
                  })
                }
                onOpen={() => setDetailId(item.id)}
              />
            ))}
          </div>
        )}

        {recentHandled.length > 0 ? (
          <div className="mt-6">
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">Recently handled</p>
            <div className="space-y-2">
              {recentHandled.slice(0, 6).map((item) => (
                <div key={item.id} className="bg-card flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                  <span className="truncate">
                    @{item.username} · {item.commentText}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={item.status === 'approved' ? 'default' : 'outline'} className="capitalize">
                      {item.status}
                    </Badge>
                    {!item.leadId ? (
                      <Button size="xs" variant="outline" onClick={() => { setAddLeadId(item.id); setFunnelId(funnels[0]?.id ?? ''); setAddLeadError('') }}>
                        Add to lead
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {viewMode === 'compact' ? (
        <BulkActionBar
          count={selected.size}
          mixedIntents={mixedIntents}
          primaryLabel={mixedIntents ? 'Approve Selected' : TRIAGE_THEME[primarySection].actionLabel + ' Selected'}
          onClear={() => setSelected(new Set())}
          onIgnore={() => void runQueueAction([...selected], 'ignore')}
          onApprove={() => {
            if (mixedIntents || !primarySection) return
            const kind = primaryActionFor(primarySection).kind
            if (kind === 'review') {
              const first = selectedItems[0]
              if (first) setDetailId(first.id)
              return
            }
            void (async () => {
              if (kind === 'approve_dm') {
                const ok = await confirm({
                  title: `Send a DM to ${selected.size} customers?`,
                  description: 'This cannot be undone.',
                  confirmLabel: 'Send DMs',
                })
                if (!ok) return
              }
              void runQueueAction(
                [...selected],
                kind === 'approve_dm' ? 'approve_dm' : kind === 'escalate' ? 'escalate' : 'approve_reply',
              )
            })()
          }}
        />
      ) : null}

      <Sheet open={detailItem != null} onOpenChange={(open) => !open && setDetailId(null)}>
        <SheetContent side="right" className="sm:max-w-md">
          {detailItem ? (
            <>
              <SheetHeader>
                <SheetTitle>Comment detail</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4">
                <ReviewCard
                  item={detailItem}
                  onApprove={() => void onPrimary(detailItem.id)}
                  onIgnore={() => void runQueueAction([detailItem.id], 'ignore')}
                  onAddLead={() => { setAddLeadId(detailItem.id); setFunnelId(funnels[0]?.id ?? ''); setAddLeadError('') }}
                  addLeadBusy={addLeadBusy && addLeadId === detailItem.id}
                />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <AddLeadDialog
        open={addLeadId != null}
        funnels={funnels}
        loading={funnelsQ.isLoading}
        busy={addLeadBusy}
        error={addLeadError}
        funnelId={funnelId}
        onFunnelId={setFunnelId}
        onClose={() => setAddLeadId(null)}
        onConfirm={() => void confirmAddLead()}
      />

      {runningIds.size > 0 ? <span className="sr-only">Working on {runningIds.size} items</span> : null}
    </div>
  )
}
