import { useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'

import { TagChipInput } from '@/components/tags/TagChipInput'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { isSyntheticChannelPhone } from '@/lib/contactChannel'
import { ApiError } from '@/lib/httpClient'
import { dialForCountry, isValidContactPhone, listDialCodeOptions, splitPhone, toE164 } from '@/lib/locale/dialCodes'
import { realContactsService } from '@/services/realContacts.service'
import { realWorkspaceMembersService } from '@/services/realWorkspaceMembers.service'

const DIAL_OPTIONS = listDialCodeOptions()
const DEFAULT_DIAL = dialForCountry('IN')
const LEAD_JOURNEY_FIELD = 'leadJourney'
const INSTAGRAM_FIELD_PREFIX = 'instagram'

function customFieldsToRows(fields: Record<string, unknown> | null | undefined): { key: string; value: string }[] {
  if (!fields) return []
  return Object.entries(fields)
    .filter(([key]) => key !== 'ownerId' && key !== LEAD_JOURNEY_FIELD && !key.startsWith(INSTAGRAM_FIELD_PREFIX))
    .map(([key, value]) => ({ key, value: String(value) }))
}

export function EditContactSheet({
  contactId,
  open,
  onOpenChange,
}: {
  contactId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: contact, isLoading } = realContactsService.useGet(contactId ?? undefined)
  const updateContact = realContactsService.useUpdate()
  const { data: members = [] } = realWorkspaceMembersService.useList()

  const [name, setName] = useState('')
  const [phoneDial, setPhoneDial] = useState(DEFAULT_DIAL)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [excludeFromInsights, setExcludeFromInsights] = useState(false)
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([])
  const [newFieldKey, setNewFieldKey] = useState('')
  const [newFieldValue, setNewFieldValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const phoneLocked = isSyntheticChannelPhone(contact?.phone ?? '')

  useEffect(() => {
    if (!contact) return
    const cf = contact.customFields ?? {}
    const countryHint = typeof cf.country === 'string' ? cf.country : undefined
    const { dial, national } = splitPhone(contact.phone, countryHint)
    setName(contact.name)
    setPhoneDial(dial)
    setPhone(national)
    setEmail(contact.email ?? '')
    setTags(contact.tags)
    setExcludeFromInsights(contact.excludeFromInsights)
    setOwnerId(typeof cf.ownerId === 'string' ? cf.ownerId : '')
    setCustomFields(customFieldsToRows(cf))
    setError(null)
  }, [contact?.id, contact?.updatedAt])

  const fullPhone = useMemo(() => toE164(phoneDial, phone), [phoneDial, phone])

  const addCustomField = () => {
    const key = newFieldKey.trim()
    if (!key || customFields.some((f) => f.key === key)) return
    setCustomFields((prev) => [...prev, { key, value: newFieldValue.trim() }])
    setNewFieldKey('')
    setNewFieldValue('')
  }

  const save = () => {
    if (!contactId || !contact) return
    if (!name.trim()) {
      setError('Nickname is required.')
      return
    }
    if (!phoneLocked && !isValidContactPhone(fullPhone)) {
      setError('Enter a valid phone number with country code.')
      return
    }

    const nextFields: Record<string, string> = {}
    if (contact.customFields) {
      for (const [key, value] of Object.entries(contact.customFields)) {
        if (key.startsWith(INSTAGRAM_FIELD_PREFIX) || key === LEAD_JOURNEY_FIELD) {
          nextFields[key] = String(value)
        }
      }
    }
    for (const row of customFields) {
      const k = row.key.trim()
      if (k && k !== LEAD_JOURNEY_FIELD) nextFields[k] = row.value
    }
    if (ownerId) nextFields.ownerId = ownerId

    setError(null)
    updateContact.mutate(
      {
        id: contactId,
        patch: {
          name: name.trim(),
          ...(phoneLocked ? {} : { phone: fullPhone }),
          email: email.trim() || null,
          tags,
          excludeFromInsights,
          customFields: Object.keys(nextFields).length ? nextFields : undefined,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not save this contact.'),
      }
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit contact</SheetTitle>
        </SheetHeader>

        {isLoading || !contact ? (
          <div className="text-muted-foreground flex flex-1 items-center gap-2 px-4 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Loading contact…
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-contact-name">Nickname</Label>
              <Input id="edit-contact-name" maxLength={250} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-contact-phone">Phone number</Label>
              {phoneLocked ? (
                <>
                  <Input id="edit-contact-phone" readOnly value={contact.phone} className="bg-muted" />
                  <p className="text-muted-foreground text-xs">
                    Phone cannot be changed for Instagram/Messenger/Telegram contacts.
                  </p>
                </>
              ) : (
                <div className="flex min-w-0 items-stretch gap-2">
                  <Select value={phoneDial} onValueChange={setPhoneDial}>
                    <SelectTrigger className="w-[7.5rem] shrink-0" aria-label="Country code">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {!DIAL_OPTIONS.some((o) => o.dial === phoneDial) ? (
                        <SelectItem value={phoneDial}>{phoneDial}</SelectItem>
                      ) : null}
                      {DIAL_OPTIONS.map((o) => (
                        <SelectItem key={o.dial} value={o.dial}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="edit-contact-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="min-w-0 flex-1"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-contact-owner">Owner</Label>
              <Select value={ownerId || 'unassigned'} onValueChange={(v) => setOwnerId(v === 'unassigned' ? '' : v)}>
                <SelectTrigger id="edit-contact-owner" className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.name} ({m.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-contact-email">Email</Label>
              <Input
                id="edit-contact-email"
                type="email"
                maxLength={250}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-contact-tags">Tags</Label>
              <TagChipInput id="edit-contact-tags" value={tags} onChange={setTags} />
            </div>

            <label className="flex items-start gap-2.5 rounded-lg border p-3">
              <Checkbox
                checked={excludeFromInsights}
                onCheckedChange={(checked) => setExcludeFromInsights(Boolean(checked))}
              />
              <span>
                <span className="block text-sm font-medium">Exclude from AI insights</span>
                <span className="text-muted-foreground block text-xs">
                  For team/test numbers — never run customer insight scoring on this contact.
                </span>
              </span>
            </label>

            <div className="space-y-1.5">
              <Label>Customized attributes</Label>
              {customFields.map((field, i) => (
                <div key={field.key} className="flex items-center gap-2">
                  <Input value={field.key} disabled className="w-28 shrink-0 font-mono text-xs" />
                  <Input
                    value={field.value}
                    onChange={(e) =>
                      setCustomFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, value: e.target.value } : f)))
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => setCustomFields((prev) => prev.filter((_, idx) => idx !== i))}
                    aria-label={`Remove ${field.key}`}
                  >
                    <X />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  placeholder="Key"
                  className="w-28 shrink-0"
                />
                <Input
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  placeholder="Value"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="shrink-0"
                  onClick={addCustomField}
                  disabled={!newFieldKey.trim()}
                  aria-label="Add attribute"
                >
                  <Plus />
                </Button>
              </div>
            </div>

            {error ? <p className="text-destructive text-xs">{error}</p> : null}
          </div>
        )}

        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!name.trim() || updateContact.isPending} onClick={save}>
            {updateContact.isPending ? <Loader2 className="animate-spin" /> : null}
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
