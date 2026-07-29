import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bot, ExternalLink, Sparkles } from 'lucide-react';
import { AISuggestionCard } from './AISuggestionCard';
import { ConfiguredSummary } from './ConfiguredSummary';
import { PostConfigForm } from './PostConfigForm';
import {
  mockSuggestionsForPost,
  type PostConfigValues,
  type ScanUiState,
} from './mockPostConfig';

const EMPTY_CONFIG: PostConfigValues = {
  funnelId: null,
  skillId: null,
  tone: null,
};

type SavedMap = Record<string, PostConfigValues>;

export function PostConfigurationPanel({
  postId,
  postCaption,
  onOpenPost,
  /** Dev/demo override for AI card state. Default cycles scanning → ready. */
  mockScanState,
}: {
  postId: string;
  postCaption?: string | null;
  onOpenPost?: () => void;
  mockScanState?: ScanUiState;
}) {
  const suggestions = useMemo(() => mockSuggestionsForPost(postId), [postId]);

  const [savedByPost, setSavedByPost] = useState<SavedMap>({});
  const [editing, setEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [values, setValues] = useState<PostConfigValues>(EMPTY_CONFIG);
  const [scanState, setScanState] = useState<ScanUiState>(mockScanState ?? 'scanning');
  const [demoState, setDemoState] = useState<ScanUiState | 'auto'>(
    mockScanState ? mockScanState : 'auto'
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const saved = savedByPost[postId] ?? null;
  const isConfigured = Boolean(saved?.funnelId);
  const showSummary = isConfigured && !editing;

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Reset per-post UI when selection changes
  useEffect(() => {
    const existing = savedByPost[postId];
    setValues(existing ?? EMPTY_CONFIG);
    setEditing(false);
    setShowForm(false);
    if (demoState === 'auto') {
      setScanState('scanning');
      const t = window.setTimeout(() => setScanState('ready'), 1200);
      return () => window.clearTimeout(t);
    }
    setScanState(demoState);
    return undefined;
    // ponytail: intentionally omit savedByPost — remount via key=postId picks up saves
  }, [postId, demoState]);

  useEffect(() => {
    if (mockScanState) {
      setDemoState(mockScanState);
      setScanState(mockScanState);
    }
  }, [mockScanState]);

  const revealForm = (prefill: boolean) => {
    if (prefill) {
      setValues({
        funnelId: suggestions.funnel.id,
        skillId: suggestions.skill.id,
        tone: suggestions.tone.value,
      });
    } else if (!saved) {
      setValues(EMPTY_CONFIG);
    }
    setShowForm(true);
    setEditing(true);
  };

  const onSave = () => {
    if (!values.funnelId) return;
    setSaving(true);
    window.setTimeout(() => {
      setSavedByPost((prev) => ({ ...prev, [postId]: values }));
      setSaving(false);
      setEditing(false);
      setShowForm(false);
      setToast('Configuration saved');
    }, 450);
  };

  const formVisible =
    scanState === 'failed' || showForm || (editing && isConfigured);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-black/5 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-black/5 px-3.5 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            <Bot className="h-3.5 w-3.5" />
            This post
          </p>
          <h2 className="text-sm font-black text-gray-950">Agent &amp; funnel</h2>
          {postCaption && (
            <p className="mt-0.5 line-clamp-2 text-[11px] font-medium text-gray-400">
              {postCaption}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {onOpenPost && (
            <button
              type="button"
              onClick={onOpenPost}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-black/5 px-2 py-1 text-[10px] font-bold text-gray-500 hover:bg-surface-muted hover:text-gray-800"
            >
              Comments
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
          {/* Mock state toggle — remove when real scan is wired */}
          <label className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
            <Sparkles className="h-3 w-3" />
            <select
              value={demoState}
              onChange={(e) => setDemoState(e.target.value as ScanUiState | 'auto')}
              className="cursor-pointer rounded-md border border-black/10 bg-white px-1.5 py-0.5 text-[10px] font-bold text-gray-600 outline-none"
              title="Mock AI scan state"
            >
              <option value="auto">Auto scan</option>
              <option value="scanning">Scanning</option>
              <option value="ready">Suggestions</option>
              <option value="failed">Failed</option>
            </select>
          </label>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3.5">
        <AnimatePresence mode="wait">
          {showSummary ? (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <ConfiguredSummary
                values={saved!}
                onEdit={() => {
                  setValues(saved!);
                  setEditing(true);
                  setShowForm(true);
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`ai-${scanState}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <AISuggestionCard
                state={scanState}
                suggestions={suggestions}
                onUseAll={() => revealForm(true)}
                onConfigureManually={() => revealForm(false)}
                onApplyFunnel={() => {
                  setValues((v) => ({ ...v, funnelId: suggestions.funnel.id }));
                  setShowForm(true);
                  setEditing(true);
                }}
                onApplySkill={() => {
                  setValues((v) => ({ ...v, skillId: suggestions.skill.id }));
                  setShowForm(true);
                  setEditing(true);
                }}
                onApplyTone={() => {
                  setValues((v) => ({ ...v, tone: suggestions.tone.value }));
                  setShowForm(true);
                  setEditing(true);
                }}
                onRetry={() => {
                  if (demoState === 'auto' || demoState === 'failed') {
                    setScanState('scanning');
                    window.setTimeout(() => setScanState('ready'), 1000);
                    if (demoState === 'failed') setDemoState('auto');
                  } else {
                    setScanState('scanning');
                    window.setTimeout(() => setScanState(demoState === 'scanning' ? 'ready' : demoState), 800);
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {formVisible && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.22 }}
            >
              <PostConfigForm
                values={values}
                onChange={setValues}
                onSave={onSave}
                saving={saving}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {toast && (
        <div className="pointer-events-none absolute right-3 top-14 z-10 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

export function PostConfigEmptyState() {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 bg-surface px-6 py-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-black text-gray-950">Configure agent &amp; funnel</h3>
      <p className="mt-1.5 max-w-[220px] text-xs leading-relaxed text-gray-500">
        Open a post to review AI suggestions and set funnel, skill, and reply tone.
      </p>
    </div>
  );
}
