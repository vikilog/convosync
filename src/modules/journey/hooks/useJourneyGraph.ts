import { useCallback } from 'react';
import type { Edge, Node } from '@xyflow/react';
import type { JourneyGraph, JourneyGraphEdge, JourneyGraphNode, JourneyNodeType } from '../types';

export function graphToFlow(graph: JourneyGraph): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = graph.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: { x: n.positionX, y: n.positionY },
    data: { ...n.data, label: n.type },
  }));

  const edges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    label: e.conditionValue === 'yes' ? 'Yes' : e.conditionValue === 'no' ? 'No' : undefined,
    data: { conditionValue: e.conditionValue ?? 'default' },
    sourceHandle:
      e.conditionValue === 'yes'
        ? 'yes'
        : e.conditionValue === 'no'
          ? 'no'
          : undefined,
  }));

  return { nodes, edges };
}

export function flowToGraph(nodes: Node[], edges: Edge[]): JourneyGraph {
  const graphNodes: JourneyGraphNode[] = nodes.map((n) => ({
    id: n.id,
    type: n.type as JourneyNodeType,
    data: (n.data ?? {}) as Record<string, unknown>,
    positionX: n.position.x,
    positionY: n.position.y,
  }));

  const graphEdges: JourneyGraphEdge[] = edges.map((e) => {
    let conditionValue: string | null = (e.data as { conditionValue?: string })?.conditionValue ?? null;
    if (e.sourceHandle === 'yes') conditionValue = 'yes';
    if (e.sourceHandle === 'no') conditionValue = 'no';
    if (conditionValue === 'default') conditionValue = null;
    return {
      id: e.id,
      sourceNodeId: e.source,
      targetNodeId: e.target,
      conditionValue,
    };
  });

  return { nodes: graphNodes, edges: graphEdges };
}

export function useGraphConverters() {
  const toFlow = useCallback((graph: JourneyGraph) => graphToFlow(graph), []);
  const toGraph = useCallback((nodes: Node[], edges: Edge[]) => flowToGraph(nodes, edges), []);
  return { toFlow, toGraph };
}

export function newNodeId(): string {
  return `node_${crypto.randomUUID().slice(0, 8)}`;
}

export function newEdgeId(): string {
  return `edge_${crypto.randomUUID().slice(0, 8)}`;
}

export function createStarterGraph(): JourneyGraph {
  const triggerId = newNodeId();
  const endId = newNodeId();
  return {
    nodes: [
      {
        id: triggerId,
        type: 'TRIGGER',
        data: { event: 'message.received' },
        positionX: 80,
        positionY: 120,
      },
      {
        id: endId,
        type: 'END',
        data: {},
        positionX: 420,
        positionY: 120,
      },
    ],
    edges: [
      {
        id: newEdgeId(),
        sourceNodeId: triggerId,
        targetNodeId: endId,
        conditionValue: null,
      },
    ],
  };
}
