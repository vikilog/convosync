import { useState } from 'react'
import { ArrowDown, ArrowUp, Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'

import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { templateGroupsService, type TemplateGroup } from '@/services/realTemplates.service'

function GroupRow({
  group,
  isFirst,
  isLast,
  onMove,
}: {
  group: TemplateGroup
  isFirst: boolean
  isLast: boolean
  onMove: (direction: 'up' | 'down') => void
}) {
  const confirm = useConfirm()
  const updateMutation = templateGroupsService.useUpdate()
  const removeMutation = templateGroupsService.useRemove()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(group.name)
  const [error, setError] = useState('')

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Name is required.')
      return
    }
    try {
      await updateMutation.mutateAsync({ id: group.id, patch: { name: trimmed } })
      setEditing(false)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename group.')
    }
  }

  const remove = async () => {
    const ok = await confirm({
      title: `Delete "${group.name}"?`,
      description:
        group.templateCount > 0
          ? `${group.templateCount} template${group.templateCount === 1 ? '' : 's'} in this group will become ungrouped — they won't be deleted.`
          : 'This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) removeMutation.mutate(group.id)
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border p-2.5">
      <div className="flex shrink-0 flex-col">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isFirst}
          onClick={() => onMove('up')}
          aria-label="Move up"
          className="size-5"
        >
          <ArrowUp className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isLast}
          onClick={() => onMove('down')}
          aria-label="Move down"
          className="size-5"
        >
          <ArrowDown className="size-3" />
        </Button>
      </div>

      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="space-y-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') void save()
                if (e.key === 'Escape') {
                  setName(group.name)
                  setEditing(false)
                  setError('')
                }
              }}
            />
            {error ? <p className="text-destructive text-xs">{error}</p> : null}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{group.name}</p>
            <span className="text-muted-foreground text-xs">
              {group.templateCount} template{group.templateCount === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {editing ? (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => void save()}
              disabled={updateMutation.isPending}
              aria-label="Save"
            >
              {updateMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setName(group.name)
                setEditing(false)
                setError('')
              }}
              aria-label="Cancel"
            >
              <X className="size-3.5" />
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)} aria-label="Rename">
              <Pencil className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => void remove()} aria-label="Delete">
              <Trash2 className="size-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export function ManageTemplateGroupsSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: groups = [] } = templateGroupsService.useList()
  const createMutation = templateGroupsService.useCreate()
  const updateMutation = templateGroupsService.useUpdate()
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')

  const addGroup = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    try {
      await createMutation.mutateAsync(trimmed)
      setNewName('')
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create group.')
    }
  }

  const move = (index: number, direction: 'up' | 'down') => {
    const swapWith = direction === 'up' ? index - 1 : index + 1
    if (swapWith < 0 || swapWith >= groups.length) return
    const a = groups[index]
    const b = groups[swapWith]
    updateMutation.mutate({ id: a.id, patch: { order: b.order } })
    updateMutation.mutate({ id: b.id, patch: { order: a.order } })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Manage groups</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4">
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Product, Service, Feedback"
                maxLength={60}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void addGroup()
                }}
              />
              <Button onClick={() => void addGroup()} disabled={!newName.trim() || createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Add
              </Button>
            </div>
            {error ? <p className="text-destructive text-xs">{error}</p> : null}
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {groups.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">No groups yet — add one above.</p>
            ) : (
              groups.map((group, i) => (
                <GroupRow
                  key={group.id}
                  group={group}
                  isFirst={i === 0}
                  isLast={i === groups.length - 1}
                  onMove={(direction) => move(i, direction)}
                />
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
