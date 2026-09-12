import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Plus, Target, Users } from 'lucide-react'
import { toast } from 'sonner'

import { FunnelFormSheet } from '@/components/leads/FunnelFormSheet'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/httpClient'
import { pathForLeadFunnel } from '@/lib/leadPaths'
import { realLeadFunnelsService, type FunnelWriteInput, type LeadFunnel } from '@/services/realLeadFunnels.service'

export function FunnelList() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = realLeadFunnelsService.useList()
  const createFunnel = realLeadFunnelsService.useCreate()
  const updateFunnel = realLeadFunnelsService.useUpdate()
  const funnels = data?.funnels ?? []
  const [createOpen, setCreateOpen] = useState(false)
  const [editFunnel, setEditFunnel] = useState<LeadFunnel | null>(null)

  const save = (input: FunnelWriteInput) => {
    if (editFunnel) {
      updateFunnel.mutate(
        { id: editFunnel.id, patch: input },
        {
          onSuccess: () => setEditFunnel(null),
          onError: (err) =>
            toast.error('Could not save funnel', { description: err instanceof ApiError ? err.message : undefined }),
        }
      )
      return
    }
    createFunnel.mutate(input, {
      onSuccess: (res) => {
        setCreateOpen(false)
        navigate(pathForLeadFunnel(res.funnel.id))
      },
      onError: (err) =>
        toast.error('Could not create funnel', { description: err instanceof ApiError ? err.message : undefined }),
    })
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-y-auto">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="text-base font-semibold">Lead funnels</h2>
          <p className="text-muted-foreground text-xs">
            Create a funnel first — then open its Kanban board. No auto-created funnels.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus />
          Create funnel
        </Button>
      </div>

      <div className="p-4">
        {isError ? (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {error instanceof Error ? error.message : 'Failed to load funnels'}{' '}
            <button type="button" className="underline" onClick={() => void refetch()}>
              Retry
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : funnels.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No funnels yet"
            description="Create a funnel with a name, description, and goal. Social Listening automation stays off until you pick one in settings."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus />
                Create funnel
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {funnels.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => navigate(pathForLeadFunnel(f.id))}
                className="hover:bg-muted/40 bg-card cursor-pointer rounded-xl border p-4 text-left transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{f.name}</p>
                  <span className="text-muted-foreground shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                    {f.leadCount} leads
                  </span>
                </div>
                <p className="text-muted-foreground mt-2 line-clamp-2 text-xs">
                  {f.description || 'No description'}
                </p>
                {f.goal ? (
                  <p className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <Target className="size-3" />
                    {f.goal}
                  </p>
                ) : null}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-primary text-[11px] font-semibold">Open board →</span>
                  <span
                    role="button"
                    tabIndex={0}
                    className="text-muted-foreground hover:text-foreground ml-auto text-[11px] font-semibold"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditFunnel(f)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation()
                        setEditFunnel(f)
                      }
                    }}
                  >
                    <Pencil className="mr-0.5 inline size-3" />
                    Edit
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <FunnelFormSheet
        open={createOpen || editFunnel != null}
        funnel={editFunnel}
        saving={createFunnel.isPending || updateFunnel.isPending}
        onOpenChange={(next) => {
          if (next) return
          setCreateOpen(false)
          setEditFunnel(null)
        }}
        onSave={save}
      />
    </div>
  )
}
