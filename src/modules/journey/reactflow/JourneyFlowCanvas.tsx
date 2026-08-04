import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type MutableRefObject,
} from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { journeyNodeTypes } from './nodes/JourneyNodes';
import { JourneyCanvasContext } from './JourneyCanvasContext';
import { DEFAULT_NODE_DATA, type JourneyGraph, type JourneyNodeType } from '../types';
import {
  createStarterGraph,
  flowToGraph,
  graphToFlow,
  newEdgeId,
  newNodeId,
} from '../hooks/useJourneyGraph';
import { useJourneyBuilderStore } from '../store/journeyBuilderStore';
import { flowEdgeTypes } from '../../flow-builder/CurvedEdge';
import { FLOW_EDGE_STYLE } from '../../flow-builder/channelTheme';
import { FlowCanvasToolbar } from '../../flow-builder/FlowCanvasToolbar';
import { IG_LAYOUT_NODE_CEILING } from '../../instagram-automation/lib/layoutIgFlow';
import { PhonePreviewStrip } from '../../flow-builder/PhonePreviewStrip';
import { readStepNote, StepNoteMenu } from '../../flow-builder/StepNote';

export type NewOrReusedNode = { id: string; type: JourneyNodeType; data: Record<string, unknown> };

export type JourneyAddStepApi = {
  addNodeAfter: (sourceNodeId: string, type: JourneyNodeType) => void;
  /**
   * Same create/link as addNodeAfter, but wired to a specific source handle (e.g. a BUTTONS
   * button id) instead of the node's default output. Reuses an existing node already on that
   * handle if its type already matches (no duplicate node per re-click of the same action).
   */
  addNodeAfterHandle: (
    sourceNodeId: string,
    type: JourneyNodeType,
    sourceHandle: string,
    extraData?: Record<string, unknown>
  ) => NewOrReusedNode | null;
  hasTrigger: boolean;
};

type Props = {
  graph?: JourneyGraph;
  onGraphChange: (graph: JourneyGraph) => void;
  onSelectNode?: (node: Node | null) => void;
  selectedNodeId?: string | null;
  /** Opens the parent sidesheet to pick a step after this node. */
  onRequestAddStep?: (nodeId: string, meta: { hasTrigger: boolean }) => void;
  addStepApiRef?: MutableRefObject<JourneyAddStepApi | null>;
  showPreviewStrip?: boolean;
};

const defaultEdgeOptions = {
  type: 'curved' as const,
  style: { ...FLOW_EDGE_STYLE },
  animated: false,
};

/** Must sit under ReactFlow so useReactFlow() works after align. */
function FitViewOnAlign({ token }: { token: number }) {
  const { fitView, getNodes } = useReactFlow();
  useEffect(() => {
    if (token === 0) return;
    const t = window.setTimeout(() => {
      const heavy = getNodes().length > IG_LAYOUT_NODE_CEILING;
      fitView({ padding: 0.35, duration: heavy ? 0 : 200 });
    }, 30);
    return () => window.clearTimeout(t);
  }, [token, fitView, getNodes]);
  return null;
}

export function JourneyFlowCanvas({
  graph,
  onGraphChange,
  onSelectNode,
  selectedNodeId = null,
  onRequestAddStep,
  addStepApiRef,
  showPreviewStrip = true,
}: Props) {
  const setDirty = useJourneyBuilderStore((s) => s.setDirty);
  const [addMenuAnchor, setAddMenuAnchor] = useState<{ nodeId: string } | null>(null);
  const [fitToken, setFitToken] = useState(0);
  const [noteMenu, setNoteMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);

  const seed = useMemo(() => {
    const g = graph && graph.nodes.length > 0 ? graph : createStarterGraph();
    return graphToFlow(g);
  }, [graph]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(seed.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(seed.edges);

  useEffect(() => {
    const g = graph && graph.nodes.length > 0 ? graph : createStarterGraph();
    const flow = graphToFlow(g);
    setNodes(flow.nodes);
    setEdges(flow.edges);
  }, [graph, setNodes, setEdges]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: n.id === selectedNodeId,
      }))
    );
  }, [selectedNodeId, setNodes]);

  const syncGraph = useCallback(
    (nextNodes: Node[], nextEdges: Edge[]) => {
      setDirty(true);
      onGraphChange(flowToGraph(nextNodes, nextEdges));
    },
    [onGraphChange, setDirty]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const next = addEdge(
          {
            ...connection,
            id: `edge_${crypto.randomUUID().slice(0, 8)}`,
            type: 'curved',
            style: { ...FLOW_EDGE_STYLE },
            data: {
              conditionValue:
                connection.sourceHandle && connection.sourceHandle !== 'default'
                  ? connection.sourceHandle
                  : 'default',
            },
          },
          eds
        );
        syncGraph(nodes, next);
        return next;
      });
    },
    [nodes, setEdges, syncGraph]
  );

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/journey-node') as JourneyNodeType;
      if (!type) return;
      const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const position = {
        x: event.clientX - bounds.left - 90,
        y: event.clientY - bounds.top - 30,
      };
      const newNode: Node = {
        id: newNodeId(),
        type,
        position,
        data: { ...DEFAULT_NODE_DATA[type], label: type },
      };
      setNodes((nds) => {
        const next = nds.concat(newNode);
        syncGraph(next, edges);
        return next;
      });
    },
    [edges, setNodes, syncGraph]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const addNodeAfter = useCallback(
    (sourceNodeId: string, type: JourneyNodeType) => {
      const source = nodes.find((n) => n.id === sourceNodeId);
      if (!source) return;

      const newId = newNodeId();
      const newNode: Node = {
        id: newId,
        type,
        position: { x: source.position.x + 260, y: source.position.y },
        data: { ...DEFAULT_NODE_DATA[type], label: type },
      };

      const outgoing = edges.filter((e) => e.source === sourceNodeId);
      const linearEdge =
        outgoing.find((e) => !e.sourceHandle) ??
        outgoing.find((e) => e.sourceHandle !== 'yes' && e.sourceHandle !== 'no');

      let nextEdges = [...edges];
      if (linearEdge && source.type !== 'CONDITION') {
        nextEdges = nextEdges.filter((e) => e.id !== linearEdge.id);
        nextEdges.push({
          id: newEdgeId(),
          source: sourceNodeId,
          target: newId,
          type: 'curved',
          style: { ...FLOW_EDGE_STYLE },
          sourceHandle: linearEdge.sourceHandle,
          data: linearEdge.data,
        });
        nextEdges.push({
          id: newEdgeId(),
          source: newId,
          target: linearEdge.target,
          type: 'curved',
          style: { ...FLOW_EDGE_STYLE },
        });
      } else if (source.type !== 'CONDITION' && source.type !== 'END') {
        nextEdges.push({
          id: newEdgeId(),
          source: sourceNodeId,
          target: newId,
          type: 'curved',
          style: { ...FLOW_EDGE_STYLE },
        });
      }

      const nextNodes = [...nodes, newNode];
      setNodes(nextNodes);
      setEdges(nextEdges);
      syncGraph(nextNodes, nextEdges);
      setAddMenuAnchor(null);
    },
    [nodes, edges, setNodes, setEdges, syncGraph]
  );

  const addNodeAfterHandle = useCallback(
    (
      sourceNodeId: string,
      type: JourneyNodeType,
      sourceHandle: string,
      extraData?: Record<string, unknown>
    ): NewOrReusedNode | null => {
      const source = nodes.find((n) => n.id === sourceNodeId);
      if (!source) return null;

      const existingEdge = edges.find(
        (e) => e.source === sourceNodeId && (e.sourceHandle ?? undefined) === sourceHandle
      );
      const existingTarget = existingEdge
        ? nodes.find((n) => n.id === existingEdge.target)
        : undefined;
      if (existingTarget && existingTarget.type === type) {
        return {
          id: existingTarget.id,
          type: existingTarget.type as JourneyNodeType,
          data: existingTarget.data as Record<string, unknown>,
        };
      }

      const newId = newNodeId();
      const data = { ...DEFAULT_NODE_DATA[type], ...extraData, label: type };
      const newNode: Node = {
        id: newId,
        type,
        position: { x: source.position.x + 260, y: source.position.y },
        data,
      };

      const nextEdges = edges
        .filter((e) => !(e.source === sourceNodeId && (e.sourceHandle ?? undefined) === sourceHandle))
        .concat({
          id: newEdgeId(),
          source: sourceNodeId,
          target: newId,
          sourceHandle,
          type: 'curved',
          style: { ...FLOW_EDGE_STYLE },
          data: { conditionValue: sourceHandle },
        });

      const nextNodes = [...nodes, newNode];
      setNodes(nextNodes);
      setEdges(nextEdges);
      syncGraph(nextNodes, nextEdges);
      return { id: newId, type, data };
    },
    [nodes, edges, setNodes, setEdges, syncGraph]
  );

  const hasTrigger = useMemo(() => nodes.some((n) => n.type === 'TRIGGER'), [nodes]);

  const updateNodeData = useCallback(
    (nodeId: string, patch: Record<string, unknown>) => {
      setNodes((nds) => {
        const next = nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...(n.data as object), ...patch } } : n
        );
        syncGraph(next, edges);
        return next;
      });
    },
    [setNodes, syncGraph, edges]
  );

  useEffect(() => {
    if (!addStepApiRef) return;
    addStepApiRef.current = { addNodeAfter, addNodeAfterHandle, hasTrigger };
    return () => {
      addStepApiRef.current = null;
    };
  }, [addStepApiRef, addNodeAfter, addNodeAfterHandle, hasTrigger]);

  const openAddMenu = useCallback(
    (anchor: { nodeId: string }) => {
      setAddMenuAnchor(anchor);
      onRequestAddStep?.(anchor.nodeId, { hasTrigger });
    },
    [hasTrigger, onRequestAddStep]
  );

  const closeAddMenu = useCallback(() => {
    setAddMenuAnchor(null);
  }, []);

  const autoAlign = useCallback(() => {
    // ponytail: no layered auto-layout for WA yet — fitView only (IG has layoutIgFlow)
    requestAnimationFrame(() => setFitToken((n) => n + 1));
  }, []);

  const canvasActions = useMemo(
    () => ({
      addNodeAfter,
      updateNodeData,
      hasTrigger,
      addMenuAnchor,
      openAddMenu,
      closeAddMenu,
      selectedNodeId,
    }),
    [addNodeAfter, updateNodeData, hasTrigger, addMenuAnchor, openAddMenu, closeAddMenu, selectedNodeId]
  );

  return (
    <JourneyCanvasContext.Provider value={canvasActions}>
      <div className="journey-canvas-shell relative h-full w-full overflow-hidden rounded-xl border-[0.5px] border-border-subtle bg-surface">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          defaultEdgeOptions={defaultEdgeOptions}
          edgeTypes={flowEdgeTypes}
          onNodesChange={(changes) => {
            onNodesChange(changes);
            if (changes.some((c) => c.type === 'position' && c.dragging === false)) {
              syncGraph(nodes, edges);
            }
            if (changes.some((c) => c.type === 'remove')) {
              setTimeout(() => syncGraph(nodes, edges), 0);
            }
          }}
          onEdgesChange={(changes) => {
            onEdgesChange(changes);
            if (changes.some((c) => c.type === 'remove')) {
              setTimeout(() => syncGraph(nodes, edges), 0);
            }
          }}
          onConnect={onConnect}
          nodeTypes={journeyNodeTypes}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeDragStop={() => syncGraph(nodes, edges)}
          onNodeClick={(_, node) => {
            setAddMenuAnchor(null);
            onSelectNode?.(node);
          }}
          onNodeContextMenu={(event, node) => {
            event.preventDefault();
            setAddMenuAnchor(null);
            setNoteMenu({ nodeId: node.id, x: event.clientX, y: event.clientY });
          }}
          onPaneClick={() => {
            setAddMenuAnchor(null);
            setNoteMenu(null);
            onSelectNode?.(null);
          }}
          fitView
          fitViewOptions={{ padding: 0.35 }}
          minZoom={0.35}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#d6d3cd" />
          <FitViewOnAlign token={fitToken} />
          <FlowCanvasToolbar onAutoAlign={autoAlign} position="center-right" />
        </ReactFlow>

        {showPreviewStrip ? (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
            <div className="pointer-events-auto">
              <PhonePreviewStrip
                channel="whatsapp"
                nodes={nodes}
                edges={edges}
                maxPhones={5}
                selectedNodeId={selectedNodeId}
                onSelectStep={(nodeId) => {
                  const node = nodes.find((n) => n.id === nodeId) ?? null;
                  if (node) onSelectNode?.(node);
                }}
              />
            </div>
          </div>
        ) : null}

        {noteMenu ? (
          <StepNoteMenu
            x={noteMenu.x}
            y={noteMenu.y}
            hasNote={Boolean(readStepNote(nodes.find((n) => n.id === noteMenu.nodeId)?.data))}
            onAddNote={() => updateNodeData(noteMenu.nodeId, { note: { text: '' } })}
            onRemoveNote={() => updateNodeData(noteMenu.nodeId, { note: undefined })}
            onClose={() => setNoteMenu(null)}
          />
        ) : null}
      </div>
    </JourneyCanvasContext.Provider>
  );
}
