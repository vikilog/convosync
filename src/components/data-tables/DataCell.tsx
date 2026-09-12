import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { DataTableColumn } from '@/services/realDataTables.service'

/** Column options are meant to be string[] (see dataTables.schemas.ts), but
 * some legacy rows have {id,title}-shaped options instead — normalize so a
 * select cell never crashes rendering an object as a React child. */
function normalizeSelectOptions(options: DataTableColumn['options']): { value: string; label: string }[] {
  return (options ?? [])
    .map((opt) => {
      if (typeof opt === 'string') return { value: opt, label: opt }
      if (opt && typeof opt === 'object') {
        const o = opt as { id?: unknown; title?: unknown }
        const value = typeof o.id === 'string' ? o.id : typeof o.title === 'string' ? o.title : ''
        const label = typeof o.title === 'string' ? o.title : value
        return { value, label }
      }
      return { value: '', label: '' }
    })
    .filter((opt) => opt.value)
}

function formatValue(value: unknown, column: DataTableColumn): string {
  if (value === undefined || value === null || value === '') return ''
  if (column.type === 'boolean') return value === true ? 'Yes' : 'No'
  if (column.type === 'date') {
    const d = new Date(String(value))
    return Number.isNaN(d.getTime())
      ? String(value)
      : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  return String(value)
}

export function DataCell({
  column,
  value,
  onCommit,
}: {
  column: DataTableColumn
  value: unknown
  onCommit: (next: unknown) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (column.type === 'boolean') {
    return (
      <div className="flex items-center px-1">
        <Switch checked={value === true} onCheckedChange={(checked) => onCommit(checked)} />
      </div>
    )
  }

  if (column.type === 'select') {
    const options = normalizeSelectOptions(column.options)
    return (
      <Select value={(value as string) ?? ''} onValueChange={(v) => onCommit(v)}>
        <SelectTrigger size="sm" className="hover:border-input w-full border-transparent bg-transparent">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (editing) {
    const inputValue =
      column.type === 'date' && typeof draft === 'string' ? draft.slice(0, 10) : ((draft as string) ?? '')
    return (
      <Input
        autoFocus
        type={
          column.type === 'number'
            ? 'number'
            : column.type === 'date'
              ? 'date'
              : column.type === 'email'
                ? 'email'
                : 'text'
        }
        value={inputValue}
        onChange={(e) => setDraft(column.type === 'number' ? Number(e.target.value) : e.target.value)}
        onBlur={() => {
          setEditing(false)
          onCommit(draft)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setEditing(false)
            onCommit(draft)
          }
          if (e.key === 'Escape') {
            setDraft(value)
            setEditing(false)
          }
        }}
        className="border-primary/50 h-8"
      />
    )
  }

  const display = formatValue(value, column)

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(
          column.type === 'date' && typeof value === 'string' ? value.slice(0, 10) : value
        )
        setEditing(true)
      }}
      className="hover:bg-muted/60 flex h-8 w-full items-center rounded-md px-2 text-left text-sm"
    >
      {display ? (
        <span className="truncate">{display}</span>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      )}
    </button>
  )
}
