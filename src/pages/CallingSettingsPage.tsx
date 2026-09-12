import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, IndianRupee, Loader2, Phone, PhoneOff, Save } from 'lucide-react'

import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { virtualNumberService } from '@/services/virtualNumber.service'
import { realTemplatesService } from '@/services/realTemplates.service'

const DEFAULT_PLATFORM_MISS_MESSAGE =
  "Sorry we missed your call! We'll call you back shortly. Reply here if it's urgent."
const DEFAULT_USER_MISS_MESSAGE =
  "We tried calling you just now but couldn't get through. Reply here and we'll try again."

type ReplyMode = 'message' | 'template'

function formatInr(paise: number): string {
  if (!Number.isFinite(paise)) return '—'
  return (paise / 100).toFixed(2)
}

function MissReplyFields({
  enabled,
  onEnabled,
  mode,
  onMode,
  message,
  onMessage,
  templateId,
  onTemplateId,
  messageId,
}: {
  enabled: boolean
  onEnabled: (v: boolean) => void
  mode: ReplyMode
  onMode: (v: ReplyMode) => void
  message: string
  onMessage: (v: string) => void
  templateId: string
  onTemplateId: (v: string) => void
  messageId: string
}) {
  const { data: templates = [], isLoading } = realTemplatesService.useList()
  const approved = templates.filter((t) => t.status === 'approved')
  const selectedTemplate = approved.find((t) => t.id === templateId) ?? null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Send a WhatsApp message or template</p>
          <p className="text-muted-foreground text-xs">Pick an approved template, or type a session message.</p>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabled} />
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-lg border p-1">
        {(['message', 'template'] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={!enabled}
            onClick={() => onMode(opt)}
            className={`rounded-md py-1.5 text-xs font-semibold ${
              mode === opt ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'
            }`}
          >
            {opt === 'message' ? 'Message' : 'Template'}
          </button>
        ))}
      </div>
      {mode === 'message' ? (
        <div className="space-y-1.5">
          <Label htmlFor={messageId}>Message</Label>
          <Textarea
            id={messageId}
            value={message}
            onChange={(e) => onMessage(e.target.value)}
            disabled={!enabled}
            rows={3}
            maxLength={1000}
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label>Template</Label>
          {isLoading ? (
            <p className="text-muted-foreground text-xs">Loading templates…</p>
          ) : approved.length === 0 ? (
            <p className="text-muted-foreground text-xs">No approved templates yet. Create one under Templates.</p>
          ) : (
            <>
              <Select value={templateId || 'none'} onValueChange={(v) => onTemplateId(v === 'none' ? '' : v)} disabled={!enabled}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Choose a template</SelectItem>
                  {approved.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate ? (
                <div className="bg-muted/40 space-y-1.5 rounded-lg border p-3 text-sm">
                  {selectedTemplate.header ? <p className="font-semibold">{selectedTemplate.header}</p> : null}
                  <p className="whitespace-pre-wrap">{selectedTemplate.bodyPattern}</p>
                  {selectedTemplate.footer ? (
                    <p className="text-muted-foreground text-xs">{selectedTemplate.footer}</p>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function CallingSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { data: numbersData, isLoading } = virtualNumberService.useNumbers()
  const number = numbersData?.numbers.find((n) => n.id === id) ?? null
  const { data: pricing, isLoading: pricingLoading } = virtualNumberService.usePricing(number?.id)
  const updateSettings = virtualNumberService.useUpdateSettings(number?.id)
  const releaseNumber = virtualNumberService.useReleaseNumber(number?.id)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [platformEnabled, setPlatformEnabled] = useState(false)
  const [platformMode, setPlatformMode] = useState<ReplyMode>('message')
  const [platformMessage, setPlatformMessage] = useState(DEFAULT_PLATFORM_MISS_MESSAGE)
  const [platformTemplateId, setPlatformTemplateId] = useState('')
  const [userEnabled, setUserEnabled] = useState(false)
  const [userMode, setUserMode] = useState<ReplyMode>('message')
  const [userMessage, setUserMessage] = useState(DEFAULT_USER_MISS_MESSAGE)
  const [userTemplateId, setUserTemplateId] = useState('')
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [releaseError, setReleaseError] = useState<string | null>(null)

  useEffect(() => {
    if (!number) return
    setName(number.label || '')
    setDescription(number.description || '')
    setPlatformEnabled(Boolean(number.missedCallAutoReplyEnabled))
    setPlatformMessage(number.missedCallMessage || DEFAULT_PLATFORM_MISS_MESSAGE)
    setPlatformTemplateId(number.missedCallTemplateId || '')
    setPlatformMode(number.missedCallTemplateId ? 'template' : 'message')
    setUserEnabled(Boolean(number.userMissedCallAutoReplyEnabled))
    setUserMessage(number.userMissedCallMessage || DEFAULT_USER_MISS_MESSAGE)
    setUserTemplateId(number.userMissedCallTemplateId || '')
    setUserMode(number.userMissedCallTemplateId ? 'template' : 'message')
  }, [
    number?.label,
    number?.description,
    number?.missedCallAutoReplyEnabled,
    number?.missedCallMessage,
    number?.missedCallTemplateId,
    number?.userMissedCallAutoReplyEnabled,
    number?.userMissedCallMessage,
    number?.userMissedCallTemplateId,
  ])

  const handleSave = async () => {
    setSaved(false)
    setSaveError(null)
    try {
      await updateSettings.mutateAsync({
        label: name.trim(),
        description: description.trim(),
        missedCallAutoReplyEnabled: platformEnabled,
        missedCallMessage: platformMessage.trim(),
        missedCallTemplateId: platformMode === 'template' ? platformTemplateId || null : null,
        userMissedCallAutoReplyEnabled: userEnabled,
        userMissedCallMessage: userMessage.trim(),
        userMissedCallTemplateId: userMode === 'template' ? userTemplateId || null : null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save settings.')
    }
  }

  const handleRelease = async () => {
    setReleaseError(null)
    const ok = await confirm({
      title: `Release ${number?.label || number?.number}?`,
      description:
        'This permanently releases the number back to Plivo. Calling and WhatsApp on this number stop immediately, billing stops, and this cannot be undone.',
      confirmLabel: 'Release number',
      destructive: true,
    })
    if (!ok) return
    try {
      await releaseNumber.mutateAsync()
      navigate('/calling')
    } catch (err) {
      setReleaseError(err instanceof Error ? err.message : 'Could not release this number.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <Button variant="outline" size="icon-sm" onClick={() => navigate('/calling')} aria-label="Back to calls">
          <ArrowLeft className="size-3.5" />
        </Button>
        <div>
          <h1 className="text-base font-semibold">Number Settings</h1>
          <p className="text-muted-foreground mt-1 text-xs">Manage this virtual number's behavior and pricing.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading…
        </div>
      ) : !number ? (
        <EmptyState
          icon={Phone}
          title="Number not found"
          description="This number may have been released, or you don't have access to it."
        />
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Your number</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full">
                    <Phone className="size-4" />
                  </span>
                  <div>
                    <p className="font-mono text-sm font-semibold tabular-nums">{number.number}</p>
                    <p className="text-muted-foreground text-xs">{number.city ?? 'India'}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="number-name">Name</Label>
                  <Input
                    id="number-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sales Line, Support"
                    maxLength={80}
                  />
                  <p className="text-muted-foreground text-xs">
                    Shown instead of the raw number wherever you pick from your numbers.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="number-description">Description</Label>
                  <Textarea
                    id="number-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's this number used for? e.g. Inbound sales enquiries"
                    maxLength={300}
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" disabled={updateSettings.isPending} onClick={() => void handleSave()}>
                    {updateSettings.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    Save
                  </Button>
                  {saved ? <span className="text-channel-green text-xs font-medium">Saved</span> : null}
                  {saveError ? <span className="text-destructive text-xs">{saveError}</span> : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Call pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pricingLoading ? (
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    Fetching live rate…
                  </div>
                ) : pricing ? (
                  <>
                    <div className="flex items-center gap-2">
                      <IndianRupee className="text-foreground size-4" />
                      <span className="text-xl font-semibold tabular-nums">
                        {formatInr(pricing.outboundPerMinInrPaise)}
                      </span>
                      <span className="text-muted-foreground text-xs">/ minute, outgoing calls</span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Live Plivo rate for {pricing.countryName}, plus our {(pricing.markupRate * 100).toFixed(0)}%
                      service markup. Billed per call to your workspace credits.
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground text-xs">Could not load pricing right now.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-destructive text-sm">Danger zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-xs">
                  Releasing this number returns it to Plivo permanently. You'll stop receiving calls and WhatsApp
                  messages on it, and it cannot be recovered.
                </p>
                {releaseError ? <p className="text-destructive text-xs">{releaseError}</p> : null}
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                  disabled={releaseNumber.isPending}
                  onClick={() => void handleRelease()}
                >
                  {releaseNumber.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <PhoneOff className="size-3.5" />
                  )}
                  Release this number
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">When we miss a call</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-xs">
                  Someone calls this number and nobody in the workspace answers. WhatsApp goes to the caller.
                </p>
                <MissReplyFields
                  enabled={platformEnabled}
                  onEnabled={setPlatformEnabled}
                  mode={platformMode}
                  onMode={setPlatformMode}
                  message={platformMessage}
                  onMessage={setPlatformMessage}
                  templateId={platformTemplateId}
                  onTemplateId={setPlatformTemplateId}
                  messageId="platform-miss-message"
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" disabled={updateSettings.isPending} onClick={() => void handleSave()}>
                    {updateSettings.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    Save
                  </Button>
                  {saved ? <span className="text-channel-green text-xs font-medium">Saved</span> : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">When they miss a call</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-xs">
                  You call out and the other person does not answer. WhatsApp goes to that number.
                </p>
                <MissReplyFields
                  enabled={userEnabled}
                  onEnabled={setUserEnabled}
                  mode={userMode}
                  onMode={setUserMode}
                  message={userMessage}
                  onMessage={setUserMessage}
                  templateId={userTemplateId}
                  onTemplateId={setUserTemplateId}
                  messageId="user-miss-message"
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" disabled={updateSettings.isPending} onClick={() => void handleSave()}>
                    {updateSettings.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    Save
                  </Button>
                  {saved ? <span className="text-channel-green text-xs font-medium">Saved</span> : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
