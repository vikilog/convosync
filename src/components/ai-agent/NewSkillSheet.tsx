import { useState } from 'react'
import { Plus } from 'lucide-react'

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

export type NewSkillInput = { title: string; trigger: string; description: string; instructions: string }

export function NewSkillSheet({
  onCreate,
  pending,
}: {
  onCreate: (input: NewSkillInput) => void
  pending?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [trigger, setTrigger] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')

  const reset = () => {
    setTitle('')
    setTrigger('')
    setDescription('')
    setInstructions('')
  }

  const canSave = title.trim().length > 0

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
          New skill
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>New skill</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label htmlFor="skill-title">Title</Label>
            <Input
              id="skill-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Book a demo call"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="skill-trigger">Start trigger</Label>
            <Textarea
              id="skill-trigger"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder="When should this skill kick in?"
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="skill-description">Description</Label>
            <Textarea
              id="skill-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this skill do?"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="skill-instructions">Instructions</Label>
            <Textarea
              id="skill-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Step-by-step how the agent should handle this."
              rows={3}
            />
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
                onCreate({
                  title: title.trim(),
                  trigger: trigger.trim(),
                  description: description.trim(),
                  instructions: instructions.trim(),
                })
                reset()
              }}
            >
              Create skill
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
