import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { TagChipInput } from '@/components/tags/TagChipInput'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import {
  INBOX_RULE_CHANNELS,
  INBOX_RULE_DAYS,
  emptyInboxRuleForm,
  inboxRuleFormToInput,
  inboxRuleToForm,
  type InboxRuleChannel,
  type InboxRuleFormState,
} from '@/lib/inboxRuleForm'
import type { InboxGroup, InboxRule } from '@/services/realWorkspaceSettings.service'

export function InboxRuleFormSheet({
  open,
  onOpenChange,
  rule,
  groups,
  members,
  fallbackTimezone,
  pending,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: InboxRule | null
  groups: InboxGroup[]
  members: { userId: string; name: string }[]
  fallbackTimezone: string
  pending?: boolean
  onSave: (input: ReturnType<typeof inboxRuleFormToInput>, onDone: (ok: boolean) => void) => void
}) {
  const [form, setForm] = useState<InboxRuleFormState>(() => emptyInboxRuleForm(fallbackTimezone))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setForm(rule ? inboxRuleToForm(rule, fallbackTimezone) : emptyInboxRuleForm(fallbackTimezone))
    setError(null)
  }, [open, rule, fallbackTimezone])

  const toggleChannel = (c: InboxRuleChannel) =>
    setForm((prev) => ({
      ...prev,
      channels: prev.channels.includes(c) ? prev.channels.filter((x) => x !== c) : [...prev.channels, c],
    }))

  const submit = () => {
    const input = inboxRuleFormToInput(form)
    if ('error' in input) {
      setError(input.error)
      return
    }
    setError(null)
    onSave(input, (ok) => {
      if (ok) onOpenChange(false)
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{rule ? 'Edit rule' : 'New rule'}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label htmlFor="rule-name">Name</Label>
            <Input
              id="rule-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Channels</Label>
            <div className="flex flex-wrap gap-3">
              {INBOX_RULE_CHANNELS.map((c) => (
                <Label key={c} className="flex items-center gap-1.5 text-sm capitalize">
                  <Checkbox checked={form.channels.includes(c)} onCheckedChange={() => toggleChannel(c)} />
                  {c}
                </Label>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">Leave empty to match any channel.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rule-tags">Contact tags (any match)</Label>
            <TagChipInput
              id="rule-tags"
              value={form.contactTags}
              onChange={(contactTags) => setForm((p) => ({ ...p, contactTags }))}
            />
            <p className="text-muted-foreground text-xs">Leave empty to match any contact.</p>
          </div>

          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="rule-hours">Business hours</Label>
              <Switch
                id="rule-hours"
                checked={form.businessHoursEnabled}
                onCheckedChange={(checked) => setForm((p) => ({ ...p, businessHoursEnabled: checked }))}
              />
            </div>
            {form.businessHoursEnabled ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {INBOX_RULE_DAYS.map((d) => (
                    <Label key={d.value} className="flex items-center gap-1 text-xs">
                      <Checkbox
                        checked={form.days.includes(d.value)}
                        onCheckedChange={(checked) =>
                          setForm((p) => ({
                            ...p,
                            days: checked ? [...p.days, d.value] : p.days.filter((v) => v !== d.value),
                          }))
                        }
                      />
                      {d.label}
                    </Label>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={form.start}
                    onChange={(e) => setForm((p) => ({ ...p, start: e.target.value }))}
                  />
                  <span className="text-muted-foreground text-xs">to</span>
                  <Input
                    type="time"
                    value={form.end}
                    onChange={(e) => setForm((p) => ({ ...p, end: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rule-tz">Timezone</Label>
                  <Input
                    id="rule-tz"
                    value={form.timezone}
                    onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                    placeholder={fallbackTimezone || 'Asia/Kolkata'}
                  />
                </div>
              </>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Assign to</Label>
            <Select
              value={form.actionType}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, actionType: v as 'group' | 'user', actionGroupId: '', actionUserId: '' }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="group">Group</SelectItem>
                <SelectItem value="user">Specific member</SelectItem>
              </SelectContent>
            </Select>
            {form.actionType === 'group' ? (
              <Select
                value={form.actionGroupId}
                onValueChange={(v) => setForm((p) => ({ ...p, actionGroupId: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a group…" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name} ({g.members.length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={form.actionUserId}
                onValueChange={(v) => setForm((p) => ({ ...p, actionUserId: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a member…" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <Button disabled={pending} onClick={submit}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Save rule
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
