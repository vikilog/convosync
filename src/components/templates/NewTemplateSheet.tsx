import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
  SheetTrigger,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { TEMPLATE_CATEGORIES, type TemplateCategory } from '@/lib/templatesMockData'

export type NewTemplateInput = {
  name: string
  category: TemplateCategory
  body: string
}

export function NewTemplateSheet({
  channel,
  onCreate,
}: {
  channel: 'whatsapp' | 'email'
  onCreate: (input: NewTemplateInput) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<TemplateCategory>('Utility')
  const [body, setBody] = useState('')

  const reset = () => {
    setName('')
    setCategory('Utility')
    setBody('')
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
          New template
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>New {channel === 'whatsapp' ? 'WhatsApp' : 'email'} template</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label htmlFor="template-name">{channel === 'whatsapp' ? 'Template name' : 'Subject line'}</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                channel === 'whatsapp' ? 'e.g. order_confirmation' : 'e.g. Your October roundup is here'
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as TemplateCategory)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-body">{channel === 'whatsapp' ? 'Body' : 'Preview text'}</Label>
            <Textarea
              id="template-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                channel === 'whatsapp'
                  ? 'Hi {{1}}, your order #{{2}} has been confirmed…'
                  : 'Write a short preview of your email…'
              }
              rows={5}
            />
            {channel === 'whatsapp' ? (
              <p className="text-muted-foreground text-xs">
                Use <code className="bg-muted rounded px-1">{'{{1}}'}</code>,{' '}
                <code className="bg-muted rounded px-1">{'{{2}}'}</code> for variables.
              </p>
            ) : null}
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button
              disabled={!canSave}
              onClick={() => {
                onCreate({ name: name.trim(), category, body: body.trim() })
                reset()
              }}
            >
              Save as draft
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
