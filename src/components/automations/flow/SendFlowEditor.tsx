import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { SendFlowData } from '@/lib/journeyNodeTypes'
import { realFlowsService } from '@/services/realFlows.service'
import { realLeadFunnelsService } from '@/services/realLeadFunnels.service'

const NONE = '__none__'

export function SendFlowEditor({
  draft,
  onChange,
}: {
  draft: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const d = draft as Partial<SendFlowData>
  const { data: flowsData } = realFlowsService.useList()
  const { data: funnelsData } = realLeadFunnelsService.useList()
  const flows = (flowsData?.items ?? []).filter((f) => f.status === 'published')
  const funnels = funnelsData?.funnels ?? []
  const stages = funnels.find((f) => f.id === d.funnelId)?.stages ?? []

  return (
    <>
      <div className="space-y-1.5">
        <Label>WhatsApp Flow</Label>
        <Select value={d.flowId || NONE} onValueChange={(v) => onChange({ ...draft, flowId: v === NONE ? '' : v })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a published flow…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Select a published flow…</SelectItem>
            {flows.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {flows.length === 0 ? (
          <p className="text-muted-foreground text-xs">No published flows yet — publish one in Templates → Flows first.</p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="node-flow-text">Message text</Label>
        <Textarea
          id="node-flow-text"
          rows={2}
          placeholder="Please fill out this quick form"
          value={d.text ?? ''}
          onChange={(e) => onChange({ ...draft, text: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="node-flow-header">Header text (optional)</Label>
        <Input
          id="node-flow-header"
          value={d.headerText ?? ''}
          onChange={(e) => onChange({ ...draft, headerText: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="node-flow-cta">Button label</Label>
        <Input
          id="node-flow-cta"
          maxLength={30}
          value={d.ctaLabel ?? ''}
          onChange={(e) => onChange({ ...draft, ctaLabel: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="node-flow-prefix">Save submitted fields with prefix</Label>
        <Input
          id="node-flow-prefix"
          className="font-mono"
          placeholder="flow_"
          value={d.saveFieldsPrefix ?? ''}
          onChange={(e) => onChange({ ...draft, saveFieldsPrefix: e.target.value })}
        />
      </div>
      <div className="bg-muted/40 space-y-3 rounded-lg border p-3">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Map answers to contact</p>
        <div className="space-y-1.5">
          <Label htmlFor="node-map-name">Name field</Label>
          <Input
            id="node-map-name"
            className="font-mono"
            placeholder="full_name"
            value={d.mapNameField ?? ''}
            onChange={(e) => onChange({ ...draft, mapNameField: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="node-map-phone">Phone field</Label>
          <Input
            id="node-map-phone"
            className="font-mono"
            placeholder="phone"
            value={d.mapPhoneField ?? ''}
            onChange={(e) => onChange({ ...draft, mapPhoneField: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="node-map-email">Email field</Label>
          <Input
            id="node-map-email"
            className="font-mono"
            placeholder="email"
            value={d.mapEmailField ?? ''}
            onChange={(e) => onChange({ ...draft, mapEmailField: e.target.value })}
          />
        </div>
      </div>
      <div className="bg-muted/40 space-y-3 rounded-lg border p-3">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Add to funnel (optional)</p>
        <Select
          value={d.funnelId || NONE}
          onValueChange={(v) => onChange({ ...draft, funnelId: v === NONE ? '' : v, stageId: '' })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Don't add to a funnel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Don't add to a funnel</SelectItem>
            {funnels.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {d.funnelId ? (
          <Select value={d.stageId || NONE} onValueChange={(v) => onChange({ ...draft, stageId: v === NONE ? '' : v })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Default (first board)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Default (first board)</SelectItem>
              {stages.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
    </>
  )
}
