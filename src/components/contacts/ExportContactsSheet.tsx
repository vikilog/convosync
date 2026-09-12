import { useState } from 'react'
import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  buildContactsCsv,
  defaultExportColumnIds,
  EXPORT_COLUMNS,
  type ExportColumnId,
} from '@/lib/exportContactsCsv'
import type { Contact } from '@/services/realContacts.service'

export function ExportContactsSheet({
  open,
  onOpenChange,
  contacts,
  selectedIds,
  fileSuffix = 'all',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: Contact[]
  selectedIds: Set<string>
  fileSuffix?: string
}) {
  const [columns, setColumns] = useState<ExportColumnId[]>(defaultExportColumnIds)
  const rows = selectedIds.size > 0 ? contacts.filter((c) => selectedIds.has(c.id)) : contacts

  const toggle = (id: ExportColumnId) => {
    setColumns((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  const download = () => {
    const csv = buildContactsCsv(rows, columns)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contacts-${fileSuffix}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Export contacts</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <p className="text-muted-foreground text-sm">
            {selectedIds.size > 0
              ? `${rows.length} selected contact${rows.length === 1 ? '' : 's'}`
              : `${rows.length} contact${rows.length === 1 ? '' : 's'} on this page`}
          </p>
          <div className="space-y-2">
            {EXPORT_COLUMNS.map((col) => (
              <label key={col.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={columns.includes(col.id)} onCheckedChange={() => toggle(col.id)} />
                {col.label}
              </label>
            ))}
          </div>
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={columns.length === 0 || rows.length === 0} onClick={download}>
            <Download />
            Download CSV
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
