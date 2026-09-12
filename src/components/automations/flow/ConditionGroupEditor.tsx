import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  CONDITION_OPERATORS,
  normalizeConditionGroup,
  type ConditionRow,
} from '@/lib/journeyNodeTypes'
import type { AutomationChannel } from '@/services/realAutomations.service'

const ROW_TYPES = [
  { value: 'field', label: 'Contact attribute' },
  { value: 'tag', label: 'Tag' },
  { value: 'email_known', label: 'Email known' },
  { value: 'phone_known', label: 'Phone known' },
  { value: 'custom_field', label: 'Custom field' },
  { value: 'journey_status', label: 'Lifecycle stage' },
  { value: 'channel', label: 'Channel' },
  { value: 'follows_account', label: 'Follows account', channels: ['instagram'] as AutomationChannel[] },
]

function defaultRow(type: string): ConditionRow {
  if (type === 'tag') return { type, field: '', operator: '=', value: '' }
  if (type === 'email_known' || type === 'phone_known' || type === 'follows_account') {
    return { type, field: '', operator: '=', value: 'yes' }
  }
  if (type === 'channel') return { type, field: '', operator: '=', value: 'whatsapp' }
  if (type === 'custom_field') return { type, field: '', operator: '=', value: '' }
  if (type === 'journey_status') return { type, field: '', operator: '=', value: '' }
  return { type: 'field', field: 'tags', operator: 'contains', value: '' }
}

export function ConditionGroupEditor({
  draft,
  channel,
  onChange,
}: {
  draft: Record<string, unknown>
  channel: AutomationChannel
  onChange: (next: Record<string, unknown>) => void
}) {
  const { conditions, combinator } = normalizeConditionGroup(draft)
  const rows = conditions.length ? conditions : [defaultRow('field')]
  const types = ROW_TYPES.filter((t) => !t.channels || t.channels.includes(channel))

  const setGroup = (next: ConditionRow[], nextCombinator = combinator) => {
    onChange({ ...draft, conditions: next, combinator: nextCombinator })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm">
        Match{' '}
        <Select value={combinator} onValueChange={(v) => setGroup(rows, v === 'any' ? 'any' : 'all')}>
          <SelectTrigger className="inline-flex h-7 w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">all</SelectItem>
            <SelectItem value="any">any</SelectItem>
          </SelectContent>
        </Select>{' '}
        of these conditions
      </p>

      {rows.map((row, idx) => (
        <div key={idx} className="space-y-2 rounded-lg border p-2.5">
          <div className="flex items-center justify-between gap-2">
            <Select
              value={row.type}
              onValueChange={(v) => setGroup(rows.map((r, i) => (i === idx ? defaultRow(v) : r)))}
            >
              <SelectTrigger className="h-8 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove condition"
              onClick={() => {
                const next = rows.filter((_, i) => i !== idx)
                setGroup(next.length ? next : [defaultRow('field')])
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>

          {row.type === 'tag' || row.type === 'field' || row.type === 'custom_field' || row.type === 'journey_status' ? (
            <div className="grid grid-cols-2 gap-2">
              {row.type !== 'tag' && row.type !== 'journey_status' ? (
                <div className="space-y-1">
                  <Label className="text-xs">Field</Label>
                  <Input
                    value={row.field}
                    onChange={(e) =>
                      setGroup(rows.map((r, i) => (i === idx ? { ...r, field: e.target.value } : r)))
                    }
                    placeholder={row.type === 'custom_field' ? 'plan' : 'tags'}
                  />
                </div>
              ) : null}
              <div className="space-y-1">
                <Label className="text-xs">Operator</Label>
                <Select
                  value={row.operator}
                  onValueChange={(v) => setGroup(rows.map((r, i) => (i === idx ? { ...r, operator: v } : r)))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPERATORS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {row.type === 'tag' ? (o.value === '!=' ? "doesn't have" : 'has') : o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Value</Label>
                <Input
                  value={row.value}
                  onChange={(e) =>
                    setGroup(rows.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r)))
                  }
                />
              </div>
            </div>
          ) : null}

          {row.type === 'email_known' || row.type === 'phone_known' || row.type === 'follows_account' ? (
            <Select
              value={row.value === 'no' ? 'no' : 'yes'}
              onValueChange={(v) => setGroup(rows.map((r, i) => (i === idx ? { ...r, value: v } : r)))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          ) : null}

          {row.type === 'channel' ? (
            <Select
              value={row.value || 'whatsapp'}
              onValueChange={(v) => setGroup(rows.map((r, i) => (i === idx ? { ...r, value: v } : r)))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="messenger">Messenger</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setGroup([...rows, defaultRow('field')])}>
        <Plus />
        Condition
      </Button>
      <p className="text-muted-foreground text-xs">
        <span className="text-primary font-medium">Yes</span> when it matches ·{' '}
        <span className="text-destructive font-medium">No</span> otherwise.
      </p>
    </div>
  )
}
