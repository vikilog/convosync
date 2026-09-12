import { useEffect, useState } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Pencil, Trash2 } from 'lucide-react'

import { LeadCard } from '@/components/leads/LeadCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { LeadFunnelStage } from '@/services/realLeadFunnels.service'
import type { Lead } from '@/services/realLeads.service'

function DraggableLeadCard({
  lead,
  showConvert,
  convertBusy,
  onOpen,
  onConvert,
}: {
  lead: Lead
  showConvert: boolean
  convertBusy: boolean
  onOpen: () => void
  onConvert: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
    data: { stageId: lead.stageId },
  })

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={isDragging ? 'opacity-30' : ''}>
      <LeadCard
        lead={lead}
        showConvert={showConvert}
        convertBusy={convertBusy}
        onOpen={onOpen}
        onConvert={onConvert}
      />
    </div>
  )
}

export function LeadColumn({
  stage,
  leads,
  canDelete,
  convertingIds,
  onOpenLead,
  onConvertLead,
  onRename,
  onDelete,
}: {
  stage: LeadFunnelStage
  leads: Lead[]
  canDelete: boolean
  convertingIds: Set<string>
  onOpenLead: (lead: Lead) => void
  onConvertLead: (lead: Lead) => void
  onRename: (stageId: string, name: string) => Promise<void>
  onDelete: (stageId: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(stage.name)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!editing) setDraft(stage.name)
  }, [stage.name, editing])

  const commitRename = async () => {
    const next = draft.trim()
    if (!next || next === stage.name) {
      setDraft(stage.name)
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onRename(stage.id, next)
      setEditing(false)
    } catch {
      setDraft(stage.name)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`bg-muted/30 flex w-72 shrink-0 flex-col rounded-xl border transition-colors ${
        isOver ? 'ring-primary/30 ring-2' : ''
      }`}
    >
      <div className="flex items-center gap-1.5 border-b px-2.5 py-2">
        {editing ? (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => void commitRename()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void commitRename()
              }
              if (e.key === 'Escape') {
                setDraft(stage.name)
                setEditing(false)
              }
            }}
            disabled={saving}
            autoFocus
            aria-label="Board name"
            className="h-7 min-w-0 flex-1 px-2 text-xs font-semibold"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="Rename board"
            className="min-w-0 flex-1 truncate rounded-md px-1 py-0.5 text-left text-xs font-semibold"
          >
            {stage.name}
          </button>
        )}
        {stage.isFinal ? (
          <Badge variant="secondary" className="shrink-0">
            Final
          </Badge>
        ) : null}
        <span className="bg-background text-muted-foreground shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold">
          {leads.length}
        </span>
        {!editing ? (
          <Button variant="ghost" size="icon-xs" title="Rename" onClick={() => setEditing(true)}>
            <Pencil />
          </Button>
        ) : null}
        {canDelete ? (
          <Button
            variant="ghost"
            size="icon-xs"
            title="Delete board"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(stage.id)}
          >
            <Trash2 />
          </Button>
        ) : null}
      </div>
      <div className="flex min-h-[120px] flex-1 flex-col gap-2 overflow-y-auto p-2">
        {leads.map((lead) => (
          <DraggableLeadCard
            key={lead.id}
            lead={lead}
            showConvert={stage.isFinal && !lead.contactId}
            convertBusy={convertingIds.has(lead.id)}
            onOpen={() => onOpenLead(lead)}
            onConvert={() => onConvertLead(lead)}
          />
        ))}
        {leads.length === 0 ? (
          <div className="text-muted-foreground flex flex-1 items-center justify-center rounded-lg border border-dashed p-4 text-center text-xs">
            Drop leads here
          </div>
        ) : null}
      </div>
    </div>
  )
}
