import { useCallback, useEffect, useRef, useState } from 'react';
import type { Node } from '@xyflow/react';
import { Check, Eye, Loader2, Rocket, Save } from 'lucide-react';
import {
  JourneyFlowCanvas,
  type JourneyAddStepApi,
} from '../reactflow/JourneyFlowCanvas';
import { NodeConfigPanel } from './NodeConfigPanel';
import { AddStepsMenu } from './AddStepsMenu';
import { JourneyNameDialog } from './JourneyNameDialog';
import { useJourneyBuilderStore } from '../store/journeyBuilderStore';
import type { JourneyGraph, JourneyNodeType, JourneyRecord } from '../types';
import {
  useJourneyGraph,
  usePublishJourney,
  useSaveJourneyGraph,
  useUpdateJourney,
} from '../hooks/useJourneys';
import { FLOW_CHANNEL_THEMES } from '../../flow-builder/channelTheme';
import {
  buildButtonDestination,
  type ButtonActionId,
  type PerformActionId,
} from '../../flow-builder/buttonActions';

const theme = FLOW_CHANNEL_THEMES.whatsapp;

type Props = {
  journey: JourneyRecord;
  onBack: () => void;
};

export function JourneyBuilder({ journey, onBack }: Props) {
  const { data: graphData, isLoading } = useJourneyGraph(journey.id);
  const saveGraph = useSaveJourneyGraph(journey.id);
  const updateJourney = useUpdateJourney(journey.id);
  const publish = usePublishJourney(journey.id);
  const isDirty = useJourneyBuilderStore((s) => s.isDirty);
  const setDirty = useJourneyBuilderStore((s) => s.setDirty);
  const setSaving = useJourneyBuilderStore((s) => s.setSaving);

  const [draftGraph, setDraftGraph] = useState<JourneyGraph | undefined>();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftName, setDraftName] = useState(journey.name);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'publish' | null>(null);
  const [addAfterNodeId, setAddAfterNodeId] = useState<string | null>(null);
  const [addMenuHasTrigger, setAddMenuHasTrigger] = useState(false);
  const [previewStripVisible, setPreviewStripVisible] = useState(true);
  const addStepApiRef = useRef<JourneyAddStepApi | null>(null);

  const graph = draftGraph ?? graphData;

  useEffect(() => {
    setDraftName(journey.name);
  }, [journey.id, journey.name]);

  const nameChanged = draftName.trim() !== journey.name;
  const hasValidName = draftName.trim().length > 0;
  const isPublished = journey.status === 'published';
  const isSaved = !isDirty && !nameChanged;

  const persistName = async (name: string) => {
    if (name !== journey.name) {
      await updateJourney.mutateAsync({ name });
    }
    setDraftName(name);
  };

  const runSave = async (name: string) => {
    if (!graph) return;
    setError(null);
    setSaving(true);
    try {
      await persistName(name);
      await saveGraph.mutateAsync(graph);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const runPublish = async (name: string) => {
    setError(null);
    try {
      await persistName(name);
      if (isDirty && graph) {
        await saveGraph.mutateAsync(graph);
        setDirty(false);
      }
      await publish.mutateAsync();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
    }
  };

  const requestNameThen = (action: 'save' | 'publish') => {
    if (!hasValidName) {
      setPendingAction(action);
      setNameDialogOpen(true);
      return;
    }
    if (action === 'save') void runSave(draftName.trim());
    else void runPublish(draftName.trim());
  };

  const handleNameDialogConfirm = async (name: string) => {
    setDraftName(name);
    setNameDialogOpen(false);
    const action = pendingAction;
    setPendingAction(null);
    if (action === 'save') await runSave(name);
    else if (action === 'publish') await runPublish(name);
  };

  const onGraphChange = useCallback((g: JourneyGraph) => {
    setDraftGraph(g);
  }, []);

  const onNodeUpdate = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      if (!graph) return;
      const next: JourneyGraph = {
        ...graph,
        nodes: graph.nodes.map((n) => (n.id === nodeId ? { ...n, data } : n)),
      };
      setDraftGraph(next);
      setDirty(true);
      if (selectedNode?.id === nodeId) {
        setSelectedNode({ ...selectedNode, data: { ...data, label: selectedNode.type } });
      }
    },
    [graph, selectedNode, setDirty]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (!graph) return;
      const next: JourneyGraph = {
        nodes: graph.nodes.filter((n) => n.id !== nodeId),
        edges: graph.edges.filter(
          (e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId
        ),
      };
      setDraftGraph(next);
      setSelectedNode(null);
      setDirty(true);
    },
    [graph, setDirty]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!selectedNode || addAfterNodeId) return;
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      handleDeleteNode(selectedNode.id);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedNode, handleDeleteNode, addAfterNodeId]);

  const closeAddSteps = useCallback(() => setAddAfterNodeId(null), []);

  /** Focuses an already-wired destination node (Edit Button panel's "Currently: …" banner). */
  const handleFocusNode = useCallback(
    (nodeId: string) => {
      const n = graph?.nodes.find((x) => x.id === nodeId);
      if (!n) return;
      setSelectedNode({
        id: n.id,
        type: n.type,
        data: { ...n.data, label: n.type },
        position: { x: n.positionX, y: n.positionY },
      } as Node);
    },
    [graph]
  );

  /** "When this button is pressed" — ensures a destination node + edge, then focuses it. */
  const handleButtonAction = useCallback(
    (
      sourceNodeId: string,
      buttonId: string,
      actionId: ButtonActionId | PerformActionId,
      buttonTitle: string
    ) => {
      const dest = buildButtonDestination(actionId, { channel: 'whatsapp', buttonTitle });
      if (!dest) return;
      const result = addStepApiRef.current?.addNodeAfterHandle(
        sourceNodeId,
        dest.nodeType as JourneyNodeType,
        buttonId,
        dest.data
      );
      if (result) {
        // ponytail: position isn't known synchronously here, {0,0} is fine — NodeConfigPanel
        // never reads a node's position, only id/type/data.
        setSelectedNode({ id: result.id, type: result.type, data: result.data, position: { x: 0, y: 0 } } as Node);
      }
    },
    []
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border-[0.5px] border-border-subtle bg-white px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer font-medium text-slate-500 transition-colors hover:text-dark-navy"
          >
            WhatsApp Automation
          </button>
          <span className="text-slate-300">/</span>
          <input
            type="text"
            value={draftName}
            onChange={(e) => {
              setDraftName(e.target.value);
              if (e.target.value.trim()) setError(null);
            }}
            placeholder="Journey name"
            className="max-w-[200px] truncate bg-transparent font-semibold text-dark-navy placeholder:text-slate-400 focus:outline-none"
          />
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-500">Edit</span>
          {isSaved && !saveGraph.isPending ? (
            <span className="ml-2 inline-flex items-center gap-1 text-[12px] font-medium text-emerald-600">
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              Saved
            </span>
          ) : (
            <span className="ml-2 inline-flex items-center gap-1 text-[12px] font-medium text-amber-600">
              {saveGraph.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              {saveGraph.isPending ? 'Saving…' : 'Unsaved'}
            </span>
          )}
          {isPublished ? (
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${theme.softChip}`}
            >
              Published
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => requestNameThen('save')}
            disabled={saveGraph.isPending || !graph || isSaved}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-[0.5px] border-border-subtle bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-surface-muted disabled:opacity-50"
          >
            {saveGraph.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
          <button
            type="button"
            onClick={() => setPreviewStripVisible((v) => !v)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-[0.5px] border-border-subtle bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-surface-muted"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          {/* Keep "Publish" — WA product language; IG uses "Set Live". Same button styling. */}
          <button
            type="button"
            onClick={() => requestNameThen('publish')}
            disabled={publish.isPending}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold disabled:opacity-50 ${theme.primaryBtn}`}
          >
            {publish.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            Publish
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border-[0.5px] border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <div className="grid h-full min-h-0 grid-cols-12 gap-3">
          <div
            className={`min-h-0 ${selectedNode ? 'col-span-8 lg:col-span-9' : 'col-span-12'}`}
          >
            {isLoading && !graph ? (
              <div className="flex h-full min-h-0 items-center justify-center rounded-xl border-[0.5px] border-border-subtle bg-surface text-sm text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
                Loading workflow…
              </div>
            ) : (
              <div className="h-full min-h-0">
                <JourneyFlowCanvas
                  graph={graph}
                  onGraphChange={onGraphChange}
                  onSelectNode={(node) => {
                    setAddAfterNodeId(null);
                    setSelectedNode(node);
                  }}
                  selectedNodeId={selectedNode?.id ?? null}
                  addStepApiRef={addStepApiRef}
                  showPreviewStrip={previewStripVisible}
                  onRequestAddStep={(nodeId, meta) => {
                    setAddMenuHasTrigger(meta.hasTrigger);
                    setAddAfterNodeId(nodeId);
                  }}
                />
              </div>
            )}
          </div>

          {selectedNode ? (
            <aside className="col-span-4 flex min-h-0 flex-col lg:col-span-3">
              <div className="min-h-0 flex-1">
                <NodeConfigPanel
                  node={selectedNode}
                  graph={graph ?? null}
                  onUpdate={onNodeUpdate}
                  onDelete={handleDeleteNode}
                  onButtonAction={handleButtonAction}
                  onFocusNode={handleFocusNode}
                />
              </div>
            </aside>
          ) : null}
        </div>

        <AddStepsMenu
          open={addAfterNodeId !== null}
          hasTrigger={addMenuHasTrigger}
          onClose={closeAddSteps}
          onSelect={(type) => {
            if (!addAfterNodeId) return;
            addStepApiRef.current?.addNodeAfter(addAfterNodeId, type);
            setAddAfterNodeId(null);
          }}
        />
      </div>

      <JourneyNameDialog
        open={nameDialogOpen}
        title="Name this journey"
        description="Add a journey name before saving or publishing."
        initialName={draftName}
        confirmLabel={pendingAction === 'publish' ? 'Save & publish' : 'Save journey'}
        loading={saveGraph.isPending || updateJourney.isPending || publish.isPending}
        onClose={() => {
          setNameDialogOpen(false);
          setPendingAction(null);
        }}
        onConfirm={handleNameDialogConfirm}
      />
    </div>
  );
}
