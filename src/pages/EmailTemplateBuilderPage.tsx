import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { EasyEmailCanvas } from '@/components/templates/EasyEmailCanvas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { COMMON_EMAIL_VARS, EMAIL_SNIPPETS, extractEmailVars, insertAtCursor } from '@/lib/emailHtmlEditor'
import {
  DEFAULT_EMAIL_HTML,
  deserializeEmailTemplatePayload,
  serializeEmailTemplatePayload,
  wrapHtmlAsPage,
  type EasyEmailBlock,
} from '@/lib/easyEmailPayload'
import { compileEasyEmailHtml, createDefaultEasyEmailPage } from '@/lib/easyEmailRender'
import { emailHtmlFragment, sanitizeEmailHtml, stripHtmlToText } from '@/lib/sanitizeEmailHtml'
import {
  realEmailTemplatesService,
  type EmailTemplateStatus,
} from '@/services/realEmailTemplates.service'

function previewSrcDoc(html: string): string {
  const trimmed = html.trim()
  if (/^<!doctype/i.test(trimmed) || /<html[\s>]/i.test(trimmed)) return trimmed
  const fragment = sanitizeEmailHtml(emailHtmlFragment(trimmed))
  return `<!DOCTYPE html><html><body style="margin:16px;font-family:system-ui,sans-serif;font-size:14px">${fragment}</body></html>`
}

export function EmailTemplateBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  const navigate = useNavigate()
  const createMutation = realEmailTemplatesService.useCreate()
  const updateMutation = realEmailTemplatesService.useUpdate()
  const { data: loaded, isLoading, isError } = realEmailTemplatesService.useGet(isNew ? null : (id ?? null))

  const htmlRef = useRef<HTMLTextAreaElement>(null)
  const [seedContent, setSeedContent] = useState<EasyEmailBlock | null>(() =>
    isNew ? createDefaultEasyEmailPage() : null
  )
  const contentRef = useRef<EasyEmailBlock>(seedContent ?? wrapHtmlAsPage(DEFAULT_EMAIL_HTML))
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [htmlBody, setHtmlBody] = useState(DEFAULT_EMAIL_HTML)
  const [htmlEdited, setHtmlEdited] = useState(false)
  const [tab, setTab] = useState('design')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isNew || !loaded) return
    const parsed = deserializeEmailTemplatePayload(loaded.designJson, loaded.htmlBody)
    contentRef.current = parsed.content
    setSeedContent(parsed.content)
    setName(loaded.name)
    setSubject(loaded.subject)
    setHtmlBody(parsed.htmlBody)
    setHtmlEdited(parsed.htmlEdited)
  }, [isNew, loaded])

  const vars = useMemo(() => extractEmailVars(subject, htmlBody), [subject, htmlBody])
  const pending = createMutation.isPending || updateMutation.isPending
  const backTo = '/templates?tab=email'

  const insert = (text: string) => {
    const el = htmlRef.current
    const start = el?.selectionStart ?? htmlBody.length
    const end = el?.selectionEnd ?? start
    const next = insertAtCursor(htmlBody, text, start, end)
    setHtmlBody(next)
    setHtmlEdited(true)
    requestAnimationFrame(() => {
      if (!el) return
      const pos = start + text.length
      el.focus()
      el.setSelectionRange(pos, pos)
    })
  }

  const syncHtmlFromDesign = () => {
    if (htmlEdited) return
    try {
      setHtmlBody(compileEasyEmailHtml(contentRef.current))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not compile visual layout to HTML')
    }
  }

  const save = async (nextStatus: EmailTemplateStatus) => {
    setError('')
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (!subject.trim()) {
      setError('Subject line is required.')
      return
    }
    let html = htmlBody
    let edited = htmlEdited
    if (!htmlEdited) {
      try {
        html = compileEasyEmailHtml(contentRef.current)
        edited = false
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not compile visual layout to HTML')
        return
      }
    }
    if (!html.trim()) {
      setError('HTML body is required.')
      return
    }
    const { htmlBody: nextHtml, designJson } = serializeEmailTemplatePayload({
      content: contentRef.current,
      htmlBody: html,
      htmlEdited: edited,
    })
    const payload = {
      name: name.trim(),
      subject: subject.trim(),
      htmlBody: nextHtml,
      textBody: stripHtmlToText(nextHtml),
      status: nextStatus,
      designJson,
    }
    try {
      if (id) {
        await updateMutation.mutateAsync({ id, patch: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      navigate(backTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save email template')
    }
  }

  if (!isNew && isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col p-4">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  if (!isNew && (isError || !loaded)) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-start gap-3 p-6">
        <p className="text-sm">Could not load this email template.</p>
        <Button asChild variant="outline">
          <Link to={backTo}>Back to templates</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-end gap-3 border-b px-4 py-3">
        <Button asChild variant="ghost" size="sm" className="mb-0.5">
          <Link to={backTo}>
            <ArrowLeft />
            Templates
          </Link>
        </Button>
        <div className="min-w-[180px] flex-1 space-y-1">
          <Label htmlFor="em-name">Name</Label>
          <Input id="em-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="min-w-[220px] flex-[1.4] space-y-1">
          <Label htmlFor="em-subject">Subject</Label>
          <Input id="em-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={pending} onClick={() => void save('draft')}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Save draft
          </Button>
          <Button disabled={pending} onClick={() => void save('active')}>
            Save &amp; activate
          </Button>
        </div>
      </div>

      {error ? (
        <p className="border-destructive/20 bg-destructive/10 text-destructive mx-4 mt-3 rounded-md border px-3 py-2 text-xs">
          {error}
        </p>
      ) : null}

      <Tabs
        value={tab}
        onValueChange={(next) => {
          if (next === 'html' || next === 'preview') syncHtmlFromDesign()
          setTab(next)
        }}
        className="flex min-h-0 flex-1 flex-col gap-0 p-4 pt-3"
      >
        <TabsList>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="html">HTML</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="design" forceMount className="mt-3 flex min-h-0 flex-col data-[state=inactive]:hidden">
          {htmlEdited ? (
            <p className="text-muted-foreground mb-2 shrink-0 text-xs">
              HTML was edited separately. Saving from Design will overwrite the send HTML from this layout; the
              visual blocks may not match the HTML tab.
            </p>
          ) : null}
          {seedContent ? (
            <EasyEmailCanvas
              key={id ?? 'new'}
              initialContent={seedContent}
              subject={subject}
              contentRef={contentRef}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="html" className="mt-3 min-h-0 space-y-2 overflow-y-auto">
          <p className="text-muted-foreground text-xs">
            This HTML is what campaigns send. Editing it may not fully round-trip into visual blocks — the
            Design tab keeps the last Easy Email JSON separately.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {EMAIL_SNIPPETS.map((snippet) => (
              <Button key={snippet.id} type="button" variant="outline" size="sm" onClick={() => insert(snippet.html)}>
                {snippet.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_EMAIL_VARS.map((v) => (
              <Button
                key={v}
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => insert(`{{${v}}}`)}
              >
                {`{{${v}}}`}
              </Button>
            ))}
          </div>
          <Textarea
            ref={htmlRef}
            id="em-html"
            value={htmlBody}
            onChange={(e) => {
              setHtmlBody(e.target.value)
              setHtmlEdited(true)
            }}
            rows={18}
            className="min-h-[320px] font-mono text-xs"
            spellCheck={false}
          />
          {vars.length > 0 ? <p className="text-muted-foreground text-xs">Variables: {vars.join(', ')}</p> : null}
        </TabsContent>

        <TabsContent value="preview" className="mt-3 min-h-0">
          <iframe
            title="Email preview"
            sandbox=""
            className="bg-background h-full min-h-[480px] w-full rounded-lg border"
            srcDoc={previewSrcDoc(htmlBody)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
