import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export function AddBoardSheet({
  open,
  hasFinalBoard,
  saving,
  onOpenChange,
  onSave,
}: {
  open: boolean
  hasFinalBoard: boolean
  saving?: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { name: string; isFinal: boolean }) => void
}) {
  const [name, setName] = useState('')
  const [isFinal, setIsFinal] = useState(false)

  useEffect(() => {
    if (open) return
    setName('')
    setIsFinal(false)
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Add board</SheetTitle>
          <p className="text-muted-foreground text-xs">
            New column on this funnel’s Kanban. Default board is New.
          </p>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label htmlFor="board-name">Board name</Label>
            <Input
              id="board-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Won / Closed"
              autoFocus
            />
          </div>
          {!hasFinalBoard ? (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5">
              <Checkbox checked={isFinal} onCheckedChange={(v) => setIsFinal(v === true)} className="mt-0.5" />
              <span>
                <span className="block text-xs font-semibold">Final step</span>
                <span className="text-muted-foreground block text-[11px]">
                  Leads on this board can convert to Contacts
                </span>
              </span>
            </label>
          ) : (
            <p className="text-muted-foreground text-[11px]">New board is inserted before the Final board.</p>
          )}
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={saving || !name.trim()}
            onClick={() => onSave({ name: name.trim(), isFinal: hasFinalBoard ? false : isFinal })}
          >
            {saving ? 'Adding…' : 'Add board'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
