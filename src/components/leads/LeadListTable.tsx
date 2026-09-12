import { UserPlus, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SOURCE_BADGE, timeAgo } from '@/lib/leadLabels'
import type { LeadFunnelStage } from '@/services/realLeadFunnels.service'
import type { Lead } from '@/services/realLeads.service'

export function LeadListTable({
  leads,
  stages,
  convertingIds,
  onOpen,
  onConvert,
}: {
  leads: Lead[]
  stages: LeadFunnelStage[]
  convertingIds: Set<string>
  onOpen: (lead: Lead) => void
  onConvert: (lead: Lead) => void
}) {
  const stageName = (lead: Lead) => stages.find((s) => s.id === lead.stageId)?.name ?? lead.stage
  const isFinal = (lead: Lead) => Boolean(stages.find((s) => s.id === lead.stageId)?.isFinal)

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Board</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-10 text-center text-sm">
                No leads match these filters.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => {
              const source = SOURCE_BADGE[lead.source] ?? SOURCE_BADGE.manual
              return (
                <TableRow key={lead.id} className="cursor-pointer" onClick={() => onOpen(lead)}>
                  <TableCell className="font-medium">{lead.name || 'Unknown'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={source.className}>
                      {source.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{stageName(lead)}</TableCell>
                  <TableCell>
                    {lead.contactId ? (
                      <span className="text-primary inline-flex items-center gap-1 text-xs">
                        <Users className="size-3.5" /> Linked
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{timeAgo(lead.updatedAt)}</TableCell>
                  <TableCell>
                    {isFinal(lead) && !lead.contactId ? (
                      <Button
                        variant="outline"
                        size="icon-xs"
                        title="Add to contacts"
                        disabled={convertingIds.has(lead.id)}
                        onClick={(e) => {
                          e.stopPropagation()
                          onConvert(lead)
                        }}
                      >
                        <UserPlus />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
