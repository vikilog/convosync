import { ArrowUpRight, Bot } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardAgent } from '@/lib/dashboardMockData'

interface AiAgentsPanelProps {
  agents: DashboardAgent[]
  onViewAll: () => void
}

export function AiAgentsPanel({ agents, onViewAll }: AiAgentsPanelProps) {
  const items = agents.slice(0, 4)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>AI agents</CardTitle>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Bot className="text-muted-foreground h-6 w-6" aria-hidden />
            <p className="text-muted-foreground mt-2 text-sm">No AI agents yet.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((agent) => (
              <li key={agent.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <Avatar className="bg-primary/10 size-7 rounded-lg">
                  {agent.avatarUrl ? <AvatarImage src={agent.avatarUrl} alt="" /> : null}
                  <AvatarFallback className="text-primary rounded-lg bg-transparent">
                    <Bot className="h-3.5 w-3.5" aria-hidden />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{agent.name}</p>
                  <p className="text-muted-foreground truncate text-xs">{agent.role}</p>
                </div>
                <Badge variant={agent.isEnabled ? 'default' : 'outline'} className="shrink-0">
                  {agent.isEnabled ? 'Active' : 'Off'}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter>
        <Button variant="link" size="sm" className="mx-auto" onClick={onViewAll}>
          View all agents
          <ArrowUpRight />
        </Button>
      </CardFooter>
    </Card>
  )
}
