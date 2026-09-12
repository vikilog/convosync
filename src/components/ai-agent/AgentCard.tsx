import { Bot, Copy, GitBranch, MessageSquare, Pause, Pencil, Play, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CATEGORY_LABELS } from '@/lib/aiAgentLabels'
import type { Agent } from '@/services/realAgents.service'

function StatusDot({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium ${enabled ? 'text-primary' : 'text-muted-foreground'}`}
    >
      <span className={`size-1.5 rounded-full ${enabled ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
      {enabled ? 'Live' : 'Offline'}
    </span>
  )
}

function Actions({
  agent,
  onEdit,
  onDelete,
  onToggle,
  onDuplicate,
}: {
  agent: Agent
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  onDuplicate: () => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        aria-label={agent.isEnabled ? 'Pause agent' : 'Resume agent'}
        title={agent.isEnabled ? 'Pause' : 'Resume'}
      >
        {agent.isEnabled ? <Pause /> : <Play />}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={(e) => {
          e.stopPropagation()
          onDuplicate()
        }}
        aria-label="Duplicate agent"
      >
        <Copy />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
        aria-label="Edit agent"
      >
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        aria-label="Delete agent"
      >
        <Trash2 />
      </Button>
    </div>
  )
}

export function AgentListRow({
  agent,
  onOpen,
  onDelete,
  onToggle,
  onDuplicate,
}: {
  agent: Agent
  onOpen: () => void
  onDelete: () => void
  onToggle: () => void
  onDuplicate: () => void
}) {
  return (
    <div className="group hover:bg-muted/40 flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Bot className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold">{agent.name}</p>
            <Badge variant="outline">{CATEGORY_LABELS[agent.category]}</Badge>
            <StatusDot enabled={agent.isEnabled} />
          </div>
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{agent.description}</p>
          <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3" />
              {agent.conversationsCount.toLocaleString()} chats
            </span>
            {agent.category === 'rule_based' ? (
              <span className="inline-flex items-center gap-1">
                <GitBranch className="size-3" />
                {agent.flowsCount} flows
              </span>
            ) : null}
          </p>
        </div>
      </button>
      <Actions agent={agent} onEdit={onOpen} onDelete={onDelete} onToggle={onToggle} onDuplicate={onDuplicate} />
    </div>
  )
}

export function AgentGridCard({
  agent,
  onOpen,
  onDelete,
  onToggle,
  onDuplicate,
}: {
  agent: Agent
  onOpen: () => void
  onDelete: () => void
  onToggle: () => void
  onDuplicate: () => void
}) {
  return (
    <div className="group bg-card hover:border-primary/30 flex flex-col rounded-xl border p-4 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
            <Bot className="size-5" />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="truncate text-sm font-semibold">{agent.name}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline">{CATEGORY_LABELS[agent.category]}</Badge>
              <StatusDot enabled={agent.isEnabled} />
            </div>
          </div>
        </button>
        <Actions agent={agent} onEdit={onOpen} onDelete={onDelete} onToggle={onToggle} onDuplicate={onDuplicate} />
      </div>
      <button type="button" onClick={onOpen} className="mt-3 flex-1 text-left">
        <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">{agent.description}</p>
        <p className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3" />
            {agent.conversationsCount.toLocaleString()} chats
          </span>
          {agent.category === 'rule_based' ? (
            <span className="inline-flex items-center gap-1">
              <GitBranch className="size-3" />
              {agent.flowsCount} flows
            </span>
          ) : null}
        </p>
      </button>
    </div>
  )
}
