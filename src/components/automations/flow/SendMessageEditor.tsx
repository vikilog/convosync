import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { countBodyVariables } from '@/lib/templateBuilderUtils'
import { IG_SEND_AS_MODES, resolveMessageMode, type MessageMode, type SendMessageData } from '@/lib/journeyNodeTypes'
import { realTemplateStatusBadgeVariant } from '@/components/templates/template-status'
import type { AutomationChannel } from '@/services/realAutomations.service'
import { realTemplatesService, type WhatsAppTemplate } from '@/services/realTemplates.service'

const CTA_URL_LABEL_MAX = 20

function variableArray(data: Record<string, unknown>): string[] {
  const v = data.variables
  if (Array.isArray(v)) return v.map(String)
  if (v && typeof v === 'object') return Object.values(v as Record<string, string>).map(String)
  return []
}

export function SendMessageEditor({
  draft,
  channel,
  onChange,
}: {
  draft: Record<string, unknown>
  channel: AutomationChannel
  onChange: (next: Record<string, unknown>) => void
}) {
  const d = draft as Partial<SendMessageData>
  const mode = resolveMessageMode(draft)
  const { data: templates = [], isLoading, isError } = realTemplatesService.useList()

  const setMode = (next: MessageMode) => {
    if (next === mode) return
    if (next === 'text') onChange({ ...draft, messageMode: 'text', templateId: '', templateName: '', variables: [] })
    else if (next === 'template') onChange({ ...draft, messageMode: 'template', text: '' })
    else onChange({ ...draft, messageMode: 'cta_url', templateId: '', templateName: '', variables: [] })
  }

  const selectTemplate = (t: WhatsAppTemplate) => {
    const count = countBodyVariables(t.bodyPattern)
    const prev = variableArray(draft)
    const nextVars = Array.from({ length: count }, (_, i) => {
      if (prev[i]?.trim()) return prev[i]
      const label = (t.variables[i] || '').toLowerCase()
      if (label.includes('name') || label.includes('first')) return '{{contact.name}}'
      if (label.includes('phone')) return '{{contact.phone}}'
      if (label.includes('email')) return '{{contact.email}}'
      return ''
    })
    onChange({
      ...draft,
      messageMode: 'template',
      templateId: t.id,
      templateName: t.name,
      language: t.language ?? 'en',
      variables: nextVars,
      text: '',
    })
  }

  const selected =
    templates.find((t) => t.id === d.templateId) ?? templates.find((t) => t.name === d.templateName) ?? null
  const varCount = selected ? countBodyVariables(selected.bodyPattern) : 0
  const vars = variableArray(draft)

  if (channel === 'instagram') {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Send as</Label>
          <Select
            value={d.sendAs === 'private_reply' ? 'private_reply' : 'window_24h'}
            onValueChange={(v) => onChange({ ...draft, sendAs: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IG_SEND_AS_MODES.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            Private reply only applies to the first message after a comment trigger.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="node-message-text">Message text</Label>
          <Textarea
            id="node-message-text"
            rows={5}
            value={d.text ?? ''}
            onChange={(e) => onChange({ ...draft, text: e.target.value })}
            placeholder="Hi there! 👋"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1 rounded-lg border p-1">
        {(['text', 'template', 'cta_url'] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setMode(opt)}
            className={`rounded-md py-1.5 text-xs font-semibold ${
              mode === opt ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'
            }`}
          >
            {opt === 'text' ? 'Text' : opt === 'template' ? 'Template' : 'Link button'}
          </button>
        ))}
      </div>

      {mode === 'text' ? (
        <div className="space-y-1.5">
          <Label htmlFor="node-message-text">Message text</Label>
          <Textarea
            id="node-message-text"
            rows={5}
            value={d.text ?? ''}
            onChange={(e) => onChange({ ...draft, text: e.target.value })}
            placeholder="Hi {{contact.name}}, thanks for reaching out!"
          />
          <p className="text-muted-foreground text-xs">{'{{contact.name}}'}, {'{{contact.phone}}'}, {'{{contact.email}}'}</p>
        </div>
      ) : null}

      {mode === 'cta_url' ? (
        <>
          <p className="text-muted-foreground text-xs">
            WhatsApp CTA URL message — the Meta-accepted way to attach a link button.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="node-cta-text">Message text</Label>
            <Textarea
              id="node-cta-text"
              rows={4}
              value={d.text ?? ''}
              onChange={(e) => onChange({ ...draft, text: e.target.value })}
              placeholder="Hi {{contact.name}}, here's your link:"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="node-cta-label">Button label</Label>
              <Input
                id="node-cta-label"
                maxLength={CTA_URL_LABEL_MAX}
                value={d.ctaLabel ?? ''}
                onChange={(e) => onChange({ ...draft, ctaLabel: e.target.value })}
                placeholder="Open link"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="node-cta-url">URL</Label>
              <Input
                id="node-cta-url"
                value={d.ctaUrl ?? ''}
                onChange={(e) => onChange({ ...draft, ctaUrl: e.target.value })}
                placeholder="https://"
              />
            </div>
          </div>
        </>
      ) : null}

      {mode === 'template' ? (
        <>
          {isError ? <p className="text-destructive text-xs">Failed to load templates.</p> : null}
          {isLoading ? (
            <p className="text-muted-foreground text-xs">Loading templates…</p>
          ) : templates.length === 0 ? (
            <p className="text-muted-foreground text-xs">No templates yet. Create or sync them from Templates.</p>
          ) : (
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border p-1.5">
              {templates.map((t) => {
                const active = t.id === d.templateId || (!d.templateId && t.name === d.templateName)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTemplate(t)}
                    className={`w-full rounded-md px-2 py-1.5 text-left ${active ? 'bg-primary/10' : 'hover:bg-muted'}`}
                  >
                    <p className="truncate font-mono text-sm font-semibold">{t.name}</p>
                    <Badge variant={realTemplateStatusBadgeVariant(t.status)} className="mt-0.5 capitalize">
                      {t.status}
                    </Badge>
                  </button>
                )
              })}
            </div>
          )}
          {selected && selected.status !== 'approved' ? (
            <p className="text-xs text-amber-800">This template is {selected.status}. Only approved templates can be sent.</p>
          ) : null}
          {selected && varCount > 0 ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Variable mapping</p>
              {Array.from({ length: varCount }, (_, i) => (
                <div key={i} className="space-y-1">
                  <Label className="text-xs">{selected.variables[i] || `{{${i + 1}}}`}</Label>
                  <Input
                    value={vars[i] ?? ''}
                    onChange={(e) => {
                      const next = [...vars]
                      while (next.length <= i) next.push('')
                      next[i] = e.target.value
                      onChange({ ...draft, variables: next })
                    }}
                    placeholder="{{contact.name}} or static value"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
