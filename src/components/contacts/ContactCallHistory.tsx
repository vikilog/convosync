import { Loader2, PhoneCall, PhoneIncoming, PhoneMissed, PhoneOff, PhoneOutgoing, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCallDuration, formatDetailDate } from '@/lib/contactDetailFormat'
import {
  CALL_STATUS_LABEL,
  CALL_STATUS_TONE,
  type CallDirection,
  type CallStatus,
  type ContactCallEntry,
} from '@/services/calling.service'

const CALL_DIRECTION_TOGGLES: { value: CallDirection; label: string; icon: typeof PhoneIncoming }[] = [
  { value: 'inbound', label: 'Inbound', icon: PhoneIncoming },
  { value: 'outbound', label: 'Outbound', icon: PhoneOutgoing },
]

const CALL_STATUS_TOGGLES: { value: CallStatus; label: string; icon: typeof PhoneMissed; tone: string }[] = [
  { value: 'answered', label: 'Answered', icon: PhoneCall, tone: 'border-channel-green bg-channel-green/10 text-channel-green' },
  { value: 'no-answer', label: 'Missed', icon: PhoneMissed, tone: 'border-destructive bg-destructive/10 text-destructive' },
  { value: 'busy', label: 'Busy', icon: PhoneOff, tone: 'border-destructive bg-destructive/10 text-destructive' },
  { value: 'failed', label: 'Failed', icon: XCircle, tone: 'border-destructive bg-destructive/10 text-destructive' },
]

function CallFilterChip({
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

export function ContactCallHistory({
  calls,
  filteredCalls,
  loading,
  directionFilters,
  statusFilters,
  onToggleDirection,
  onToggleStatus,
}: {
  calls: ContactCallEntry[]
  filteredCalls: ContactCallEntry[]
  loading: boolean
  directionFilters: Set<CallDirection>
  statusFilters: Set<CallStatus>
  onToggleDirection: (value: CallDirection) => void
  onToggleStatus: (value: CallStatus) => void
}) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading calls…
      </div>
    )
  }

  if (calls.length === 0) {
    return <p className="text-muted-foreground py-6 text-sm">No calls with this contact yet.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {CALL_DIRECTION_TOGGLES.map((t) => (
            <CallFilterChip
              key={t.value}
              icon={t.icon}
              label={t.label}
              active={directionFilters.has(t.value)}
              onClick={() => onToggleDirection(t.value)}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
          {CALL_STATUS_TOGGLES.map((t) => (
            <CallFilterChip
              key={t.value}
              icon={t.icon}
              label={t.label}
              tone={t.tone}
              active={statusFilters.has(t.value)}
              onClick={() => onToggleStatus(t.value)}
            />
          ))}
        </div>
      </div>

      {filteredCalls.length === 0 ? (
        <p className="text-muted-foreground py-6 text-sm">No calls match these filters.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Direction</TableHead>
              <TableHead>Via number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Recorded</TableHead>
              <TableHead className="text-right">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCalls.map((call) => (
              <TableRow
                key={call.id}
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/calling/${call.numberId}/${call.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/calling/${call.numberId}/${call.id}`)
                  }
                }}
                className="hover:bg-muted/50 cursor-pointer"
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    {call.direction === 'inbound' ? (
                      <PhoneIncoming className="text-channel-green size-4 shrink-0" />
                    ) : call.status === 'answered' ? (
                      <PhoneOutgoing className="text-muted-foreground size-4 shrink-0" />
                    ) : (
                      <PhoneMissed className="text-destructive size-4 shrink-0" />
                    )}
                    <span className="text-sm font-semibold">
                      {call.direction === 'inbound' ? 'Incoming' : 'Outgoing'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {call.numberLabel ?? call.fromNumber}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`uppercase ${CALL_STATUS_TONE[call.status]}`}>
                    {CALL_STATUS_LABEL[call.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm tabular-nums">
                  {call.durationSeconds > 0 ? formatCallDuration(call.durationSeconds) : '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {call.hasRecording ? 'Yes' : 'No'}
                </TableCell>
                <TableCell className="text-muted-foreground text-right text-xs tabular-nums">
                  {call.startedAt ? formatDetailDate(call.startedAt) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
