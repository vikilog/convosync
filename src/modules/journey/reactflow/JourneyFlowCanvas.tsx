import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AddStepsMenu } from '../components/AddStepsMenu';
import { journeyNodeTypes } from './nodes/JourneyNodes';
import { JourneyCanvasContext, type AddStepsMenuAnchor } from './JourneyCanvasContext';
import { DEFAULT_NODE_DATA, type JourneyGraph, type JourneyNodeType } from '../types';
import { createStarterGraph, flowToGraph, graphToFlow, newEdgeId, newNodeId } from '../hooks/useJourneyGraph';
import { useJourneyBuilderStore } from '../store/journeyBuilderStore';

type Props = {
  graph?: JourneyGraph;
  onGraphChange: (graph: JourneyGraph) => void;
  onSelectNode?: (node: Node | null) => void;
  selectedNodeId?: string | null;
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  style: { stroke: '#94a3b8', strokeWidth: 2 },
  animated: false,
};

export function JourneyFlowCanvas({
  graph,
  onGraphChange,
  onSelectNode,
  selectedNodeId = null,
}: Props) {
  const setDirty = useJourneyBuilderStore((s) => s.setDirty);
  const [addMenuAnchor, setAddMenuAnchor] = useState<AddStepsMenuAnchor | null>(null);

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
            data: {
              conditionValue:
                connection.sourceHandle === 'yes'
                  ? 'yes'
                  : connection.sourceHandle === 'no'
                    ? 'no'
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
          sourceHandle: linearEdge.sourceHandle,
          data: linearEdge.data,
        });
        nextEdges.push({
          id: newEdgeId(),
          source: newId,
          target: linearEdge.target,
        });
      } else if (source.type !== 'CONDITION' && source.type !== 'END') {
        nextEdges.push({ id: newEdgeId(), source: sourceNodeId, target: newId });
      }

      const nextNodes = [...nodes, newNode];
      setNodes(nextNodes);
      setEdges(nextEdges);
      syncGraph(nextNodes, nextEdges);
      setAddMenuAnchor(null);
    },
    [nodes, edges, setNodes, setEdges, syncGraph]
  );

  const hasTrigger = useMemo(() => nodes.some((n) => n.type === 'TRIGGER'), [nodes]);

  const canvasActions = useMemo(
    () => ({
      addNodeAfter,
      hasTrigger,
      addMenuAnchor,
      openAddMenu: setAddMenuAnchor,
      closeAddMenu: () => setAddMenuAnchor(null),
      selectedNodeId,
    }),
    [addNodeAfter, hasTrigger, addMenuAnchor, selectedNodeId]
  );

  return (
    <JourneyCanvasContext.Provider value={canvasActions}>
      <div className="journey-canvas-shell relative h-full w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 shadow-inner">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          defaultEdgeOptions={defaultEdgeOptions}
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
          onPaneClick={() => {
            setAddMenuAnchor(null);
            onSelectNode?.(null);
          }}
          fitView
          fitViewOptions={{ padding: 0.35 }}
          minZoom={0.35}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#cbd5e1" />
          <Controls
            showInteractive={false}
            className="!shadow-md !border-slate-200 !rounded-xl overflow-hidden"
          />
          <MiniMap
            pannable
            zoomable
            className="!rounded-xl !border-slate-200 !shadow-md"
            maskColor="rgba(248, 250, 252, 0.75)"
            nodeColor={(n) => {
              if (n.type === 'TRIGGER') return '#064e3b';
              if (n.type === 'END') return '#475569';
              if (n.type === 'SEND_MESSAGE') return '#25d366';
              if (n.type === 'WAIT') return '#d97706';
              return '#0a5c46';
            }}
          />
        </ReactFlow>
      </div>

      {addMenuAnchor ? (
        <AddStepsMenu
          anchor={{ top: addMenuAnchor.top, left: addMenuAnchor.left }}
          hasTrigger={hasTrigger}
          onClose={() => setAddMenuAnchor(null)}
          onSelect={(type) => addNodeAfter(addMenuAnchor.nodeId, type)}
        />
      ) : null}
    </JourneyCanvasContext.Provider>
  );
}
