import { useNavigate, useParams } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { AgentDetailPage, type AgentSection } from '@/pages/AgentDetailPage'
import { realAgentsService } from '@/services/realAgents.service'

const SECTIONS = new Set<AgentSection>(['profile', 'skills', 'knowledge', 'flows'])

function sectionFromParam(raw: string | undefined): AgentSection {
  return raw && SECTIONS.has(raw as AgentSection) ? (raw as AgentSection) : 'profile'
}

/** Route shell for /ai-agent/:agentId and /ai-agent/:agentId/:section. */
export function AgentDetailRoute() {
  const { agentId, section: sectionParam } = useParams<{ agentId: string; section?: string }>()
  const navigate = useNavigate()
  const { data: agent, isLoading } = realAgentsService.useGet(agentId)
  const updateAgent = realAgentsService.useUpdate()
  const section = sectionFromParam(sectionParam)

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col p-4">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }
  if (!agent) {
    navigate('/ai-agent', { replace: true })
    return null
  }

  if (section === 'flows' && agent.category !== 'rule_based') {
    navigate(`/ai-agent/${agent.id}/profile`, { replace: true })
    return null
  }

  return (
    <AgentDetailPage
      agent={agent}
      section={section}
      onBack={() => navigate('/ai-agent')}
      onUpdate={(patch) => updateAgent.mutate({ id: agent.id, patch })}
      saving={updateAgent.isPending}
    />
  )
}
