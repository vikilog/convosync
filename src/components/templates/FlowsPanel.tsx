import { useState } from 'react'
import { LayoutGrid, Pencil, Plus, Trash2 } from 'lucide-react'

import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { EmptyState } from '@/components/common/EmptyState'
import { WhatsAppFlowEditor } from '@/components/templates/WhatsAppFlowEditor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { realFlowsService, type WhatsAppFlow } from '@/services/realFlows.service'

export function FlowsPanel({ enabled }: { enabled: boolean }) {
  const { data, isLoading, isError } = realFlowsService.useList()
  const removeMutation = realFlowsService.useRemove()
  const confirm = useConfirm()
  const [query, setQuery] = useState('')
  const [editorId, setEditorId] = useState<string | 'new' | null>(null)
  const flows = data?.items ?? []
  const filtered = flows.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))

  if (!enabled) {
    return (
      <div className="p-4">
        <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-xl border p-4 text-sm">
          WhatsApp Flows isn't enabled for this workspace yet. Request access from Integrations.
        </div>
      </div>
    )
  }

  if (editorId !== null) {
    return (
      <WhatsAppFlowEditor
        flowId={editorId === 'new' ? null : editorId}
        onBack={() => setEditorId(null)}
      />
    )
  }

  const remove = async (flow: WhatsAppFlow) => {
    const ok = await confirm({
      title: `Delete "${flow.name}"?`,
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) removeMutation.mutate(flow.id)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4">
        <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-xl border p-4 text-sm">
          WhatsApp Flows isn't enabled for this workspace yet. Request access from Integrations.
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b p-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search flows…"
          className="min-w-[220px] max-w-sm flex-1"
        />
        <Button size="sm" onClick={() => setEditorId('new')}>
          <Plus />
          Create flow
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title={flows.length === 0 ? 'No WhatsApp flows yet' : 'No flows match your search'}
          description="Flows are interactive multi-screen forms for booking, surveys, or lead capture."
          className="m-4 h-auto"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 overflow-auto p-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((flow) => (
            <Card key={flow.id} size="sm" className="gap-2">
              <CardHeader className="gap-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{flow.name}</p>
                  <Badge
                    variant={flow.status === 'published' ? 'default' : 'outline'}
                    className="shrink-0 capitalize"
                  >
                    {flow.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-xs">
                  Updated{' '}
                  {new Date(flow.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </p>
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-2 bg-transparent">
                <Button variant="outline" size="sm" onClick={() => setEditorId(flow.id)}>
                  <Pencil />
                  {flow.status === 'published' ? 'View' : 'Edit'}
                </Button>
                <Button variant="ghost" size="icon-sm" title="Delete" onClick={() => void remove(flow)}>
                  <Trash2 />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
