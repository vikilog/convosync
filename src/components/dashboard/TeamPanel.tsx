import { ArrowUpRight, Crown } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardTeamMember } from '@/lib/dashboardMockData'

interface TeamPanelProps {
  members: DashboardTeamMember[]
  onViewAll: () => void
}

export function TeamPanel({ members, onViewAll }: TeamPanelProps) {
  const items = members.slice(0, 5)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Team</CardTitle>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-muted-foreground text-sm">No team members yet.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((member) => (
              <li key={member.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <Avatar className="size-7">
                  {member.avatar ? <AvatarImage src={member.avatar} alt="" /> : null}
                  <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-sm font-medium">{member.name}</p>
                    {member.isOwner ? <Crown className="text-primary h-3 w-3 shrink-0" aria-hidden /> : null}
                  </div>
                  <p className="text-muted-foreground truncate text-xs capitalize">{member.role}</p>
                </div>
                {typeof member.conversationsCount === 'number' ? (
                  <Badge variant="outline" className="shrink-0">
                    {member.conversationsCount} convos
                  </Badge>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter>
        <Button variant="link" size="sm" className="mx-auto" onClick={onViewAll}>
          View all
          <ArrowUpRight />
        </Button>
      </CardFooter>
    </Card>
  )
}
