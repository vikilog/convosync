import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { FaqPair } from '@/lib/parseFaqBulk'
import { realAgentsService, type KnowledgeItem } from '@/services/realAgents.service'

function parseQnAPairs(item: KnowledgeItem): FaqPair[] {
  if (item.content) {
    try {
      const parsed = JSON.parse(item.content) as unknown
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p) => ({
          question: String((p as FaqPair).question ?? ''),
          answer: String((p as FaqPair).answer ?? ''),
        }))
      }
    } catch {
      /* plain text */
    }
  }
  return [{ question: item.title, answer: item.content ?? '' }]
}

export function EditKnowledgeSheet({
  agentId,
  item,
  open,
  onOpenChange,
}: {
  agentId: string
  item: KnowledgeItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const update = realAgentsService.useUpdateKnowledge()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [pairs, setPairs] = useState<FaqPair[]>([{ question: '', answer: '' }])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!item || !open) return
    setTitle(item.title)
    setContent(item.content ?? '')
    setUrl(item.url ?? '')
    setPairs(parseQnAPairs(item))
    setError(null)
  }, [item, open])

  if (!item) return null

  const save = () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (item.type === 'qna') {
      const valid = pairs.filter((p) => p.question.trim() && p.answer.trim())
      if (!valid.length) {
        setError('Add at least one question and answer')
        return
      }
      update.mutate(
        {
          agentId,
          knowledgeId: item.id,
          patch: { title: title.trim() || valid[0].question.trim(), content: JSON.stringify(valid), metadata: { pairs: valid } },
        },
        { onSuccess: () => onOpenChange(false), onError: (e) => setError(e instanceof Error ? e.message : 'Save failed') }
      )
      return
    }
    update.mutate(
      {
        agentId,
        knowledgeId: item.id,
        patch: {
          title: title.trim(),
          content: content.trim() || null,
          ...(item.type === 'online_data' ? { url: url.trim() || null } : {}),
        },
      },
      { onSuccess: () => onOpenChange(false), onError: (e) => setError(e instanceof Error ? e.message : 'Save failed') }
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit knowledge</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <p className="text-muted-foreground text-xs capitalize">{item.type.replace('_', ' ')}</p>
          <div className="space-y-1.5">
            <Label htmlFor="edit-kb-title">Title</Label>
            <Input id="edit-kb-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          {item.type === 'online_data' ? (
            <div className="space-y-1.5">
              <Label htmlFor="edit-kb-url">URL</Label>
              <Input id="edit-kb-url" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
          ) : null}
          {item.type === 'qna' ? (
            <div className="space-y-3">
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
                    rows={3}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPairs((prev) => [...prev, { question: '', answer: '' }])}
              >
                Add Q&A pair
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="edit-kb-content">{item.type === 'attachment' ? 'Description' : 'Content'}</Label>
              <Textarea id="edit-kb-content" value={content} onChange={(e) => setContent(e.target.value)} rows={8} />
            </div>
          )}
          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <Button disabled={update.isPending} onClick={save}>
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
