import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { realAgentsService, type AgentSkill } from '@/services/realAgents.service'

export function SkillEditorPanel({ agentId, skillId }: { agentId: string; skillId: string }) {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { data: skills = [], isLoading } = realAgentsService.useSkills(agentId)
  const { data: knowledge = [] } = realAgentsService.useKnowledge(agentId)
  const updateSkill = realAgentsService.useUpdateSkill()
  const publishSkill = realAgentsService.usePublishSkill()
  const deleteSkill = realAgentsService.useDeleteSkill()

  const remote = skills.find((s) => s.id === skillId) ?? null
  const [draft, setDraft] = useState<AgentSkill | null>(null)

  useEffect(() => {
    if (remote) setDraft(remote)
  }, [remote])

  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (!draft) {
    return (
      <div className="space-y-3 py-12 text-center">
        <p className="text-destructive text-sm">Skill not found</p>
        <Button variant="ghost" onClick={() => navigate(`/ai-agent/${agentId}/skills`)}>
          Back to skills
        </Button>
      </div>
    )
  }

  const save = (patch: Partial<AgentSkill>) => {
    const next = { ...draft, ...patch }
    setDraft(next)
    updateSkill.mutate({
      agentId,
      skillId,
      patch: {
        title: next.title,
        trigger: next.trigger,
        instructions: next.instructions,
        description: next.description,
        knowledgeItemIds: next.knowledgeItemIds ?? [],
      },
    })
  }

  const toggleKb = (id: string) => {
    const current = draft.knowledgeItemIds ?? []
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    save({ knowledgeItemIds: next })
  }

  const unpublish = () => updateSkill.mutate({ agentId, skillId, patch: { status: 'draft' } })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/ai-agent/${agentId}/skills`)}>
          <ArrowLeft />
          Skills
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant={draft.status === 'live' ? 'default' : 'outline'} className="capitalize">
            {draft.status}
          </Badge>
          {draft.status === 'live' ? (
            <Button variant="outline" size="sm" disabled={updateSkill.isPending} onClick={unpublish}>
              Set draft
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={publishSkill.isPending}
              onClick={() => publishSkill.mutate({ agentId, skillId })}
            >
              Publish
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={async () => {
              const ok = await confirm({
                title: `Delete "${draft.title}"?`,
                description: 'This cannot be undone.',
                confirmLabel: 'Delete',
                destructive: true,
              })
              if (ok) {
                deleteSkill.mutate(
                  { agentId, skillId },
                  { onSuccess: () => navigate(`/ai-agent/${agentId}/skills`) }
                )
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="skill-edit-title">Title</Label>
        <Input
          id="skill-edit-title"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          onBlur={() => draft.title.trim() && draft.title !== remote?.title && save({ title: draft.title.trim() })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="skill-edit-trigger">Start trigger</Label>
        <Textarea
          id="skill-edit-trigger"
          value={draft.trigger}
          onChange={(e) => setDraft({ ...draft, trigger: e.target.value })}
          onBlur={() => draft.trigger !== remote?.trigger && save({ trigger: draft.trigger })}
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="skill-edit-desc">Description</Label>
        <Textarea
          id="skill-edit-desc"
          value={draft.description ?? ''}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          onBlur={() => (draft.description ?? '') !== (remote?.description ?? '') && save({ description: draft.description })}
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="skill-edit-ins">Instructions</Label>
        <Textarea
          id="skill-edit-ins"
          value={draft.instructions}
          onChange={(e) => setDraft({ ...draft, instructions: e.target.value })}
          onBlur={() => draft.instructions !== remote?.instructions && save({ instructions: draft.instructions })}
          rows={8}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Linked knowledge</p>
        {knowledge.length === 0 ? (
          <p className="text-muted-foreground text-xs">No knowledge items yet.</p>
        ) : (
          <div className="space-y-1.5">
            {knowledge.map((item) => {
              const checked = (draft.knowledgeItemIds ?? []).includes(item.id)
              return (
                <label key={item.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <Checkbox checked={checked} onCheckedChange={() => toggleKb(item.id)} />
                  <span className="min-w-0 truncate">{item.title}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
