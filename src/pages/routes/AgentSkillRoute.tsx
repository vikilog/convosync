import { useNavigate, useParams } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { AgentDetailPage } from '@/pages/AgentDetailPage'
import { realAgentsService } from '@/services/realAgents.service'

/** Route shell for /ai-agent/:agentId/skills/:skillId. */
export function AgentSkillRoute() {
  const { agentId, skillId } = useParams<{ agentId: string; skillId: string }>()
  const navigate = useNavigate()
  const { data: agent, isLoading } = realAgentsService.useGet(agentId)
  const updateAgent = realAgentsService.useUpdate()

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col p-4">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }
  if (!agent || !skillId) {
    navigate('/ai-agent', { replace: true })
    return null
  }

  return (
    <AgentDetailPage
      agent={agent}
      section="skills"
      skillId={skillId}
      onBack={() => navigate('/ai-agent')}
      onUpdate={(patch) => updateAgent.mutate({ id: agent.id, patch })}
      saving={updateAgent.isPending}
    />
  )
}
