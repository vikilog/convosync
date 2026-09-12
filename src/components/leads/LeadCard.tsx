import { Mail, Phone, UserPlus, UserRound, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SOURCE_BADGE, timeAgo } from '@/lib/leadLabels'
import type { Lead } from '@/services/realLeads.service'

export function LeadCard({
  lead,
  dragging,
  showConvert,
  convertBusy,
  onOpen,
  onConvert,
}: {
  lead: Lead
  dragging?: boolean
  showConvert?: boolean
  convertBusy?: boolean
  onOpen?: () => void
  onConvert?: () => void
}) {
  const source = SOURCE_BADGE[lead.source] ?? SOURCE_BADGE.manual

  return (
    <div
      className={`bg-card w-full rounded-xl border p-3 text-left transition-shadow ${
        dragging ? 'ring-primary/30 shadow-lg ring-2' : ''
      }`}
    >
      <button type="button" onClick={onOpen} className="w-full cursor-grab text-left active:cursor-grabbing">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold">{lead.name || 'Unknown'}</p>
          <Badge variant="outline" className={`shrink-0 ${source.className}`}>
            {source.label}
          </Badge>
        </div>

        <div className="text-muted-foreground mt-2 flex items-center gap-2">
          <Phone className={`size-3.5 ${lead.phone ? '' : 'opacity-30'}`} />
          <Mail className={`size-3.5 ${lead.email ? '' : 'opacity-30'}`} />
        </div>

        <p className="text-muted-foreground mt-2 line-clamp-2 text-xs leading-relaxed">{lead.requirement}</p>
      </button>

      <div className="mt-3 flex items-center justify-between gap-2">
        {lead.assignedRep ? (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            {lead.assignedRep.avatarUrl ? (
              <img src={lead.assignedRep.avatarUrl} alt="" className="size-5 rounded-full object-cover" />
            ) : (
              <span className="bg-muted flex size-5 items-center justify-center rounded-full">
                <UserRound className="size-3" />
              </span>
            )}
            <span className="text-muted-foreground truncate text-[11px] font-semibold">
              {lead.assignedRep.name}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground text-[11px]">Unassigned</span>
        )}
        <div className="flex shrink-0 items-center gap-1.5">
          {showConvert ? (
            <Button
              variant="outline"
              size="icon-xs"
              title="Add to contacts"
              disabled={convertBusy}
              className="border-primary/30 text-primary hover:bg-primary/10"
              onClick={(e) => {
                e.stopPropagation()
                onConvert?.()
              }}
            >
              <UserPlus className={convertBusy ? 'animate-pulse' : undefined} />
            </Button>
          ) : null}
          {lead.contactId ? (
            <span title="Contact linked" className="text-primary">
              <Users className="size-3.5" />
            </span>
          ) : null}
          <span className="text-muted-foreground text-[11px]">{timeAgo(lead.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}
