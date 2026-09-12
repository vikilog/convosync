import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { realContactsService } from '@/services/realContacts.service'
import { realAutomationsService } from '@/services/realAutomations.service'

/** Uses existing POST /journeys/trigger. Does not invent a message-send endpoint. */
export function TestTriggerSheet({
  open,
  event,
  onClose,
}: {
  open: boolean
  event: string
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const [contactId, setContactId] = useState<string | null>(null)
  const { data } = realContactsService.useList({ search: search.trim() || undefined, limit: 20 })
  const trigger = realAutomationsService.useTrigger()
  const contacts = data?.items ?? []

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setContactId(null)
          setSearch('')
          onClose()
        }
      }}
    >
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Run for a contact</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-3 overflow-y-auto px-4">
          <p className="text-muted-foreground text-xs">
            Starts published WhatsApp journeys matching <span className="font-medium">{event}</span> for
            the selected contact, via the existing trigger API. This can send journey messages.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="test-contact-search">Contact</Label>
            <Input
              id="test-contact-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts…"
            />
          </div>
          <ul className="max-h-72 space-y-1 overflow-auto">
            {contacts.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setContactId(c.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                    contactId === c.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                  }`}
                >
                  <span className="font-medium">{c.name || c.phone}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{c.phone}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <Button
            disabled={!contactId || trigger.isPending}
            onClick={() => {
              if (!contactId) return
              trigger.mutate(
                { event, contactId },
                {
                  onSuccess: () => {
                    toast.success('Trigger queued for that contact.')
                    onClose()
                  },
                  onError: (err) => toast.error(err instanceof Error ? err.message : 'Trigger failed'),
                }
              )
            }}
          >
            Run trigger
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
