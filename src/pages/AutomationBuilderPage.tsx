import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addEdge,
  Background,
  ConnectionLineType,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ArrowLeft, BarChart3, Loader2, Pause, Play, Send } from 'lucide-react'

import { AutomationAnalyticsSheet } from '@/components/automations/AutomationAnalyticsSheet'
import { FlowStepNode } from '@/components/automations/flow/FlowStepNode'
import { NodeEditSheet } from '@/components/automations/flow/NodeEditSheet'
import { TestTriggerSheet } from '@/components/automations/TestTriggerSheet'
import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ChannelIcon } from '@/components/channel-icon'
import type { FlowStepKind } from '@/lib/flowStepTypes'
import {
  defaultGraph,
  FLOW_EDGE,
  graphFromFlow,
  layoutVertical,
  makeStepNode,
  needsVerticalLayout,
  nextStepPosition,
  spliceStepEdge,
  toFlowEdges,
  toFlowNodes,
  X_BASE,
  Y_STEP,
} from '@/lib/journeyGraph'
import { detailForNode } from '@/lib/journeyNodeTypes'
import {
  realAutomationsService,
  useAutomationsKeepAlive,
  type AutomationChannel,
  type AutomationStatus,
  type JourneyGraph,
} from '@/services/realAutomations.service'

const NODE_TYPES = { flowStep: FlowStepNode }

interface FlowCanvasProps {
  automationId: string
  channel: AutomationChannel
  name: string
  status: AutomationStatus
  graph: JourneyGraph
  onBack: () => void
}

function FlowCanvas({ automationId, channel, name, status, graph, onBack }: FlowCanvasProps) {
  useAutomationsKeepAlive()
  const confirm = useConfirm()
  const saveGraph = realAutomationsService.useSaveGraph()
  const publish = realAutomationsService.usePublish()
  const pause = realAutomationsService.usePause()
  const update = realAutomationsService.useUpdate()

  const initialEdges = useMemo(() => toFlowEdges(graph), [graph])
  const initialNodes = useMemo(() => {
    const nodes = toFlowNodes(graph)
    return needsVerticalLayout(nodes, initialEdges) ? layoutVertical(nodes, initialEdges) : nodes
  }, [graph, initialEdges])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [draftName, setDraftName] = useState(name)
  const [dirty, setDirty] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [testOpen, setTestOpen] = useState(false)

  useEffect(() => setDraftName(name), [name])

  const nameChanged = draftName.trim() !== name
  const isSaved = !dirty && !nameChanged

  useEffect(() => {
    if (isSaved) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isSaved])

  const markDirty = useCallback(() => setDirty(true), [])

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== id))
      setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id))
      markDirty()
    },
    [setNodes, setEdges, markDirty]
  )

  const addStepAfter = useCallback(
    (sourceId: string, handleId: string | undefined, kind: FlowStepKind) => {
      const source = nodes.find((n) => n.id === sourceId)
      const newNode = makeStepNode(
        kind,
        channel,
        source ? nextStepPosition(source, handleId) : { x: X_BASE, y: Y_STEP }
      )
      setNodes((prev) => [...prev, newNode])
      setEdges((prev) => spliceStepEdge(prev, sourceId, handleId, newNode.id))
      markDirty()
    },
    [nodes, channel, setNodes, setEdges, markDirty]
  )

  const editNode = useCallback(
    (data: Record<string, unknown>) => {
      if (!editingNodeId) return
      setNodes((prev) =>
        prev.map((n) =>
          n.id === editingNodeId
            ? { ...n, data: { ...n.data, rawData: data, detail: detailForNode(n.data.kind, data) } }
            : n
        )
      )
      markDirty()
    },
    [editingNodeId, setNodes, markDirty]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((prev) => addEdge({ ...connection, ...FLOW_EDGE }, prev))
      markDirty()
    },
    [setEdges, markDirty]
  )

  const onNodesChangeDirty: typeof onNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes)
      if (changes.some((c) => c.type === 'position' && 'dragging' in c && c.dragging === false)) {
        markDirty()
      }
    },
    [onNodesChange, markDirty]
  )

  const nodesWithHandlers = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          channel,
          onDelete: deleteNode,
          onAddStep: addStepAfter,
          onEdit: setEditingNodeId,
        },
      })),
    [nodes, channel, deleteNode, addStepAfter]
  )

  const editingNode = nodes.find((n) => n.id === editingNodeId) ?? null
  const triggerEvent =
    (nodes.find((n) => n.data.kind === 'trigger')?.data.rawData.event as string | undefined) ??
    'message.received'

  const persistName = async () => {
    const next = draftName.trim()
    if (!next) throw new Error('Name is required')
    if (next !== name) await update.mutateAsync({ id: automationId, channel, name: next })
  }

  const save = async () => {
    setPublishError(null)
    try {
      await persistName()
      await saveGraph.mutateAsync({ id: automationId, channel, graph: graphFromFlow(nodes, edges) })
      setDirty(false)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  const savePublish = async () => {
    setPublishError(null)
    try {
      await persistName()
      await saveGraph.mutateAsync({ id: automationId, channel, graph: graphFromFlow(nodes, edges) })
      setDirty(false)
      await publish.mutateAsync({ id: automationId, channel })
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Publish failed')
    }
  }

  const leave = async () => {
    if (
      !isSaved &&
      !(await confirm({
        title: 'Leave without saving?',
        description: 'You have unsaved changes.',
        confirmLabel: 'Leave',
        destructive: true,
      }))
    ) {
      return
    }
    onBack()
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => void leave()} aria-label="Back to automations">
            <ArrowLeft />
          </Button>
          <ChannelIcon channel={channel} className="size-4 shrink-0" />
          <div className="min-w-0">
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="h-7 max-w-56 border-transparent px-1 text-sm font-semibold shadow-none"
              aria-label="Automation name"
            />
            <p className="text-muted-foreground px-1 text-xs">
              {isSaved ? 'Saved' : saveGraph.isPending ? 'Saving…' : 'Unsaved'}
              {channel === 'instagram' ? ' · Instagram' : ' · WhatsApp'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {publishError ? (
            <Badge variant="outline" className="border-destructive/40 text-destructive max-w-64 truncate">
              {publishError}
            </Badge>
          ) : null}
          <Badge variant={status === 'published' ? 'default' : 'outline'} className="capitalize">
            {status}
          </Badge>
          {channel === 'whatsapp' ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setAnalyticsOpen(true)}>
                <BarChart3 />
                Analytics
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTestOpen(true)}>
                Run
              </Button>
            </>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => void save()} disabled={saveGraph.isPending || isSaved}>
            {saveGraph.isPending ? <Loader2 className="animate-spin" /> : null}
            Save
          </Button>
          {status === 'published' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => pause.mutate({ id: automationId, channel })}
              disabled={pause.isPending}
            >
              <Pause />
              Pause
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => void savePublish()}
              disabled={saveGraph.isPending || publish.isPending}
            >
              <Send />
              Publish
            </Button>
          )}
          {status === 'published' ? (
            <Button size="sm" onClick={() => void savePublish()} disabled={saveGraph.isPending || publish.isPending}>
              <Play />
              Republish
            </Button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ReactFlow
          nodes={nodesWithHandlers}
          edges={edges}
          onNodesChange={onNodesChangeDirty}
          onEdgesChange={(changes) => {
            onEdgesChange(changes)
            markDirty()
          }}
          onConnect={onConnect}
          nodeTypes={NODE_TYPES}
          defaultEdgeOptions={FLOW_EDGE}
          connectionLineType={ConnectionLineType.SmoothStep}
          edgesReconnectable={false}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          className="[&_.react-flow__edgeupdater]:hidden"
        >
          <Background gap={20} />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable className="!bg-card" />
        </ReactFlow>
      </div>

      <NodeEditSheet
        kind={editingNode?.data.kind ?? null}
        backendType={editingNode?.data.backendType}
        channel={channel}
        data={editingNode?.data.rawData ?? {}}
        currentAutomationId={automationId}
        steps={nodes
          .filter((n) => n.id !== editingNodeId)
          .map((n) => ({ id: n.id, label: n.data.label || n.data.backendType }))}
        onClose={() => setEditingNodeId(null)}
        onSave={editNode}
      />
      {channel === 'whatsapp' ? (
        <>
          <AutomationAnalyticsSheet
            automationId={automationId}
            open={analyticsOpen}
            onClose={() => setAnalyticsOpen(false)}
          />
          <TestTriggerSheet open={testOpen} event={triggerEvent} onClose={() => setTestOpen(false)} />
        </>
      ) : null}
    </div>
  )
}

export function AutomationBuilderPage({
  automationId,
  channel,
  name,
  status,
  onBack,
}: {
  automationId: string
  channel: AutomationChannel
  name: string
  status: AutomationStatus
  onBack: () => void
}) {
  const { data: graph, isLoading } = realAutomationsService.useGraph(automationId, channel)

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col p-4">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  const effectiveGraph = graph && graph.nodes.length > 0 ? graph : defaultGraph(channel)

  return (
    <ReactFlowProvider>
      <FlowCanvas
        key={automationId}
        automationId={automationId}
        channel={channel}
        name={name}
        status={status}
        graph={effectiveGraph}
        onBack={onBack}
      />
    </ReactFlowProvider>
  )
}
