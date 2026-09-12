import { useEffect, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { TagsPanel } from '@/components/settings/TagsPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  realWorkspaceSettingsService,
  type PersistentMenuItem,
} from '@/services/realWorkspaceSettings.service'

function AddMenuItemSheet({
  onAdd,
  disabled,
}: {
  onAdd: (item: PersistentMenuItem) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'postback' | 'web_url'>('web_url')
  const [value, setValue] = useState('')

  const reset = () => {
    setTitle('')
    setType('web_url')
    setValue('')
  }

  const canSave = title.trim().length > 0 && value.trim().length > 0

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Plus />
          Add menu item
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Add menu item</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label htmlFor="menu-item-title">Title</Label>
            <Input
              id="menu-item-title"
              value={title}
              maxLength={30}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v as 'postback' | 'web_url')
                setValue('')
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="web_url">Link</SelectItem>
                <SelectItem value="postback">Reply</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="menu-item-value">{type === 'web_url' ? 'URL' : 'Reply payload'}</Label>
            <Input
              id="menu-item-value"
              value={value}
              placeholder={type === 'web_url' ? 'https://example.com' : 'PAYLOAD_KEY'}
              onChange={(e) => setValue(e.target.value)}
            />
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
                onAdd({
                  id: `item_${Date.now()}`,
                  title: title.trim(),
                  type,
                  ...(type === 'web_url' ? { url: value.trim() } : { payload: value.trim() }),
                })
                reset()
              }}
            >
              Add
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function AutomationSettingsPanel() {
  const { data: settings, isLoading } = realWorkspaceSettingsService.useAutomation()
  const update = realWorkspaceSettingsService.useUpdateAutomation()

  const [defaultReplyText, setDefaultReplyText] = useState('')

  useEffect(() => {
    if (settings) setDefaultReplyText(settings.defaultReplyText ?? '')
  }, [settings?.defaultReplyText])

  if (isLoading || !settings) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading automation settings…
      </div>
    )
  }

  const menu = settings.persistentMenu

  const addMenuItem = (item: PersistentMenuItem) => {
    update.mutate({
      persistentMenu: { enabled: menu.enabled, items: [...menu.items, item] },
      syncMenu: true,
    })
  }

  const removeMenuItem = (id: string) => {
    update.mutate({
      persistentMenu: { enabled: menu.enabled, items: menu.items.filter((m) => m.id !== id) },
      syncMenu: true,
    })
  }

  return (
    <Tabs defaultValue="controls" className="space-y-4">
      <TabsList>
        <TabsTrigger value="controls">Controls</TabsTrigger>
        <TabsTrigger value="tags">Tags</TabsTrigger>
      </TabsList>
      <TabsContent value="tags">
        <TagsPanel />
      </TabsContent>
      <TabsContent value="controls" className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between gap-3 pt-6">
          <div>
            <p className="text-sm font-medium">Pause all automations</p>
            <p className="text-muted-foreground text-xs">
              Temporarily stop every journey and AI agent workspace-wide.
            </p>
          </div>
          <Switch
            checked={settings.automationsPaused}
            onCheckedChange={(checked) => update.mutate({ automationsPaused: checked })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Default reply</CardTitle>
            <Switch
              checked={settings.defaultReplyEnabled}
              onCheckedChange={(checked) => update.mutate({ defaultReplyEnabled: checked })}
            />
          </div>
        </CardHeader>
        {settings.defaultReplyEnabled ? (
          <CardContent className="space-y-2">
            <Textarea
              value={defaultReplyText}
              onChange={(e) => setDefaultReplyText(e.target.value)}
              onBlur={() => {
                if (defaultReplyText !== (settings.defaultReplyText ?? '')) {
                  update.mutate({ defaultReplyText })
                }
              }}
              rows={3}
            />
            <p className="text-muted-foreground text-xs">
              Sent automatically when no automation or AI agent matches an incoming message.
            </p>
          </CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Persistent menu</CardTitle>
            <Switch
              checked={menu.enabled}
              onCheckedChange={(checked) =>
                update.mutate({ persistentMenu: { enabled: checked, items: menu.items }, syncMenu: true })
              }
            />
          </div>
        </CardHeader>
        {menu.enabled ? (
          <CardContent className="space-y-2">
            {menu.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                <Badge variant="outline" className="shrink-0 uppercase">
                  {item.type === 'postback' ? 'Reply' : 'Link'}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-muted-foreground truncate text-xs">{item.url ?? item.payload}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeMenuItem(item.id)}
                  aria-label={`Remove ${item.title}`}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <AddMenuItemSheet onAdd={addMenuItem} disabled={menu.items.length >= 5} />
          </CardContent>
        ) : null}
      </Card>
      </TabsContent>
    </Tabs>
  )
}
