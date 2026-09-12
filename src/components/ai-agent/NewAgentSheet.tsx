import { useState } from 'react'
import { Bot, Plus } from 'lucide-react'

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
import { CATEGORY_LABELS } from '@/lib/aiAgentLabels'
import type { AgentCategory } from '@/services/realAgents.service'

export type NewAgentInput = { name: string; category: AgentCategory }

const CATEGORIES: AgentCategory[] = ['ai_agent', 'responsive', 'rule_based']

export function NewAgentSheet({
  onCreate,
  pending,
}: {
  onCreate: (input: NewAgentInput) => void
  pending?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<AgentCategory>('ai_agent')

  const reset = () => {
    setName('')
    setCategory('ai_agent')
  }

  const canSave = name.trim().length > 0

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
          Create Agent
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Create agent</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label htmlFor="agent-name">Agent name</Label>
            <Input
              id="agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sales Assistant"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <div className="space-y-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    category === c ? 'border-primary bg-primary/5' : 'hover:border-primary/30'
                  }`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${category === c ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}
                  >
                    <Bot className="size-4" />
                  </span>
                  <span className="text-sm font-medium">{CATEGORY_LABELS[c]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button
              disabled={!canSave || pending}
              onClick={() => {
                onCreate({ name: name.trim(), category })
                reset()
              }}
            >
              Create agent
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
