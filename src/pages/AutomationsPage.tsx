import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, FileText, LayoutGrid, Search, Workflow } from 'lucide-react'

import { AutomationCard } from '@/components/automations/AutomationCard'
import { NewAutomationSheet, type NewAutomationInput } from '@/components/automations/NewAutomationSheet'
import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatTile } from '@/components/stat-tile'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { pathForAutomation, pathForAutomationGallery } from '@/lib/automationPaths'
import { channelAllowedByPlan } from '@/lib/planChannels'
import {
  realAutomationsService,
  useAutomationsKeepAlive,
  type Automation,
  type AutomationChannel,
  type AutomationStatus,
} from '@/services/realAutomations.service'
import { realBillingService } from '@/services/realBilling.service'

type ChannelFilter = 'all' | AutomationChannel
type StatusFilter = 'all' | AutomationStatus

export function AutomationsPage() {
  useAutomationsKeepAlive()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { data: automations = [], isLoading, isError } = realAutomationsService.useList()
  const removeAutomation = realAutomationsService.useRemove()
  const createAutomation = realAutomationsService.useCreate()
  const publishAutomation = realAutomationsService.usePublish()
  const pauseAutomation = realAutomationsService.usePause()
  const { data: subscription } = realBillingService.useSubscription()
  const planChannels = subscription?.currentPlan?.features?.channels
  const instagramAllowed = !subscription || channelAllowedByPlan(planChannels, 'instagram')

  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [query, setQuery] = useState('')

  const eligible = useMemo(
    () => (instagramAllowed ? automations : automations.filter((a) => a.channel !== 'instagram')),
    [automations, instagramAllowed]
  )

  const stats = useMemo(
    () => ({
      total: eligible.length,
      published: eligible.filter((a) => a.status === 'published').length,
      draft: eligible.filter((a) => a.status === 'draft').length,
    }),
    [eligible]
  )

  const filtered = useMemo(() => {
    return eligible.filter((a) => {
      if (channelFilter !== 'all' && a.channel !== channelFilter) return false
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (query.trim() && !a.name.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [eligible, channelFilter, statusFilter, query])

  const openAutomation = (automation: Automation) =>
    navigate(pathForAutomation(automation.id, automation.channel))

  const deleteAutomation = async (automation: Automation) => {
    const ok = await confirm({
      title: `Delete "${automation.name}"?`,
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) removeAutomation.mutate({ id: automation.id, channel: automation.channel })
  }

  const create = (input: NewAutomationInput) => {
    createAutomation.mutate(input, {
      onSuccess: (row) => navigate(pathForAutomation(row.id, input.channel)),
    })
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="shrink-0 space-y-4 border-b p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile label="Total automations" value={stats.total} icon={Workflow} />
          <StatTile label="Published" value={stats.published} icon={CheckCircle2} tone="text-primary" />
          <StatTile label="Draft" value={stats.draft} icon={FileText} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Tabs value={channelFilter} onValueChange={(v) => setChannelFilter(v as ChannelFilter)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                {instagramAllowed ? <TabsTrigger value="instagram">Instagram</TabsTrigger> : null}
              </TabsList>
            </Tabs>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <TabsList>
                <TabsTrigger value="all">Any status</TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
                <TabsTrigger value="draft">Draft / paused</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(pathForAutomationGallery())}>
              <LayoutGrid />
              Gallery
            </Button>
            <NewAutomationSheet
              onCreate={create}
              pending={createAutomation.isPending}
              instagramAllowed={instagramAllowed}
              onBrowseGallery={() => navigate(pathForAutomationGallery())}
            />
          </div>
        </div>

        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search automations…"
            className="pl-8"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-xl border p-4 text-sm">
            Couldn&apos;t load automations.
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Workflow}
            title="No automations found"
            description="Try changing the filters or create a new automation."
          />
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((automation) => (
              <AutomationCard
                key={`${automation.channel}-${automation.id}`}
                automation={automation}
                onOpen={() => openAutomation(automation)}
                onEditFlow={() => openAutomation(automation)}
                onDelete={() => void deleteAutomation(automation)}
                onPublish={() => publishAutomation.mutate({ id: automation.id, channel: automation.channel })}
                onPause={() => pauseAutomation.mutate({ id: automation.id, channel: automation.channel })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
