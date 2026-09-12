import { useEffect, useState } from 'react'

import { ConditionGroupEditor } from '@/components/automations/flow/ConditionGroupEditor'
import { SendFlowEditor } from '@/components/automations/flow/SendFlowEditor'
import { SendMessageEditor } from '@/components/automations/flow/SendMessageEditor'
import { TagChipInput } from '@/components/tags/TagChipInput'
import {
  AddToFunnelEditor,
  AssignToEditor,
  GotoStepEditor,
  RandomizerEditor,
  TriggerJourneyEditor,
  UpdateFieldEditor,
  UpdateLifecycleEditor,
} from '@/components/automations/flow/StepEditors'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { FlowStepKind } from '@/lib/flowStepTypes'
import {
  IG_TRIGGER_EVENTS,
  igTriggerEvents,
  labelForKind,
  TRIGGER_EVENTS,
  type ButtonsData,
  type CloseConversationData,
  type SendMessageData,
  type TriggerData,
  type UpdateTagData,
  type WaitData,
  type WebhookData,
} from '@/lib/journeyNodeTypes'
import type { AutomationChannel } from '@/services/realAutomations.service'

export type BuilderStepOption = { id: string; label: string }

interface NodeEditSheetProps {
  kind: FlowStepKind | null
  backendType?: string
  channel: AutomationChannel
  data: Record<string, unknown>
  steps?: BuilderStepOption[]
  currentAutomationId?: string
  onClose: () => void
  onSave: (data: Record<string, unknown>) => void
}

export function NodeEditSheet({
  kind,
  backendType,
  channel,
  data,
  steps = [],
  currentAutomationId,
  onClose,
  onSave,
}: NodeEditSheetProps) {
  const [draft, setDraft] = useState<Record<string, unknown>>(data)

  useEffect(() => setDraft(data), [data])

  const igEvents = igTriggerEvents(draft)

  return (
    <Sheet open={kind !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{kind ? labelForKind(kind, backendType) : ''}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          {kind === 'trigger' && channel === 'whatsapp' ? (
            <div className="space-y-1.5">
              <Label>Event</Label>
              <Select
                value={(draft as Partial<TriggerData>).event ?? 'message.received'}
                onValueChange={(v) => setDraft({ ...draft, event: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_EVENTS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {kind === 'trigger' && channel === 'instagram' ? (
            <>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Events</legend>
                <p className="text-muted-foreground text-xs">Starts when any selected event matches.</p>
                {IG_TRIGGER_EVENTS.map((ev) => {
                  const checked = igEvents.includes(ev.value)
                  return (
                    <label key={ev.value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) => {
                          const selected = igTriggerEvents(draft)
                          let events: string[]
                          if (next) events = selected.includes(ev.value) ? selected : [...selected, ev.value]
                          else events = selected.filter((e) => e !== ev.value)
                          if (events.length === 0) return
                          setDraft({ ...draft, events, event: events[0] })
                        }}
                      />
                      {ev.label}
                    </label>
                  )
                })}
              </fieldset>
              <div className="space-y-1.5">
                <Label htmlFor="node-keyword">Keyword filter</Label>
                <Input
                  id="node-keyword"
                  value={(draft as Partial<TriggerData>).keyword ?? ''}
                  onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
                  placeholder="Leave empty to match any text"
                />
                <p className="text-muted-foreground text-xs">
                  Case-insensitive substring on incoming DM or comment text.
                </p>
              </div>
            </>
          ) : null}

          {kind === 'message' ? <SendMessageEditor draft={draft} channel={channel} onChange={setDraft} /> : null}

          {kind === 'ask' ? (
            <div className="space-y-1.5">
              <Label htmlFor="node-message-text">Question</Label>
              <Textarea
                id="node-message-text"
                rows={5}
                value={(draft as Partial<SendMessageData>).text ?? ''}
                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                placeholder="How can we help?"
              />
            </div>
          ) : null}

          {kind === 'buttons' ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="node-buttons-text">Message</Label>
                <Textarea
                  id="node-buttons-text"
                  rows={3}
                  value={(draft as Partial<ButtonsData>).text ?? ''}
                  onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                />
              </div>
              {((draft as Partial<ButtonsData>).buttons ?? []).map((btn, i) => (
                <div key={btn.id} className="space-y-1.5">
                  <Label htmlFor={`node-btn-${i}`}>Button {i + 1}</Label>
                  <Input
                    id={`node-btn-${i}`}
                    value={btn.title}
                    maxLength={20}
                    onChange={(e) => {
                      const buttons = [...((draft as Partial<ButtonsData>).buttons ?? [])]
                      buttons[i] = { ...buttons[i], title: e.target.value }
                      setDraft({ ...draft, buttons })
                    }}
                  />
                </div>
              ))}
            </>
          ) : null}

          {kind === 'sendFlow' ? <SendFlowEditor draft={draft} onChange={setDraft} /> : null}

          {kind === 'wait' ? (
            <div className="flex gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="node-wait-amount">Duration</Label>
                <Input
                  id="node-wait-amount"
                  type="number"
                  min={1}
                  value={(draft as Partial<WaitData>).amount ?? 1}
                  onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) || 1 })}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label>Unit</Label>
                <Select
                  value={(draft as Partial<WaitData>).unit ?? 'hours'}
                  onValueChange={(v) => setDraft({ ...draft, unit: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          {kind === 'condition' ? (
            <ConditionGroupEditor draft={draft} channel={channel} onChange={setDraft} />
          ) : null}

          {kind === 'randomizer' ? <RandomizerEditor draft={draft} onChange={setDraft} /> : null}

          {kind === 'tag' ? (
            <>
              <div className="space-y-1.5">
                <Label>Action</Label>
                <Select
                  value={(draft as Partial<UpdateTagData>).action ?? 'add'}
                  onValueChange={(v) => setDraft({ ...draft, action: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add</SelectItem>
                    <SelectItem value="remove">Remove</SelectItem>
                    <SelectItem value="set">Set</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="node-tags">Tags</Label>
                <TagChipInput
                  id="node-tags"
                  value={(draft as Partial<UpdateTagData>).tags ?? []}
                  onChange={(tags) => setDraft({ ...draft, tags })}
                />
              </div>
            </>
          ) : null}

          {kind === 'updateField' ? <UpdateFieldEditor draft={draft} onChange={setDraft} /> : null}
          {kind === 'addToFunnel' ? <AddToFunnelEditor draft={draft} onChange={setDraft} /> : null}
          {kind === 'updateLifecycle' ? <UpdateLifecycleEditor draft={draft} onChange={setDraft} /> : null}
          {kind === 'assign' ? (
            <AssignToEditor
              draft={draft}
              channel={channel}
              excludeId={currentAutomationId}
              onChange={setDraft}
            />
          ) : null}

          {kind === 'webhook' ? (
            <>
              <div className="space-y-1.5">
                <Label>Method</Label>
                <Select
                  value={(draft as Partial<WebhookData>).method ?? 'POST'}
                  onValueChange={(v) => setDraft({ ...draft, method: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="node-webhook-url">URL</Label>
                <Input
                  id="node-webhook-url"
                  value={(draft as Partial<WebhookData>).url ?? ''}
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                  placeholder="https://"
                />
              </div>
            </>
          ) : null}

          {kind === 'close' ? (
            <div className="space-y-1.5">
              <Label htmlFor="node-close-note">Closing note</Label>
              <Input
                id="node-close-note"
                value={(draft as Partial<CloseConversationData>).closingNote ?? ''}
                onChange={(e) => setDraft({ ...draft, closingNote: e.target.value })}
              />
            </div>
          ) : null}

          {kind === 'goto' ? <GotoStepEditor draft={draft} steps={steps} onChange={setDraft} /> : null}
          {kind === 'triggerJourney' ? (
            <TriggerJourneyEditor
              draft={draft}
              channel={channel}
              excludeId={currentAutomationId}
              onChange={setDraft}
            />
          ) : null}

          {kind === 'open' ? (
            <p className="text-muted-foreground text-sm">Reopens the contact conversation in the inbox.</p>
          ) : null}

          {kind === 'end' ? (
            <p className="text-muted-foreground text-sm">
              This step ends the automation for the contact — nothing to configure.
            </p>
          ) : null}

          {kind === 'custom' ? (
            <p className="text-muted-foreground text-sm">
              This step type ({backendType}) is preserved on save. Open it in the previous builder to edit
              advanced fields.
            </p>
          ) : null}
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <Button
            onClick={() => {
              onSave(draft)
              onClose()
            }}
          >
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
