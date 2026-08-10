/**
 * Unified WhatsApp + Instagram automation list.
 * Create New → choose channel → name dialog → existing builder routes.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Instagram,
  Loader2,
  MessageCircle,
  Plus,
  Trash2,
  Workflow,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  pathForInstagramAutomation,
  pathForJourney,
  pathForJourneyGallery,
} from '../routes';
import { JourneyNameDialog } from '../modules/journey/components/JourneyNameDialog';
import { IgNameDialog } from '../modules/instagram-automation/components/IgNameDialog';
import {
  useCreateJourney,
  useDeleteJourney,
  useJourneys,
} from '../modules/journey/hooks/useJourneys';
import {
  useCreateIgJourney,
  useDeleteIgJourney,
  useIgJourneys,
} from '../modules/instagram-automation/hooks/useIgJourneys';
import { useJourneyBuilderStore } from '../modules/journey/store/journeyBuilderStore';
import { useIgBuilderStore } from '../modules/instagram-automation/store/igBuilderStore';
import type { JourneyRecord } from '../modules/journey/types';
import type { IgJourneyRecord } from '../modules/instagram-automation/types';
import { useWorkspaceAccess } from '../hooks/useWorkspaceAccess';
import { channelAllowedByPlan } from '../lib/planEntitlements';

type Channel = 'whatsapp' | 'instagram';

type UnifiedRow = {
  id: string;
  name: string;
  status: 'draft' | 'published';
  channel: Channel;
  triggerEvent?: string | null;
  nodes: number;
  runs: number;
  updatedAt: string;
};

function triggerLabel(channel: Channel, event?: string | null) {
  if (channel === 'instagram') {
    const events = (event ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const hasDm = events.includes('dm.received');
    const hasComment = events.includes('comment.received');
    if (hasDm && hasComment) return 'DM + Comment';
    if (hasComment) return 'Comment';
    if (hasDm) return 'DM';
    return 'Trigger';
  }
  if (event === 'contact.created') return 'Contact created';
  if (event === 'contact.tag_added') return 'Tag added';
  if (event === 'message.received') return 'Message';
  if (event === 'conversation.opened') return 'Conversation';
  if (event === 'manual') return 'Manual';
  return 'Trigger';
}

function ChannelChooserDialog({
  open,
  onClose,
  onPick,
  instagramAllowed,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (channel: Channel | 'whatsapp-gallery') => void;
  instagramAllowed: boolean;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-labelledby="automation-channel-title"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 id="automation-channel-title" className="text-sm font-black text-gray-900">
                  Create automation
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Which channel should this automation run on?
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 p-4">
              <button
                type="button"
                onClick={() => onPick('whatsapp')}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-black/5 bg-surface px-4 py-3 text-left transition-colors hover:border-channel-green/40 hover:bg-[#25d366]/08"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25d366]/15 text-[#128C7E]">
                  <MessageCircle className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-gray-950">WhatsApp</span>
                  <span className="block text-xs text-gray-500">
                    Triggers, delays, buttons, and journeys
                  </span>
                </span>
              </button>
              {instagramAllowed ? (
                <button
                  type="button"
                  onClick={() => onPick('instagram')}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-black/5 bg-surface px-4 py-3 text-left transition-colors hover:border-[#833AB4]/40 hover:bg-[#833AB4]/08"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#F58529]/20 via-[#DD2A7B]/20 to-[#8134AF]/20 text-[#833AB4]">
                    <Instagram className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-gray-950">Instagram</span>
                    <span className="block text-xs text-gray-500">DM and comment automations</span>
                  </span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onPick('whatsapp-gallery')}
                className="w-full cursor-pointer rounded-xl px-3 py-2 text-center text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                Or browse WhatsApp templates →
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function AutomationsView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: waJourneys = [], isLoading: waLoading } = useJourneys();
  const { data: igJourneys = [], isLoading: igLoading } = useIgJourneys();
  const createWa = useCreateJourney();
  const createIg = useCreateIgJourney();
  const deleteWa = useDeleteJourney();
  const deleteIg = useDeleteIgJourney();
  const setWaDirty = useJourneyBuilderStore((s) => s.setDirty);
  const setIgDirty = useIgBuilderStore((s) => s.setDirty);

  const [chooserOpen, setChooserOpen] = useState(false);
  const [waNameOpen, setWaNameOpen] = useState(false);
  const [igNameOpen, setIgNameOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<'all' | Channel>('all');
  const { planFeatures, planFeaturesReady } = useWorkspaceAccess();

  // Before subscription resolves, planFeatures is null (= Starter default). Don't hide
  // Instagram for Business workspaces during that window / after a slow fetch.
  const instagramAutomationAllowed =
    !planFeaturesReady || channelAllowedByPlan(planFeatures, 'instagram');

  const rows = useMemo(() => {
    const wa: UnifiedRow[] = (waJourneys as JourneyRecord[]).map((j) => ({
      id: j.id,
      name: j.name,
      status: j.status,
      channel: 'whatsapp' as const,
      triggerEvent: j.triggerEvent,
      nodes: j._count?.nodes ?? 0,
      runs: j._count?.executions ?? 0,
      updatedAt: j.updatedAt,
    }));
    const ig: UnifiedRow[] = (igJourneys as IgJourneyRecord[]).map((j) => ({
      id: j.id,
      name: j.name,
      status: j.status,
      channel: 'instagram' as const,
      triggerEvent: j.triggerEvent,
      nodes: j._count?.nodes ?? 0,
      runs: j._count?.executions ?? 0,
      updatedAt: j.updatedAt,
    }));
    return [...wa, ...ig].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [waJourneys, igJourneys]);

  const eligibleRows = instagramAutomationAllowed
    ? rows
    : rows.filter((r) => r.channel !== 'instagram');
  const visible =
    filter === 'all' ? eligibleRows : eligibleRows.filter((r) => r.channel === filter);
  const loading = waLoading || igLoading;

  const handleCreateWa = async (name: string) => {
    setCreating(true);
    try {
      const created = await createWa.mutateAsync(name);
      setWaDirty(false);
      setWaNameOpen(false);
      navigate(pathForJourney(created.id));
    } finally {
      setCreating(false);
    }
  };

  const handleCreateIg = async (name: string) => {
    setCreating(true);
    try {
      const created = await createIg.mutateAsync(name);
      setIgDirty(false);
      setIgNameOpen(false);
      navigate(pathForInstagramAutomation(created.id));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (row: UnifiedRow) => {
    const label = row.channel === 'whatsapp' ? 'journey' : 'automation';
    if (!window.confirm(`Delete this ${label}?`)) return;
    if (row.channel === 'whatsapp') {
      await deleteWa.mutateAsync(row.id);
      void queryClient.invalidateQueries({ queryKey: ['journeys'] });
    } else {
      await deleteIg.mutateAsync(row.id);
      void queryClient.invalidateQueries({ queryKey: ['instagram-journeys'] });
    }
  };

  const openRow = (row: UnifiedRow) => {
    if (row.channel === 'whatsapp') navigate(pathForJourney(row.id));
    else navigate(pathForInstagramAutomation(row.id));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-black text-gray-950">Automations</h2>
          <p className="text-xs text-gray-500">
            {instagramAutomationAllowed
              ? 'WhatsApp and Instagram workflows in one place.'
              : 'WhatsApp workflows in one place.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setChooserOpen(true)}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Create new
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'whatsapp', label: 'WhatsApp' },
            ...(instagramAutomationAllowed
              ? ([{ id: 'instagram', label: 'Instagram' }] as const)
              : []),
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === tab.id
                ? 'bg-primary text-white'
                : 'bg-surface text-slate-600 hover:bg-surface-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading automations…
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-surface p-8 text-center">
          <Workflow className="mx-auto mb-3 h-7 w-7 text-primary" aria-hidden />
          <p className="font-bold text-gray-900">No automations yet</p>
          <p className="mt-1 text-sm text-gray-500">
            {instagramAutomationAllowed
              ? 'Create a WhatsApp journey or Instagram automation to get started.'
              : 'Create a WhatsApp journey to get started.'}
          </p>
          <button
            type="button"
            onClick={() => setChooserOpen(true)}
            className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Create new
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((row) => {
            const published = row.status === 'published';
            const isWa = row.channel === 'whatsapp';
            return (
              <article
                key={`${row.channel}-${row.id}`}
                className="group flex items-stretch overflow-hidden rounded-xl border border-black/5 bg-surface transition-shadow hover:shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => openRow(row)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-3 py-2.5 text-left"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isWa ? 'bg-[#25d366]/15 text-[#128C7E]' : 'bg-[#833AB4]/12 text-[#833AB4]'
                    }`}
                    title={isWa ? 'WhatsApp' : 'Instagram'}
                  >
                    {isWa ? (
                      <MessageCircle className="h-4 w-4" aria-hidden />
                    ) : (
                      <Instagram className="h-4 w-4" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3
                        className={`truncate text-sm font-bold text-gray-950 ${
                          isWa ? 'group-hover:text-primary' : 'group-hover:text-[#833AB4]'
                        }`}
                      >
                        {row.name}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                          isWa
                            ? 'bg-[#25d366]/15 text-[#128C7E]'
                            : 'bg-[#833AB4]/12 text-[#833AB4]'
                        }`}
                      >
                        {isWa ? 'WA' : 'IG'}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                          published
                            ? 'bg-primary/10 text-primary'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                      {triggerLabel(row.channel, row.triggerEvent)}
                      <span className="mx-1 text-gray-300">·</span>
                      {row.nodes} steps
                      <span className="mx-1 text-gray-300">·</span>
                      {row.runs} runs
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(row)}
                  className="shrink-0 cursor-pointer border-l border-black/5 px-2.5 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Delete ${row.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </article>
            );
          })}
        </div>
      )}

      <ChannelChooserDialog
        open={chooserOpen}
        onClose={() => setChooserOpen(false)}
        instagramAllowed={instagramAutomationAllowed}
        onPick={(choice) => {
          setChooserOpen(false);
          if (choice === 'whatsapp') setWaNameOpen(true);
          else if (choice === 'instagram') setIgNameOpen(true);
          else navigate(pathForJourneyGallery());
        }}
      />

      <JourneyNameDialog
        open={waNameOpen}
        title="Name your WhatsApp journey"
        description="Choose a clear name before you start building the workflow."
        confirmLabel="Create journey"
        loading={createWa.isPending || creating}
        onClose={() => {
          if (createWa.isPending || creating) return;
          setWaNameOpen(false);
        }}
        onConfirm={(name) => void handleCreateWa(name)}
      />

      <IgNameDialog
        open={igNameOpen}
        title="Name your Instagram automation"
        description="Choose a clear name before you start building the workflow."
        confirmLabel="Create automation"
        loading={createIg.isPending || creating}
        onClose={() => {
          if (createIg.isPending || creating) return;
          setIgNameOpen(false);
        }}
        onConfirm={(name) => void handleCreateIg(name)}
      />
    </div>
  );
}
