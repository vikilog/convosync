import { useEffect, useMemo, useState } from 'react'
import { MessageSquareText, Paperclip, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { applyCannedVariables } from '@/lib/messagingWindow'
import { realCannedResponsesService } from '@/services/realCannedResponses.service'

export function InboxCannedPicker({
  open,
  onOpenChange,
  contactName,
  contactPhone,
  onInsert,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactName: string
  contactPhone: string
  onInsert: (selection: {
    message: string
    cannedId: string
    hasMedia: boolean
    mediaFileName?: string | null
  }) => void
}) {
  const { data: items = [], isLoading, isError, error } = realCannedResponsesService.useList()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setSelectedId(items[0]?.id ?? null)
  }, [open, items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        (item.shortcut ?? '').toLowerCase().includes(q)
    )
  }, [items, query])

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null
  const preview = selected
    ? applyCannedVariables(selected.content, {
        'contact.name': contactName,
        'contact.phone': contactPhone,
      })
    : ''

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="data-[side=right]:sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageSquareText className="size-4" />
            Canned responses
          </SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col px-4">
          <div className="relative mb-3">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search canned responses…"
              className="pl-8"
            />
          </div>

          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : isError ? (
            <p className="text-destructive text-sm">
              {error instanceof Error ? error.message : 'Failed to load canned responses'}
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No canned responses yet. Create them under Templates → Canned response.
            </p>
          ) : (
            <div className="flex min-h-0 flex-1 gap-3">
              <ScrollArea className="w-2/5 min-w-0 rounded-lg border">
                <div className="p-1">
                  {filtered.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`hover:bg-muted w-full rounded-md px-2.5 py-2 text-left ${
                        selected?.id === item.id ? 'bg-muted' : ''
                      }`}
                    >
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                        <span className="truncate">{item.title}</span>
                        {item.mediaStorageKey ? (
                          <Paperclip className="text-muted-foreground size-3 shrink-0" />
                        ) : null}
                      </p>
                      {item.shortcut ? (
                        <p className="text-muted-foreground font-mono text-xs">/{item.shortcut}</p>
                      ) : null}
                    </button>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">
                  Preview
                </p>
                <p className="bg-muted/40 min-h-28 flex-1 overflow-y-auto rounded-lg border p-3 text-sm whitespace-pre-wrap">
                  {preview || (selected?.mediaStorageKey ? '(Media only — caption optional)' : '')}
                </p>
              </div>
            </div>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              if (!selected) return
              onInsert({
                message: preview,
                cannedId: selected.id,
                hasMedia: Boolean(selected.mediaStorageKey),
                mediaFileName: selected.mediaFileName,
              })
              onOpenChange(false)
            }}
          >
            Insert message
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
