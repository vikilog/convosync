import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  ArrowLeft,
  Filter,
  Instagram,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Target,
  Trash2,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react';
import { api } from '../../lib/api';
import { leadFunnelIdFromPath, pathForLeadFunnel, pathForTab } from '../../routes';
import { LeadDetailDrawer } from './LeadDetailDrawer';
import { FunnelInsightsBar } from './FunnelInsightsBar';
import {
  timeAgo,
  type Lead,
  type LeadFunnel,
  type LeadFunnelStage,
  type LeadSource,
} from './types';

function sourceBadge(source: LeadSource) {
  if (source === 'instagram') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-[#fce8f0] px-1.5 py-0.5 text-[10px] font-bold text-[#C13584]">
        <Instagram className="h-3 w-3" /> IG
      </span>
    );
  }
  if (source === 'whatsapp') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
        WA
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
      Manual
    </span>
  );
}

const LeadCard: React.FC<{
  lead: Lead;
  dragging?: boolean;
  showConvert?: boolean;
  convertBusy?: boolean;
  onOpen?: () => void;
  onConvert?: () => void;
}> = ({ lead, dragging, showConvert, convertBusy, onOpen, onConvert }) => {
  return (
    <div
      className={`w-full rounded-xl border border-black/5 bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md ${
        dragging ? 'shadow-lg ring-2 ring-primary/30 opacity-95' : ''
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="w-full cursor-grab text-left active:cursor-grabbing"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-bold text-gray-900">
            {lead.name?.trim() || 'Unknown'}
          </p>
          {sourceBadge(lead.source)}
        </div>

        <div className="mt-2 flex items-center gap-2 text-gray-400">
          <Phone className={`h-3.5 w-3.5 ${lead.phone ? 'text-gray-500' : 'opacity-30'}`} />
          <Mail className={`h-3.5 w-3.5 ${lead.email ? 'text-gray-500' : 'opacity-30'}`} />
        </div>

        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">
          {lead.requirement}
        </p>
      </button>

      <div className="mt-3 flex items-center justify-between gap-2">
        {lead.assignedRep ? (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            {lead.assignedRep.avatarUrl ? (
              <img
                src={lead.assignedRep.avatarUrl}
                alt=""
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100">
                <UserRound className="h-3 w-3 text-slate-500" />
              </span>
            )}
            <span className="truncate text-[11px] font-semibold text-gray-600">
              {lead.assignedRep.name}
            </span>
          </span>
        ) : (
          <span className="text-[11px] text-gray-400">Unassigned</span>
        )}
        <div className="flex shrink-0 items-center gap-1.5">
          {showConvert && (
            <button
              type="button"
              title="Add to contact"
              disabled={convertBusy}
              onClick={(e) => {
                e.stopPropagation();
                onConvert?.();
              }}
              className="cursor-pointer rounded-md border border-emerald-200 bg-emerald-50 p-1 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            >
              <UserPlus className={`h-3.5 w-3.5 ${convertBusy ? 'animate-pulse' : ''}`} />
            </button>
          )}
          {lead.contactId && (
            <span title="Contact linked" className="text-sky-600">
              <Users className="h-3.5 w-3.5" />
            </span>
          )}
          <span className="text-[11px] text-gray-400">{timeAgo(lead.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};

const DraggableLeadCard: React.FC<{
  lead: Lead;
  showConvert?: boolean;
  convertBusy?: boolean;
  onOpen: () => void;
  onConvert?: () => void;
}> = ({ lead, showConvert, convertBusy, onOpen, onConvert }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { stageId: lead.stageId },
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none">
      <LeadCard
        lead={lead}
        dragging={isDragging}
        showConvert={showConvert}
        convertBusy={convertBusy}
        onOpen={onOpen}
        onConvert={onConvert}
      />
    </div>
  );
};

const StageColumn: React.FC<{
  stageId: string;
  label: string;
  isFinal?: boolean;
  leads: Lead[];
  canDelete: boolean;
  convertingIds: Set<string>;
  onOpen: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onRename: (stageId: string, name: string) => Promise<void>;
  onDelete: (stageId: string) => void;
}> = ({
  stageId,
  label,
  isFinal,
  leads,
  canDelete,
  convertingIds,
  onOpen,
  onConvert,
  onRename,
  onDelete,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: stageId });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(label);
  }, [label, editing]);

  const commitRename = async () => {
    const next = draft.trim();
    if (!next || next === label) {
      setDraft(label);
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onRename(stageId, next);
      setEditing(false);
    } catch {
      setDraft(label);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-2xl bg-white ring-1 ring-slate-200/80 ${
        isOver ? 'ring-2 ring-primary/20' : ''
      }`}
    >
      <div className="flex items-center gap-1.5 border-b border-black/5 px-2.5 py-2">
        {editing ? (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => void commitRename()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void commitRename();
              }
              if (e.key === 'Escape') {
                setDraft(label);
                setEditing(false);
              }
            }}
            disabled={saving}
            autoFocus
            aria-label="Board name"
            className="min-w-0 flex-1 rounded-md border border-primary/30 bg-white px-2 py-1 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-primary/20"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="Rename board"
            className="min-w-0 flex-1 cursor-pointer truncate rounded-md px-1 py-0.5 text-left text-xs font-bold text-gray-800 transition-colors hover:bg-black/[0.03]"
          >
            {label}
            {isFinal ? (
              <span className="ml-1.5 rounded bg-emerald-50 px-1 py-0.5 text-[10px] font-bold text-emerald-700">
                Final
              </span>
            ) : null}
          </button>
        )}
        <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
          {leads.length}
        </span>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-700"
            aria-label={`Rename ${label}`}
            title="Rename"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        ) : null}
        {canDelete ? (
          <button
            type="button"
            onClick={() => onDelete(stageId)}
            className="shrink-0 cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete ${label}`}
            title="Delete board"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      <div className="flex min-h-[120px] flex-1 flex-col gap-2 overflow-y-auto p-2">
        {leads.map((lead) => (
          <DraggableLeadCard
            key={lead.id}
            lead={lead}
            showConvert={Boolean(isFinal) && !lead.contactId}
            convertBusy={convertingIds.has(lead.id)}
            onOpen={() => onOpen(lead)}
            onConvert={() => onConvert(lead)}
          />
        ))}
      </div>
    </div>
  );
};

function FunnelFormModal({
  title,
  initial,
  saving,
  onClose,
  onSave,
}: {
  title: string;
  initial?: Partial<LeadFunnel>;
  saving: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string; goal: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [goal, setGoal] = useState(initial?.goal ?? '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-5 shadow-xl">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        <p className="mt-0.5 text-xs text-gray-400">
          Funnels are never auto-created. Automation needs one of these.
        </p>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Instagram inbound"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What this funnel is for"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">Goal</span>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. 50 qualified demos / month"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-black/10 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !name.trim()}
            onClick={() =>
              onSave({
                name: name.trim(),
                description: description.trim(),
                goal: goal.trim(),
              })
            }
            className="cursor-pointer rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export const LeadsKanbanView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeFunnelId = leadFunnelIdFromPath(location.pathname);
  const [funnels, setFunnels] = useState<LeadFunnel[]>([]);
  const [funnelsLoading, setFunnelsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editFunnel, setEditFunnel] = useState<LeadFunnel | null>(null);
  const [funnelSaving, setFunnelSaving] = useState(false);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | LeadSource>('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftRequirement, setDraftRequirement] = useState('');
  const [saving, setSaving] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardIsFinal, setBoardIsFinal] = useState(false);
  const [addBoardOpen, setAddBoardOpen] = useState(false);
  const [boardSaving, setBoardSaving] = useState(false);
  // Set, not a single id — converting two different leads at once is fine;
  // a single shared value previously meant clicking convert on lead B while
  // lead A was still in flight silently re-enabled A's button (the id moved
  // to B), even though A's request hadn't finished.
  const [convertingIds, setConvertingIds] = useState<Set<string>>(new Set());
  const convertingRef = useRef<Set<string>>(new Set());
  const [insightsKey, setInsightsKey] = useState(0);
  // Keyed per lead id — a single shared timer previously meant editing
  // Lead B before Lead A's debounced save fired would clearTimeout and
  // silently drop Lead A's edit forever (never sent, no error, reverts on
  // refresh).
  const drawerPersistTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const dragGenerationRef = useRef<Record<string, number>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const activeFunnel = useMemo(
    () => funnels.find((f) => f.id === activeFunnelId) ?? null,
    [funnels, activeFunnelId]
  );

  const refreshFunnels = useCallback(async () => {
    setFunnelsLoading(true);
    setLoadError(null);
    try {
      const res = await api.getLeadFunnels();
      setFunnels(res.funnels as LeadFunnel[]);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load funnels');
    } finally {
      setFunnelsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshFunnels();
  }, [refreshFunnels]);

  useEffect(() => {
    setSelectedId(null);
    setSearch('');
    setSourceFilter('all');
  }, [activeFunnelId]);

  useEffect(() => {
    return () => {
      for (const key of Object.keys(drawerPersistTimers.current)) {
        clearTimeout(drawerPersistTimers.current[key]);
      }
    };
  }, []);

  const refreshLeads = useCallback(async () => {
    if (!activeFunnelId) {
      setLeads([]);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.getLeads({ funnelId: activeFunnelId });
      setLeads(res.leads as Lead[]);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [activeFunnelId]);

  useEffect(() => {
    void refreshLeads();
  }, [refreshLeads]);

  const boardStages: LeadFunnelStage[] = useMemo(
    () =>
      [...(activeFunnel?.stages ?? [])].sort((a, b) => a.position - b.position),
    [activeFunnel]
  );
  const hasFinalBoard = boardStages.some((s) => s.isFinal);

  const persistLead = useCallback(async (id: string, patch: Partial<Lead>) => {
    const body: {
      stageId?: string;
      name?: string | null;
      phone?: string | null;
      email?: string | null;
      requirement?: string;
      notes?: string;
    } = {};
    if (patch.stageId !== undefined && patch.stageId) body.stageId = patch.stageId;
    if (patch.name !== undefined) body.name = patch.name;
    if (patch.phone !== undefined) body.phone = patch.phone;
    if (patch.email !== undefined) body.email = patch.email;
    if (patch.requirement !== undefined) body.requirement = patch.requirement;
    if (patch.notes !== undefined) body.notes = patch.notes;
    if (Object.keys(body).length === 0) return;
    const res = await api.updateLead(id, body);
    setLeads((prev) => prev.map((l) => (l.id === id ? (res.lead as Lead) : l)));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (sourceFilter !== 'all' && lead.source !== sourceFilter) return false;
      if (!q) return true;
      const hay = [
        lead.name ?? '',
        lead.phone ?? '',
        lead.email ?? '',
        lead.requirement,
        lead.origin?.username ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [leads, search, sourceFilter]);

  const byStage = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of boardStages) map[s.id] = [];
    const fallbackId = boardStages[0]?.id;
    for (const lead of filtered) {
      const key =
        lead.stageId && map[lead.stageId] ? lead.stageId : fallbackId;
      if (key) map[key].push(lead);
    }
    return map;
  }, [filtered, boardStages]);

  const activeLead = activeId ? leads.find((l) => l.id === activeId) ?? null : null;
  const selectedLead = selectedId ? leads.find((l) => l.id === selectedId) ?? null : null;

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const leadId = String(active.id);
    const overId = String(over.id);
    const droppedOnLead = leads.find((l) => l.id === overId);
    const nextStage =
      boardStages.find((s) => s.id === overId) ??
      (droppedOnLead?.stageId
        ? boardStages.find((s) => s.id === droppedOnLead.stageId)
        : undefined);
    if (!nextStage) return;
    const current = leads.find((l) => l.id === leadId);
    if (!current || current.stageId === nextStage.id) return;

    const prevStageId = current.stageId;
    const prevStageName = current.stage;
    // Per-lead generation so an out-of-order response from an earlier drag
    // of THIS SAME lead can't clobber a newer, already-applied move — either
    // by overwriting it with stale success data, or by wrongly rolling it
    // back to an even older stage on a late failure.
    const generation = (dragGenerationRef.current[leadId] ?? 0) + 1;
    dragGenerationRef.current[leadId] = generation;

    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              stageId: nextStage.id,
              stage: nextStage.name,
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );
    try {
      const res = await api.updateLead(leadId, { stageId: nextStage.id });
      if (dragGenerationRef.current[leadId] !== generation) return;
      setLeads((prev) => prev.map((l) => (l.id === leadId ? (res.lead as Lead) : l)));
      setInsightsKey((k) => k + 1);
    } catch (err) {
      if (dragGenerationRef.current[leadId] !== generation) return;
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? { ...l, stageId: prevStageId, stage: prevStageName }
            : l
        )
      );
      setLoadError(err instanceof Error ? err.message : 'Failed to move lead');
    }
  };

  const addBoard = async () => {
    if (!activeFunnelId || !boardName.trim()) return;
    setBoardSaving(true);
    try {
      const res = await api.createLeadFunnelStage(activeFunnelId, {
        name: boardName.trim(),
        isFinal: hasFinalBoard ? false : boardIsFinal,
      });
      await refreshFunnels();
      setBoardName('');
      setBoardIsFinal(false);
      setAddBoardOpen(false);
      void res;
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to add board');
    } finally {
      setBoardSaving(false);
    }
  };

  const renameBoard = async (stageId: string, name: string) => {
    if (!activeFunnelId) return;
    const res = await api.updateLeadFunnelStage(activeFunnelId, stageId, { name });
    const updated = res.stage;
    setFunnels((prev) =>
      prev.map((f) =>
        f.id !== activeFunnelId
          ? f
          : {
              ...f,
              stages: (f.stages ?? []).map((s) =>
                s.id === stageId
                  ? {
                      ...s,
                      name: updated.name,
                      isFinal: updated.isFinal,
                      position: updated.position,
                    }
                  : s
              ),
            }
      )
    );
    setLeads((prev) =>
      prev.map((l) => (l.stageId === stageId ? { ...l, stage: updated.name } : l))
    );
    setInsightsKey((k) => k + 1);
  };

  const deleteBoard = async (stageId: string) => {
    if (!activeFunnelId) return;
    const stage = boardStages.find((s) => s.id === stageId);
    const count = (byStage[stageId] ?? []).length;
    const confirmed = window.confirm(
      count > 0
        ? `Delete “${stage?.name ?? 'board'}”? ${count} lead${count === 1 ? '' : 's'} will move to another board.`
        : `Delete “${stage?.name ?? 'board'}”?`
    );
    if (!confirmed) return;
    setLoadError(null);
    try {
      await api.deleteLeadFunnelStage(activeFunnelId, stageId);
      await Promise.all([refreshFunnels(), refreshLeads()]);
      setInsightsKey((k) => k + 1);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to delete board');
    }
  };

  const convertLead = async (lead: Lead) => {
    // The ref is checked synchronously (state isn't visible until the next
    // render) so a fast double-click can't fire two overlapping conversion
    // requests for the same lead.
    if (convertingRef.current.has(lead.id)) return;
    const confirmed = window.confirm(
      `Convert ${lead.name || 'this lead'} to a contact? This can't be undone from here.`
    );
    if (!confirmed) return;
    convertingRef.current.add(lead.id);
    setConvertingIds((prev) => new Set(prev).add(lead.id));
    setLoadError(null);
    try {
      const res = await api.convertLeadToContact(lead.id);
      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id ? ({ ...l, ...(res.lead as Lead), contactId: res.contactId } as Lead) : l
        )
      );
      setInsightsKey((k) => k + 1);
    } catch (err) {
      let message = err instanceof Error ? err.message : 'Convert failed';
      try {
        const parsed = JSON.parse(message) as { error?: string };
        if (parsed.error) message = parsed.error;
      } catch {
        /* keep */
      }
      setLoadError(message);
    } finally {
      convertingRef.current.delete(lead.id);
      setConvertingIds((prev) => {
        const next = new Set(prev);
        next.delete(lead.id);
        return next;
      });
    }
  };

  const addLead = async () => {
    if (!activeFunnelId) return;
    const name = draftName.trim();
    const requirement = draftRequirement.trim() || 'Manual lead';
    setSaving(true);
    try {
      const res = await api.createLead({
        funnelId: activeFunnelId,
        name: name || undefined,
        requirement,
        source: 'manual',
      });
      const lead = res.lead as Lead;
      if (lead) {
        setLeads((prev) => [lead, ...prev]);
        setSelectedId(lead.id);
      }
      setDraftName('');
      setDraftRequirement('');
      setAddOpen(false);
      void refreshFunnels();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to create lead');
    } finally {
      setSaving(false);
    }
  };

  const saveFunnel = async (data: { name: string; description: string; goal: string }) => {
    setFunnelSaving(true);
    setLoadError(null);
    try {
      if (editFunnel) {
        const res = await api.updateLeadFunnel(editFunnel.id, data);
        setFunnels((prev) =>
          prev.map((f) => (f.id === editFunnel.id ? (res.funnel as LeadFunnel) : f))
        );
        setEditFunnel(null);
      } else {
        const res = await api.createLeadFunnel(data);
        setFunnels((prev) => [res.funnel as LeadFunnel, ...prev]);
        setCreateOpen(false);
        navigate(pathForLeadFunnel(res.funnel.id));
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to save funnel');
    } finally {
      setFunnelSaving(false);
    }
  };

  // —— Funnel list (no board until a funnel is opened) ——
  if (!activeFunnelId) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-white p-4 md:p-6">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl bg-white ring-1 ring-slate-200/80 p-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-black text-gray-900">
              <Filter className="h-5 w-5 text-primary" />
              Lead funnels
            </h2>
            <p className="mt-0.5 text-xs font-medium text-gray-400">
              Create a funnel first — then open its Kanban board. No auto-created funnels.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white shadow-sm shadow-primary/15 hover:bg-primary-hover"
          >
            <Plus className="h-3.5 w-3.5" /> Create funnel
          </button>
        </div>

        {loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {loadError}{' '}
            <button type="button" className="underline" onClick={() => void refreshFunnels()}>
              Retry
            </button>
          </div>
        )}

        {funnelsLoading ? (
          <p className="text-sm font-medium text-gray-400">Loading funnels…</p>
        ) : funnels.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 bg-white px-6 py-16 text-center">
            <Users className="mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-bold text-[#0F172A]">No funnels yet</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Create a funnel with a name, description, and goal. Social Listening automation stays
              off until you pick one in settings.
            </p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-4 inline-flex min-h-10 cursor-pointer items-center rounded-xl bg-[#0F172A] px-4 text-sm font-bold text-white hover:bg-slate-800"
            >
              Create funnel
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {funnels.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => navigate(pathForLeadFunnel(f.id))}
                className="cursor-pointer rounded-2xl bg-white ring-1 ring-slate-200/80 p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:border-primary/20 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-[#0F172A]">{f.name}</p>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-slate-500">
                    {f.leadCount} leads
                  </span>
                </div>
                {f.description ? (
                  <p className="mt-2 line-clamp-2 text-xs text-slate-500">{f.description}</p>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">No description</p>
                )}
                {f.goal ? (
                  <p className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <Target className="h-3 w-3" />
                    {f.goal}
                  </p>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <span className="text-[11px] font-bold text-primary">Open board →</span>
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-auto text-[11px] font-semibold text-slate-400 hover:text-slate-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditFunnel(f);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation();
                        setEditFunnel(f);
                      }
                    }}
                  >
                    Edit
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {(createOpen || editFunnel) && (
          <FunnelFormModal
            title={editFunnel ? 'Edit funnel' : 'Create funnel'}
            initial={editFunnel ?? undefined}
            saving={funnelSaving}
            onClose={() => {
              setCreateOpen(false);
              setEditFunnel(null);
            }}
            onSave={(data) => void saveFunnel(data)}
          />
        )}
      </div>
    );
  }

  // —— Kanban inside selected funnel ——
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden bg-white p-4 md:p-6 selection:bg-primary/15">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl bg-white ring-1 ring-slate-200/80 p-4">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => {
              setSelectedId(null);
              navigate(pathForTab('leads'));
              void refreshFunnels();
            }}
            className="mb-1 inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-slate-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All funnels
          </button>
          <h2 className="flex items-center gap-2 text-base font-black text-gray-900">
            <Users className="h-5 w-5 text-primary" />
            {activeFunnel?.name ?? 'Funnel'}
          </h2>
          <p className="mt-0.5 truncate text-xs font-medium text-gray-400">
            {activeFunnel?.goal || activeFunnel?.description || 'Kanban board'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-44 sm:w-56">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-meta font-semibold outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as 'all' | LeadSource)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-meta font-semibold text-gray-700 outline-none"
          >
            <option value="all">All sources</option>
            <option value="instagram">Instagram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="manual">Manual</option>
          </select>
          <button
            type="button"
            onClick={() => setAddBoardOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold text-gray-700 hover:bg-surface-muted"
          >
            <Plus className="h-3.5 w-3.5" /> Add board
          </button>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white shadow-sm shadow-primary/15 hover:bg-primary-hover"
          >
            <Plus className="h-3.5 w-3.5" /> Add Lead
          </button>
        </div>
      </div>

      {loadError && (
        <div className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {loadError}{' '}
          <button type="button" className="underline" onClick={() => void refreshLeads()}>
            Retry
          </button>
        </div>
      )}

      {activeFunnelId && (
        <FunnelInsightsBar funnelId={activeFunnelId} refreshKey={insightsKey} />
      )}

      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
        {loading ? (
          <p className="px-2 py-10 text-sm font-medium text-gray-400">Loading leads…</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragEnd={(e) => void onDragEnd(e)}
            onDragCancel={() => setActiveId(null)}
          >
            <div className="flex h-full min-h-[420px] min-w-max gap-3">
              {boardStages.map((stage) => (
                <React.Fragment key={stage.id}>
                  {stage.isFinal ? (
                    <button
                      type="button"
                      onClick={() => setAddBoardOpen(true)}
                      className="flex w-56 shrink-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 bg-white/50 text-sm font-bold text-slate-500 hover:border-primary/30 hover:text-primary"
                    >
                      <Plus className="h-5 w-5" />
                      Add board
                    </button>
                  ) : null}
                  <StageColumn
                    stageId={stage.id}
                    label={stage.name}
                    isFinal={stage.isFinal}
                    leads={byStage[stage.id] ?? []}
                    canDelete={boardStages.length > 1}
                    convertingIds={convertingIds}
                    onOpen={(lead) => setSelectedId(lead.id)}
                    onConvert={(lead) => void convertLead(lead)}
                    onRename={renameBoard}
                    onDelete={(id) => void deleteBoard(id)}
                  />
                </React.Fragment>
              ))}
              {!hasFinalBoard ? (
                <button
                  type="button"
                  onClick={() => setAddBoardOpen(true)}
                  className="flex w-56 shrink-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 bg-white/50 text-sm font-bold text-slate-500 hover:border-primary/30 hover:text-primary"
                >
                  <Plus className="h-5 w-5" />
                  Add board
                </button>
              ) : null}
            </div>
            <DragOverlay dropAnimation={null}>
              {activeLead ? <LeadCard lead={activeLead} dragging /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <LeadDetailDrawer
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedId(null)}
        stages={boardStages}
        onChange={(next) => {
          const prev = leads.find((l) => l.id === next.id);
          setLeads((list) => list.map((l) => (l.id === next.id ? next : l)));
          if (!prev) return;
          const stageChanged = next.stageId !== prev.stageId;
          const patch: Partial<Lead> = {};
          if (stageChanged && next.stageId) {
            patch.stageId = next.stageId;
            patch.stage = next.stage;
          }
          if (next.name !== prev.name) patch.name = next.name;
          if (next.phone !== prev.phone) patch.phone = next.phone;
          if (next.email !== prev.email) patch.email = next.email;
          if (next.notes !== prev.notes) patch.notes = next.notes;
          if (next.requirement !== prev.requirement) patch.requirement = next.requirement;
          if (Object.keys(patch).length === 0) return;
          const existingTimer = drawerPersistTimers.current[next.id];
          if (existingTimer) clearTimeout(existingTimer);
          const delay = stageChanged ? 0 : 450;
          drawerPersistTimers.current[next.id] = setTimeout(() => {
            delete drawerPersistTimers.current[next.id];
            void persistLead(next.id, patch);
          }, delay);
        }}
      />

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">Add lead</h3>
            <p className="mt-0.5 text-xs text-gray-400">
              Creates a card in New for {activeFunnel?.name}.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-gray-600">Name</span>
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Optional"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-600">Requirement</span>
                <input
                  value={draftRequirement}
                  onChange={(e) => setDraftRequirement(e.target.value)}
                  placeholder="What are they looking for?"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="cursor-pointer rounded-xl border border-black/10 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void addLead()}
                className="cursor-pointer rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {addBoardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-black/5 bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">Add board</h3>
            <p className="mt-0.5 text-xs text-gray-400">
              New column on this funnel’s Kanban. Default board is New.
            </p>
            <label className="mt-4 block">
              <span className="text-xs font-semibold text-gray-600">Board name</span>
              <input
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="e.g. Won / Closed"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            </label>
            {!hasFinalBoard ? (
              <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl bg-surface-muted px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={boardIsFinal}
                  onChange={(e) => setBoardIsFinal(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                />
                <span>
                  <span className="block text-xs font-bold text-gray-800">Final step</span>
                  <span className="block text-[11px] text-gray-500">
                    Leads on this board can convert to Contacts
                  </span>
                </span>
              </label>
            ) : (
              <p className="mt-3 text-[11px] text-gray-500">
                New board is inserted before the Final board.
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAddBoardOpen(false);
                  setBoardName('');
                  setBoardIsFinal(false);
                }}
                className="cursor-pointer rounded-xl border border-black/10 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={boardSaving || !boardName.trim()}
                onClick={() => void addBoard()}
                className="cursor-pointer rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {boardSaving ? 'Adding…' : 'Add board'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
