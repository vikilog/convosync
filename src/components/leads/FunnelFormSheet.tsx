import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { FunnelWriteInput, LeadFunnel } from '@/services/realLeadFunnels.service'

export function FunnelFormSheet({
  open,
  funnel,
  saving,
  onOpenChange,
  onSave,
}: {
  open: boolean
  funnel?: LeadFunnel | null
  saving?: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: FunnelWriteInput) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [goal, setGoal] = useState('')

  useEffect(() => {
    if (!open) return
    setName(funnel?.name ?? '')
    setDescription(funnel?.description ?? '')
    setGoal(funnel?.goal ?? '')
  }, [open, funnel])

  const canSave = name.trim().length > 0 && !saving

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{funnel ? 'Edit funnel' : 'Create funnel'}</SheetTitle>
          <p className="text-muted-foreground text-xs">
            Funnels are never auto-created. Social Listening automation needs one of these.
          </p>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label htmlFor="funnel-name">Name</Label>
            <Input
              id="funnel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Instagram inbound"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="funnel-description">Description</Label>
            <Textarea
              id="funnel-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this funnel is for"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="funnel-goal">Goal</Label>
            <Input
              id="funnel-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. 50 qualified demos / month"
            />
          </div>
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSave}
            onClick={() =>
              onSave({ name: name.trim(), description: description.trim(), goal: goal.trim() })
            }
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
