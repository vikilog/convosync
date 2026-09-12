import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Coins, Loader2, Mail, MessageCircle, Sparkles } from 'lucide-react'

import { StatTile } from '@/components/stat-tile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { realBillingService } from '@/services/realBilling.service'

export function UsagePanel() {
  const { data: usage, isLoading } = realBillingService.useUsage()

  if (isLoading || !usage) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading usage…
      </div>
    )
  }

  const byChannel = usage.whatsapp.rows
    .filter((r) => r.conversations > 0)
    .map((r) => ({ name: r.label, value: r.conversations, fill: r.chartColor }))

  const dailyAi = usage.ai.dailyTokens.map((d) => ({ day: `${d.day}`, tokens: d.tokens }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <span className="text-muted-foreground text-xs font-medium">{usage.month}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Wallet balance" value={usage.wallet.balanceInr} icon={Coins} />
        <StatTile label="WhatsApp sent" value={usage.summary.whatsappMessagesSent} icon={MessageCircle} />
        <StatTile label="AI tokens used" value={usage.summary.aiTokensUsed} icon={Sparkles} />
        <StatTile label="Emails sent" value={usage.summary.emailsSent} icon={Mail} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>WhatsApp by type</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            {byChannel.length === 0 ? (
              <p className="text-muted-foreground py-16 text-center text-sm">No WhatsApp usage this month.</p>
            ) : (
              <>
                <div className="h-52 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byChannel}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={2}
                        stroke="none"
                        isAnimationActive={false}
                      >
                        {byChannel.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {byChannel.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                      <span className="text-muted-foreground">{entry.name}</span>
                      <span className="font-medium">{entry.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>AI tokens — daily</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="h-52 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyAi} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} width={40} />
                  <Tooltip />
                  <Bar
                    dataKey="tokens"
                    fill="var(--color-primary)"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
