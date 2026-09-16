import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  FileText,
  FolderKanban,
  LayoutGrid,
  Mail,
  MessageSquare,
  MessageSquareText,
  Pencil,
  Plus,
  RefreshCw,
  RotateCw,
  Send,
  Trash2,
} from 'lucide-react'

import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { EmptyState } from '@/components/common/EmptyState'
import { CannedResponsesPanel } from '@/components/templates/CannedResponsesPanel'
import { FlowsPanel } from '@/components/templates/FlowsPanel'
import { ManageTemplateGroupsSheet } from '@/components/templates/ManageTemplateGroupsSheet'
import { NewWhatsAppTemplateSheet } from '@/components/templates/NewWhatsAppTemplateSheet'
import { TemplateInsightsPanel } from '@/components/templates/TemplateInsightsPanel'
import {
  REAL_TEMPLATE_STATUS_ICON,
  realTemplateStatusBadgeVariant,
} from '@/components/templates/template-status'
import { WhatsAppBubblePreview } from '@/components/templates/WhatsAppBubblePreview'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBlobUrl } from '@/hooks/useBlobUrl'
import { headerFormatFromApi } from '@/lib/templateBuilderUtils'
import { emailTemplateBuilderPath } from '@/lib/easyEmailPayload'
import { stripHtmlToText } from '@/lib/sanitizeEmailHtml'
import {
  realEmailTemplatesService,
  type EmailTemplateRecord,
} from '@/services/realEmailTemplates.service'
import { realIntegrationsService } from '@/services/realIntegrations.service'
import {
  realTemplatesService,
  templateGroupsService,
  type TemplateCategory as RealTemplateCategory,
  type TemplateGroup,
  type TemplateStatus as RealTemplateStatus,
  type WhatsAppTemplate as RealWhatsAppTemplate,
} from '@/services/realTemplates.service'

const REAL_STATUSES: RealTemplateStatus[] = ['draft', 'pending', 'approved', 'rejected', 'paused', 'disabled']
const REAL_CATEGORIES: RealTemplateCategory[] = ['Utility', 'Marketing', 'Authentication']

type Channel = 'whatsapp' | 'email' | 'canned' | 'flows' | 'insights'
const CHANNELS: Channel[] = ['whatsapp', 'email', 'canned', 'flows', 'insights']

function parseChannel(raw: string | null): Channel | null {
  return raw && CHANNELS.includes(raw as Channel) ? (raw as Channel) : null
}

export function TemplatesPage() {
  const confirm = useConfirm()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: waStatus } = realIntegrationsService.useWhatsAppStatus()
  const { data: flowStatus } = realIntegrationsService.useWhatsAppFlowStatus()
  const whatsappConnected = Boolean(waStatus?.connected || (waStatus?.accounts?.length ?? 0) > 0)
  const flowEnabled = Boolean(flowStatus?.enabled)

  const { data: waTemplates = [], isLoading: waLoading, isError: waError } = realTemplatesService.useList()
  const { data: groups = [] } = templateGroupsService.useList()
  const updateWaMutation = realTemplatesService.useUpdate()
  const { data: emailTemplates = [], isLoading: emailLoading, isError: emailError } =
    realEmailTemplatesService.useList()
  const submitWaMutation = realTemplatesService.useSubmit()
  const refreshWaMutation = realTemplatesService.useRefreshStatus()
  const syncWaMutation = realTemplatesService.useSync()
  const removeWaTemplate = realTemplatesService.useRemove()
  const removeEmailTemplate = realEmailTemplatesService.useRemove()

  const insightsParam = searchParams.get('insights')
  const tabParam = parseChannel(searchParams.get('tab'))
  const [channel, setChannel] = useState<Channel>(() => {
    if (insightsParam) return 'insights'
    if (tabParam) return tabParam
    return 'whatsapp'
  })
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | RealTemplateCategory>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | RealTemplateStatus | 'draft' | 'active'>('all')
  const [activeGroup, setActiveGroup] = useState<'__folders__' | '__all__' | '__ungrouped__' | string>(
    '__folders__',
  )
  const [waSheetOpen, setWaSheetOpen] = useState(false)
  const [waEditId, setWaEditId] = useState<string | null>(null)
  const [manageGroupsOpen, setManageGroupsOpen] = useState(false)

  useEffect(() => {
    if (insightsParam) setChannel('insights')
  }, [insightsParam])

  useEffect(() => {
    if (channel === 'whatsapp' && waStatus && !whatsappConnected) {
      setChannel('canned')
    }
    if (channel === 'flows' && flowStatus && !flowEnabled) {
      setChannel('canned')
    }
  }, [channel, waStatus, whatsappConnected, flowStatus, flowEnabled])

  const setChannelAndUrl = (next: Channel, insightsId?: string | null) => {
    setChannel(next)
    const nextParams = new URLSearchParams(searchParams)
    if (next === 'insights' && insightsId) nextParams.set('insights', insightsId)
    else nextParams.delete('insights')
    if (next !== 'whatsapp') nextParams.set('tab', next)
    else nextParams.delete('tab')
    setSearchParams(nextParams, { replace: true })
  }

  const filteredWa = useMemo(() => {
    const q = query.trim().toLowerCase()
    return waTemplates.filter((t) => {
      if (categoryFilter !== 'all' && t.category.toLowerCase() !== categoryFilter.toLowerCase()) return false
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (activeGroup === '__ungrouped__' && t.groupId) return false
      if (
        activeGroup !== '__folders__' &&
        activeGroup !== '__all__' &&
        activeGroup !== '__ungrouped__' &&
        t.groupId !== activeGroup
      )
        return false
      if (q && !t.name.toLowerCase().includes(q) && !t.bodyPattern.toLowerCase().includes(q)) return false
      return true
    })
  }, [waTemplates, categoryFilter, statusFilter, activeGroup, query])

  const ungroupedCount = useMemo(() => waTemplates.filter((t) => !t.groupId).length, [waTemplates])

  const inFolderLanding =
    channel === 'whatsapp' && activeGroup === '__folders__' && !query.trim() && categoryFilter === 'all' &&
    statusFilter === 'all'

  const activeGroupLabel =
    activeGroup === '__all__'
      ? 'All templates'
      : activeGroup === '__ungrouped__'
        ? 'Ungrouped'
        : activeGroup === '__folders__'
          ? 'Search results'
          : groups.find((g) => g.id === activeGroup)?.name ?? 'Group'

  const openGroup = (id: '__all__' | '__ungrouped__' | string) => {
    setActiveGroup(id)
    setQuery('')
    setCategoryFilter('all')
    setStatusFilter('all')
  }

  const backToGroups = () => {
    setActiveGroup('__folders__')
    setQuery('')
    setCategoryFilter('all')
    setStatusFilter('all')
  }

  const filteredEmail = useMemo(() => {
    const q = query.trim().toLowerCase()
    return emailTemplates.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (!q) return true
      return (
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        stripHtmlToText(t.htmlBody).toLowerCase().includes(q)
      )
    })
  }, [emailTemplates, statusFilter, query])

  const deleteWa = async (template: RealWhatsAppTemplate) => {
    const ok = await confirm({
      title: `Delete "${template.name}"?`,
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) removeWaTemplate.mutate(template.id)
  }

  const submitWa = async (template: RealWhatsAppTemplate) => {
    const ok = await confirm({
      title: `Submit "${template.name}" to Meta for review?`,
      description: "This can't be undone, and review can take up to 24 hours.",
      confirmLabel: 'Submit',
    })
    if (ok) submitWaMutation.mutate(template.id)
  }

  const changeWaGroup = (template: RealWhatsAppTemplate, groupId: string | null) => {
    updateWaMutation.mutate({ id: template.id, patch: { groupId } })
  }

  const deleteEmail = async (template: EmailTemplateRecord) => {
    const ok = await confirm({
      title: `Delete "${template.name}"?`,
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) removeEmailTemplate.mutate(template.id)
  }

  const listChannel = channel === 'whatsapp' || channel === 'email'

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="shrink-0 space-y-4 border-b p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={channel} onValueChange={(v) => setChannelAndUrl(v as Channel)}>
            <TabsList className="!h-7 p-0.5">
              {whatsappConnected ? (
                <TabsTrigger value="whatsapp" className="gap-1.5 px-2.5 text-[0.8rem]">
                  <MessageSquareText className="size-3.5" />
                  WhatsApp
                </TabsTrigger>
              ) : null}
              <TabsTrigger value="email" className="gap-1.5 px-2.5 text-[0.8rem]">
                <Mail className="size-3.5" />
                Email
              </TabsTrigger>
              <TabsTrigger value="canned" className="gap-1.5 px-2.5 text-[0.8rem]">
                <MessageSquare className="size-3.5" />
                Canned response
              </TabsTrigger>
              {flowEnabled ? (
                <TabsTrigger value="flows" className="gap-1.5 px-2.5 text-[0.8rem]">
                  <LayoutGrid className="size-3.5" />
                  Flows
                </TabsTrigger>
              ) : null}
              {whatsappConnected ? (
                <TabsTrigger value="insights" className="gap-1.5 px-2.5 text-[0.8rem]">
                  <BarChart3 className="size-3.5" />
                  Insights
                </TabsTrigger>
              ) : null}
            </TabsList>
          </Tabs>

          {channel === 'whatsapp' ? (
            <div className="flex items-center gap-2">
              {!inFolderLanding ? (
                <Button variant="outline" size="sm" onClick={backToGroups}>
                  <ArrowLeft />
                  Groups
                </Button>
              ) : null}
              <Button variant="outline" size="sm" onClick={() => setManageGroupsOpen(true)}>
                <FolderKanban />
                Manage groups
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncWaMutation.mutate()}
                disabled={syncWaMutation.isPending}
              >
                <RotateCw className={syncWaMutation.isPending ? 'animate-spin' : ''} />
                Fetch from Meta
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setWaEditId(null)
                  setWaSheetOpen(true)
                }}
              >
                <Plus />
                New template
              </Button>
            </div>
          ) : channel === 'email' ? (
            <Button size="sm" onClick={() => navigate(emailTemplateBuilderPath())}>
              <Plus />
              New template
            </Button>
          ) : null}
        </div>

        {channel === 'whatsapp' && !inFolderLanding ? (
          <p className="text-muted-foreground text-sm font-medium">{activeGroupLabel}</p>
        ) : null}

        {listChannel ? (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates…"
              className="min-w-[220px] flex-1"
            />
            {channel === 'whatsapp' ? (
              <Select
                value={categoryFilter}
                onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {REAL_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(channel === 'whatsapp' ? REAL_STATUSES : (['draft', 'active'] as const)).map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      {channel === 'canned' ? (
        <CannedResponsesPanel />
      ) : channel === 'flows' ? (
        <FlowsPanel enabled={flowEnabled} />
      ) : channel === 'insights' ? (
        <TemplateInsightsPanel initialId={insightsParam} />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto p-4">
          {channel === 'whatsapp' ? (
            !whatsappConnected ? (
              <EmptyState
                icon={MessageSquareText}
                title="WhatsApp isn't connected"
                description="Connect WhatsApp in Integrations to manage message templates."
              />
            ) : waLoading ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : waError ? (
              <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-xl border p-4 text-sm">
                Couldn't load templates.
              </div>
            ) : inFolderLanding ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                <GroupFolderCard
                  icon={LayoutGrid}
                  name="All templates"
                  count={waTemplates.length}
                  onClick={() => openGroup('__all__')}
                />
                {groups.map((g) => (
                  <GroupFolderCard
                    key={g.id}
                    icon={FolderKanban}
                    name={g.name}
                    count={g.templateCount}
                    onClick={() => openGroup(g.id)}
                  />
                ))}
                <GroupFolderCard
                  icon={FolderKanban}
                  name="Ungrouped"
                  count={ungroupedCount}
                  onClick={() => openGroup('__ungrouped__')}
                  muted
                />
              </div>
            ) : filteredWa.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No WhatsApp templates"
                description="Try changing the filters or create a new template."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredWa.map((template) => (
                  <WhatsAppTemplateCard
                    key={template.id}
                    template={template}
                    groups={groups}
                    onChangeGroup={(groupId) => changeWaGroup(template, groupId)}
                    onDelete={() => void deleteWa(template)}
                    onSubmit={() => void submitWa(template)}
                    onRefresh={() => refreshWaMutation.mutate(template.id)}
                    onEdit={() => {
                      setWaEditId(template.id)
                      setWaSheetOpen(true)
                    }}
                    onInsights={() => setChannelAndUrl('insights', template.id)}
                  />
                ))}
              </div>
            )
          ) : emailLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : emailError ? (
            <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-xl border p-4 text-sm">
              Couldn't load email templates.
            </div>
          ) : filteredEmail.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No email templates"
              description="Try changing the filters or create a new template."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredEmail.map((template) => (
                <EmailTemplateCard
                  key={template.id}
                  template={template}
                  onDelete={() => void deleteEmail(template)}
                  onEdit={() => navigate(emailTemplateBuilderPath(template.id))}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <NewWhatsAppTemplateSheet
        open={waSheetOpen}
        editId={waEditId}
        onOpenChange={(open) => {
          setWaSheetOpen(open)
          if (!open) setWaEditId(null)
        }}
      />
      <ManageTemplateGroupsSheet open={manageGroupsOpen} onOpenChange={setManageGroupsOpen} />
    </div>
  )
}

function GroupFolderCard({
  icon: Icon,
  name,
  count,
  onClick,
  muted,
}: {
  icon: typeof FolderKanban
  name: string
  count: number
  onClick: () => void
  muted?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:bg-accent hover:border-accent-foreground/20 flex items-center gap-3 rounded-xl border p-3 text-left transition-colors"
    >
      <div
        className={
          muted
            ? 'bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg'
            : 'bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg'
        }
      >
        <Icon className="size-4.5" />
      </div>
      <p className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</p>
      <span className="text-muted-foreground shrink-0 text-xs">
        {count} template{count === 1 ? '' : 's'}
      </span>
    </button>
  )
}

function WhatsAppTemplateCard({
  template,
  groups,
  onChangeGroup,
  onDelete,
  onSubmit,
  onRefresh,
  onEdit,
  onInsights,
}: {
  template: RealWhatsAppTemplate
  groups: TemplateGroup[]
  onChangeGroup: (groupId: string | null) => void
  onDelete: () => void
  onSubmit: () => void
  onRefresh: () => void
  onEdit: () => void
  onInsights: () => void
}) {
  const StatusIcon = REAL_TEMPLATE_STATUS_ICON[template.status]
  const mediaUrl = useBlobUrl(template.headerMediaStorageKey, realTemplatesService.fetchHeaderMedia)
  const canSubmit =
    template.status === 'draft' || template.status === 'rejected' || template.status === 'paused'
  const canInsights = template.status === 'approved' || template.status === 'paused'

  return (
    <Card size="sm" className="gap-2">
      <CardHeader className="gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Badge variant="outline" className="shrink-0 uppercase">
              {template.category}
            </Badge>
            <p className="truncate font-mono text-xs font-semibold">{template.name}</p>
          </div>
          <Badge
            variant={realTemplateStatusBadgeVariant(template.status)}
            className="shrink-0 gap-1 capitalize"
          >
            <StatusIcon className="size-3" />
            {template.status}
          </Badge>
        </div>
        {template.status === 'rejected' && template.rejectionReason ? (
          <p className="border-destructive/20 bg-destructive/10 text-destructive line-clamp-2 rounded-md border px-2 py-1 text-[11px]">
            Meta rejected: {template.rejectionReason}
          </p>
        ) : null}
        <Select
          value={template.groupId ?? 'ungrouped'}
          onValueChange={(v) => onChangeGroup(v === 'ungrouped' ? null : v)}
        >
          <SelectTrigger size="sm" className="h-6 w-fit gap-1 border-none px-1.5 text-[11px] shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ungrouped">Ungrouped</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="pointer-events-none">
        <WhatsAppBubblePreview
          headerFormat={headerFormatFromApi(template.headerFormat, Boolean(template.header))}
          header={template.header ?? ''}
          headerMediaUrl={mediaUrl}
          headerMediaFileName={template.headerMediaFileName ?? undefined}
          body={template.bodyPattern}
          footer={template.footer ?? ''}
          variableSamples={template.variables}
          buttonText={template.buttonText ?? ''}
        />
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 bg-transparent">
        <span className="text-muted-foreground text-xs">
          {template.language} ·{' '}
          {new Date(template.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
        </span>
        <div className="flex items-center gap-1">
          {canSubmit ? (
            <Button variant="ghost" size="icon-sm" title="Submit for review" onClick={onSubmit}>
              <Send />
            </Button>
          ) : null}
          {canInsights ? (
            <Button variant="ghost" size="icon-sm" title="View insights" onClick={onInsights}>
              <BarChart3 />
            </Button>
          ) : null}
          <Button variant="ghost" size="icon-sm" title="Refresh status" onClick={onRefresh}>
            <RefreshCw />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Edit" onClick={onEdit}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Delete" onClick={onDelete}>
            <Trash2 />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

function EmailTemplateCard({
  template,
  onDelete,
  onEdit,
}: {
  template: EmailTemplateRecord
  onDelete: () => void
  onEdit: () => void
}) {
  return (
    <Card size="sm" className="gap-2">
      <CardHeader className="gap-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold">{template.name}</p>
          <Badge variant={template.status === 'active' ? 'default' : 'outline'} className="capitalize">
            {template.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs">
            <Mail className="size-3.5" />
            Subject
          </p>
          <p className="mb-2 truncate text-sm font-medium">{template.subject}</p>
          <p className="text-muted-foreground line-clamp-3 text-xs">{stripHtmlToText(template.htmlBody)}</p>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 bg-transparent">
        <span className="text-muted-foreground text-xs">
          {template.updatedAt
            ? new Date(template.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
            : ''}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" title="Edit" onClick={onEdit}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Delete" onClick={onDelete}>
            <Trash2 />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
