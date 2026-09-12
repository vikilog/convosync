import { Position, type Edge, type Node } from '@xyflow/react'

import type { FlowStepKind, FlowStepNodeData } from '@/lib/flowStepTypes'
import {
  defaultDataForKind,
  detailForNode,
  kindForNodeType,
  labelForKind,
  nodeTypeForKind,
  sourcePorts,
} from '@/lib/journeyNodeTypes'
import type {
  AutomationChannel,
  JourneyGraph,
  JourneyGraphEdge,
  JourneyGraphNode,
} from '@/services/realAutomations.service'

export const X_BASE = 260
export const Y_STEP = 176
export const NODE_W = 224
export const BRANCH_OFFSET = 280
export const BRANCH_GAP = 48

export const FLOW_EDGE = {
  type: 'smoothstep' as const,
  style: { strokeWidth: 1.5 },
  reconnectable: false,
}

export function defaultGraph(channel: AutomationChannel = 'whatsapp'): JourneyGraph {
  const triggerId = crypto.randomUUID()
  const endId = crypto.randomUUID()
  return {
    nodes: [
      {
        id: triggerId,
        type: 'TRIGGER',
        data: defaultDataForKind('trigger', channel),
        positionX: X_BASE,
        positionY: 0,
      },
      { id: endId, type: 'END', data: {}, positionX: X_BASE, positionY: Y_STEP },
    ],
    edges: [{ id: crypto.randomUUID(), sourceNodeId: triggerId, targetNodeId: endId, conditionValue: null }],
  }
}

function stubHandlers(): Pick<FlowStepNodeData, 'onDelete' | 'onAddStep' | 'onEdit'> {
  return { onDelete: () => {}, onAddStep: () => {}, onEdit: () => {} }
}

export function toFlowNodes(graph: JourneyGraph): Node<FlowStepNodeData>[] {
  return graph.nodes.map((n) => {
    const kind = kindForNodeType(n.type)
    return {
      id: n.id,
      type: 'flowStep',
      position: { x: n.positionX, y: n.positionY },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: {
        kind,
        backendType: n.type,
        label: labelForKind(kind, n.type),
        detail: detailForNode(kind, n.data),
        rawData: n.data,
        ...stubHandlers(),
      },
    }
  })
}

function normalizeHandle(value: string | null | undefined, ports: { id: string }[]): string | undefined {
  const raw = value?.trim()
  if (!raw || raw === 'default') return undefined
  if (ports.some((p) => p.id === raw)) return raw
  const lower = raw.toLowerCase()
  return ports.find((p) => p.id === lower)?.id
}

export function toFlowEdges(graph: JourneyGraph): Edge[] {
  const nodes = new Map(graph.nodes.map((n) => [n.id, n]))
  const outgoing = new Map<string, JourneyGraphEdge[]>()
  for (const e of graph.edges) {
    const list = outgoing.get(e.sourceNodeId) ?? []
    list.push(e)
    outgoing.set(e.sourceNodeId, list)
  }

  return graph.edges.map((e) => {
    const src = nodes.get(e.sourceNodeId)
    const kind = src ? kindForNodeType(src.type) : 'custom'
    const ports = src ? sourcePorts(kind, src.data) : []
    let sourceHandle = normalizeHandle(e.conditionValue, ports)
    if (ports.length && !sourceHandle) {
      const unlabeled = (outgoing.get(e.sourceNodeId) ?? []).filter((s) => !normalizeHandle(s.conditionValue, ports))
      sourceHandle = ports[unlabeled.indexOf(e)]?.id ?? ports[0]?.id
    }
    return {
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      sourceHandle,
      ...FLOW_EDGE,
    }
  })
}

export function graphFromFlow(
  nodes: Node<FlowStepNodeData>[],
  edges: Edge[]
): JourneyGraph {
  return {
    nodes: nodes.map(
      (n): JourneyGraphNode => ({
        id: n.id,
        type: nodeTypeForKind(n.data.kind, n.data.backendType),
        data: n.data.rawData,
        positionX: n.position.x,
        positionY: n.position.y,
      })
    ),
    edges: edges.map(
      (e): JourneyGraphEdge => ({
        id: e.id,
        sourceNodeId: e.source,
        targetNodeId: e.target,
        conditionValue: (e.sourceHandle as string | undefined) ?? null,
      })
    ),
  }
}

export function makeStepNode(
  kind: FlowStepKind,
  channel: AutomationChannel,
  position: { x: number; y: number }
): Node<FlowStepNodeData> {
  const rawData = defaultDataForKind(kind, channel)
  const backendType = nodeTypeForKind(kind)
  return {
    id: crypto.randomUUID(),
    type: 'flowStep',
    position,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    data: {
      kind,
      backendType,
      label: labelForKind(kind, backendType),
      detail: detailForNode(kind, rawData),
      rawData,
      ...stubHandlers(),
    },
  }
}

function sameHandle(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a ?? undefined) === (b ?? undefined)
}

/** Insert `newId` on the source handle, splicing any existing outgoing edge so the line stays one path. */
export function spliceStepEdge(
  edges: Edge[],
  sourceId: string,
  handleId: string | undefined,
  newId: string
): Edge[] {
  const existing = edges.find((e) => e.source === sourceId && sameHandle(e.sourceHandle, handleId))
  const toNew: Edge = {
    id: `e-${sourceId}-${newId}`,
    source: sourceId,
    sourceHandle: handleId,
    target: newId,
    ...FLOW_EDGE,
  }
  if (!existing) return [...edges, toNew]
  return [
    ...edges.filter((e) => e.id !== existing.id),
    toNew,
    { id: `e-${newId}-${existing.target}`, source: newId, target: existing.target, ...FLOW_EDGE },
  ]
}

export function nextStepPosition(
  source: Node<FlowStepNodeData>,
  handleId: string | undefined
): { x: number; y: number } {
  const ports = sourcePorts(source.data.kind, source.data.rawData)
  let dx = 0
  if (handleId === 'yes') dx = -BRANCH_OFFSET
  else if (handleId === 'no') dx = BRANCH_OFFSET
  else if (handleId && ports.length > 1) {
    const i = ports.findIndex((p) => p.id === handleId)
    if (i >= 0) dx = (i - (ports.length - 1) / 2) * BRANCH_OFFSET
  }
  return { x: source.position.x + dx, y: source.position.y + Y_STEP }
}

function handleOrder(h?: string | null) {
  if (h === 'yes') return 0
  if (h === 'no') return 2
  return 1
}

/** Top-down tree layout so YES/NO (and other) siblings do not sit on top of each other. */
export function layoutVertical(nodes: Node<FlowStepNodeData>[], edges: Edge[]): Node<FlowStepNodeData>[] {
  if (nodes.length === 0) return nodes
  const ids = new Set(nodes.map((n) => n.id))
  const outs = new Map<string, Edge[]>()
  const indeg = new Map<string, number>()
  for (const id of ids) {
    outs.set(id, [])
    indeg.set(id, 0)
  }
  for (const e of edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) continue
    outs.get(e.source)!.push(e)
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1)
  }
  for (const list of outs.values()) {
    list.sort((a, b) => handleOrder(a.sourceHandle) - handleOrder(b.sourceHandle))
  }

  const roots = nodes
    .filter((n) => (indeg.get(n.id) ?? 0) === 0)
    .sort((a, b) => (a.data.kind === 'trigger' ? -1 : b.data.kind === 'trigger' ? 1 : 0))
    .map((n) => n.id)
  const start = roots.length > 0 ? roots : [nodes[0].id]

  const widthMemo = new Map<string, number>()
  const subtreeWidth = (id: string, walking: Set<string>): number => {
    const hit = widthMemo.get(id)
    if (hit !== undefined) return hit
    if (walking.has(id)) return NODE_W
    walking.add(id)
    const kids = [...new Set((outs.get(id) ?? []).map((e) => e.target))].filter((t) => t !== id)
    if (kids.length === 0) {
      widthMemo.set(id, NODE_W)
      return NODE_W
    }
    const w = Math.max(
      NODE_W,
      kids.reduce((sum, k) => sum + subtreeWidth(k, walking), 0) + BRANCH_GAP * (kids.length - 1)
    )
    widthMemo.set(id, w)
    return w
  }

  const pos = new Map<string, { x: number; y: number }>()
  const place = (id: string, x: number, y: number, seen: Set<string>) => {
    if (seen.has(id)) return
    seen.add(id)
    pos.set(id, { x, y })
    const unique = [...new Set((outs.get(id) ?? []).map((e) => e.target))].filter((k) => !seen.has(k))
    if (unique.length === 0) return
    const widths = unique.map((k) => subtreeWidth(k, new Set()))
    const total = widths.reduce((a, b) => a + b, 0) + BRANCH_GAP * (unique.length - 1)
    let cx = x + NODE_W / 2 - total / 2
    unique.forEach((k, i) => {
      place(k, cx + widths[i]! / 2 - NODE_W / 2, y + Y_STEP, seen)
      cx += widths[i]! + BRANCH_GAP
    })
  }

  const seen = new Set<string>()
  let x0 = X_BASE
  for (const id of start) {
    const w = subtreeWidth(id, new Set())
    place(id, x0, 0, seen)
    x0 += w + BRANCH_GAP
  }
  for (const n of nodes) {
    if (!seen.has(n.id)) {
      place(n.id, x0, 0, seen)
      x0 += NODE_W + BRANCH_GAP
    }
  }

  return nodes.map((n) => {
    const p = pos.get(n.id)
    return p ? { ...n, position: p } : n
  })
}

export function needsVerticalLayout(nodes: Node[], edges: Edge[]): boolean {
  if (nodes.length < 2) return false
  const xs = nodes.map((n) => n.position.x)
  const ys = nodes.map((n) => n.position.y)
  const dx = Math.max(...xs) - Math.min(...xs)
  const dy = Math.max(...ys) - Math.min(...ys)
  if (dx > 80 && dy < 40) return true

  const byId = new Map(nodes.map((n) => [n.id, n]))
  const kids = new Map<string, Node[]>()
  for (const e of edges) {
    const t = byId.get(e.target)
    if (!t) continue
    const list = kids.get(e.source) ?? []
    list.push(t)
    kids.set(e.source, list)
  }
  for (const siblings of kids.values()) {
    if (siblings.length < 2) continue
    for (let i = 0; i < siblings.length; i++) {
      for (let j = i + 1; j < siblings.length; j++) {
        const a = siblings[i]!.position
        const b = siblings[j]!.position
        if (Math.abs(a.x - b.x) < NODE_W && Math.abs(a.y - b.y) < 80) return true
      }
    }
  }
  return false
}
