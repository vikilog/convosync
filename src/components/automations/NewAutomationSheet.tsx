import { useState } from 'react'
import { Plus } from 'lucide-react'

import { ChannelIcon } from '@/components/channel-icon'
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
import type { AutomationChannel } from '@/services/realAutomations.service'

export type NewAutomationInput = {
  name: string
  channel: AutomationChannel
}

export function NewAutomationSheet({
  onCreate,
  pending,
  instagramAllowed = true,
  onBrowseGallery,
}: {
  onCreate: (input: NewAutomationInput) => void
  pending: boolean
  instagramAllowed?: boolean
  onBrowseGallery?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [channel, setChannel] = useState<AutomationChannel>('whatsapp')

  const reset = () => {
    setName('')
    setChannel('whatsapp')
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
          Create new
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>New automation</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label htmlFor="automation-name">Automation name</Label>
            <Input
              id="automation-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Welcome New Contacts"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Channel</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={channel === 'whatsapp' ? 'secondary' : 'outline'}
                onClick={() => setChannel('whatsapp')}
                className="justify-start"
              >
                <ChannelIcon channel="whatsapp" />
                WhatsApp
              </Button>
              {instagramAllowed ? (
                <Button
                  type="button"
                  variant={channel === 'instagram' ? 'secondary' : 'outline'}
                  onClick={() => setChannel('instagram')}
                  className="justify-start"
                >
                  <ChannelIcon channel="instagram" />
                  Instagram
                </Button>
              ) : null}
            </div>
            {channel === 'instagram' ? (
              <p className="text-muted-foreground text-xs">
                DM and comment automations with a keyword filter on the trigger.
              </p>
            ) : null}
            {onBrowseGallery ? (
              <Button
                type="button"
                variant="ghost"
                className="px-0"
                onClick={() => {
                  setOpen(false)
                  onBrowseGallery()
                }}
              >
                Or browse WhatsApp templates →
              </Button>
            ) : null}
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <Button
            disabled={!canSave || pending}
            onClick={() => {
              onCreate({
                name: name.trim(),
                channel: instagramAllowed ? channel : 'whatsapp',
              })
              setOpen(false)
              reset()
            }}
          >
            Create draft
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
