import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ASSIGNEE_TYPES,
  CONTACT_FIELDS,
  RANDOMIZER_PATHS_MAX,
  type AddToFunnelData,
  type AssignToData,
  type GotoStepData,
  type RandomizerData,
  type RandomizerPath,
  type TriggerJourneyData,
  type UpdateFieldData,
  type UpdateLifecycleData,
} from '@/lib/journeyNodeTypes'
import { realAgentsService } from '@/services/realAgents.service'
import { realAutomationsService, type AutomationChannel } from '@/services/realAutomations.service'
import { realLeadFunnelsService } from '@/services/realLeadFunnels.service'
import { realWorkspaceMembersService } from '@/services/realWorkspaceMembers.service'

const NONE = '__none__'

function normalizePaths(raw: unknown): RandomizerPath[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((p) => p && typeof p === 'object')
    .map((p, i) => {
      const row = p as RandomizerPath
      return {
        id: String(row.id || `p_${i}`),
        label: String(row.label ?? ''),
        weight: Number(row.weight) || 0,
      }
    })
    .slice(0, RANDOMIZER_PATHS_MAX)
}

export function RandomizerEditor({
  draft,
  onChange,
}: {
  draft: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const paths = normalizePaths((draft as Partial<RandomizerData>).paths)
  const total = paths.reduce((sum, p) => sum + (Number(p.weight) || 0), 0)
  const setPaths = (next: RandomizerPath[]) => onChange({ ...draft, paths: next.slice(0, RANDOMIZER_PATHS_MAX) })

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Paths</Label>
        <span className="text-muted-foreground text-xs">
          {paths.length}/{RANDOMIZER_PATHS_MAX} · {total}%
        </span>
      </div>
      <p className="text-muted-foreground text-xs">Weighted split — path id matches the canvas handle.</p>
      {paths.map((path, idx) => (
        <div key={path.id} className="flex gap-2">
          <Input
            value={path.label}
            onChange={(e) => {
              const next = [...paths]
              next[idx] = { ...next[idx], label: e.target.value }
              setPaths(next)
            }}
            placeholder="Label"
          />
          <Input
            type="number"
            min={0}
            className="w-20"
            value={path.weight}
            aria-label="Weight percent"
            onChange={(e) => {
              const next = [...paths]
              next[idx] = { ...next[idx], weight: Number(e.target.value) }
              setPaths(next)
            }}
          />
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove path" onClick={() => setPaths(paths.filter((_, i) => i !== idx))}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
      {paths.length < RANDOMIZER_PATHS_MAX ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setPaths([
              ...paths,
              { id: `p_${crypto.randomUUID().slice(0, 4)}`, label: `Path ${String.fromCharCode(65 + paths.length)}`, weight: 0 },
            ])
          }
        >
          <Plus />
          Add path
        </Button>
      ) : null}
    </div>
  )
}

export function UpdateFieldEditor({
  draft,
  onChange,
}: {
  draft: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const d = draft as Partial<UpdateFieldData>
  return (
    <>
      <div className="space-y-1.5">
        <Label>Field</Label>
        <Select value={d.field ?? 'name'} onValueChange={(v) => onChange({ ...draft, field: v })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONTACT_FIELDS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {d.field === 'custom' ? (
        <div className="space-y-1.5">
          <Label htmlFor="node-custom-key">Custom field key</Label>
          <Input
            id="node-custom-key"
            value={d.customFieldKey ?? ''}
            onChange={(e) => onChange({ ...draft, customFieldKey: e.target.value })}
          />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="node-field-value">Value</Label>
        <Input
          id="node-field-value"
          value={d.value ?? ''}
          onChange={(e) => onChange({ ...draft, value: e.target.value })}
        />
      </div>
    </>
  )
}

export function AddToFunnelEditor({
  draft,
  onChange,
}: {
  draft: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const d = draft as Partial<AddToFunnelData>
  const { data } = realLeadFunnelsService.useList()
  const funnels = data?.funnels ?? []
  const stages = funnels.find((f) => f.id === d.funnelId)?.stages ?? []

  return (
    <>
      <div className="space-y-1.5">
        <Label>Lead funnel</Label>
        <Select
          value={d.funnelId || NONE}
          onValueChange={(v) => onChange({ ...draft, funnelId: v === NONE ? '' : v, stageId: '' })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select funnel…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Select funnel…</SelectItem>
            {funnels.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Board (optional)</Label>
        <Select
          value={d.stageId || NONE}
          onValueChange={(v) => onChange({ ...draft, stageId: v === NONE ? '' : v })}
          disabled={!d.funnelId}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Default (first board)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Default (first board)</SelectItem>
            {stages.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-muted-foreground text-xs">Creates a lead linked to this contact.</p>
    </>
  )
}

export function GotoStepEditor({
  draft,
  steps,
  onChange,
}: {
  draft: Record<string, unknown>
  steps: { id: string; label: string }[]
  onChange: (next: Record<string, unknown>) => void
}) {
  const id = (draft as Partial<GotoStepData>).targetNodeId ?? ''
  return (
    <div className="space-y-1.5">
      <Label>Jump to step</Label>
      <Select value={id || NONE} onValueChange={(v) => onChange({ ...draft, targetNodeId: v === NONE ? '' : v })}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select step…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Select step…</SelectItem>
          {steps.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.label} · {s.id.slice(0, 8)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function TriggerJourneyEditor({
  draft,
  channel,
  excludeId,
  onChange,
}: {
  draft: Record<string, unknown>
  channel: AutomationChannel
  excludeId?: string
  onChange: (next: Record<string, unknown>) => void
}) {
  const { data: automations = [] } = realAutomationsService.useList()
  const published = automations.filter((j) => j.channel === channel && j.status === 'published' && j.id !== excludeId)
  const id = (draft as Partial<TriggerJourneyData>).journeyId ?? ''

  return (
    <div className="space-y-1.5">
      <Label>Published {channel === 'instagram' ? 'automation' : 'journey'}</Label>
      <Select value={id || NONE} onValueChange={(v) => onChange({ ...draft, journeyId: v === NONE ? '' : v })}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Select…</SelectItem>
          {published.map((j) => (
            <SelectItem key={j.id} value={j.id}>
              {j.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function UpdateLifecycleEditor({
  draft,
  onChange,
}: {
  draft: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const stage = (draft as Partial<UpdateLifecycleData>).stage ?? ''
  return (
    <div className="space-y-1.5">
      <Label htmlFor="node-lifecycle">Lifecycle stage</Label>
      <Input
        id="node-lifecycle"
        value={stage}
        onChange={(e) => onChange({ ...draft, stage: e.target.value })}
        placeholder="e.g. lead, customer, churned"
      />
    </div>
  )
}

export function AssignToEditor({
  draft,
  channel,
  excludeId,
  onChange,
}: {
  draft: Record<string, unknown>
  channel: AutomationChannel
  excludeId?: string
  onChange: (next: Record<string, unknown>) => void
}) {
  const d = draft as Partial<AssignToData>
  const type = d.assigneeType ?? 'unassigned'
  const { data: members = [] } = realWorkspaceMembersService.useList()
  const { data: agents = [] } = realAgentsService.useList()
  const { data: automations = [] } = realAutomationsService.useList()
  const journeys = automations.filter((j) => j.channel === channel && j.status === 'published' && j.id !== excludeId)
  const aiAgents = agents.filter((a) => a.category === 'ai_agent' || a.category === 'responsive')

  const options =
    type === 'user'
      ? members.map((m) => ({ id: m.userId, label: m.name || m.email }))
      : type === 'ai'
        ? aiAgents.map((a) => ({ id: a.id, label: a.name }))
        : type === 'journey'
          ? journeys.map((j) => ({ id: j.id, label: j.name }))
          : []

  return (
    <>
      <div className="space-y-1.5">
        <Label>Assignee</Label>
        <Select value={type} onValueChange={(v) => onChange({ ...draft, assigneeType: v, assigneeId: '' })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSIGNEE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {type !== 'unassigned' ? (
        <div className="space-y-1.5">
          <Label>Assignee ID</Label>
          <Select
            value={d.assigneeId || NONE}
            onValueChange={(v) => onChange({ ...draft, assigneeId: v === NONE ? '' : v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Select…</SelectItem>
              {d.assigneeId && !options.some((o) => o.id === d.assigneeId) ? (
                <SelectItem value={d.assigneeId}>{d.assigneeId}</SelectItem>
              ) : null}
              {options.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </>
  )
}
