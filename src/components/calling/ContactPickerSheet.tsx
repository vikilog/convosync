import { useMemo, useState } from 'react'
import { Loader2, PhoneCall, Search, Users } from 'lucide-react'

import { EmptyState } from '@/components/common/EmptyState'
import { ContactAvatar } from '@/components/inbox/ContactAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { realContactsService, type Contact } from '@/services/realContacts.service'

/** Slide-over contact picker for placing a call — pulls the real contact base
 * (only entries with a phone number), paginated as you scroll. */
export function ContactPickerSheet({
  open,
  onOpenChange,
  onCall,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCall: (to: string) => void
}) {
  const [search, setSearch] = useState('')
  // WhatsApp is the only channel guaranteed to carry a real phone number — others may be
  // keyed by a username/PSID instead, which isn't dialable.
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = realContactsService.useInfiniteList(
    { search: search.trim() || undefined, channel: 'whatsapp', limit: 25 },
    open,
  )

  const contacts = useMemo(
    () => (data?.pages.flatMap((p) => p.items) ?? []).filter((c) => c.phone),
    [data],
  )

  const dialableQuery = search.replace(/\D/g, '')
  const showManualDial = dialableQuery.length >= 8

  const call = (to: string) => {
    onCall(to)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>New call</SheetTitle>
        </SheetHeader>
        <div className="px-4">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts or type a number…"
              className="pl-8"
              autoFocus
            />
          </div>
        </div>

        {showManualDial ? (
          <div className="px-4">
            <button
              type="button"
              onClick={() => call(dialableQuery)}
              className="hover:bg-muted/50 flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left"
            >
              <span className="bg-channel-green/10 flex size-8 shrink-0 items-center justify-center rounded-full">
                <PhoneCall className="text-channel-green size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Call {search}</p>
                <p className="text-muted-foreground text-xs">Not in your contacts</p>
              </div>
            </button>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Loading contacts…
            </div>
          ) : contacts.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No contacts found"
              description={search ? 'Try a different name or number.' : 'Your contact base is empty so far.'}
            />
          ) : (
            <div className="space-y-1">
              {contacts.map((c: Contact) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => call(c.phone)}
                  className="hover:bg-muted/50 flex w-full items-center gap-2.5 rounded-lg p-2 text-left"
                >
                  <ContactAvatar name={c.name || c.phone} src={c.avatar} className="size-8 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name || c.phone}</p>
                    <p className="text-muted-foreground truncate font-mono text-xs tabular-nums">{c.phone}</p>
                  </div>
                </button>
              ))}
              {hasNextPage ? (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isFetchingNextPage}
                    onClick={() => void fetchNextPage()}
                  >
                    {isFetchingNextPage ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    {isFetchingNextPage ? 'Loading…' : 'Load more'}
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
