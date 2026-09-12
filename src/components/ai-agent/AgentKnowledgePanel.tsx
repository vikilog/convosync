import { useState } from 'react'
import { FileText, HelpCircle, Library, Link2, Paperclip, Pencil, Search, Trash2 } from 'lucide-react'

import { AddKnowledgeSheet } from '@/components/ai-agent/AddKnowledgeSheet'
import { AgentRetrievalStats } from '@/components/ai-agent/AgentRetrievalStats'
import { EditKnowledgeSheet } from '@/components/ai-agent/EditKnowledgeSheet'
import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { KNOWLEDGE_TYPE_LABELS } from '@/lib/aiAgentLabels'
import {
  realAgentsService,
  type KnowledgeItem,
  type KnowledgeStatus,
  type KnowledgeType,
} from '@/services/realAgents.service'

const TYPE_ICON: Record<KnowledgeType, React.ComponentType<{ className?: string }>> = {
  document: FileText,
  online_data: Link2,
  qna: HelpCircle,
  attachment: Paperclip,
}

function statusVariant(status: KnowledgeStatus): 'default' | 'secondary' | 'destructive' {
  if (status === 'ready') return 'default'
  if (status === 'failed') return 'destructive'
  return 'secondary'
}

export function AgentKnowledgePanel({ agentId }: { agentId: string }) {
  const [query, setQuery] = useState('')
  const [editItem, setEditItem] = useState<KnowledgeItem | null>(null)
  const confirm = useConfirm()
  const { data: knowledge = [], isLoading } = realAgentsService.useKnowledge(agentId)
  const deleteKnowledge = realAgentsService.useDeleteKnowledge()

  const filtered = knowledge.filter((k) => k.title.toLowerCase().includes(query.toLowerCase()))

  const remove = async (item: KnowledgeItem) => {
    const ok = await confirm({
      title: `Delete "${item.title}"?`,
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) deleteKnowledge.mutate({ agentId, knowledgeId: item.id })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Knowledge</h2>
        <p className="text-muted-foreground text-sm">
          Add, edit, or remove knowledge anytime — the agent reindexes after updates.
        </p>
      </div>

      <AgentRetrievalStats agentId={agentId} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search knowledge…"
            className="pl-8"
          />
        </div>
        <AddKnowledgeSheet agentId={agentId} />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-10 text-center">
          <Library className="text-muted-foreground size-7" />
          <p className="text-sm font-medium">No knowledge yet</p>
          <p className="text-muted-foreground max-w-xs text-xs">
            Add documents, URLs, or Q&amp;A pairs so the agent can answer from your content.
          </p>
        </div>
      ) : (
        <div className="bg-card divide-y rounded-xl border">
          {filtered.map((item) => {
            const Icon = TYPE_ICON[item.type]
            return (
              <div key={item.id} className="flex items-center gap-3 p-3">
                <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {KNOWLEDGE_TYPE_LABELS[item.type]} ·{' '}
                    {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <Badge variant={statusVariant(item.status)} className="shrink-0 capitalize">
                  {item.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                  onClick={() => setEditItem(item)}
                  aria-label={`Edit ${item.title}`}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => void remove(item)}
                  aria-label={`Delete ${item.title}`}
                >
                  <Trash2 />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <EditKnowledgeSheet
        agentId={agentId}
        item={editItem}
        open={Boolean(editItem)}
        onOpenChange={(next) => {
          if (!next) setEditItem(null)
        }}
      />
    </div>
  )
}
