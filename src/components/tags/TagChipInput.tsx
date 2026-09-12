import { useId, useState } from 'react'
import { X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { sortTagNamesByFolder } from '@/lib/tagFolders'
import { workspaceTagsService } from '@/services/workspaceTags.service'

type Props = {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  id?: string
}

/**
 * Chip-style multi-tag editor with folder-clustered suggestions from the WorkspaceTag registry.
 * Enter/comma/blur still adds a name that isn't registered yet — the backend upserts on save.
 */
export function TagChipInput({ value, onChange, placeholder = 'Select or create a new tag', id }: Props) {
  const { data: records = [] } = workspaceTagsService.useList()
  const suggestions = sortTagNamesByFolder(records)
  const [input, setInput] = useState('')
  const listId = useId()

  const addTag = (raw: string) => {
    const t = raw.trim()
    if (!t || value.includes(t)) {
      setInput('')
      return
    }
    onChange([...value, t])
    setInput('')
  }

  return (
    <div>
      {value.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1">
              {t}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      <Input
        id={id}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag(input)
          } else if (e.key === 'Backspace' && !input && value.length > 0) {
            onChange(value.slice(0, -1))
          }
        }}
        onBlur={() => addTag(input)}
        list={listId}
        placeholder={placeholder}
      />
      <datalist id={listId}>
        {suggestions
          .filter((t) => !value.includes(t))
          .map((t) => (
            <option key={t} value={t} />
          ))}
      </datalist>
    </div>
  )
}
