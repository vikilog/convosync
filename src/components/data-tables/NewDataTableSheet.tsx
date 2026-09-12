import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

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
import { Textarea } from '@/components/ui/textarea'
import {
  DATA_COLUMN_TYPE_OPTIONS,
  type DataColumnType,
  type NewColumnInput,
} from '@/services/realDataTables.service'

type DraftColumn = { label: string; type: DataColumnType; options: string }

const STARTER_COLUMNS: DraftColumn[] = [
  { label: 'Name', type: 'text', options: '' },
  { label: 'Phone', type: 'phone', options: '' },
]

export type NewDataTableInput = {
  name: string
  description: string
  columns: NewColumnInput[]
}

function toColumns(drafts: DraftColumn[]): NewColumnInput[] {
  return drafts
    .filter((c) => c.label.trim())
    .map((c) => ({
      label: c.label.trim(),
      type: c.type,
      options:
        c.type === 'select'
          ? c.options
              .split(',')
              .map((o) => o.trim())
              .filter(Boolean)
          : undefined,
    }))
}

export function NewDataTableSheet({
  onCreate,
  pending,
}: {
  onCreate: (input: NewDataTableInput) => void | Promise<void>
  pending?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [columns, setColumns] = useState<DraftColumn[]>(STARTER_COLUMNS)
  const [error, setError] = useState('')

  const reset = () => {
    setName('')
    setDescription('')
    setColumns(STARTER_COLUMNS)
    setError('')
  }

  const updateColumn = (i: number, patch: Partial<DraftColumn>) => {
    setColumns((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  }

  const submit = async () => {
    const trimmed = name.trim()
    const clean = toColumns(columns)
    if (!trimmed) {
      setError('Table name is required.')
      return
    }
    if (clean.length === 0) {
      setError('Add at least one column.')
      return
    }
    setError('')
    try {
      await onCreate({ name: trimmed, description: description.trim(), columns: clean })
      reset()
      setOpen(false)
    } catch {
      // parent reports the API error; keep the sheet open
    }
  }

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
        <Button size="sm">
          <Plus />
          New table
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>New table</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label htmlFor="table-name">Table name</Label>
            <Input
              id="table-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Appointment bookings"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="table-description">Description</Label>
            <Textarea
              id="table-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Columns</Label>
            <p className="text-muted-foreground text-xs">
              Design columns now — you can add or remove them later.
            </p>
            {columns.map((col, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Input
                    value={col.label}
                    onChange={(e) => updateColumn(i, { label: e.target.value })}
                    placeholder="Column name"
                    className="flex-1"
                  />
                  <Select
                    value={col.type}
                    onValueChange={(v) => updateColumn(i, { type: v as DataColumnType })}
                  >
                    <SelectTrigger className="w-36">
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setColumns((prev) => prev.filter((_, idx) => idx !== i))}
                    aria-label="Remove column"
                  >
                    <Trash2 />
                  </Button>
                </div>
                {col.type === 'select' ? (
                  <Input
                    value={col.options}
                    onChange={(e) => updateColumn(i, { options: e.target.value })}
                    placeholder={`Choices for "${col.label || 'column'}", comma separated`}
                  />
                ) : null}
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setColumns((prev) => [...prev, { label: '', type: 'text', options: '' }])}
            >
              <Plus />
              Add column
            </Button>
          </div>
          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="ghost" disabled={pending}>
              Cancel
            </Button>
          </SheetClose>
          <Button disabled={pending} onClick={() => void submit()}>
            Create table
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
