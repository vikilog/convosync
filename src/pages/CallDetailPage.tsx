import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, PhoneIncoming, PhoneMissed, PhoneOutgoing, UserRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ContactAvatar } from '@/components/inbox/ContactAvatar'
import { CALL_STATUS_LABEL, CALL_STATUS_TONE, callingService, type CallDetail } from '@/services/calling.service'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatWhen(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b py-2.5 last:border-b-0">
      <span className="text-muted-foreground shrink-0 text-xs font-semibold tracking-wide uppercase">
        {label}
      </span>
      <span className="truncate text-right text-sm font-medium tabular-nums">{value}</span>
    </div>
  )
}

/** Mirrors the field set Plivo's own "Call Insights" panel shows — everything here
 * comes straight from the CDR (network-lookup labels like "Originator" are console-only,
 * not exposed via the REST API, so they're left out rather than guessed). */
function CallInsights({ call }: { call: CallDetail }) {
  const left: [string, string][] = [
    ['Call UUID', call.callUuid],
    ['From', call.direction === 'inbound' ? call.contact.phone : call.fromNumber],
    ['To', call.direction === 'inbound' ? call.fromNumber : call.contact.phone],
    ['Direction', call.direction],
    ['Initiation time', formatWhen(call.startedAt)],
    ['Answer time', formatWhen(call.answerTime)],
    ['Call duration', formatDuration(call.durationSeconds)],
    ['Ring duration', call.ringDurationSeconds != null ? `${call.ringDurationSeconds}s` : '—'],
  ]
  const right: [string, string][] = [
    ['Hangup cause', call.hangupCause ?? '—'],
    ['Hangup source', call.hangupSource ?? '—'],
    ['Hangup code', call.hangupCauseCode != null ? String(call.hangupCauseCode) : '—'],
    ['STIR verification', call.stirVerification ?? '—'],
    ['Post dial delay', call.postDialDelaySeconds != null ? `${call.postDialDelaySeconds}s` : '—'],
    ['Source IP', call.sourceIp ?? '—'],
    ['Total cost', call.totalCostInrPaise != null ? `₹${(call.totalCostInrPaise / 100).toFixed(2)}` : '—'],
    ['Recorded', call.hasRecording ? 'Yes' : 'No'],
  ]

  return (
    <Card>
      <CardContent>
        <h2 className="mb-1 text-sm font-semibold">Call insights</h2>
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          <div>
            {left.map(([label, value]) => (
              <InsightRow key={label} label={label} value={value} />
            ))}
          </div>
          <div>
            {right.map(([label, value]) => (
              <InsightRow key={label} label={label} value={value} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function CallDetailPage() {
  const { numberId, callId } = useParams<{ numberId: string; callId: string }>()
  const navigate = useNavigate()
  const { data: call, isLoading, error } = callingService.useCallDetail(numberId, callId)

  const back = () => navigate('/calling')

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <Button variant="ghost" size="sm" onClick={back} className="gap-1.5">
        <ArrowLeft className="size-4" />
        Back to Calls
      </Button>

      {isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-16 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading call…
        </div>
      ) : error || !call ? (
        <p className="text-destructive py-16 text-center text-sm">Could not load this call.</p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <ContactAvatar name={call.contact.name ?? call.contact.phone} className="size-11" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {call.direction === 'inbound' ? (
                  <PhoneIncoming className="text-channel-green size-4" />
                ) : call.status === 'answered' ? (
                  <PhoneOutgoing className="text-muted-foreground size-4" />
                ) : (
                  <PhoneMissed className="text-destructive size-4" />
                )}
                <h1 className="truncate text-lg font-semibold">{call.contact.name ?? call.contact.phone}</h1>
              </div>
              <p className="text-muted-foreground text-xs">
                {call.contact.name ? <span className="font-mono tabular-nums">{call.contact.phone} · </span> : null}
                {call.direction === 'inbound' ? 'Incoming call' : 'Outgoing call'} · via {call.fromNumber} ·{' '}
                {formatWhen(call.startedAt)}
              </p>
            </div>
            {call.contact.contactId ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => navigate(`/contacts/${call.contact.contactId}`)}
              >
                <UserRound className="size-3.5" />
                View contact
              </Button>
            ) : null}
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${CALL_STATUS_TONE[call.status]}`}
            >
              {CALL_STATUS_LABEL[call.status]}
            </span>
          </div>

          <CallInsights call={call} />

          <Card>
            <CardContent className="space-y-3">
              <h2 className="text-sm font-semibold">Recording</h2>
              {call.recordUrl ? (
                <audio controls className="w-full" src={call.recordUrl}>
                  Your browser does not support audio playback.
                </audio>
              ) : (
                <p className="text-muted-foreground text-xs">
                  No recording for this call — either it wasn't answered, or recording wasn't enabled when it
                  was placed.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <h2 className="text-sm font-semibold">Transcript</h2>
              {call.transcript ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{call.transcript}</p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  {call.recordUrl
                    ? 'Transcription is still processing — Plivo delivers it a little after the recording finishes. Check back shortly.'
                    : 'No transcript available for this call.'}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
