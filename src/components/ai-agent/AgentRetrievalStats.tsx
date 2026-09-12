import { AlertTriangle } from 'lucide-react'

import { realAgentsService, type RetrievalPath } from '@/services/realAgents.service'

const LABELS: Record<RetrievalPath, string> = {
  cache: 'Cached',
  direct: 'Direct match',
  rag: 'RAG answer',
  full_llm: 'Open-ended',
  escalate: 'Escalated',
}

const ORDER: RetrievalPath[] = ['cache', 'direct', 'rag', 'full_llm', 'escalate']

export function AgentRetrievalStats({ agentId }: { agentId: string }) {
  const { data: stats } = realAgentsService.useRetrievalStats(agentId)
  if (!stats || stats.total === 0) return null

  const escalatePct = stats.percentages.escalate ?? 0

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          How this agent answered the last {stats.total} question{stats.total !== 1 ? 's' : ''}
        </p>
        {escalatePct >= 25 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
            <AlertTriangle className="size-3.5" />
            {escalatePct}% escalated — knowledge gaps likely
          </span>
        ) : null}
      </div>
      <div className="mb-3 flex h-2 overflow-hidden rounded-full">
        {ORDER.map((path) => (
          <div
            key={path}
            className={
              path === 'escalate' ? 'bg-amber-400' : path === 'full_llm' ? 'bg-muted-foreground/30' : 'bg-primary/70'
            }
            style={{ width: `${Math.max(stats.percentages[path] ?? 0, stats.counts[path] > 0 ? 1 : 0)}%` }}
            title={`${LABELS[path]}: ${stats.percentages[path] ?? 0}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {ORDER.map((path) => (
          <p key={path} className="text-muted-foreground text-xs">
            <span className="text-foreground font-semibold">{stats.percentages[path] ?? 0}%</span> {LABELS[path]}
          </p>
        ))}
      </div>
    </div>
  )
}
