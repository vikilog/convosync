import { Filter, GitBranch } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { realContactsService } from '@/services/realContacts.service'

function formatDay(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function ContactLeadJourneyPanel({ contactId }: { contactId: string }) {
  const { data, isLoading } = realContactsService.useLeadJourney(contactId)
  const journey = data?.journey

  if (isLoading) return <Skeleton className="h-28 w-full" />
  if (!journey) return null

  const timeline = journey.timeline ?? []

  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Filter className="size-3.5" />
          Lead journey
        </p>
        <span className="text-muted-foreground rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ring-1 ring-border">
          Read-only
        </span>
      </div>
      <p className="text-muted-foreground mt-1 text-[11px]">Funnel path and dates — not editable from here.</p>
      <div className="mt-3 space-y-2">
        <p className="text-sm font-semibold">{journey.funnelName}</p>
        <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
          <span>Entered {formatDay(journey.enteredAt)}</span>
          <span>Contact {formatDay(journey.convertedAt)}</span>
          <span>Final: {journey.finalStage}</span>
        </div>
        {journey.origin?.commentText ? (
          <p className="rounded-lg border border-[#E1306C]/15 bg-[#fce8f0]/40 px-2.5 py-2 text-xs">
            <span className="font-semibold text-[#C13584]">@{journey.origin.username}</span>
            {': '}
            {journey.origin.commentText}
          </p>
        ) : null}
        {timeline.length > 0 ? (
          <ol className="relative mt-3 ml-1.5 space-y-3 border-l-2 pl-4">
            {timeline.map((item, i) => (
              <li key={`${item.at}-${i}`} className="relative">
                <span
                  className={`absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-white ${
                    item.type === 'converted'
                      ? 'bg-emerald-500'
                      : item.type === 'created'
                        ? 'bg-sky-500'
                        : 'bg-primary'
                  }`}
                />
                <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                  {formatDay(item.at)}
                </p>
                <p className="mt-0.5 text-xs font-semibold">{item.text}</p>
                {item.fromStage && item.toStage ? (
                  <p className="text-muted-foreground mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium">
                    <GitBranch className="size-3" />
                    {item.fromStage} → {item.toStage}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </div>
  )
}
