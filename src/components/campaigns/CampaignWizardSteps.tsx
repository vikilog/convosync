import { ChannelIcon } from '@/components/channel-icon'
import { WhatsAppBubblePreview } from '@/components/templates/WhatsAppBubblePreview'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { sanitizeEmailHtml } from '@/lib/sanitizeEmailHtml'
import type {
  AudienceContactRow,
  AudienceSegment,
  CampaignChannel,
  EmailCampaignTemplate,
  TagMatchMode,
} from '@/services/realCampaigns.service'
import type { WhatsAppTemplate } from '@/services/realTemplates.service'

export const AUTO_EMAIL_VARS = new Set([
  'first_name',
  'last_name',
  'name',
  'email',
  'phone',
  'contact.name',
  'contact.first_name',
  'contact.last_name',
  'contact.email',
  'contact.phone',
])

const WA_FIELDS = [
  { value: '{{contact.name}}', label: 'Contact name' },
  { value: '{{contact.first_name}}', label: 'First name' },
  { value: '{{contact.phone}}', label: 'Phone' },
  { value: '{{contact.email}}', label: 'Email' },
] as const

export function applyEmailVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`)
}

function contactHandle(
  contact: AudienceContactRow,
  channel: CampaignChannel
): string {
  if (channel === 'email') return contact.email?.trim() || 'No email'
  if (channel === 'instagram') {
    if (contact.phone.startsWith('ig:')) return contact.phone.slice(3)
    return contact.source === 'Instagram' ? 'Instagram contact' : contact.phone
  }
  return contact.phone
}

export function ChannelStep({
  channel,
  onChange,
}: {
  channel: CampaignChannel
  onChange: (c: CampaignChannel) => void
}) {
  return (
    <div className="grid gap-2">
      {(
        [
          { id: 'whatsapp' as const, label: 'WhatsApp' },
          { id: 'email' as const, label: 'Email' },
          { id: 'instagram' as const, label: 'Instagram', hint: 'Preview only' },
        ] as const
      ).map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm ${
            channel === opt.id ? 'border-primary ring-primary/30 ring-1' : ''
          }`}
        >
          <ChannelIcon channel={opt.id} className="size-4" />
          <span className="font-medium">{opt.label}</span>
          {'hint' in opt ? <span className="text-muted-foreground ml-auto text-xs">{opt.hint}</span> : null}
        </button>
      ))}
    </div>
  )
}

export function AudienceStep({
  channel,
  audienceType,
  onAudienceType,
  tagQuery,
  onTagQuery,
  segmentIds,
  onToggleTag,
  tagMatchMode,
  onMatchMode,
  tagged,
  audienceTotal,
  excludedCount,
  audienceCount,
  contacts,
  truncated,
}: {
  channel: CampaignChannel
  audienceType: 'all' | 'segment'
  onAudienceType: (t: 'all' | 'segment') => void
  tagQuery: string
  onTagQuery: (q: string) => void
  segmentIds: string[]
  onToggleTag: (id: string) => void
  tagMatchMode: TagMatchMode
  onMatchMode: (m: TagMatchMode) => void
  tagged: AudienceSegment[]
  audienceTotal: number
  excludedCount?: number
  audienceCount: number
  contacts: AudienceContactRow[]
  truncated?: boolean
}) {
  return (
    <>
      <div className="grid gap-2">
        <button
          type="button"
          onClick={() => onAudienceType('all')}
          className={`flex w-full items-center gap-2 rounded-lg border p-3 text-left text-sm ${
            audienceType === 'all' ? 'border-primary ring-primary/30 ring-1' : ''
          }`}
        >
          All {channel} contacts
          <span className="text-muted-foreground ml-auto text-xs">{audienceTotal.toLocaleString()}</span>
        </button>
        <button
          type="button"
          onClick={() => onAudienceType('segment')}
          className={`flex w-full items-center gap-2 rounded-lg border p-3 text-left text-sm ${
            audienceType === 'segment' ? 'border-primary ring-primary/30 ring-1' : ''
          }`}
        >
          By tag
        </button>
      </div>
      {audienceType === 'segment' ? (
        <div className="space-y-2">
          <Input value={tagQuery} onChange={(e) => onTagQuery(e.target.value)} placeholder="Filter tags…" />
          {segmentIds.length > 1 ? (
            <div className="flex gap-2">
              {(['any', 'all'] as const).map((mode) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={tagMatchMode === mode ? 'default' : 'outline'}
                  onClick={() => onMatchMode(mode)}
                >
                  Match {mode}
                </Button>
              ))}
            </div>
          ) : null}
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
            {tagged.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={segmentIds.includes(s.id)} onCheckedChange={() => onToggleTag(s.id)} />
                <span className="flex-1 truncate">{s.name}</span>
                <span className="text-muted-foreground text-xs">{s.count.toLocaleString()}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
      <p className="text-muted-foreground text-xs">
        {audienceCount.toLocaleString()} contacts
        {excludedCount ? ` · ${excludedCount.toLocaleString()} excluded (unsubscribed/blocked)` : ''}
      </p>
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2">
        {contacts.slice(0, 20).map((c) => (
          <div key={c.id} className="flex justify-between gap-2 text-xs">
            <span className="truncate font-medium">{c.name}</span>
            <span className="text-muted-foreground truncate">{contactHandle(c, channel)}</span>
          </div>
        ))}
        {truncated ? <p className="text-muted-foreground text-xs">Preview truncated</p> : null}
      </div>
    </>
  )
}

export function MessageStep({
  channel,
  approvedWa,
  waTemplateId,
  onWaTemplate,
  waTemplate,
  waMappings,
  onWaMapping,
  headerName,
  onHeaderFile,
  activeEmail,
  emailTemplateId,
  onEmailTemplate,
  emailTemplate,
  emailMappings,
  onEmailMapping,
  igMessage,
  onIgMessage,
}: {
  channel: CampaignChannel
  approvedWa: WhatsAppTemplate[]
  waTemplateId: string
  onWaTemplate: (id: string) => void
  waTemplate: WhatsAppTemplate | null
  waMappings: Record<string, string>
  onWaMapping: (key: string, value: string) => void
  headerName: string | null
  onHeaderFile: (file: File) => void
  activeEmail: EmailCampaignTemplate[]
  emailTemplateId: string
  onEmailTemplate: (id: string) => void
  emailTemplate: EmailCampaignTemplate | null
  emailMappings: Record<string, string>
  onEmailMapping: (key: string, value: string) => void
  igMessage: string
  onIgMessage: (v: string) => void
}) {
  if (channel === 'instagram') {
    return (
      <div className="space-y-1.5">
        <Label>Instagram DM (preview only)</Label>
        <Textarea value={igMessage} onChange={(e) => onIgMessage(e.target.value)} rows={6} maxLength={1000} />
        <p className="text-muted-foreground text-xs">
          Instagram send is preview-only. Use WhatsApp or Email to launch.
        </p>
      </div>
    )
  }

  if (channel === 'email') {
    return (
      <>
        <div className="space-y-1.5">
          <Label>Email template</Label>
          <Select value={emailTemplateId} onValueChange={onEmailTemplate}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a template" />
            </SelectTrigger>
            <SelectContent>
              {activeEmail.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {emailTemplate
          ? emailTemplate.variables
              .filter((v) => !AUTO_EMAIL_VARS.has(v))
              .map((v) => (
                <div key={v} className="space-y-1.5">
                  <Label>{v}</Label>
                  <Input value={emailMappings[v] ?? ''} onChange={(e) => onEmailMapping(v, e.target.value)} />
                </div>
              ))
          : null}
        {emailTemplate ? (
          <iframe
            title="Email preview"
            className="h-56 w-full rounded-lg border bg-white"
            srcDoc={sanitizeEmailHtml(applyEmailVars(emailTemplate.htmlBody, emailMappings))}
          />
        ) : null}
      </>
    )
  }

  return (
    <>
      <div className="space-y-1.5">
        <Label>Approved template</Label>
        <Select value={waTemplateId} onValueChange={onWaTemplate}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a template" />
          </SelectTrigger>
          <SelectContent>
            {approvedWa.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {waTemplate
        ? waTemplate.variables.map((v) => (
            <div key={v} className="space-y-1.5">
              <Label>{v}</Label>
              <Select value={waMappings[v] || undefined} onValueChange={(val) => onWaMapping(v, val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Map variable" />
                </SelectTrigger>
                <SelectContent>
                  {WA_FIELDS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))
        : null}
      {waTemplate && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(waTemplate.headerFormat ?? '') ? (
        <div className="space-y-1.5">
          <Label>Header media override</Label>
          <Input
            type="file"
            accept={
              waTemplate.headerFormat === 'VIDEO'
                ? 'video/*'
                : waTemplate.headerFormat === 'DOCUMENT'
                  ? '.pdf,application/pdf'
                  : 'image/*'
            }
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onHeaderFile(file)
            }}
          />
          <p className="text-muted-foreground text-xs">
            {headerName || waTemplate.headerMediaStorageKey ? 'Media ready' : 'Required for this template'}
          </p>
        </div>
      ) : null}
      {waTemplate ? (
        <WhatsAppBubblePreview
          headerFormat={
            waTemplate.headerFormat
              ? (waTemplate.headerFormat.toLowerCase() as 'text' | 'image' | 'video' | 'document')
              : 'none'
          }
          header={waTemplate.header ?? ''}
          body={waTemplate.bodyPattern}
          footer={waTemplate.footer ?? ''}
          variableSamples={waTemplate.variables.map((v) => waMappings[v] || v)}
          buttonText={waTemplate.buttonText ?? ''}
        />
      ) : null}
    </>
  )
}
