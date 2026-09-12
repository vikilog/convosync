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
import type { NewLeadInput } from '@/services/realLeads.service'

export function NewLeadSheet({
  onCreate,
  disabled,
  funnelName,
}: {
  onCreate: (input: NewLeadInput) => void
  disabled?: boolean
  funnelName?: string
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [requirement, setRequirement] = useState('')

  const reset = () => {
    setName('')
    setRequirement('')
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
        <Button size="sm" disabled={disabled}>
          <Plus />
          Add lead
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Add lead</SheetTitle>
          <p className="text-muted-foreground text-xs">
            Creates a card in New{funnelName ? ` for ${funnelName}` : ''}.
          </p>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label htmlFor="lead-name">Name</Label>
            <Input
              id="lead-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-requirement-new">Requirement</Label>
            <Input
              id="lead-requirement-new"
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder="What are they looking for?"
            />
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <Button
            disabled={disabled}
            onClick={() => {
              onCreate({
                name: name.trim() || undefined,
                requirement: requirement.trim() || 'Manual lead',
                source: 'manual',
              })
              reset()
              setOpen(false)
            }}
          >
            Create
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
