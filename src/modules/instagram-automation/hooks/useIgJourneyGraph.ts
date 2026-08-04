import { useCallback } from 'react';
import type { Edge, Node } from '@xyflow/react';
import type {
  IgJourneyGraph,
  IgJourneyGraphEdge,
  IgJourneyGraphNode,
  IgJourneyNodeType,
} from '../types';
import { DEFAULT_NODE_DATA } from '../types';

export function graphToFlow(graph: IgJourneyGraph): { nodes: Node[]; edges: Edge[] } {
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
    type: 'curved',
    style: { stroke: 'var(--color-border-strong)', strokeWidth: 1.5 },
    label: e.conditionValue === 'yes' ? 'Yes' : e.conditionValue === 'no' ? 'No' : undefined,
    data: { conditionValue: e.conditionValue ?? 'default' },
    sourceHandle:
      e.conditionValue && e.conditionValue !== 'default' ? e.conditionValue : undefined,
  }));

  return { nodes, edges };
}

export function flowToGraph(nodes: Node[], edges: Edge[]): IgJourneyGraph {
  const graphNodes: IgJourneyGraphNode[] = nodes.map((n) => ({
    id: n.id,
    type: n.type as IgJourneyNodeType,
    data: (n.data ?? {}) as Record<string, unknown>,
    positionX: n.position.x,
    positionY: n.position.y,
  }));

  const graphEdges: IgJourneyGraphEdge[] = edges.map((e) => {
    let conditionValue: string | null = (e.data as { conditionValue?: string })?.conditionValue ?? null;
    if (e.sourceHandle && e.sourceHandle !== 'default') conditionValue = e.sourceHandle;
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
  const toFlow = useCallback((graph: IgJourneyGraph) => graphToFlow(graph), []);
  const toGraph = useCallback((nodes: Node[], edges: Edge[]) => flowToGraph(nodes, edges), []);
  return { toFlow, toGraph };
}

export function newNodeId(): string {
  return `node_${crypto.randomUUID().slice(0, 8)}`;
}

export function newEdgeId(): string {
  return `edge_${crypto.randomUUID().slice(0, 8)}`;
}

export function createStarterGraph(): IgJourneyGraph {
  const triggerId = newNodeId();
  const endId = newNodeId();
  return {
    nodes: [
      {
        id: triggerId,
        type: 'TRIGGER',
        data: { ...DEFAULT_NODE_DATA.TRIGGER },
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
