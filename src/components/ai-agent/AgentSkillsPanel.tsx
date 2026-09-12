import { useState } from 'react'
import { Search, Sparkles, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { NewSkillSheet, type NewSkillInput } from '@/components/ai-agent/NewSkillSheet'
import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { realAgentsService, type AgentSkill } from '@/services/realAgents.service'

export function AgentSkillsPanel({ agentId }: { agentId: string }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const confirm = useConfirm()
  const { data: skills = [], isLoading } = realAgentsService.useSkills(agentId)
  const createSkill = realAgentsService.useCreateSkill()
  const deleteSkill = realAgentsService.useDeleteSkill()

  const filtered = skills.filter((s) => s.title.toLowerCase().includes(query.toLowerCase()))

  const create = (input: NewSkillInput) => {
    createSkill.mutate(
      { agentId, input },
      { onSuccess: (skill) => navigate(`/ai-agent/${agentId}/skills/${skill.id}`) }
    )
  }

  const remove = async (skill: AgentSkill) => {
    const ok = await confirm({
      title: `Delete "${skill.title}"?`,
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) deleteSkill.mutate({ agentId, skillId: skill.id })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills…"
            className="pl-8"
          />
        </div>
        <NewSkillSheet onCreate={create} pending={createSkill.isPending} />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-10 text-center">
          <Sparkles className="text-muted-foreground size-7" />
          <p className="text-sm font-medium">No skills yet</p>
          <p className="text-muted-foreground max-w-xs text-xs">
            Skills are scripted mini-flows the agent follows when a specific situation comes up.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((skill) => (
            <div key={skill.id} className="bg-card flex items-start justify-between gap-3 rounded-xl border p-4">
              <button
                type="button"
                onClick={() => navigate(`/ai-agent/${agentId}/skills/${skill.id}`)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{skill.title}</p>
                  <Badge variant={skill.status === 'live' ? 'default' : 'outline'} className="capitalize">
                    {skill.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                  {skill.description || skill.trigger}
                </p>
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => void remove(skill)}
                aria-label={`Delete ${skill.title}`}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
