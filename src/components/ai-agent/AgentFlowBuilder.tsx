import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart3,
  GitBranch,
  HelpCircle,
  Maximize2,
  MessageSquare,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  UserCheck,
  Webhook,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  checkAgentFlow,
  defaultAgentFlowDefinition,
  NODE_LABELS,
  SAMPLE_EXACT_MATCH_FLOW,
  SAMPLE_SUPPORT_FLOW,
  TRIGGER_DESCRIPTIONS,
  TRIGGER_LABELS,
  type AgentFlowDefinition,
  type AgentFlowNodeType,
  type FlowTriggerType,
  type KeywordMatchRule,
} from '@/lib/agentFlow'

const TOOLBOX: { type: AgentFlowNodeType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'ask_question', label: NODE_LABELS.ask_question, icon: HelpCircle },
  { type: 'send_messages', label: NODE_LABELS.send_messages, icon: MessageSquare },
  { type: 'call_api', label: NODE_LABELS.call_api, icon: Webhook },
  { type: 'agent_takeover', label: NODE_LABELS.agent_takeover, icon: UserCheck },
  { type: 'unsubscribe', label: NODE_LABELS.unsubscribe, icon: X },
  { type: 'add_tags', label: NODE_LABELS.add_tags, icon: Tag },
  { type: 'send_shop_product', label: NODE_LABELS.send_shop_product, icon: ShoppingBag },
  { type: 'branch', label: NODE_LABELS.branch, icon: GitBranch },
]

function NodeCard({
  title,
  body,
  onClick,
}: {
  title: string
  body: React.ReactNode
  onClick?: () => void
}) {
  const TagName = onClick ? 'button' : 'div'
  return (
    <TagName
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className="bg-card w-[200px] shrink-0 overflow-hidden rounded-lg border text-left"
    >
      <div className="bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">{title}</div>
      <div className="text-muted-foreground min-h-16 px-3 py-3 text-xs">{body}</div>
    </TagName>
  )
}

export function AgentFlowBuilder({
  flow,
  saving,
  onSave,
}: {
  flow: AgentFlowDefinition | null
  saving?: boolean
  onSave: (flow: AgentFlowDefinition) => void
}) {
  const [definition, setDefinition] = useState<AgentFlowDefinition>(() => flow ?? defaultAgentFlowDefinition())
  const synced = useRef(flow)
  const [tab, setTab] = useState<'build' | 'analysis'>('build')
  const [triggerOpen, setTriggerOpen] = useState(false)
  const [panelMode, setPanelMode] = useState<'select' | FlowTriggerType>('select')
  const [draftRule, setDraftRule] = useState<KeywordMatchRule>('containing')
  const [draftKeywords, setDraftKeywords] = useState<string[]>([''])
  const [zoom, setZoom] = useState(100)
  const [checkMessage, setCheckMessage] = useState<string | null>(null)

  useEffect(() => {
    if (flow && flow !== synced.current) {
      synced.current = flow
      setDefinition(flow)
    }
  }, [flow])

  const triggerSummary = useMemo(() => {
    if (!definition.triggerType) return ''
    if (definition.triggerType === 'keyword') {
      const filled = (definition.keywordList ?? []).map((k) => k.trim()).filter(Boolean)
      if (!filled.length) return 'Configure keywords'
      const rule = definition.keywordMatchRule === 'exact_match' ? 'Exact match' : 'Containing'
      return `${rule}: ${filled.join(', ')}`
    }
    return 'WhatsApp template quick reply'
  }, [definition.triggerType, definition.keywordMatchRule, definition.keywordList])

  const addNode = (type: AgentFlowNodeType, insertAt?: number) => {
    setDefinition((prev) => {
      const node = {
        id: `node_${Date.now()}_${prev.nodes.length}`,
        type,
        title: NODE_LABELS[type],
        x: 0,
        y: 0,
      }
      const index = insertAt ?? prev.nodes.length
      return { ...prev, nodes: [...prev.nodes.slice(0, index), node, ...prev.nodes.slice(index)] }
    })
  }

  const openTrigger = () => {
    if (definition.triggerType === 'keyword') {
      setPanelMode('keyword')
      setDraftRule(definition.keywordMatchRule ?? 'containing')
      setDraftKeywords(definition.keywordList?.length ? definition.keywordList : [''])
    } else if (definition.triggerType === 'click_button') {
      setPanelMode('click_button')
    } else {
      setPanelMode('select')
      setDraftRule('containing')
      setDraftKeywords([''])
    }
    setTriggerOpen(true)
  }

  const saveKeyword = () => {
    const trimmed = draftKeywords.map((k) => k.trim())
    if (trimmed.some((k) => !k)) {
      setCheckMessage('Every keyword is required')
      return
    }
    setDefinition((prev) => ({
      ...prev,
      triggerType: 'keyword',
      keywordMatchRule: draftRule,
      keywordList: trimmed,
    }))
    setTriggerOpen(false)
  }

  const scale = zoom / 100

  return (
    <div className="bg-muted/40 flex h-full min-h-[520px] flex-col overflow-hidden rounded-xl border">
      <div className="flex flex-wrap items-center gap-2 border-b bg-background px-3 py-2">
        <Input
          value={definition.name}
          onChange={(e) => setDefinition((prev) => ({ ...prev, name: e.target.value }))}
          className="h-8 max-w-56 border-transparent font-semibold shadow-none"
        />
        <Button
          size="sm"
          variant={definition.status === 'active' ? 'default' : 'outline'}
          onClick={() =>
            setDefinition((prev) => ({ ...prev, status: prev.status === 'active' ? 'inactive' : 'active' }))
          }
        >
          {definition.status === 'active' ? 'Active' : 'Inactive'}
        </Button>
        <div className="bg-muted ml-auto inline-flex rounded-lg p-0.5">
          <Button size="sm" variant={tab === 'build' ? 'secondary' : 'ghost'} onClick={() => setTab('build')}>
            Build
          </Button>
          <Button size="sm" variant={tab === 'analysis' ? 'secondary' : 'ghost'} onClick={() => setTab('analysis')}>
            <BarChart3 />
            Analysis
          </Button>
        </div>
        <Button size="sm" variant="outline" onClick={() => setDefinition({ ...SAMPLE_SUPPORT_FLOW, status: 'active' })}>
          Sample: Support
        </Button>
        <Button size="sm" variant="outline" onClick={() => setDefinition({ ...SAMPLE_EXACT_MATCH_FLOW, status: 'active' })}>
          Sample: Exact
        </Button>
        <Button size="sm" variant="outline" onClick={() => setCheckMessage(checkAgentFlow(definition))}>
          Check
        </Button>
        <Button size="sm" disabled={saving} onClick={() => onSave(definition)}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      {checkMessage ? (
        <p className="border-b bg-amber-50 px-4 py-2 text-xs text-amber-900">{checkMessage}</p>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <aside className="w-52 shrink-0 space-y-1 overflow-y-auto border-r bg-background p-3">
          <p className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-wide uppercase">Actions</p>
          {TOOLBOX.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => addNode(item.type)}
              className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs"
            >
              <item.icon className="text-muted-foreground size-3.5" />
              {item.label}
            </button>
          ))}
        </aside>

        <div className="relative min-w-0 flex-1 overflow-hidden">
          {tab === 'analysis' ? (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              Flow analytics will appear here once the flow is active.
            </div>
          ) : (
            <div
              className="absolute inset-0 overflow-auto"
              style={{
                backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
                backgroundSize: `${20 * scale}px ${20 * scale}px`,
              }}
            >
              <div className="inline-block min-h-full min-w-full p-8" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                <div className="flex flex-nowrap items-start">
                  <NodeCard
                    title="Trigger"
                    onClick={openTrigger}
                    body={
                      definition.triggerType ? (
                        <>
                          <p className="text-foreground font-semibold">{TRIGGER_LABELS[definition.triggerType]}</p>
                          {triggerSummary ? <p className="mt-1">{triggerSummary}</p> : null}
                        </>
                      ) : (
                        'Click to configure'
                      )
                    }
                  />
                  {definition.nodes.length === 0 ? (
                    <Connector onAdd={() => addNode('send_messages')} />
                  ) : (
                    definition.nodes.map((node, i) => (
                      <div key={node.id} className="flex items-start">
                        <Connector onAdd={() => addNode(node.type, i)} />
                        <NodeCard title={node.title} body="Configure in next step" />
                        {i === definition.nodes.length - 1 ? (
                          <Connector onAdd={() => addNode('send_messages')} />
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-4 z-[5] flex items-center gap-0.5 rounded-lg border bg-background px-1 py-1">
            <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.min(150, z + 10))}>
              <Plus />
            </Button>
            <span className="w-10 text-center text-xs tabular-nums">{zoom}%</span>
            <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.max(50, z - 10))}>
              <Minus />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setZoom(100)} aria-label="Reset zoom">
              <Maximize2 />
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={triggerOpen} onOpenChange={setTriggerOpen}>
        <SheetContent side="left" className="sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Trigger</SheetTitle>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto px-4">
            {panelMode === 'select' ? (
              (['keyword', 'click_button'] as FlowTriggerType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPanelMode(type)}
                  className="hover:border-primary/40 w-full rounded-lg border p-3 text-left"
                >
                  <p className="text-sm font-semibold">{TRIGGER_LABELS[type]}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{TRIGGER_DESCRIPTIONS[type]}</p>
                </button>
              ))
            ) : panelMode === 'click_button' ? (
              <p className="text-muted-foreground text-sm">{TRIGGER_DESCRIPTIONS.click_button}</p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Match rule</Label>
                  <Select value={draftRule} onValueChange={(v) => setDraftRule(v as KeywordMatchRule)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="containing">Containing</SelectItem>
                      <SelectItem value="exact_match">Exact match</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {draftKeywords.map((kw, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={kw}
                      onChange={(e) => setDraftKeywords((prev) => prev.map((k, idx) => (idx === i ? e.target.value : k)))}
                      placeholder="Keyword"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setDraftKeywords((prev) => (prev.length <= 1 ? [''] : prev.filter((_, idx) => idx !== i)))
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setDraftKeywords((prev) => [...prev, ''])}>
                  <Plus />
                  Keyword
                </Button>
              </div>
            )}
          </div>
          <SheetFooter className="flex-row gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setTriggerOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                if (panelMode === 'keyword') saveKeyword()
                else if (panelMode === 'click_button') {
                  setDefinition((prev) => ({ ...prev, triggerType: 'click_button' }))
                  setTriggerOpen(false)
                } else {
                  setTriggerOpen(false)
                }
              }}
            >
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Connector({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex shrink-0 items-center px-1">
      <div className="bg-border h-px w-8" />
      <Button size="icon-sm" className="size-7 rounded-full" onClick={onAdd} aria-label="Add step">
        <Plus />
      </Button>
      <div className="bg-border h-px w-6" />
    </div>
  )
}
