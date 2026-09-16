import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  Loader2,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  PhoneOutgoing,
  RefreshCw,
  Search,
  Settings,
  UserRound,
  XCircle,
} from 'lucide-react'

import { ContactPickerSheet } from '@/components/calling/ContactPickerSheet'
import { ContactAvatar } from '@/components/inbox/ContactAvatar'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCall } from '@/lib/callClient'
import {
  CALL_STATUS_LABEL,
  CALL_STATUS_TONE,
  callingService,
  type CallDirection,
  type CallLogEntry,
  type CallStatus,
} from '@/services/calling.service'
import { virtualNumberService, type OwnedNumber } from '@/services/virtualNumber.service'

const STATUS_FILTER_VALUES = ['answered', 'no-answer', 'busy', 'failed'] as const satisfies readonly CallStatus[]

const DIRECTION_TOGGLES: { value: CallDirection; label: string; icon: typeof PhoneIncoming }[] = [
  { value: 'inbound', label: 'Inbound', icon: PhoneIncoming },
  { value: 'outbound', label: 'Outbound', icon: PhoneOutgoing },
]

const STATUS_TONE_ANSWERED = 'border-channel-green bg-channel-green/10 text-channel-green'
const STATUS_TONE_PROBLEM = 'border-destructive bg-destructive/10 text-destructive'

const STATUS_TOGGLES: { value: CallStatus; label: string; icon: typeof PhoneMissed; tone: string }[] = [
  { value: 'answered', label: 'Answered', icon: PhoneCall, tone: STATUS_TONE_ANSWERED },
  { value: 'no-answer', label: 'Missed', icon: PhoneMissed, tone: STATUS_TONE_PROBLEM },
  { value: 'busy', label: 'Busy', icon: PhoneOff, tone: STATUS_TONE_PROBLEM },
  { value: 'failed', label: 'Failed', icon: XCircle, tone: STATUS_TONE_PROBLEM },
]

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

function FilterChip({
  active,
  onClick,
  icon: Icon,
  label,
  tone,
}: {
  active: boolean
  onClick: () => void
  icon: typeof PhoneIncoming
  label: string
  tone?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active ? (tone ?? 'border-primary bg-primary text-primary-foreground') : 'hover:bg-muted/50'
      }`}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  )
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatTimeAgo(iso: string | null): string {
  if (!iso) return '—'
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function numberLabel(n: OwnedNumber): string {
  return n.label || n.number || 'Number'
}

const FILTERS_STORAGE_KEY = 'convosync:calling:filters'

type StoredFilters = { query: string; status: CallStatus[]; direction: CallDirection[] }

function loadStoredFilters(): StoredFilters {
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY)
    if (!raw) return { query: '', status: [], direction: [] }
    const parsed = JSON.parse(raw) as Partial<StoredFilters>
    return {
      query: typeof parsed.query === 'string' ? parsed.query : '',
      status: Array.isArray(parsed.status)
        ? parsed.status.filter((s): s is CallStatus => (STATUS_FILTER_VALUES as readonly string[]).includes(s))
        : [],
      direction: Array.isArray(parsed.direction)
        ? parsed.direction.filter((d): d is CallDirection => d === 'inbound' || d === 'outbound')
        : [],
    }
  } catch {
    return { query: '', status: [], direction: [] }
  }
}

function saveStoredFilters(filters: StoredFilters) {
  try {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters))
  } catch {
    // best-effort — filters just won't persist this time (private window, storage blocked, etc.)
  }
}

function DirectionIcon({ entry }: { entry: CallLogEntry }) {
  if (entry.status !== 'answered') {
    return <PhoneMissed className="text-destructive size-3.5" />
  }
  if (entry.direction === 'inbound') {
    return <PhoneIncoming className="text-channel-green size-3.5" />
  }
  return <PhoneOutgoing className="text-muted-foreground size-3.5" />
}

function CallRow({
  entry,
  onOpen,
  onRecall,
  onViewContact,
  recallDisabled,
}: {
  entry: CallLogEntry
  onOpen: () => void
  onRecall: () => void
  onViewContact: () => void
  recallDisabled: boolean
}) {
  return (
    <TableRow
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      className="hover:bg-muted/50 cursor-pointer"
    >
      <TableCell>
        <div className="flex items-center gap-2.5">
          <ContactAvatar name={entry.contact.name ?? entry.contact.phone} className="size-8" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <DirectionIcon entry={entry} />
              <p className="truncate text-sm font-semibold">
                {entry.contact.name ?? entry.contact.phone}
              </p>
            </div>
            <p className="text-muted-foreground truncate text-xs">
              {entry.contact.name ? <span className="font-mono tabular-nums">{entry.contact.phone} · </span> : null}
              {entry.direction === 'inbound' ? 'Incoming' : 'Outgoing'} · via {entry.fromNumber}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${CALL_STATUS_TONE[entry.status]}`}
        >
          {CALL_STATUS_LABEL[entry.status]}
        </span>
      </TableCell>
      <TableCell>
        {entry.durationSeconds > 0 ? (
          <span className="text-muted-foreground text-xs tabular-nums">
            {formatDuration(entry.durationSeconds)}
            {entry.hasRecording ? ' · recorded' : ''}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground text-right text-xs font-medium tabular-nums">
        {formatTimeAgo(entry.startedAt)}
      </TableCell>
      <TableCell className="w-20">
        <div className="flex items-center justify-end gap-1.5">
          {entry.contact.contactId ? (
            <Button
              variant="outline"
              size="icon-sm"
              title="View contact"
              aria-label="View contact"
              onClick={(e) => {
                e.stopPropagation()
                onViewContact()
              }}
            >
              <UserRound className="size-3.5" />
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="icon-sm"
            disabled={recallDisabled}
            title={`Call ${entry.contact.phone} again`}
            aria-label={`Call ${entry.contact.phone} again`}
            onClick={(e) => {
              e.stopPropagation()
              onRecall()
            }}
          >
            <PhoneCall className="size-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function CallingPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState(() => loadStoredFilters().query)
  const [statusFilters, setStatusFilters] = useState<Set<CallStatus>>(() => new Set(loadStoredFilters().status))
  const [directionFilters, setDirectionFilters] = useState<Set<CallDirection>>(
    () => new Set(loadStoredFilters().direction),
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const activeCall = useCall()
  const { data: numbersData } = virtualNumberService.useNumbers()
  const numbers = numbersData?.numbers ?? []

  useEffect(() => {
    if (!selectedId && numbers.length > 0) setSelectedId(numbers[0].id)
    else if (selectedId && !numbers.some((n) => n.id === selectedId)) setSelectedId(numbers[0]?.id ?? null)
  }, [numbers, selectedId])

  const selected = numbers.find((n) => n.id === selectedId) ?? null

  const {
    data: callLog,
    isLoading,
    error,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = callingService.useCallLog(selected?.id, { refetchIntervalMs: activeCall.phase !== 'idle' ? 3000 : false })

  const entries = useMemo(() => callLog?.pages.flatMap((p) => p.entries) ?? [], [callLog])

  useEffect(() => {
    saveStoredFilters({ query, status: [...statusFilters], direction: [...directionFilters] })
  }, [query, statusFilters, directionFilters])

  const stats = useMemo(() => {
    const answered = entries.filter((e) => e.status === 'answered')
    const missed = entries.filter((e) => e.status !== 'answered')
    const totalDuration = answered.reduce((sum, e) => sum + e.durationSeconds, 0)
    return {
      total: entries.length,
      answered: answered.length,
      missed: missed.length,
      avgDurationSeconds: answered.length > 0 ? Math.round(totalDuration / answered.length) : 0,
    }
  }, [entries])

  const filtered = useMemo(() => {
    const q = query.trim().replace(/\s+/g, '')
    return entries.filter((entry) => {
      if (statusFilters.size > 0 && !statusFilters.has(entry.status)) return false
      if (directionFilters.size > 0 && !directionFilters.has(entry.direction)) return false
      if (!q) return true
      return entry.contact.phone.replace(/\s+/g, '').includes(q)
    })
  }, [entries, query, statusFilters, directionFilters])

  const onCall = activeCall.phase !== 'idle'
  const placeCall = (to: string) => activeCall.call(to, selected?.rawNumber ?? undefined)

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-base font-semibold">Calls</h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Every call placed or received on your virtual numbers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {numbers.length > 1 ? (
            <Select value={selected?.id ?? ''} onValueChange={setSelectedId}>
              <SelectTrigger size="sm" className="w-44">
                <SelectValue>{selected ? numberLabel(selected) : 'Select number'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {numbers.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {numberLabel(n)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : selected ? (
            <span className="text-muted-foreground flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold">
              <Phone className="size-3.5" />
              {numberLabel(selected)}
            </span>
          ) : null}
          {selected ? (
            <Button size="sm" disabled={onCall} onClick={() => setPickerOpen(true)}>
              <PhoneCall className="size-3.5" />
              New call
            </Button>
          ) : null}
          {selected ? (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => navigate(`/calling/settings/${selected.id}`)}
              aria-label="Number settings"
              title="Number settings"
            >
              <Settings className="size-3.5" />
            </Button>
          ) : null}
        </div>
      </div>

      {selected ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card size="sm">
            <CardContent className="space-y-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Phone className="size-4" />
              </div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Total calls</p>
              <p className="font-mono text-xl font-bold tabular-nums">{stats.total}</p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="space-y-2">
              <div className="bg-[#e6f7ec] text-channel-green flex size-9 items-center justify-center rounded-xl">
                <PhoneCall className="size-4" />
              </div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Answered</p>
              <p className="font-mono text-xl font-bold tabular-nums">{stats.answered}</p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="space-y-2">
              <div className="bg-destructive/10 text-destructive flex size-9 items-center justify-center rounded-xl">
                <PhoneMissed className="size-4" />
              </div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Missed</p>
              <p className="font-mono text-xl font-bold tabular-nums">{stats.missed}</p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="space-y-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock className="size-4" />
              </div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Avg. duration</p>
              <p className="font-mono text-xl font-bold tabular-nums">{formatDuration(stats.avgDurationSeconds)}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <ContactPickerSheet open={pickerOpen} onOpenChange={setPickerOpen} onCall={placeCall} />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search phone number…"
                className="pl-8"
              />
            </div>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={isFetching}
              onClick={() => void refetch()}
              aria-label="Refresh calls"
              title="Refresh calls"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <div className="flex flex-wrap items-center gap-1.5">
              {DIRECTION_TOGGLES.map((t) => (
                <FilterChip
                  key={t.value}
                  icon={t.icon}
                  label={t.label}
                  active={directionFilters.has(t.value)}
                  onClick={() => setDirectionFilters((prev) => toggleInSet(prev, t.value))}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
              {STATUS_TOGGLES.map((t) => (
                <FilterChip
                  key={t.value}
                  icon={t.icon}
                  label={t.label}
                  active={statusFilters.has(t.value)}
                  tone={t.tone}
                  onClick={() => setStatusFilters((prev) => toggleInSet(prev, t.value))}
                />
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Loading calls…
            </div>
          ) : error ? (
            <p className="text-destructive py-12 text-center text-sm">Could not load calls right now.</p>
          ) : !selected ? (
            <EmptyState
              icon={Phone}
              title="No virtual number yet"
              description="Connect a virtual number from Integrations to start seeing calls here."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Phone}
              title="No calls yet"
              description="Once your virtual number starts placing and receiving calls, they'll show up here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">When</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <CallRow
                    key={entry.id}
                    entry={entry}
                    onOpen={() => navigate(`/calling/${selected.id}/${entry.id}`)}
                    onRecall={() => placeCall(entry.contact.rawPhone)}
                    onViewContact={() => navigate(`/contacts/${entry.contact.contactId}`)}
                    recallDisabled={onCall}
                  />
                ))}
              </TableBody>
            </Table>
          )}

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
        </CardContent>
      </Card>
    </div>
  )
}
