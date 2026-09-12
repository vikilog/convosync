import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, List, Sparkles } from 'lucide-react'

import { AgentGridCard, AgentListRow } from '@/components/ai-agent/AgentCard'
import { NewAgentSheet, type NewAgentInput } from '@/components/ai-agent/NewAgentSheet'
import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { EmptyState } from '@/components/common/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { realAgentsService, type Agent } from '@/services/realAgents.service'

type ViewMode = 'list' | 'grid'

export function AIAgentsPage() {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { data: agents = [], isLoading, isError } = realAgentsService.useList()
  const createAgentMutation = realAgentsService.useCreate()
  const removeAgent = realAgentsService.useRemove()
  const toggleAgent = realAgentsService.useToggle()
  const duplicateAgent = realAgentsService.useDuplicate()

  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const liveCount = useMemo(() => agents.filter((a) => a.isEnabled).length, [agents])

  const createAgent = (input: NewAgentInput) => {
    createAgentMutation.mutate(input, {
      onSuccess: (agent) => navigate(`/ai-agent/${agent.id}/profile`),
    })
  }

  const handleDelete = async (agent: Agent) => {
    const ok = await confirm({
      title: `Delete "${agent.name}"?`,
      description: 'This agent will stop responding immediately. This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) removeAgent.mutate(agent.id)
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">AI Agent</h1>
            {agents.length > 0 ? (
              <Badge variant="outline">
                {agents.length} total · {liveCount} live
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground text-sm">Build and manage your agents from one place.</p>
        </div>
        <div className="flex items-center gap-2">
          {agents.length > 0 ? (
            <div className="inline-flex items-center rounded-lg border p-0.5">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon-sm"
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon-sm"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <LayoutGrid />
              </Button>
            </div>
          ) : null}
          <NewAgentSheet onCreate={createAgent} pending={createAgentMutation.isPending} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-xl border p-4 text-sm">
            Couldn't load agents.
          </div>
        ) : agents.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No agents yet"
            description="Create your first AI agent to automate customer conversations."
          />
        ) : viewMode === 'list' ? (
          <div className="bg-card overflow-hidden rounded-xl border">
            {agents.map((agent) => (
              <AgentListRow
                key={agent.id}
                agent={agent}
                onOpen={() => navigate(`/ai-agent/${agent.id}/profile`)}
                onDelete={() => void handleDelete(agent)}
                onToggle={() => toggleAgent.mutate(agent.id)}
                onDuplicate={() => duplicateAgent.mutate(agent.id)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent) => (
              <AgentGridCard
                key={agent.id}
                agent={agent}
                onOpen={() => navigate(`/ai-agent/${agent.id}/profile`)}
                onDelete={() => void handleDelete(agent)}
                onToggle={() => toggleAgent.mutate(agent.id)}
                onDuplicate={() => duplicateAgent.mutate(agent.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
