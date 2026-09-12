import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { DATA_COLUMN_TYPE_OPTIONS, type DataColumnType } from '@/services/realDataTables.service'

export type NewColumnInput = { label: string; type: DataColumnType; options?: string[] }

export function AddColumnSheet({
  onAdd,
  pending,
}: {
  onAdd: (input: NewColumnInput) => void | Promise<void>
  pending?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [type, setType] = useState<DataColumnType>('text')
  const [optionsInput, setOptionsInput] = useState('')

  const reset = () => {
    setLabel('')
    setType('text')
    setOptionsInput('')
  }

  const canSave = label.trim().length > 0

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (pending) return
        setOpen(next)
        if (!next) reset()
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus />
          Add column
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Add column</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label htmlFor="column-label">Column name</Label>
            <Input
              id="column-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Status"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as DataColumnType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_COLUMN_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {type === 'select' ? (
            <div className="space-y-1.5">
              <Label htmlFor="column-options">Choices</Label>
              <Input
                id="column-options"
                value={optionsInput}
                onChange={(e) => setOptionsInput(e.target.value)}
                placeholder="Comma separated, e.g. Low, Medium, High"
              />
            </div>
          ) : null}
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="ghost" disabled={pending}>
              Cancel
            </Button>
          </SheetClose>
          <Button
            disabled={!canSave || pending}
            onClick={() => {
              void Promise.resolve(
                onAdd({
                  label: label.trim(),
                  type,
                  options:
                    type === 'select'
                      ? optionsInput
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                      : undefined,
                })
              )
                .then(() => {
                  reset()
                  setOpen(false)
                })
                .catch(() => {
                  // parent already surfaced the error
                })
            }}
          >
            Add column
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
