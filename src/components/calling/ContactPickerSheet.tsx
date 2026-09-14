import { useMemo, useState } from 'react'
import { Delete, Loader2, PhoneCall, Search, Users } from 'lucide-react'

import { EmptyState } from '@/components/common/EmptyState'
import { ContactAvatar } from '@/components/inbox/ContactAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { realContactsService, type Contact } from '@/services/realContacts.service'

/** `insert` is what actually lands in the number — the `*` key inserts `+` (international
 * dialing prefix) since a literal `*` has no meaning when just calling a phone number;
 * `sub` is the small secondary glyph shown under the main label, same convention phone
 * keypads use (e.g. "+" under "0"). */
const KEYPAD_KEYS = [
  { label: '1', insert: '1' },
  { label: '2', insert: '2' },
  { label: '3', insert: '3' },
  { label: '4', insert: '4' },
  { label: '5', insert: '5' },
  { label: '6', insert: '6' },
  { label: '7', insert: '7' },
  { label: '8', insert: '8' },
  { label: '9', insert: '9' },
  { label: '*', insert: '+', sub: '+' },
  { label: '0', insert: '0' },
  { label: '#', insert: '#' },
] as const

/** Numeric dialpad for calling a number you don't want to type on a keyboard — digits
 * (and a leading +) get dialled, `#` is stripped by the call layer if pressed. */
function Keypad({ onCall }: { onCall: (to: string) => void }) {
  const [digits, setDigits] = useState('')
  const dialable = digits.replace(/[^\d+]/g, '')
  const canCall = dialable.replace(/\D/g, '').length >= 8

  return (
    <div className="flex flex-1 flex-col items-center gap-5 px-4 pt-2">
      <div className="flex h-10 w-full items-center justify-center">
        <span className="truncate font-mono text-2xl tracking-wide tabular-nums">
          {digits || <span className="text-muted-foreground">Enter a number</span>}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {KEYPAD_KEYS.map((key) => (
          <button
            key={key.label}
            type="button"
            onClick={() => setDigits((d) => d + key.insert)}
            className="hover:bg-muted relative flex size-14 items-center justify-center rounded-full border text-lg font-medium"
          >
            {key.label}
            {'sub' in key ? (
              <span className="text-muted-foreground absolute bottom-1.5 text-[10px] leading-none">{key.sub}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex w-full items-center justify-center gap-3 pt-1">
        <Button
          size="icon"
          variant="ghost"
          disabled={!digits}
          onClick={() => setDigits((d) => d.slice(0, -1))}
          aria-label="Backspace"
        >
          <Delete className="size-4" />
        </Button>
        <Button
          size="lg"
          disabled={!canCall}
          onClick={() => onCall(dialable)}
          className="bg-channel-green hover:bg-channel-green/90 gap-2 rounded-full px-8 text-white"
        >
          <PhoneCall className="size-4" />
          Call
        </Button>
        <div className="size-9" aria-hidden />
      </div>
    </div>
  )
}

/** Slide-over contact picker for placing a call — pulls the real contact base
 * (only entries with a phone number), paginated as you scroll. Also offers a
 * numeric Keypad tab for dialling a number that isn't worth typing on a keyboard. */
export function ContactPickerSheet({
  open,
  onOpenChange,
  onCall,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCall: (to: string) => void
}) {
  const [tab, setTab] = useState<'contacts' | 'keypad'>('contacts')
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
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setTab('contacts')
      }}
    >
      <SheetContent side="right" className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>New call</SheetTitle>
        </SheetHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'contacts' | 'keypad')} className="min-h-0 flex-1">
          <div className="px-4">
            <TabsList className="w-full">
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="keypad">Keypad</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="contacts" className="flex min-h-0 flex-col">
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
              <div className="px-4 pt-3">
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

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 pb-4">
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
          </TabsContent>

          <TabsContent value="keypad" className="flex min-h-0 flex-col pb-4">
            <Keypad onCall={call} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
