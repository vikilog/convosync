import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { ArrowLeft, CheckCircle2, Clock, LayoutGrid, List, Plus, Search, Target, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

import { AddBoardSheet } from '@/components/leads/AddBoardSheet'
import { LeadCard } from '@/components/leads/LeadCard'
import { LeadColumn } from '@/components/leads/LeadColumn'
import { LeadDetailSheet } from '@/components/leads/LeadDetailSheet'
import { LeadListTable } from '@/components/leads/LeadListTable'
import { NewLeadSheet } from '@/components/leads/NewLeadSheet'
import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { EmptyState } from '@/components/common/EmptyState'
import { StatTile } from '@/components/stat-tile'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/httpClient'
import { leadMatchesFilters, resolveDropStageId } from '@/lib/leadFilters'
import { pathForLeads } from '@/lib/leadPaths'
import { realLeadFunnelsService } from '@/services/realLeadFunnels.service'
import { realLeadsService, type Lead, type LeadSource } from '@/services/realLeads.service'

type SourceFilter = 'all' | LeadSource
type BoardView = 'kanban' | 'list'

export function FunnelBoard({ funnelId }: { funnelId: string }) {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { data: funnelsRes, isLoading: funnelsLoading, refetch: refetchFunnels } = realLeadFunnelsService.useList()
  const funnels = funnelsRes?.funnels ?? []
  const activeFunnel = funnels.find((f) => f.id === funnelId) ?? null
  const stages = useMemo(
    () => [...(activeFunnel?.stages ?? [])].sort((a, b) => a.position - b.position),
    [activeFunnel]
  )
  const hasFinalBoard = stages.some((s) => s.isFinal)

  const { data: leadsRes, isLoading: leadsLoading, isError, error, refetch } = realLeadsService.useList(funnelId)
  const { data: insights } = realLeadFunnelsService.useInsights(funnelId)
  const leads = leadsRes?.leads ?? []

  const createLeadMutation = realLeadsService.useCreate(funnelId)
  const updateLeadMutation = realLeadsService.useUpdate(funnelId)
  const convertLeadMutation = realLeadsService.useConvertToContact(funnelId)
  const createStage = realLeadFunnelsService.useCreateStage(funnelId)
  const updateStage = realLeadFunnelsService.useUpdateStage(funnelId)
  const deleteStage = realLeadFunnelsService.useDeleteStage(funnelId)

  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [view, setView] = useState<BoardView>('kanban')
  const [openLeadId, setOpenLeadId] = useState<string | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [addBoardOpen, setAddBoardOpen] = useState(false)
  const [convertingIds, setConvertingIds] = useState<Set<string>>(new Set())
  const convertingRef = useRef<Set<string>>(new Set())
  const dragGenerationRef = useRef<Record<string, number>>({})

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  useEffect(() => {
    setOpenLeadId(null)
    setQuery('')
    setSourceFilter('all')
  }, [funnelId])

  const filtered = useMemo(
    () => leads.filter((l) => leadMatchesFilters(l, query, sourceFilter)),
    [leads, query, sourceFilter]
  )

  const byStage = useMemo(() => {
    const map: Record<string, Lead[]> = {}
    for (const s of stages) map[s.id] = []
    const fallbackId = stages[0]?.id
    for (const lead of filtered) {
      const key = lead.stageId && map[lead.stageId] ? lead.stageId : fallbackId
      if (key) map[key].push(lead)
    }
    return map
  }, [filtered, stages])

  const openLead = leads.find((l) => l.id === openLeadId) ?? null
  const activeDragLead = leads.find((l) => l.id === activeDragId) ?? null

  const handleDragStart = (event: DragStartEvent) => setActiveDragId(String(event.active.id))

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return
    const leadId = String(active.id)
    const nextStageId = resolveDropStageId(String(over.id), stages, leads)
    const lead = leads.find((l) => l.id === leadId)
    if (!lead || !nextStageId || lead.stageId === nextStageId) return
    const generation = (dragGenerationRef.current[leadId] ?? 0) + 1
    dragGenerationRef.current[leadId] = generation
    updateLeadMutation.mutate(
      { id: leadId, patch: { stageId: nextStageId } },
      {
        onError: (err) => {
          if (dragGenerationRef.current[leadId] !== generation) return
          toast.error('Failed to move lead', { description: err instanceof ApiError ? err.message : undefined })
        },
      }
    )
  }

  const convertLead = async (lead: Lead) => {
    if (convertingRef.current.has(lead.id)) return
    const ok = await confirm({
      title: `Convert ${lead.name || 'this lead'} to a contact?`,
      description: "This can't be undone from here.",
      confirmLabel: 'Add to contact',
    })
    if (!ok) return
    convertingRef.current.add(lead.id)
    setConvertingIds((prev) => new Set(prev).add(lead.id))
    convertLeadMutation.mutate(lead.id, {
      onError: (err) =>
        toast.error('Convert failed', { description: err instanceof ApiError ? err.message : undefined }),
      onSettled: () => {
        convertingRef.current.delete(lead.id)
        setConvertingIds((prev) => {
          const next = new Set(prev)
          next.delete(lead.id)
          return next
        })
      },
    })
  }

  const renameBoard = async (stageId: string, name: string) => {
    await updateStage.mutateAsync({ stageId, patch: { name } })
  }

  const removeBoard = async (stageId: string) => {
    const stage = stages.find((s) => s.id === stageId)
    const count = (byStage[stageId] ?? []).length
    const ok = await confirm({
      title: `Delete “${stage?.name ?? 'board'}”?`,
      description:
        count > 0
          ? `${count} lead${count === 1 ? '' : 's'} will move to another board.`
          : undefined,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    deleteStage.mutate(stageId, {
      onError: (err) =>
        toast.error('Failed to delete board', { description: err instanceof ApiError ? err.message : undefined }),
    })
  }

  if (!funnelsLoading && funnels.length > 0 && !activeFunnel) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col p-4">
        <Button variant="ghost" size="sm" className="mb-3 w-fit" onClick={() => navigate(pathForLeads())}>
          <ArrowLeft />
          All funnels
        </Button>
        <EmptyState
          icon={Target}
          title="Funnel not found"
          description="This funnel may have been deleted."
        />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="shrink-0 space-y-4 border-b p-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-1"
            onClick={() => {
              setOpenLeadId(null)
              navigate(pathForLeads())
              void refetchFunnels()
            }}
          >
            <ArrowLeft />
            All funnels
          </Button>
          <h2 className="text-base font-semibold">{activeFunnel?.name ?? 'Funnel'}</h2>
          <p className="text-muted-foreground truncate text-xs">
            {activeFunnel?.goal || activeFunnel?.description || 'Kanban board'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Entered funnel" value={insights?.entered ?? leads.length} icon={Target} />
          <StatTile label="Converted" value={insights?.converted ?? 0} icon={CheckCircle2} tone="text-primary" />
          <StatTile
            label="Conversion"
            value={insights ? `${Math.round(insights.conversionRate * 100)}%` : '—'}
            icon={TrendingUp}
          />
          <StatTile
            label="Avg. days to contact"
            value={insights?.avgDaysToConvert != null ? String(insights.avgDaysToConvert) : '—'}
            icon={Clock}
          />
        </div>
        {insights?.byStage?.length ? (
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              Board moves: {insights.stageMoves}
            </Badge>
            {insights.byStage.map((s) => (
              <Badge key={s.stageId} variant={s.isFinal ? 'secondary' : 'outline'} className="text-[10px]">
                {s.name}
                {s.isFinal ? ' · Final' : ''}: {s.count}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search leads…"
                className="pl-8"
              />
            </div>
            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as SourceFilter)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
            <div className="inline-flex items-center rounded-lg border p-0.5">
              <Button
                variant={view === 'kanban' ? 'secondary' : 'ghost'}
                size="icon-sm"
                aria-label="Kanban view"
                onClick={() => setView('kanban')}
              >
                <LayoutGrid />
              </Button>
              <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="icon-sm"
                aria-label="List view"
                onClick={() => setView('list')}
              >
                <List />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddBoardOpen(true)}>
              <Plus />
              Add board
            </Button>
            <NewLeadSheet
              disabled={!funnelId}
              funnelName={activeFunnel?.name}
              onCreate={(input) =>
                createLeadMutation.mutate(input, {
                  onSuccess: (res) => {
                    if (res.lead) setOpenLeadId(res.lead.id)
                  },
                  onError: (err) =>
                    toast.error('Failed to create lead', {
                      description: err instanceof ApiError ? err.message : undefined,
                    }),
                })
              }
            />
          </div>
        </div>
      </div>

      {isError ? (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error instanceof Error ? error.message : 'Failed to load leads'}{' '}
          <button type="button" className="underline" onClick={() => void refetch()}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {funnelsLoading || leadsLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : view === 'list' ? (
          <LeadListTable
            leads={filtered}
            stages={stages}
            convertingIds={convertingIds}
            onOpen={(lead) => setOpenLeadId(lead.id)}
            onConvert={(lead) => void convertLead(lead)}
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveDragId(null)}
          >
            <div className="flex h-full min-h-[420px] min-w-max items-start gap-3">
              {stages.map((stage) => (
                <div key={stage.id} className="flex items-start gap-3">
                  {stage.isFinal ? (
                    <button
                      type="button"
                      onClick={() => setAddBoardOpen(true)}
                      className="text-muted-foreground hover:border-primary/40 hover:text-primary flex w-56 shrink-0 cursor-pointer flex-col items-center justify-center gap-2 self-stretch rounded-2xl border border-dashed text-sm font-semibold"
                    >
                      <Plus className="size-5" />
                      Add board
                    </button>
                  ) : null}
                  <LeadColumn
                    stage={stage}
                    leads={byStage[stage.id] ?? []}
                    canDelete={stages.length > 1}
                    convertingIds={convertingIds}
                    onOpenLead={(lead) => setOpenLeadId(lead.id)}
                    onConvertLead={(lead) => void convertLead(lead)}
                    onRename={renameBoard}
                    onDelete={(id) => void removeBoard(id)}
                  />
                </div>
              ))}
              {!hasFinalBoard ? (
                <button
                  type="button"
                  onClick={() => setAddBoardOpen(true)}
                  className="text-muted-foreground hover:border-primary/40 hover:text-primary flex w-56 shrink-0 cursor-pointer flex-col items-center justify-center gap-2 self-stretch rounded-2xl border border-dashed text-sm font-semibold"
                >
                  <Plus className="size-5" />
                  Add board
                </button>
              ) : null}
            </div>
            <DragOverlay dropAnimation={null}>
              {activeDragLead ? <LeadCard lead={activeDragLead} dragging /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <LeadDetailSheet
        lead={openLead}
        stages={stages}
        onOpenChange={(open) => {
          if (!open) setOpenLeadId(null)
        }}
        onUpdate={(id, patch) => updateLeadMutation.mutate({ id, patch })}
        onConvert={(lead) => void convertLead(lead)}
      />

      <AddBoardSheet
        open={addBoardOpen}
        hasFinalBoard={hasFinalBoard}
        saving={createStage.isPending}
        onOpenChange={setAddBoardOpen}
        onSave={(data) =>
          createStage.mutate(data, {
            onSuccess: () => setAddBoardOpen(false),
            onError: (err) =>
              toast.error('Failed to add board', { description: err instanceof ApiError ? err.message : undefined }),
          })
        }
      />
    </div>
  )
}
