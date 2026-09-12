import { useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ListChecks, Loader2, Plus, Search, SlidersHorizontal, Sparkles, Star, Workflow } from 'lucide-react'
import { ConversationRow } from '@/components/inbox/ConversationRow'
import { InboxBatchSheet } from '@/components/inbox/InboxBatchSheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { CHANNEL_ICON_CLASS, ChannelIcon } from '@/components/channel-icon'
import { useAuth } from '@/context/AuthContext'
import { contactHandleLabel } from '@/lib/contactChannel'
import { shouldShowWhatsAppLine, whatsappLineLabel, type WhatsAppLineAccount } from '@/lib/inboxLineLabels'
import {
  isAiHandlingAssignee,
  realInboxService,
  type Conversation,
  type InboxChannel,
} from '@/services/realInbox.service'

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  connectedChannels: InboxChannel[]
  channelFilter: InboxChannel
  onChannelFilterChange: (channel: InboxChannel) => void
  instagramConnected: boolean
  messengerConnected: boolean
  instagramSyncing: boolean
  instagramSyncHint: string
  instagramHasMore: boolean
  onSyncInstagram: (opts?: { loadMore?: boolean }) => void
  messengerSyncing: boolean
  onSyncMessenger: () => void
  whatsappAccounts?: WhatsAppLineAccount[]
  onNewChat?: () => void
}

const CHANNEL_TABS: { id: InboxChannel; label: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'messenger', label: 'Messenger' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'email', label: 'Email' },
]

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'mine', label: 'Mine' },
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'unread', label: 'Unread' },
]

type StatusFilter = 'all' | 'mine' | 'unassigned' | 'unread'

function isUnassigned(c: Conversation) {
  return !c.assigneeType && !c.assignedTo
}

function assigneeBadge(c: Conversation) {
  if (isAiHandlingAssignee(c.assigneeType)) {
    return { icon: Sparkles, label: 'AI' }
  }
  if (c.assigneeType === 'journey' || c.assigneeType === 'rule_based') {
    return { icon: Workflow, label: 'Automation' }
  }
  if (c.assigneeType === 'user' && c.agent?.name) {
    return { icon: null, label: c.agent.name }
  }
  return null
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  connectedChannels,
  channelFilter,
  onChannelFilterChange,
  instagramConnected,
  messengerConnected,
  instagramSyncing,
  instagramSyncHint,
  instagramHasMore,
  onSyncInstagram,
  messengerSyncing,
  onSyncMessenger,
  whatsappAccounts = [],
  onNewChat,
}: ConversationListProps) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchOpen, setBatchOpen] = useState(false)
  const setFavorite = realInboxService.useSetFavorite()

  const visibleTabs = CHANNEL_TABS.filter((tab) => connectedChannels.includes(tab.id))

  const availableTags = useMemo(() => {
    const set = new Set<string>()
    conversations.forEach((c) => c.contact.tags.forEach((t) => set.add(t)))
    return Array.from(set)
  }, [conversations])

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + tagFilter.length + (favoritesOnly ? 1 : 0)

  useEffect(() => {
    setSelectedIds(new Set())
  }, [channelFilter, statusFilter, tagFilter, favoritesOnly])

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (c.channel !== channelFilter) return false
      if (favoritesOnly && !c.isFavorite) return false
      if (tagFilter.length > 0 && !tagFilter.some((tag) => c.contact.tags.includes(tag))) return false
      if (statusFilter === 'mine' && c.assignedTo !== user?.id && c.assigneeId !== user?.id) return false
      if (statusFilter === 'unassigned' && !isUnassigned(c)) return false
      if (statusFilter === 'unread' && c.unreadCount === 0) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        const lastMessage = c.lastMessage ?? ''
        const handle = contactHandleLabel(c.contact.phone)
        const phone = c.contact.phone ?? ''
        const email = c.contact.email ?? ''
        if (
          !c.contact.name.toLowerCase().includes(q) &&
          !lastMessage.toLowerCase().includes(q) &&
          !handle.toLowerCase().includes(q) &&
          !phone.toLowerCase().includes(q) &&
          !email.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [conversations, channelFilter, statusFilter, tagFilter, favoritesOnly, query, user?.id])

  const listRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 80,
    overscan: 8,
    // jsdom reports 0x0; real browsers overwrite this after layout
    observeElementRect: (instance, cb) => {
      const el = instance.scrollElement as HTMLElement | null
      if (!el) return
      const read = () => ({
        width: el.offsetWidth || el.clientWidth || 360,
        height: el.offsetHeight || el.clientHeight || 480,
      })
      cb(read())
      if (typeof ResizeObserver === 'undefined') return
      const ro = new ResizeObserver(() => cb(read()))
      ro.observe(el)
      return () => ro.disconnect()
    },
  })

  const channelUnreadCount = (channel: InboxChannel) =>
    conversations.filter((c) => c.channel === channel).reduce((n, c) => n + c.unreadCount, 0)

  const channelThreadCount = (channel: InboxChannel) => conversations.filter((c) => c.channel === channel).length

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden border-r">
      <div className="shrink-0 space-y-2.5 border-b p-3">
        {visibleTabs.length > 0 ? (
          <div className="bg-muted/40 flex min-w-0 gap-1 rounded-xl border p-1">
            {visibleTabs.map((tab) => {
              const active = channelFilter === tab.id
              const count = channelUnreadCount(tab.id)
              return (
                <button
                  key={tab.id}
                  type="button"
                  title={tab.label}
                  aria-label={tab.label}
                  aria-pressed={active}
                  onClick={() => onChannelFilterChange(tab.id)}
                  className={`relative flex flex-1 items-center justify-center rounded-lg py-1.5 transition-colors ${
                    active ? 'bg-background shadow-sm' : 'text-muted-foreground hover:bg-background/60'
                  }`}
                >
                  <ChannelIcon
                    channel={tab.id}
                    className={`size-4 ${active ? CHANNEL_ICON_CLASS[tab.id].split(' ')[1] : ''}`}
                  />
                  {count > 0 ? (
                    <span className="bg-foreground text-background absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full text-[9px] font-bold">
                      {count}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        ) : null}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations…"
              className="pl-8"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            aria-label="New conversation"
            title="New conversation"
            onClick={onNewChat}
          >
            <Plus />
          </Button>

          {selectedIds.size > 0 ? (
            <Button
              variant="secondary"
              size="icon"
              className="relative shrink-0"
              onClick={() => setBatchOpen(true)}
              aria-label="Batch actions"
              title="Batch actions"
            >
              <ListChecks />
              <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold">
                {selectedIds.size}
              </span>
            </Button>
          ) : null}

          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button
                variant={activeFilterCount > 0 ? 'secondary' : 'outline'}
                size="icon"
                className="relative shrink-0"
                aria-label="Filter conversations"
                title="Filter conversations"
              >
                <SlidersHorizontal />
                {activeFilterCount > 0 ? (
                  <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Filter conversations</SheetTitle>
              </SheetHeader>

              <div className="flex-1 space-y-5 overflow-y-auto px-4">
                <div>
                  <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                    Status
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {STATUS_TABS.map((tab) => (
                      <Button
                        key={tab.id}
                        type="button"
                        variant={statusFilter === tab.id ? 'secondary' : 'ghost'}
                        onClick={() => setStatusFilter(tab.id)}
                        className="justify-center"
                      >
                        {tab.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center justify-between rounded-lg">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                    Favorites only
                  </span>
                  <Switch checked={favoritesOnly} onCheckedChange={setFavoritesOnly} />
                </label>

                {availableTags.length > 0 ? (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                        Tags
                      </p>
                      {tagFilter.length > 0 ? (
                        <Button variant="link" size="sm" onClick={() => setTagFilter([])}>
                          Clear
                        </Button>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {availableTags.map((tag) => {
                        const checked = tagFilter.includes(tag)
                        return (
                          <Badge
                            key={tag}
                            variant={checked ? 'default' : 'outline'}
                            asChild
                            className="cursor-pointer uppercase"
                          >
                            <button
                              type="button"
                              aria-pressed={checked}
                              onClick={() =>
                                setTagFilter((prev) =>
                                  prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                                )
                              }
                            >
                              {tag}
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <SheetFooter className="flex-row justify-between">
                <Button
                  variant="ghost"
                  disabled={activeFilterCount === 0}
                  onClick={() => {
                    setStatusFilter('all')
                    setTagFilter([])
                    setFavoritesOnly(false)
                  }}
                >
                  Clear all
                </Button>
                <SheetClose asChild>
                  <Button>Done</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {channelFilter === 'instagram' && instagramConnected && channelThreadCount('instagram') === 0 ? (
        <div className="mx-3 mt-2 rounded-lg border border-[#E1306C]/20 bg-[#fce8f0] px-3 py-2.5">
          <p className="text-xs font-semibold text-[#C13584]">Instagram connected — no chats yet</p>
          <p className="mt-1 text-xs leading-snug text-slate-600">
            Sync imports recent DMs. New customer messages still arrive live.
          </p>
          <Button
            size="sm"
            className="mt-2 bg-[#E1306C] text-white hover:bg-[#C13584]"
            disabled={instagramSyncing}
            onClick={() => onSyncInstagram()}
          >
            {instagramSyncing ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Sync Instagram chats
          </Button>
          {instagramSyncHint ? <p className="mt-2 text-[11px] leading-snug text-slate-500">{instagramSyncHint}</p> : null}
        </div>
      ) : null}

      {channelFilter === 'messenger' && messengerConnected && channelThreadCount('messenger') === 0 ? (
        <div className="mx-3 mt-2 rounded-lg border border-[#1877F2]/20 bg-[#e8f4ff] px-3 py-2.5">
          <p className="text-xs font-semibold text-[#1877F2]">Messenger connected — no chats yet</p>
          <Button size="sm" className="mt-2" disabled={messengerSyncing} onClick={onSyncMessenger}>
            {messengerSyncing ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Sync Messenger chats
          </Button>
        </div>
      ) : null}

      <div ref={listRef} data-testid="conversation-list-scroll" className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
            <SlidersHorizontal className="text-muted-foreground size-5" />
            <p className="text-muted-foreground text-sm">No conversations match these filters.</p>
          </div>
        ) : (
          <ul className="relative min-w-0 divide-y" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((vi) => {
              const c = filtered[vi.index]
              if (!c) return null
              const waLine =
                shouldShowWhatsAppLine(whatsappAccounts) &&
                whatsappLineLabel(c.channel, c.channelAccountId, whatsappAccounts)
              return (
                <li
                  key={c.id}
                  data-index={vi.index}
                  className="absolute top-0 left-0 w-full min-w-0"
                  style={{ height: vi.size, transform: `translateY(${vi.start}px)` }}
                >
                  <ConversationRow
                    conversation={c}
                    active={c.id === selectedId}
                    checked={selectedIds.has(c.id)}
                    waLine={waLine || false}
                    badge={assigneeBadge(c)}
                    onSelect={onSelect}
                    onToggleSelected={toggleSelected}
                    onToggleFavorite={(id, isFavorite) =>
                      setFavorite.mutate({ conversationId: id, isFavorite })
                    }
                  />
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {channelFilter === 'instagram' && instagramConnected && instagramHasMore && channelThreadCount('instagram') > 0 ? (
        <div className="shrink-0 border-t bg-background px-3 py-2.5">
          <Button
            variant="outline"
            className="w-full border-[#E1306C]/30 bg-[#fce8f0] text-[#C13584] hover:bg-[#f8d4e2]"
            disabled={instagramSyncing}
            onClick={() => onSyncInstagram({ loadMore: true })}
          >
            {instagramSyncing ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {instagramSyncing ? 'Loading next 20…' : 'Load more'}
          </Button>
          {instagramSyncHint ? (
            <p className="text-muted-foreground mt-1.5 text-center text-[11px] leading-snug">{instagramSyncHint}</p>
          ) : null}
        </div>
      ) : null}

      <InboxBatchSheet
        open={batchOpen}
        onOpenChange={setBatchOpen}
        conversations={filtered}
        selectedIds={selectedIds}
        onClear={() => setSelectedIds(new Set())}
      />
    </div>
  )
}
