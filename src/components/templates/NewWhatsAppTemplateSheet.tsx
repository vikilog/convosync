import { useEffect, useRef, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'

import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { WhatsAppBubblePreview } from '@/components/templates/WhatsAppBubblePreview'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useBlobUrl } from '@/hooks/useBlobUrl'
import {
  assertValidTemplateName,
  BODY_MAX,
  BUTTON_LABEL_MAX,
  countBodyVariables,
  FOOTER_MAX,
  HEADER_MAX,
  HEADER_MEDIA_ACCEPT,
  HEADER_MEDIA_HINT,
  headerFormatFromApi,
  headerFormatToApi,
  nextVariableIndex,
  TEMPLATE_LANGUAGES,
  type ButtonKind,
  type HeaderFormat,
} from '@/lib/templateBuilderUtils'
import { realFlowsService } from '@/services/realFlows.service'
import {
  realTemplatesService,
  type NewWhatsAppTemplateInput,
  type TemplateCategory,
  type WhatsAppTemplate,
  type WhatsAppTemplateInput,
} from '@/services/realTemplates.service'

const CATEGORIES: TemplateCategory[] = ['Utility', 'Marketing', 'Authentication']
const HEADER_OPTIONS: { value: HeaderFormat; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'text', label: 'Text' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'document', label: 'Document' },
]
const BUTTON_TYPES: { value: ButtonKind; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'QUICK_REPLY', label: 'Quick reply' },
  { value: 'URL', label: 'Website URL' },
  { value: 'PHONE_NUMBER', label: 'Call phone number' },
  { value: 'FLOW', label: 'Open a Flow' },
]

const EMPTY = {
  name: '',
  category: 'Utility' as TemplateCategory,
  language: 'en_US',
  headerFormat: 'none' as HeaderFormat,
  header: '',
  body: '',
  footer: '',
  buttonType: 'none' as ButtonKind,
  buttonText: '',
  buttonUrl: '',
  buttonPhone: '',
  buttonUrlSample: 'sample_payment_id',
  buttonFlowId: '',
  submitToMeta: false,
}

type Props = {
  open: boolean
  editId: string | null
  onOpenChange: (open: boolean) => void
}

export function NewWhatsAppTemplateSheet({ open, editId, onOpenChange }: Props) {
  const confirm = useConfirm()
  const createMutation = realTemplatesService.useCreate()
  const updateMutation = realTemplatesService.useUpdate()
  const submitMutation = realTemplatesService.useSubmit()
  const { data: loaded, isLoading: loadingEdit } = realTemplatesService.useGet(open ? editId : null)
  const { data: flowsData } = realFlowsService.useList()
  const publishedFlows = (flowsData?.items ?? []).filter((f) => f.status === 'published')

  const [name, setName] = useState(EMPTY.name)
  const [category, setCategory] = useState<TemplateCategory>(EMPTY.category)
  const [language, setLanguage] = useState(EMPTY.language)
  const [headerFormat, setHeaderFormat] = useState<HeaderFormat>(EMPTY.headerFormat)
  const [header, setHeader] = useState(EMPTY.header)
  const [headerMediaHandle, setHeaderMediaHandle] = useState('')
  const [headerMediaStorageKey, setHeaderMediaStorageKey] = useState('')
  const [headerMediaMimeType, setHeaderMediaMimeType] = useState('')
  const [headerMediaFileName, setHeaderMediaFileName] = useState('')
  const [localPreview, setLocalPreview] = useState('')
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [body, setBody] = useState(EMPTY.body)
  const [footer, setFooter] = useState(EMPTY.footer)
  const [variableSamples, setVariableSamples] = useState<string[]>([])
  const [buttonType, setButtonType] = useState<ButtonKind>(EMPTY.buttonType)
  const [buttonText, setButtonText] = useState(EMPTY.buttonText)
  const [buttonUrl, setButtonUrl] = useState(EMPTY.buttonUrl)
  const [buttonPhone, setButtonPhone] = useState(EMPTY.buttonPhone)
  const [buttonUrlSample, setButtonUrlSample] = useState(EMPTY.buttonUrlSample)
  const [buttonFlowId, setButtonFlowId] = useState(EMPTY.buttonFlowId)
  const [submitToMeta, setSubmitToMeta] = useState(EMPTY.submitToMeta)
  const [error, setError] = useState('')
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const savedId = loaded?.id ?? editId

  const remotePreview = useBlobUrl(
    !localPreview && headerMediaStorageKey ? headerMediaStorageKey : null,
    realTemplatesService.fetchHeaderMedia
  )
  const previewUrl = localPreview || remotePreview
  const contentLocked = Boolean(savedId && loaded?.status === 'approved')
  const varCount = countBodyVariables(body)
  const languages = TEMPLATE_LANGUAGES.some((l) => l.value === language)
    ? TEMPLATE_LANGUAGES
    : [...TEMPLATE_LANGUAGES, { value: language, label: language }]
  const isMediaHeader = headerFormat === 'image' || headerFormat === 'video' || headerFormat === 'document'
  const pending = createMutation.isPending || updateMutation.isPending || submitMutation.isPending

  useEffect(() => {
    if (!open) return
    if (editId && loaded && loaded.id === editId) hydrate(loaded)
    if (!editId) reset()
  }, [open, editId, loaded])

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  useEffect(() => {
    setVariableSamples((prev) => {
      if (varCount === 0) return []
      const next = [...prev]
      while (next.length < varCount) next.push(`Sample ${next.length + 1}`)
      return next.slice(0, varCount)
    })
  }, [varCount])

  function reset() {
    setName(EMPTY.name)
    setCategory(EMPTY.category)
    setLanguage(EMPTY.language)
    setHeaderFormat(EMPTY.headerFormat)
    setHeader(EMPTY.header)
    clearMedia()
    setBody(EMPTY.body)
    setFooter(EMPTY.footer)
    setVariableSamples([])
    setButtonType(EMPTY.buttonType)
    setButtonText(EMPTY.buttonText)
    setButtonUrl(EMPTY.buttonUrl)
    setButtonPhone(EMPTY.buttonPhone)
    setButtonUrlSample(EMPTY.buttonUrlSample)
    setButtonFlowId(EMPTY.buttonFlowId)
    setSubmitToMeta(EMPTY.submitToMeta)
    setError('')
  }

  function hydrate(t: WhatsAppTemplate) {
    setName(t.name)
    setCategory((['Marketing', 'Utility', 'Authentication'].includes(t.category)
      ? t.category
      : 'Utility') as TemplateCategory)
    setLanguage(t.language || 'en_US')
    setHeaderFormat(headerFormatFromApi(t.headerFormat, Boolean(t.header)))
    setHeader(t.header || '')
    setHeaderMediaHandle('')
    setHeaderMediaStorageKey(t.headerMediaStorageKey || '')
    setHeaderMediaMimeType(t.headerMediaMimeType || '')
    setHeaderMediaFileName(t.headerMediaFileName || '')
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ''
    })
    setBody(t.bodyPattern)
    setFooter(t.footer || '')
    setVariableSamples(t.variables?.length ? [...t.variables] : [])
    const bt = (t.buttonType as ButtonKind | null) ?? 'none'
    setButtonType(bt && bt !== 'none' ? bt : 'none')
    setButtonText(t.buttonText || '')
    setButtonUrl(t.buttonUrl || '')
    setButtonPhone(t.buttonPhoneNumber || '')
    setButtonUrlSample('sample_payment_id')
    setButtonFlowId(t.buttonFlowId || '')
    setSubmitToMeta(false)
    setError('')
  }

  function clearMedia() {
    setHeaderMediaHandle('')
    setHeaderMediaStorageKey('')
    setHeaderMediaMimeType('')
    setHeaderMediaFileName('')
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ''
    })
  }

  const selectHeader = (format: HeaderFormat) => {
    setHeaderFormat(format)
    if (format === 'none' || format === 'text') {
      clearMedia()
      if (format === 'none') setHeader('')
    } else {
      setHeader('')
      clearMedia()
    }
  }

  const handleMedia = async (file: File) => {
    if (!isMediaHeader) return
    setUploadingMedia(true)
    setError('')
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    try {
      const res = await realTemplatesService.uploadHeaderMedia(file)
      setHeaderMediaHandle(res.headerMediaHandle)
      setHeaderMediaStorageKey(res.headerMediaStorageKey)
      setHeaderMediaMimeType(res.headerMediaMimeType)
      setHeaderMediaFileName(res.headerMediaFileName || file.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Media upload failed')
      clearMedia()
    } finally {
      setUploadingMedia(false)
    }
  }

  const addVariable = () => {
    const token = `{{${nextVariableIndex(body)}}}`
    const el = bodyRef.current
    if (el) {
      const start = el.selectionStart ?? body.length
      const end = el.selectionEnd ?? body.length
      const next = body.slice(0, start) + token + body.slice(end)
      if (next.length <= BODY_MAX) setBody(next)
      return
    }
    if ((body + token).length <= BODY_MAX) setBody((b) => b + token)
  }

  const buildPayload = (): NewWhatsAppTemplateInput | null => {
    let safeName: string
    try {
      safeName = assertValidTemplateName(name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enter a valid template name.')
      return null
    }
    if (!body.trim()) {
      setError('Message body is required.')
      return null
    }
    if (body.length > BODY_MAX) {
      setError(`Body cannot exceed ${BODY_MAX} characters.`)
      return null
    }
    if (headerFormat === 'text' && header.length > HEADER_MAX) {
      setError(`Header cannot exceed ${HEADER_MAX} characters.`)
      return null
    }
    if (footer.length > FOOTER_MAX) {
      setError(`Footer cannot exceed ${FOOTER_MAX} characters.`)
      return null
    }
    if (isMediaHeader && !headerMediaHandle && !headerMediaStorageKey) {
      setError('Upload a sample file for the media header.')
      return null
    }
    if (buttonType !== 'none' && !buttonText.trim()) {
      setError('Enter button label text.')
      return null
    }
    if (buttonText.length > BUTTON_LABEL_MAX) {
      setError(`Button label cannot exceed ${BUTTON_LABEL_MAX} characters.`)
      return null
    }
    if (buttonType === 'URL' && !buttonUrl.trim()) {
      setError('Enter a website URL for the button.')
      return null
    }
    if (buttonType === 'PHONE_NUMBER' && !buttonPhone.trim()) {
      setError('Enter a phone number for the call button.')
      return null
    }
    if (buttonType === 'FLOW' && !buttonFlowId.trim()) {
      setError('Select a published flow for the button.')
      return null
    }
    return {
      name: safeName,
      category,
      language,
      bodyPattern: body.trim(),
      header: headerFormat === 'text' && header.trim() ? header.trim() : null,
      headerFormat: headerFormatToApi(headerFormat),
      headerMediaHandle: headerMediaHandle || null,
      headerMediaStorageKey: headerMediaStorageKey || null,
      headerMediaMimeType: headerMediaMimeType || null,
      headerMediaFileName: headerMediaFileName || null,
      footer: footer.trim() || null,
      variables: variableSamples,
      variableSamples,
      buttonType: buttonType === 'none' ? null : buttonType,
      buttonText: buttonType === 'none' ? null : buttonText.trim() || null,
      buttonUrl: buttonType === 'URL' ? buttonUrl.trim() || null : null,
      buttonPhoneNumber: buttonType === 'PHONE_NUMBER' ? buttonPhone.trim() || null : null,
      buttonFlowId: buttonType === 'FLOW' ? buttonFlowId.trim() || null : null,
      buttonUrlSample:
        buttonType === 'URL' && /\{\{\d+\}\}/.test(buttonUrl)
          ? buttonUrlSample.trim() || 'sample_link_id'
          : null,
      submitToMeta: false,
    }
  }

  const save = async () => {
    setError('')
    if (contentLocked && savedId) {
      try {
        await updateMutation.mutateAsync({ id: savedId, patch: { language } })
        onOpenChange(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save template')
      }
      return
    }

    const willSubmit = submitToMeta && !contentLocked
    if (willSubmit) {
      const ok = await confirm({
        title: 'Submit this template to Meta for review?',
        description: "This can't be undone, and review can take up to 24 hours.",
        confirmLabel: 'Submit',
      })
      if (!ok) return
    }

    const payload = buildPayload()
    if (!payload) return

    try {
      if (savedId) {
        const patch: WhatsAppTemplateInput = { ...payload, submitToMeta: false }
        await updateMutation.mutateAsync({ id: savedId, patch })
        if (willSubmit) await submitMutation.mutateAsync(savedId)
      } else {
        await createMutation.mutateAsync({ ...payload, submitToMeta: willSubmit })
      }
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save template')
    }
  }

  const disabled = contentLocked

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{savedId ? 'Edit WhatsApp template' : 'New WhatsApp template'}</SheetTitle>
        </SheetHeader>

        {loadingEdit && editId ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-4">
            {contentLocked ? (
              <p className="bg-muted rounded-md px-3 py-2 text-xs">
                Approved content is locked. You can still correct the language so sends match Meta.
              </p>
            ) : null}
            {error ? (
              <p className="border-destructive/20 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-xs">
                {error}
              </p>
            ) : null}

            <Field label="Template name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. order_confirmation"
                disabled={disabled}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as TemplateCategory)}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Language">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Header">
              <Select
                value={headerFormat}
                onValueChange={(v) => selectHeader(v as HeaderFormat)}
                disabled={disabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HEADER_OPTIONS.map((h) => (
                    <SelectItem key={h.value} value={h.value}>
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {headerFormat === 'text' ? (
              <Input
                value={header}
                maxLength={HEADER_MAX}
                onChange={(e) => setHeader(e.target.value)}
                placeholder="Header text"
                disabled={disabled}
              />
            ) : null}
            {isMediaHeader ? (
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept={HEADER_MEDIA_ACCEPT[headerFormat]}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void handleMedia(file)
                    e.target.value = ''
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled || uploadingMedia}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploadingMedia ? <Loader2 className="animate-spin" /> : <Upload />}
                  {headerMediaFileName || 'Upload sample'}
                </Button>
                <p className="text-muted-foreground text-xs">{HEADER_MEDIA_HINT[headerFormat]}</p>
              </div>
            ) : null}

            <Field
              label={`Body (${body.length}/${BODY_MAX})`}
              action={
                <Button type="button" variant="outline" size="sm" onClick={addVariable} disabled={disabled}>
                  Add variable
                </Button>
              }
            >
              <Textarea
                ref={bodyRef}
                value={body}
                maxLength={BODY_MAX}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Hi {{1}}, your order #{{2}} has been confirmed…"
                rows={5}
                disabled={disabled}
              />
            </Field>

            {varCount > 0 ? (
              <Field label="Variable samples">
                {Array.from({ length: varCount }, (_, i) => (
                  <Input
                    key={i}
                    value={variableSamples[i] ?? ''}
                    onChange={(e) =>
                      setVariableSamples((prev) => {
                        const next = [...prev]
                        next[i] = e.target.value
                        return next
                      })
                    }
                    placeholder={`Sample for {{${i + 1}}}`}
                    disabled={disabled}
                  />
                ))}
              </Field>
            ) : null}

            <Field label={`Footer (${footer.length}/${FOOTER_MAX})`}>
              <Input
                value={footer}
                maxLength={FOOTER_MAX}
                onChange={(e) => setFooter(e.target.value)}
                placeholder="Reply STOP to unsubscribe"
                disabled={disabled}
              />
            </Field>

            <Field label="Button">
              <Select
                value={buttonType}
                onValueChange={(v) => setButtonType(v as ButtonKind)}
                disabled={disabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUTTON_TYPES.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {buttonType !== 'none' ? (
              <div className="space-y-2">
                <Input
                  value={buttonText}
                  maxLength={BUTTON_LABEL_MAX}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="Button text"
                  disabled={disabled}
                />
                {buttonType === 'URL' ? (
                  <>
                    <Input
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      placeholder="https://example.com/pay/{{1}}"
                      disabled={disabled}
                    />
                    {/\{\{\d+\}\}/.test(buttonUrl) ? (
                      <Input
                        value={buttonUrlSample}
                        onChange={(e) => setButtonUrlSample(e.target.value)}
                        placeholder="Sample for {{n}} in the URL"
                        disabled={disabled}
                      />
                    ) : null}
                  </>
                ) : null}
                {buttonType === 'PHONE_NUMBER' ? (
                  <Input
                    value={buttonPhone}
                    onChange={(e) => setButtonPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    disabled={disabled}
                  />
                ) : null}
                {buttonType === 'FLOW' ? (
                  <Select
                    value={buttonFlowId || undefined}
                    onValueChange={setButtonFlowId}
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a published flow" />
                    </SelectTrigger>
                    <SelectContent>
                      {publishedFlows.length === 0 ? (
                        <SelectItem value="__none" disabled>
                          No published flows
                        </SelectItem>
                      ) : (
                        publishedFlows.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                ) : null}
              </div>
            ) : null}

            {!contentLocked ? (
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox checked={submitToMeta} onCheckedChange={(v) => setSubmitToMeta(v === true)} />
                Submit to Meta for review
              </label>
            ) : null}

            <Field label="Preview">
              <WhatsAppBubblePreview
                headerFormat={headerFormat}
                header={header}
                headerMediaUrl={previewUrl}
                headerMediaFileName={headerMediaFileName}
                body={body}
                footer={footer}
                variableSamples={variableSamples}
                buttonText={buttonType === 'none' ? '' : buttonText}
              />
            </Field>
          </div>
        )}

        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <Button disabled={pending || (Boolean(editId) && loadingEdit)} onClick={() => void save()}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {contentLocked ? 'Save language' : submitToMeta ? 'Save & submit' : 'Save as draft'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function Field({
  label,
  action,
  children,
}: {
  label: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {action}
      </div>
      {children}
    </div>
  )
}
