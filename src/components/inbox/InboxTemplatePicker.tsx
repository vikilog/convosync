import { useEffect, useMemo, useState } from 'react'
import { FileText, Search } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { WhatsAppBubblePreview } from '@/components/templates/WhatsAppBubblePreview'
import { realTemplateStatusBadgeVariant } from '@/components/templates/template-status'
import { countBodyVariables } from '@/lib/messagingWindow'
import type { HeaderFormat } from '@/lib/templatesMockData'
import { realTemplatesService, type TemplateHeaderFormat } from '@/services/realTemplates.service'

function previewHeaderFormat(format: TemplateHeaderFormat, hasTextHeader: boolean): HeaderFormat {
  if (format === 'IMAGE') return 'image'
  if (format === 'VIDEO') return 'video'
  if (format === 'DOCUMENT') return 'document'
  if (format === 'TEXT' || hasTextHeader) return 'text'
  return 'none'
}

function isMediaHeader(format: TemplateHeaderFormat): format is 'IMAGE' | 'VIDEO' | 'DOCUMENT' {
  return format === 'IMAGE' || format === 'VIDEO' || format === 'DOCUMENT'
}

export function InboxTemplatePicker({
  open,
  onOpenChange,
  sending,
  onSend,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sending: boolean
  onSend: (templateId: string, variables: string[], headerMediaFile?: File | null) => Promise<void>
}) {
  const { data: templates = [], isLoading, isError, error } = realTemplatesService.useList()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [variableValues, setVariableValues] = useState<string[]>([])
  const [headerMediaFile, setHeaderMediaFile] = useState<File | null>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setHeaderMediaFile(null)
    const firstApproved = templates.find((t) => t.status === 'approved')
    setSelectedId(firstApproved?.id ?? templates[0]?.id ?? null)
  }, [open, templates])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return templates
    return templates.filter(
      (t) => t.name.toLowerCase().includes(q) || t.bodyPattern.toLowerCase().includes(q)
    )
  }, [templates, query])

  const selected = filtered.find((t) => t.id === selectedId) ?? filtered[0] ?? null
  const varCount = selected ? countBodyVariables(selected.bodyPattern) : 0
  const approved = selected?.status === 'approved'
  const needsHeaderMedia = selected ? isMediaHeader(selected.headerFormat) : false
  const canSend =
    Boolean(selected) &&
    approved &&
    !sending &&
    variableValues.length === varCount &&
    variableValues.every((v) => v.trim()) &&
    (!needsHeaderMedia || Boolean(headerMediaFile) || Boolean(selected?.headerMediaStorageKey))

  useEffect(() => {
    setVariableValues(Array.from({ length: varCount }, () => ''))
    setHeaderMediaFile(null)
  }, [selected?.id, varCount])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="data-[side=right]:sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="size-4" />
            WhatsApp templates
          </SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col px-4">
          <div className="relative mb-3">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates…"
              className="pl-8"
            />
          </div>

          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : isError ? (
            <p className="text-destructive text-sm">
              {error instanceof Error ? error.message : 'Failed to load templates'}
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No templates yet. Create or sync templates from the Templates page.
            </p>
          ) : (
            <div className="flex min-h-0 flex-1 gap-3">
              <ScrollArea className="w-2/5 min-w-0 rounded-lg border">
                <div className="p-1">
                  {filtered.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`hover:bg-muted w-full rounded-md px-2.5 py-2 text-left ${
                        selected?.id === item.id ? 'bg-muted' : ''
                      }`}
                    >
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <Badge variant={realTemplateStatusBadgeVariant(item.status)} className="mt-1">
                        {item.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              </ScrollArea>

              {selected ? (
                <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto">
                  {!approved ? (
                    <p className="text-muted-foreground text-xs">
                      This template is {selected.status}. Only approved templates can be sent.
                    </p>
                  ) : null}

                  {varCount > 0
                    ? Array.from({ length: varCount }, (_, i) => (
                        <div key={i} className="space-y-1">
                          <Label htmlFor={`tpl-var-${i}`}>{`{{${i + 1}}}`}</Label>
                          <Input
                            id={`tpl-var-${i}`}
                            value={variableValues[i] ?? ''}
                            onChange={(e) =>
                              setVariableValues((prev) => {
                                const next = [...prev]
                                next[i] = e.target.value
                                return next
                              })
                            }
                            placeholder={`Value for {{${i + 1}}}`}
                          />
                        </div>
                      ))
                    : null}

                  {needsHeaderMedia ? (
                    <div className="space-y-1">
                      <Label htmlFor="tpl-header-media">Header media</Label>
                      <Input
                        id="tpl-header-media"
                        type="file"
                        onChange={(e) => setHeaderMediaFile(e.target.files?.[0] ?? null)}
                      />
                      {!headerMediaFile && selected.headerMediaStorageKey ? (
                        <p className="text-muted-foreground text-xs">
                          Template sample media will be used if you don&apos;t upload a file.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <WhatsAppBubblePreview
                    headerFormat={previewHeaderFormat(selected.headerFormat, Boolean(selected.header))}
                    header={selected.header ?? ''}
                    body={selected.bodyPattern}
                    footer={selected.footer ?? ''}
                    variableSamples={variableValues}
                    buttonText={selected.buttonText ?? ''}
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSend}
            onClick={() => {
              if (!selected) return
              void onSend(selected.id, variableValues, headerMediaFile).then(() => onOpenChange(false))
            }}
          >
            {sending ? 'Sending…' : 'Send template'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
