import { useRef, useState } from 'react'
import { FileUp, Loader2, Plus, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { parseFaqBulk, type FaqPair } from '@/lib/parseFaqBulk'
import { KNOWLEDGE_TYPE_LABELS } from '@/lib/aiAgentLabels'
import { realMediaGalleryService } from '@/services/realMediaGallery.service'
import { realAgentsService, type KnowledgeType } from '@/services/realAgents.service'

const DOC_ACCEPT = '.pdf,.docx,.txt,.md,text/markdown'
const DOC_OK = /\.(pdf|docx|txt|md)$/i

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function AddKnowledgeSheet({ agentId }: { agentId: string }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<KnowledgeType | null>(null)
  const [pairs, setPairs] = useState<FaqPair[]>([{ question: '', answer: '' }])
  const [paste, setPaste] = useState('')
  const [url, setUrl] = useState('')
  const [attachName, setAttachName] = useState('')
  const [attachDesc, setAttachDesc] = useState('')
  const [attachFile, setAttachFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const docRef = useRef<HTMLInputElement>(null)
  const faqRef = useRef<HTMLInputElement>(null)

  const createKnowledge = realAgentsService.useCreateKnowledge()
  const fetchUrl = realAgentsService.useFetchUrlKnowledge()
  const uploadDoc = realAgentsService.useUploadKnowledgeDocument()
  const createMedia = realMediaGalleryService.useCreate()
  const pending =
    createKnowledge.isPending || fetchUrl.isPending || uploadDoc.isPending || createMedia.isPending

  const reset = () => {
    setType(null)
    setPairs([{ question: '', answer: '' }])
    setPaste('')
    setUrl('')
    setAttachName('')
    setAttachDesc('')
    setAttachFile(null)
    setError(null)
  }

  const close = () => {
    setOpen(false)
    reset()
  }

  const addQna = () => {
    const valid = pairs.filter((p) => p.question.trim() && p.answer.trim())
    if (!valid.length) {
      setError('Add at least one question and answer')
      return
    }
    createKnowledge.mutate(
      {
        agentId,
        input: {
          type: 'qna',
          title: valid[0].question.trim(),
          content: JSON.stringify(valid),
          metadata: { pairs: valid },
        },
      },
      { onSuccess: close, onError: (e) => setError(e instanceof Error ? e.message : 'Failed') }
    )
  }

  const addUrl = () => {
    const next = normalizeUrl(url)
    if (!next) {
      setError('Enter a URL')
      return
    }
    fetchUrl.mutate(
      { agentId, url: next },
      { onSuccess: close, onError: (e) => setError(e instanceof Error ? e.message : 'Failed to fetch URL') }
    )
  }

  const addAttachment = () => {
    if (!attachFile || !attachName.trim()) {
      setError('Name and file are required')
      return
    }
    createMedia.mutate(
      {
        title: attachName.trim(),
        description: attachDesc.trim() || attachName.trim(),
        scope: 'customer',
        tags: [],
        usage: ['agent'],
        file: attachFile,
      },
      { onSuccess: close, onError: (e) => setError(e instanceof Error ? e.message : 'Upload failed') }
    )
  }

  const applyPaste = () => {
    const parsed = parseFaqBulk(paste)
    if (!parsed.length) {
      setError('No Q&A pairs found. Use Q:/A: labels, blank-line pairs, CSV, or JSON.')
      return
    }
    setPairs(parsed)
    setPaste('')
    setError(null)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <SheetTrigger asChild>
        <Button size="sm">
          <Plus />
          Add knowledge
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{type ? KNOWLEDGE_TYPE_LABELS[type] : 'Add knowledge'}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          {!type ? (
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(KNOWLEDGE_TYPE_LABELS) as KnowledgeType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className="hover:border-primary/40 rounded-lg border p-3 text-left transition-colors"
                >
                  <p className="text-sm font-medium">{KNOWLEDGE_TYPE_LABELS[t]}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {t === 'document'
                      ? 'Upload PDF, DOCX, TXT, or MD — parsed and indexed.'
                      : t === 'online_data'
                        ? 'Fetch a web page and keep it as a source.'
                        : t === 'qna'
                          ? 'Fixed answers for predictable questions.'
                          : 'Save a file to Media Gallery for the agent to send.'}
                  </p>
                </button>
              ))}
            </div>
          ) : type === 'document' ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => docRef.current?.click()}
                className="hover:border-primary/40 flex w-full flex-col items-center gap-2 rounded-xl border border-dashed p-8"
              >
                {uploadDoc.isPending ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
                <p className="text-sm font-medium">Click to upload</p>
                <p className="text-muted-foreground text-xs">PDF, DOCX, TXT, MD</p>
              </button>
              <input
                ref={docRef}
                type="file"
                accept={DOC_ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []).filter((f) => DOC_OK.test(f.name))
                  files.forEach((file) =>
                    uploadDoc.mutate(
                      { agentId, file },
                      { onError: (err) => setError(err instanceof Error ? err.message : 'Upload failed') }
                    )
                  )
                  e.target.value = ''
                }}
              />
            </div>
          ) : type === 'online_data' ? (
            <div className="space-y-1.5">
              <Label htmlFor="kb-url">URL</Label>
              <Input
                id="kb-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/faq"
              />
            </div>
          ) : type === 'qna' ? (
            <div className="space-y-3">
              <Textarea
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                rows={4}
                placeholder={'Paste FAQs, e.g.\nQ: Hours?\nA: Mon–Fri 9–6'}
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={!paste.trim()} onClick={applyPaste}>
                  Load FAQs
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => faqRef.current?.click()}
                >
                  <FileUp />
                  Import file
                </Button>
                <input
                  ref={faqRef}
                  type="file"
                  accept=".txt,.md,.csv,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    void file.text().then((text) => {
                      const parsed = parseFaqBulk(text)
                      if (!parsed.length) setError('No Q&A pairs found in that file.')
                      else {
                        setPairs(parsed)
                        setError(null)
                      }
                    })
                    e.target.value = ''
                  }}
                />
              </div>
              {pairs.map((pair, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <Input
                    value={pair.question}
                    onChange={(e) =>
                      setPairs((prev) => prev.map((p, idx) => (idx === i ? { ...p, question: e.target.value } : p)))
                    }
                    placeholder="Question"
                  />
                  <Textarea
                    value={pair.answer}
                    onChange={(e) =>
                      setPairs((prev) => prev.map((p, idx) => (idx === i ? { ...p, answer: e.target.value } : p)))
                    }
                    placeholder="Answer"
                    rows={2}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPairs((prev) => [...prev, { question: '', answer: '' }])}
              >
                <Plus />
                Add another Q&A
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => docRef.current?.click()}
                className="hover:border-primary/40 flex w-full flex-col items-center gap-2 rounded-xl border border-dashed p-6"
              >
                <Upload className="size-5" />
                <p className="text-sm">{attachFile ? attachFile.name : 'Upload PDF, image, video, or audio'}</p>
              </button>
              <input
                ref={docRef}
                type="file"
                accept=".pdf,image/*,video/*,audio/*"
                className="hidden"
                onChange={(e) => setAttachFile(e.target.files?.[0] ?? null)}
              />
              <div className="space-y-1.5">
                <Label htmlFor="att-name">Name</Label>
                <Input
                  id="att-name"
                  value={attachName}
                  onChange={(e) => setAttachName(e.target.value)}
                  placeholder="Attachment name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="att-desc">When should this be sent?</Label>
                <Textarea
                  id="att-desc"
                  value={attachDesc}
                  onChange={(e) => setAttachDesc(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          {type ? (
            <Button variant="ghost" onClick={() => { setType(null); setError(null) }}>
              Back
            </Button>
          ) : (
            <SheetClose asChild>
              <Button variant="ghost">Cancel</Button>
            </SheetClose>
          )}
          {type === 'online_data' ? (
            <Button disabled={pending} onClick={addUrl}>
              Fetch page
            </Button>
          ) : type === 'qna' ? (
            <Button disabled={pending} onClick={addQna}>
              Add
            </Button>
          ) : type === 'attachment' ? (
            <Button disabled={pending} onClick={addAttachment}>
              Save attachment
            </Button>
          ) : type === 'document' ? (
            <Button onClick={close}>Done</Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
