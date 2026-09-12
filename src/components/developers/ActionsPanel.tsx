import { useState } from 'react'
import { Save, Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { ActionMethod, DeveloperAction } from '@/lib/developersMockData'
import { realDevelopersService } from '@/services/realDevelopers.service'

const METHODS: ActionMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

function ActionCard({ action }: { action: DeveloperAction }) {
  const updateAction = realDevelopersService.useUpsertDeveloperAction()

  const [name, setName] = useState(action.name)
  const [method, setMethod] = useState<ActionMethod>(action.method)
  const [url, setUrl] = useState(action.url)
  const [timeoutMs, setTimeoutMs] = useState(action.timeoutMs)
  const [headersText, setHeadersText] = useState(JSON.stringify(action.headers, null, 2))
  const [enabled, setEnabled] = useState(action.enabled)
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    let headers: Record<string, string>
    try {
      headers = headersText.trim() ? JSON.parse(headersText) : {}
    } catch {
      setError(`Invalid JSON headers for ${action.actionType}`)
      return
    }
    setError(null)
    updateAction.mutate({
      actionType: action.actionType,
      name: name.trim() || action.name,
      method,
      url: url.trim(),
      timeoutMs,
      headers,
      enabled,
    })
  }

  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="text-primary flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-50">
            <Zap className="size-4" />
          </div>
          <div className="min-w-0">
            <code className="text-primary text-xs font-semibold">{action.actionType}</code>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full border-0 bg-transparent p-0 text-sm font-semibold outline-none"
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-muted-foreground text-xs">Enabled</span>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        <Select value={method} onValueChange={(v) => setMethod(v as ActionMethod)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/..."
          className="sm:col-span-2"
        />
        <Input
          type="number"
          min={1000}
          max={120000}
          value={timeoutMs}
          onChange={(e) => setTimeoutMs(Number(e.target.value))}
          title="Timeout (ms)"
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-muted-foreground text-xs font-medium">Headers (JSON)</p>
        <Textarea
          value={headersText}
          onChange={(e) => setHeadersText(e.target.value)}
          rows={3}
          className="font-mono text-xs"
        />
      </div>

      {error ? <p className="text-destructive text-xs">{error}</p> : null}

      <div className="flex justify-end">
        <Button size="sm" onClick={save}>
          <Save />
          Save
        </Button>
      </div>
    </div>
  )
}

export function ActionsPanel() {
  const { data: actions = [] } = realDevelopersService.useDeveloperActions()

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-xs">
        Configure HTTP endpoints for AI Agents and Journey Engine. Each action type maps to one external API
        call.
      </p>
      <div className="space-y-3">
        {actions.map((action) => (
          <ActionCard key={action.id} action={action} />
        ))}
      </div>
    </div>
  )
}
