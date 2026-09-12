import { useState } from 'react'
import { ArrowLeft, Bot, GitBranch, Library, Sparkles, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { AgentFlowBuilder } from '@/components/ai-agent/AgentFlowBuilder'
import { AgentKnowledgePanel } from '@/components/ai-agent/AgentKnowledgePanel'
import { AgentProfilePanel } from '@/components/ai-agent/AgentProfilePanel'
import { AgentSkillsPanel } from '@/components/ai-agent/AgentSkillsPanel'
import { SkillEditorPanel } from '@/components/ai-agent/SkillEditorPanel'
import { TestAgentSheet } from '@/components/ai-agent/TestAgentSheet'
import { Button } from '@/components/ui/button'
import { defaultAgentFlowDefinition } from '@/lib/agentFlow'
import type { Agent, AgentUpdateInput } from '@/services/realAgents.service'

export type AgentSection = 'profile' | 'skills' | 'knowledge' | 'flows'

const NAV: { id: AgentSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'skills', label: 'Skills', icon: Sparkles },
  { id: 'knowledge', label: 'Knowledge base', icon: Library },
  { id: 'flows', label: 'Flows', icon: GitBranch },
]

export function AgentDetailPage({
  agent,
  section,
  skillId,
  onBack,
  onUpdate,
  saving,
}: {
  agent: Agent
  section: AgentSection
  skillId?: string
  onBack: () => void
  onUpdate: (patch: AgentUpdateInput) => void
  saving?: boolean
}) {
  const navigate = useNavigate()
  const [testOpen, setTestOpen] = useState(false)
  const items = NAV.filter((item) => item.id !== 'flows' || agent.category === 'rule_based')

  return (
    <div className="flex h-full min-h-0 w-full flex-1">
      <nav className="w-56 shrink-0 space-y-4 overflow-y-auto border-r p-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="w-full justify-start">
          <ArrowLeft />
          All agents
        </Button>
        <div className="flex items-center gap-2 px-2">
          <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Bot className="size-4" />
          </span>
          <p className="truncate text-sm font-semibold">{agent.name}</p>
        </div>
        <div className="space-y-0.5">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(`/ai-agent/${agent.id}/${item.id}`)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                section === item.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <div className={`min-h-0 flex-1 ${section === 'flows' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {section === 'flows' && agent.category === 'rule_based' ? (
          <div className="h-full min-h-0 p-3">
            <AgentFlowBuilder
              flow={agent.flowDefinition ?? defaultAgentFlowDefinition()}
              saving={saving}
              onSave={(flowDefinition) => onUpdate({ flowDefinition })}
            />
          </div>
        ) : (
          <div className="mx-auto max-w-3xl p-6">
            {skillId ? (
              <SkillEditorPanel agentId={agent.id} skillId={skillId} />
            ) : section === 'profile' ? (
              <AgentProfilePanel agent={agent} onUpdate={onUpdate} onTestAgent={() => setTestOpen(true)} />
            ) : section === 'skills' ? (
              <AgentSkillsPanel agentId={agent.id} />
            ) : (
              <AgentKnowledgePanel agentId={agent.id} />
            )}
          </div>
        )}
      </div>

      <TestAgentSheet agent={agent} open={testOpen} onOpenChange={setTestOpen} />
    </div>
  )
}
