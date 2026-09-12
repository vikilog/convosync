import { useState } from 'react'
import { Link2, Loader2, Search, Unlink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CHANNEL_LABEL, ChannelIcon } from '@/components/channel-icon'
import { contactHandleLabel, displayNameForChannel, resolveContactChannel } from '@/lib/contactChannel'
import { realContactsService, type ContactOverviewChannel } from '@/services/realContacts.service'

export function ContactLinkedChannelsPanel({
  contactId,
  onChanged,
}: {
  contactId: string
  onChanged?: () => void
}) {
  const [query, setQuery] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const linkChannel = realContactsService.useLinkChannel()
  const { data: searchRes, isFetching } = realContactsService.useList({
    search: query.trim() || undefined,
    limit: 20,
  })
  const candidates = (searchRes?.items ?? []).filter((c) => c.id !== contactId)

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setPickerOpen((v) => !v)}>
        <Link2 />
        Link channel
      </Button>
      {pickerOpen ? (
        <div className="bg-background absolute right-0 z-20 mt-2 w-72 rounded-xl border p-2 shadow-lg">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts…"
              className="pl-7"
            />
          </div>
          <ul className="mt-2 max-h-56 overflow-y-auto">
            {isFetching ? (
              <li className="text-muted-foreground flex items-center gap-2 px-2 py-3 text-xs">
                <Loader2 className="size-3 animate-spin" />
                Searching…
              </li>
            ) : candidates.length === 0 ? (
              <li className="text-muted-foreground px-2 py-3 text-xs">No matches</li>
            ) : (
              candidates.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    disabled={linkChannel.isPending}
                    onClick={() =>
                      linkChannel.mutate(
                        { id: contactId, otherContactId: c.id },
                        {
                          onSuccess: () => {
                            setPickerOpen(false)
                            setQuery('')
                            onChanged?.()
                          },
                        }
                      )
                    }
                    className="hover:bg-muted flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm"
                  >
                    <ChannelIcon channel={resolveContactChannel(c.phone)} className="size-3.5 shrink-0" />
                    <span className="min-w-0 truncate">{displayNameForChannel(c.name, c.phone)}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export function ContactChannelCard({
  row,
  viewingId,
  onOpen,
  onInbox,
  onUnlink,
  inboxPending,
  unlinkPending,
}: {
  row: ContactOverviewChannel
  viewingId: string
  onOpen: (id: string) => void
  onInbox: (id: string) => void
  onUnlink: (id: string) => void
  inboxPending: boolean
  unlinkPending: boolean
}) {
  const isSelf = row.contactId === viewingId
  const channel = row.channel
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
            <ChannelIcon channel={channel} className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {CHANNEL_LABEL[channel]}
              {isSelf ? ' · Viewing' : ''}
            </p>
            <button
              type="button"
              disabled={isSelf}
              onClick={() => onOpen(row.contactId)}
              className={`mt-0.5 block max-w-full truncate text-left text-sm font-semibold ${isSelf ? '' : 'hover:underline'}`}
            >
              {displayNameForChannel(row.name, row.phone)}
            </button>
            <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
              {contactHandleLabel(row.phone)}
            </p>
            {row.email ? <p className="text-muted-foreground mt-0.5 truncate text-xs">{row.email}</p> : null}
            <p className="text-muted-foreground mt-2 text-xs">
              {row.conversationCount} conversation{row.conversationCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          <Button size="sm" variant="outline" disabled={inboxPending} onClick={() => onInbox(row.contactId)}>
            {inboxPending ? <Loader2 className="animate-spin" /> : null}
            Inbox
          </Button>
          {!isSelf ? (
            <Button size="sm" variant="ghost" disabled={unlinkPending} onClick={() => onUnlink(row.contactId)}>
              {unlinkPending ? <Loader2 className="animate-spin" /> : <Unlink />}
              Unlink
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
