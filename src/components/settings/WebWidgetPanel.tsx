import { useEffect, useState } from 'react'
import { Check, Copy, Loader2, RefreshCw } from 'lucide-react'

import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { realAgentsService } from '@/services/realAgents.service'
import { buildWidgetEmbedSnippet, realWebWidgetService } from '@/services/realWebWidget.service'

export function WebWidgetPanel() {
  const { data, isLoading } = realWebWidgetService.useGet()
  const update = realWebWidgetService.useUpdate()
  const regenerate = realWebWidgetService.useRegenerateToken()
  const { data: agents = [] } = realAgentsService.useList()
  const confirm = useConfirm()

  const widget = data?.item
  const aiAgents = agents.filter((a) => a.category === 'ai_agent')

  const [copied, setCopied] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [botName, setBotName] = useState('')
  const [greeting, setGreeting] = useState('')
  const [color, setColor] = useState('#16a34a')
  const [agentId, setAgentId] = useState('')

  useEffect(() => {
    if (!widget) return
    setEnabled(widget.enabled)
    setBotName(widget.botName)
    setGreeting(widget.greeting)
    setColor(widget.accentColor)
    setAgentId(widget.agentId ?? '')
  }, [widget?.updatedAt])

  if (isLoading || !widget) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading widget settings…
      </div>
    )
  }

  const snippet = buildWidgetEmbedSnippet(widget)

  const regenerateToken = async () => {
    const ok = await confirm({
      title: 'Regenerate token?',
      description: 'The old embed snippet will stop working immediately.',
      confirmLabel: 'Regenerate',
      destructive: true,
    })
    if (ok) regenerate.mutate()
  }

  const save = () =>
    update.mutate({
      enabled,
      botName: botName.trim() || 'Assistant',
      greeting: greeting.trim() || 'Hi! How can I help you today?',
      accentColor: color,
      agentId: agentId || null,
    })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Embed snippet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="bg-muted flex-1 truncate rounded-lg border px-3 py-2 text-xs">{snippet}</code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard?.writeText(snippet).catch(() => {})
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
              aria-label="Copy embed snippet"
            >
              {copied ? <Check /> : <Copy />}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={regenerate.isPending}
            onClick={regenerateToken}
          >
            <RefreshCw />
            Regenerate token
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Agent</CardTitle>
          <p className="text-muted-foreground text-xs">
            The widget answers using this agent's skills and knowledge base. It must be published and enabled.
          </p>
        </CardHeader>
        <CardContent>
          <Select value={agentId} onValueChange={setAgentId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="— none selected —" />
            </SelectTrigger>
            <SelectContent>
              {aiAgents.map((a) => (
                <SelectItem key={a.id} value={a.id} disabled={!a.isPublished || !a.isEnabled}>
                  {a.name}
                  {!a.isPublished || !a.isEnabled ? ' (not published)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {aiAgents.length === 0 ? (
            <p className="mt-2 text-xs text-amber-600">
              No AI agents yet — create and publish one under AI Agent first.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Widget enabled</span>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </label>
          <div className="space-y-1.5">
            <Label htmlFor="widget-bot-name">Bot name</Label>
            <Input
              id="widget-bot-name"
              value={botName}
              maxLength={60}
              onChange={(e) => setBotName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="widget-greeting">Greeting message</Label>
            <Textarea
              id="widget-greeting"
              value={greeting}
              maxLength={300}
              onChange={(e) => setGreeting(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="widget-color">Accent color</Label>
            <div className="flex items-center gap-2">
              <input
                id="widget-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="size-9 shrink-0 cursor-pointer rounded-md border"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="max-w-32 font-mono"
              />
            </div>
          </div>
          <Button size="sm" disabled={update.isPending} onClick={save}>
            {update.isPending ? <Loader2 className="animate-spin" /> : null}
            Save changes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
