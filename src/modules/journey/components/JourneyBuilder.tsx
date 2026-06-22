import { useCallback, useEffect, useState } from 'react';
import type { Node } from '@xyflow/react';
import {
  ArrowLeft,
  Circle,
  Loader2,
  MousePointerClick,
  Rocket,
  Save,
  Workflow,
} from 'lucide-react';
import { JourneyFlowCanvas } from '../reactflow/JourneyFlowCanvas';
import { NodeConfigPanel } from './NodeConfigPanel';
import { JourneyNameDialog } from './JourneyNameDialog';
import { useJourneyBuilderStore } from '../store/journeyBuilderStore';
import type { JourneyGraph, JourneyRecord } from '../types';
import {
  useJourneyGraph,
  usePublishJourney,
  useSaveJourneyGraph,
  useUpdateJourney,
} from '../hooks/useJourneys';

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

  const graph = draftGraph ?? graphData;

  useEffect(() => {
    setDraftName(journey.name);
  }, [journey.id, journey.name]);

  const nameChanged = draftName.trim() !== journey.name;
  const hasValidName = draftName.trim().length > 0;
  const isPublished = journey.status === 'published';
  const nodeCount = graph?.nodes.length ?? 0;

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

  const handleSave = () => requestNameThen('save');
  const handlePublish = () => requestNameThen('publish');

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
      if (!selectedNode) return;
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
  }, [selectedNode, handleDeleteNode]);

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[580px] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
            aria-label="Back to journeys"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Workflow className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <input
              type="text"
              value={draftName}
              onChange={(e) => {
                setDraftName(e.target.value);
                if (e.target.value.trim()) setError(null);
              }}
              placeholder="Journey name"
              className="block w-full max-w-sm truncate bg-transparent text-lg font-bold text-slate-900 placeholder:text-slate-400 border-b border-transparent transition-colors hover:border-slate-200 focus:border-primary focus:outline-none"
            />
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  isPublished
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {journey.status}
              </span>
              <span className="text-xs text-slate-500">{nodeCount} steps</span>
              {(isDirty || nameChanged) && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                  <Circle className="h-1.5 w-1.5 fill-current" />
                  Unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saveGraph.isPending || !graph}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
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
            onClick={handlePublish}
            disabled={publish.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50 cursor-pointer"
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
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-12 gap-3">
        <div className="col-span-8 min-h-0 lg:col-span-9">
          {isLoading && !graph ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
              Loading workflow…
            </div>
          ) : (
            <JourneyFlowCanvas
              graph={graph}
              onGraphChange={onGraphChange}
              onSelectNode={setSelectedNode}
              selectedNodeId={selectedNode?.id ?? null}
            />
          )}
        </div>

        <aside className="col-span-4 flex min-h-0 flex-col lg:col-span-3">
          <NodeConfigPanel
            node={selectedNode}
            onUpdate={onNodeUpdate}
            onDelete={handleDeleteNode}
          />
          <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-3">
            <div className="flex items-start gap-2.5">
              <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-slate-500">
                Click <span className="font-semibold text-slate-700">+</span> on any node to add
                the next step. Select a node to configure it. Press Delete to remove.
              </p>
            </div>
          </div>
        </aside>
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
