import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Plus, UserPlus } from 'lucide-react'

import { TagChipInput } from '@/components/tags/TagChipInput'
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
import { isValidContactPhone, dialForCountry, listDialCodeOptions, toE164 } from '@/lib/locale/dialCodes'
import { realWorkspaceMembersService } from '@/services/realWorkspaceMembers.service'

const DIAL_OPTIONS = listDialCodeOptions()
const DEFAULT_DIAL = dialForCountry('IN')

export type NewContactInput = {
  name: string
  phone: string
  email?: string
  tags?: string[]
  ownerId?: string
  customFields?: Record<string, string>
}

export function AddContactSheet({
  onAdd,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  onAdd: (contact: NewContactInput) => void
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = openProp ?? uncontrolledOpen
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }
  const [name, setName] = useState('')
  const [phoneDial, setPhoneDial] = useState(DEFAULT_DIAL)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [customAttrs, setCustomAttrs] = useState<{ key: string; value: string }[]>([])
  const [showCustom, setShowCustom] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: members = [] } = realWorkspaceMembersService.useList()
  const didDefaultOwner = useRef(false)

  useEffect(() => {
    if (!open) {
      didDefaultOwner.current = false
      return
    }
    if (didDefaultOwner.current || !members[0]) return
    didDefaultOwner.current = true
    setOwnerId(members[0].userId)
  }, [open, members])

  const reset = () => {
    setName('')
    setPhoneDial(DEFAULT_DIAL)
    setPhone('')
    setEmail('')
    setOwnerId('')
    setTags([])
    setCustomAttrs([])
    setShowCustom(false)
    setError(null)
  }

  const fullPhone = useMemo(() => toE164(phoneDial, phone), [phoneDial, phone])

  const save = () => {
    if (!name.trim()) {
      setError('Nickname is required.')
      return
    }
    if (!isValidContactPhone(fullPhone)) {
      setError('Enter a valid phone number with country code.')
      return
    }
    const customFields: Record<string, string> = {}
    for (const row of customAttrs) {
      const k = row.key.trim()
      if (k) customFields[k] = row.value
    }
    if (ownerId) customFields.ownerId = ownerId
    onAdd({
      name: name.trim(),
      phone: fullPhone,
      email: email.trim() || undefined,
      tags,
      ownerId: ownerId || undefined,
      customFields: Object.keys(customFields).length ? customFields : undefined,
    })
    reset()
    setOpen(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      {trigger !== null ? (
        <SheetTrigger asChild>
          {trigger ?? (
            <Button size="sm">
              <UserPlus />
              Add contact
            </Button>
          )}
        </SheetTrigger>
      ) : null}
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Add contact</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label htmlFor="contact-name">
              Nickname <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contact-name"
              maxLength={250}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Please enter"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-phone">
              Phone number <span className="text-destructive">*</span>
            </Label>
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
                id="contact-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="min-w-0 flex-1"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-owner">Owner</Label>
            <Select value={ownerId || 'unassigned'} onValueChange={(v) => setOwnerId(v === 'unassigned' ? '' : v)}>
              <SelectTrigger id="contact-owner" className="w-full">
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
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              maxLength={250}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-tags">Tags</Label>
            <TagChipInput id="contact-tags" value={tags} onChange={setTags} />
          </div>

          {!showCustom ? (
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className="text-primary text-sm font-medium hover:underline"
            >
              + Customized attributes
            </button>
          ) : (
            <div className="space-y-2">
              <Label>Customized attributes</Label>
              {customAttrs.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={row.key}
                    onChange={(e) => {
                      const next = [...customAttrs]
                      next[i] = { ...next[i], key: e.target.value }
                      setCustomAttrs(next)
                    }}
                    placeholder="Attribute name"
                  />
                  <Input
                    value={row.value}
                    onChange={(e) => {
                      const next = [...customAttrs]
                      next[i] = { ...next[i], value: e.target.value }
                      setCustomAttrs(next)
                    }}
                    placeholder="Value"
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCustomAttrs((prev) => [...prev, { key: '', value: '' }])}
              >
                <Plus />
                Add attribute
              </Button>
            </div>
          )}

          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <Button onClick={save}>Save contact</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
