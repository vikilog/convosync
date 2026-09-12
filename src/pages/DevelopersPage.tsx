import { useState } from 'react'
import { Code2, Database, Webhook, Zap } from 'lucide-react'

import { ActionsPanel } from '@/components/developers/ActionsPanel'
import { AiSyncPanel } from '@/components/developers/AiSyncPanel'
import { WebhooksPanel } from '@/components/developers/WebhooksPanel'

type DevSection = 'webhooks' | 'actions' | 'ai-sync'

const SECTIONS: {
  id: DevSection
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}[] = [
  {
    id: 'webhooks',
    label: 'Webhooks',
    icon: Webhook,
    description: 'Incoming endpoints, outgoing subscriptions, and delivery logs.',
  },
  {
    id: 'actions',
    label: 'Actions',
    icon: Zap,
    description: 'HTTP APIs for AI Agents and Journey Engine.',
  },
  {
    id: 'ai-sync',
    label: 'AI Sync',
    icon: Database,
    description: 'Knowledge health, sync queue, and rebuild.',
  },
]

export function DevelopersPage() {
  const [section, setSection] = useState<DevSection>('webhooks')
  const active = SECTIONS.find((s) => s.id === section)!

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6 lg:flex-row">
      <aside className="shrink-0 lg:w-56">
        <div className="mb-4 flex items-center gap-2">
          <div className="text-primary flex size-9 items-center justify-center rounded-xl bg-sky-50">
            <Code2 className="size-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">Developers</h1>
            <p className="text-muted-foreground text-xs">Integrations &amp; automation</p>
          </div>
        </div>
        <nav className="space-y-1">
          {SECTIONS.map((item) => {
            const isActive = section === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="mb-4">
          <h3 className="text-base font-semibold">{active.label}</h3>
          <p className="text-muted-foreground mt-1 text-xs">{active.description}</p>
        </header>

        {section === 'webhooks' ? <WebhooksPanel /> : null}
        {section === 'actions' ? <ActionsPanel /> : null}
        {section === 'ai-sync' ? <AiSyncPanel /> : null}
      </main>
    </div>
  )
}
