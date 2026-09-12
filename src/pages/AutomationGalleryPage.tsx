import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LayoutGrid } from 'lucide-react'
import { toast } from 'sonner'

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
} from '@/components/ui/sheet'
import { pathForAutomation, pathForAutomationList } from '@/lib/automationPaths'
import { JOURNEY_TEMPLATES, type JourneyTemplate } from '@/lib/journeyTemplates'
import { realAutomationsService } from '@/services/realAutomations.service'

export function AutomationGalleryPage() {
  const navigate = useNavigate()
  const createAutomation = realAutomationsService.useCreate()
  const saveGraph = realAutomationsService.useSaveGraph()
  const [pending, setPending] = useState<JourneyTemplate | null>(null)
  const [name, setName] = useState('')
  const [namingOpen, setNamingOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const createFrom = async (template: JourneyTemplate | null, journeyName: string) => {
    setCreating(true)
    try {
      const created = await createAutomation.mutateAsync({ name: journeyName, channel: 'whatsapp' })
      if (template) {
        await saveGraph.mutateAsync({
          id: created.id,
          channel: 'whatsapp',
          graph: template.buildGraph(),
        })
      }
      navigate(pathForAutomation(created.id, 'whatsapp'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create automation')
    } finally {
      setCreating(false)
      setPending(null)
      setNamingOpen(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(pathForAutomationList())}
            aria-label="Back to automations"
          >
            <ArrowLeft />
          </Button>
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <LayoutGrid className="size-4" />
              Automation gallery
            </p>
            <p className="text-muted-foreground text-xs">WhatsApp starters — edit copy, then publish.</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPending(null)
            setName('')
            setNamingOpen(true)
          }}
        >
          Start blank
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {JOURNEY_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => {
                setPending(template)
                setName(template.name)
                setNamingOpen(true)
              }}
              className="bg-card hover:border-primary/40 rounded-xl border p-4 text-left transition-colors"
            >
              <p className="text-sm font-semibold">{template.name}</p>
              <p className="text-muted-foreground mt-1 text-xs">{template.description}</p>
              <p className="text-muted-foreground mt-2 text-[11px]">{template.triggerLabel}</p>
            </button>
          ))}
        </div>
      </div>

      <Sheet
        open={namingOpen}
        onOpenChange={(open) => {
          if (!open && !creating) {
            setPending(null)
            setName('')
            setNamingOpen(false)
          }
        }}
      >
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{pending ? `Create “${pending.name}”` : 'Name your journey'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-1.5 px-4">
            <Label htmlFor="gallery-name">Name</Label>
            <Input id="gallery-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <SheetFooter className="flex-row justify-end gap-2">
            <SheetClose asChild>
              <Button variant="ghost" disabled={creating}>
                Cancel
              </Button>
            </SheetClose>
            <Button
              disabled={!name.trim() || creating}
              onClick={() => void createFrom(pending, name.trim())}
            >
              {pending ? 'Create from template' : 'Create journey'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
