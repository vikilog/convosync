import { useEffect, useMemo, useState } from 'react';
import { MousePointerClick, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Node } from '@xyflow/react';
import {
  TRIGGER_EVENTS,
  CONTACT_FIELDS,
  ASSIGNEE_TYPES,
  NODE_LABELS,
  type JourneyGraph,
  type JourneyNodeType,
} from '../types';
import { getStepVisual } from './stepIcons';
import { SendMessageConfig } from './SendMessageConfig';
import { WebhookConfig } from './WebhookConfig';
import { ConditionGroupEditor } from '../../flow-builder/condition/ConditionGroupEditor';
import { useJourneys } from '../hooks/useJourneys';
import { api } from '../../../lib/api';
import { TagChipInput } from '../../../components/tags/TagChipInput';
import { EditButtonPanel, type ButtonDestinationInfo } from '../../flow-builder/EditButtonPanel';
import { summarizeDestinationNode } from '../../flow-builder/buttonActions';
import { FLOW_CHANNEL_THEMES } from '../../flow-builder/channelTheme';
import type { ButtonActionId, PerformActionId } from '../../flow-builder/buttonActions';

const theme = FLOW_CHANNEL_THEMES.whatsapp;

type FunnelOption = {
  id: string;
  name: string;
  stages: Array<{ id: string; name: string; position: number }>;
};

type Props = {
  node: Node | null;
  graph?: JourneyGraph | null;
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
  onDelete?: (nodeId: string) => void;
  /** Ensures a destination node for this button's action + wires its edge; caller focuses it. */
  onButtonAction?: (
    nodeId: string,
    buttonId: string,
    actionId: ButtonActionId | PerformActionId,
    buttonTitle: string
  ) => void;
  /** Selects an already-wired destination node (Edit Button panel's "Currently: …" banner). */
  onFocusNode?: (nodeId: string) => void;
};

type ButtonRow = { id: string; title: string };
type PathRow = { id: string; label: string; weight: number };

const WA_BUTTONS_MAX = 3;
const WA_BUTTON_TITLE_MAX = 20;

function resolveButtonDestination(
  graph: JourneyGraph | null | undefined,
  nodeId: string,
  buttonId: string
): ButtonDestinationInfo | null {
  const edge = graph?.edges.find((e) => e.sourceNodeId === nodeId && e.conditionValue === buttonId);
  if (!edge) return null;
  const target = graph?.nodes.find((n) => n.id === edge.targetNodeId);
  if (!target) return null;
  return {
    id: target.id,
    type: target.type,
    label: NODE_LABELS[target.type] ?? target.type,
    summary: summarizeDestinationNode(target.type, target.data ?? {}),
  };
}
const RANDOMIZER_PATHS_MAX = 6;
const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
] as const;

type BusinessHours = {
  enabled: boolean;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
};

function normalizeBusinessHours(raw: unknown): BusinessHours {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    enabled: Boolean(o.enabled),
    startTime: typeof o.startTime === 'string' && o.startTime ? o.startTime : '08:00',
    endTime: typeof o.endTime === 'string' && o.endTime ? o.endTime : '22:00',
    daysOfWeek: Array.isArray(o.daysOfWeek)
      ? o.daysOfWeek.map(Number).filter((d) => d >= 0 && d <= 6)
      : [],
  };
}

function normalizeButtons(raw: unknown): ButtonRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((b) => b && typeof b === 'object')
    .map((b, i) => ({
      id: String((b as ButtonRow).id || `btn_${i}`),
      title: String((b as ButtonRow).title ?? ''),
    }));
}

function normalizePaths(raw: unknown): PathRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p) => p && typeof p === 'object')
    .map((p, i) => ({
      id: String((p as PathRow).id || `p_${i}`),
      label: String((p as PathRow).label ?? ''),
      weight: Number((p as PathRow).weight) || 0,
    }));
}

export function NodeConfigPanel({ node, graph = null, onUpdate, onDelete, onButtonAction, onFocusNode }: Props) {
  const [local, setLocal] = useState<Record<string, unknown>>({});
  const [funnels, setFunnels] = useState<FunnelOption[]>([]);
  const [editingButtonId, setEditingButtonId] = useState<string | null>(null);
  const { data: journeys = [] } = useJourneys();

  const publishedJourneys = useMemo(
    () => journeys.filter((j) => j.status === 'published'),
    [journeys]
  );

  useEffect(() => {
    if (node) {
      setLocal({ ...(node.data as Record<string, unknown>) });
    }
    setEditingButtonId(null);
  }, [node?.id, node?.data]);

  useEffect(() => {
    if (node?.type !== 'ADD_TO_FUNNEL') return;
    let cancelled = false;
    api
      .getLeadFunnels()
      .then((res) => {
        if (!cancelled) setFunnels(res.funnels ?? []);
      })
      .catch(() => {
        if (!cancelled) setFunnels([]);
      });
    return () => {
      cancelled = true;
    };
  }, [node?.type]);

  if (!node) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border-[0.5px] border-border-subtle bg-white p-6 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-400">
          <MousePointerClick className="h-5 w-5" />
        </div>
        <h3 className="text-[14px] font-bold text-dark-navy">No step selected</h3>
        <p className="mt-1.5 max-w-[200px] text-[12px] leading-relaxed text-slate-500">
          Click a node on the canvas to edit its settings here.
        </p>
      </div>
    );
  }

  const type = node.type as JourneyNodeType;
  const visual = getStepVisual(type);
  const Icon = visual.icon;

  const patch = (key: string, value: unknown) => {
    const next = { ...local, [key]: value };
    setLocal(next);
    onUpdate(node.id, next);
  };

  const patchMany = (updates: Record<string, unknown>) => {
    const next = { ...local, ...updates };
    setLocal(next);
    onUpdate(node.id, next);
  };

  const buttons = normalizeButtons(local.buttons);
  const setButtons = (next: ButtonRow[]) => {
    patch('buttons', next.slice(0, WA_BUTTONS_MAX));
  };

  if (type === 'BUTTONS' && editingButtonId) {
    const editingButton = buttons.find((b) => b.id === editingButtonId);
    if (editingButton) {
      const destination = resolveButtonDestination(graph, node.id, editingButton.id);
      return (
        <EditButtonPanel
          theme={theme}
          channel="whatsapp"
          button={editingButton}
          titleMaxLen={WA_BUTTON_TITLE_MAX}
          destination={destination}
          onTitleChange={(title) =>
            setButtons(buttons.map((b) => (b.id === editingButton.id ? { ...b, title } : b)))
          }
          onChooseAction={(actionId) =>
            onButtonAction?.(node.id, editingButton.id, actionId, editingButton.title)
          }
          onFocusDestination={() => {
            if (destination) onFocusNode?.(destination.id);
            setEditingButtonId(null);
          }}
          onDelete={() => {
            setButtons(buttons.filter((b) => b.id !== editingButton.id));
            setEditingButtonId(null);
          }}
          onClose={() => setEditingButtonId(null)}
        />
      );
    }
  }

  const paths = normalizePaths(local.paths);
  const setPaths = (next: PathRow[]) => {
    patch('paths', next.slice(0, RANDOMIZER_PATHS_MAX));
  };
  const pathWeightTotal = paths.reduce((sum, p) => sum + (Number(p.weight) || 0), 0);
  const businessHours = normalizeBusinessHours(local.businessHours);
  const patchBusinessHours = (updates: Partial<BusinessHours>) => {
    patch('businessHours', { ...businessHours, ...updates });
  };
  const gotoTargets = (graph?.nodes ?? []).filter((n) => n.id !== node.id);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border-[0.5px] border-border-subtle bg-white">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border-subtle/70 px-4 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md ${visual.accentBg}`}>
            <Icon className={`h-3.5 w-3.5 ${visual.accent}`} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              {NODE_LABELS[type]}
            </p>
            <h3 className="text-[13px] font-bold text-dark-navy">Step settings</h3>
          </div>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(node.id)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 cursor-pointer"
            title="Delete node"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
      {type === 'TRIGGER' && (
        <label className="block text-sm font-semibold text-gray-700">
          Event
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            value={String(local.event ?? 'contact.created')}
            onChange={(e) => patch('event', e.target.value)}
          >
            {TRIGGER_EVENTS.map((ev) => (
              <option key={ev.value} value={ev.value}>
                {ev.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {type === 'SEND_MESSAGE' && (
        <SendMessageConfig local={local} patch={patch} patchMany={patchMany} />
      )}

      {type === 'ASK_QUESTION' && (
        <>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              checked={Boolean(local.quickCollect)}
              onChange={(e) => patch('quickCollect', e.target.checked)}
            />
            Quick data capture
          </label>
          {Boolean(local.quickCollect) ? (
            <>
              <label className="block text-sm font-semibold text-gray-700">
                Question text
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  value={String(local.text ?? '')}
                  onChange={(e) => patch('text', e.target.value)}
                  placeholder="What would you like to know?"
                />
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                Save reply to
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  value={String(local.saveReplyTo ?? 'last_reply')}
                  onChange={(e) => patch('saveReplyTo', e.target.value)}
                >
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="last_reply">last_reply (custom)</option>
                </select>
              </label>
              <p className="text-xs leading-relaxed text-slate-500">
                Name / email / phone update the contact and any linked funnel lead. Other keys save as
                custom fields.
              </p>
            </>
          ) : (
            <label className="block text-sm font-semibold text-gray-700">
              Question text
              <textarea
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                value={String(local.text ?? '')}
                onChange={(e) => patch('text', e.target.value)}
                placeholder="What would you like to know?"
              />
            </label>
          )}
        </>
      )}

      {type === 'BUTTONS' && (
        <>
          <label className="block text-sm font-semibold text-gray-700">
            Message text
            <textarea
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={String(local.text ?? '')}
              onChange={(e) => patch('text', e.target.value)}
              placeholder="Choose an option…"
            />
          </label>
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Buttons</p>
              <span className="text-xs text-slate-500">
                {buttons.length}/{WA_BUTTONS_MAX}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              WhatsApp reply buttons (max {WA_BUTTONS_MAX}, {WA_BUTTON_TITLE_MAX} chars each). Each
              id is a canvas handle — click Edit to set what happens when it&apos;s pressed.
            </p>
            <div className="mt-2 space-y-2">
              {buttons.map((btn, idx) => (
                <div key={btn.id || idx} className="flex gap-2">
                  <input
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    value={btn.title}
                    maxLength={WA_BUTTON_TITLE_MAX}
                    onChange={(e) => {
                      const next = [...buttons];
                      next[idx] = { ...next[idx], title: e.target.value };
                      setButtons(next);
                    }}
                    placeholder="Button title"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingButtonId(btn.id)}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-primary/10 hover:text-primary"
                    aria-label="Edit button"
                    title="Edit button"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setButtons(buttons.filter((_, i) => i !== idx))}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Remove button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {buttons.length < WA_BUTTONS_MAX && (
              <button
                type="button"
                onClick={() =>
                  setButtons([
                    ...buttons,
                    { id: `btn_${crypto.randomUUID().slice(0, 4)}`, title: '' },
                  ])
                }
                className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Add button
              </button>
            )}
          </div>
        </>
      )}

      {type === 'RANDOMIZER' && (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Paths</p>
            <span className="text-xs text-slate-500">
              {paths.length}/{RANDOMIZER_PATHS_MAX} · total {pathWeightTotal}%
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Weighted random split — path id matches the canvas handle. Max {RANDOMIZER_PATHS_MAX}.
          </p>
          <div className="mt-2 space-y-2">
            {paths.map((path, idx) => (
              <div key={path.id || idx} className="flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  value={path.label}
                  onChange={(e) => {
                    const next = [...paths];
                    next[idx] = { ...next[idx], label: e.target.value };
                    setPaths(next);
                  }}
                  placeholder="Label"
                />
                <input
                  type="number"
                  min={0}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  value={path.weight}
                  onChange={(e) => {
                    const next = [...paths];
                    next[idx] = { ...next[idx], weight: Number(e.target.value) };
                    setPaths(next);
                  }}
                  aria-label="Weight percent"
                />
                <button
                  type="button"
                  onClick={() => setPaths(paths.filter((_, i) => i !== idx))}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Remove path"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {paths.length < RANDOMIZER_PATHS_MAX && (
            <button
              type="button"
              onClick={() =>
                setPaths([
                  ...paths,
                  {
                    id: `p_${crypto.randomUUID().slice(0, 4)}`,
                    label: `Path ${String.fromCharCode(65 + paths.length)}`,
                    weight: 0,
                  },
                ])
              }
              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add path
            </button>
          )}
        </div>
      )}

      {(type === 'SEND_MESSAGE' || type === 'ASK_QUESTION' || type === 'BUTTONS') && (
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={Boolean(local.simulateTyping)}
            onChange={(e) => patch('simulateTyping', e.target.checked)}
          />
          Simulate typing
        </label>
      )}

      {type === 'ASSIGN_TO' && (
        <>
          <label className="block text-sm font-semibold text-gray-700">
            Assign to
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={String(local.assigneeType ?? 'user')}
              onChange={(e) => patch('assigneeType', e.target.value)}
            >
              {ASSIGNEE_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          {['user', 'rule_based', 'journey'].includes(String(local.assigneeType ?? 'user')) && (
            <label className="block text-sm font-semibold text-gray-700">
              Assignee ID
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-mono text-xs"
                value={String(local.assigneeId ?? '')}
                onChange={(e) => patch('assigneeId', e.target.value)}
                placeholder="User, bot, or journey ID"
              />
            </label>
          )}
        </>
      )}

      {type === 'WAIT' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-semibold text-gray-700">
              Amount
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                value={Number(local.amount ?? 1)}
                onChange={(e) => patch('amount', Number(e.target.value))}
              />
            </label>
            <label className="block text-sm font-semibold text-gray-700">
              Unit
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                value={String(local.unit ?? 'hours')}
                onChange={(e) => patch('unit', e.target.value)}
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </label>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              checked={businessHours.enabled}
              onChange={(e) => patchBusinessHours({ enabled: e.target.checked })}
            />
            Only continue during specific hours
          </label>
          {businessHours.enabled && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Start
                  <input
                    type="time"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    value={businessHours.startTime}
                    onChange={(e) => patchBusinessHours({ startTime: e.target.value || '08:00' })}
                  />
                </label>
                <label className="block text-sm font-semibold text-gray-700">
                  End
                  <input
                    type="time"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    value={businessHours.endTime}
                    onChange={(e) => patchBusinessHours({ endTime: e.target.value || '22:00' })}
                  />
                </label>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Days</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {businessHours.daysOfWeek.length === 0
                    ? 'Any day'
                    : 'Only selected days'}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const selected = businessHours.daysOfWeek.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          const next = selected
                            ? businessHours.daysOfWeek.filter((d) => d !== day.value)
                            : [...businessHours.daysOfWeek, day.value].sort((a, b) => a - b);
                          patchBusinessHours({ daysOfWeek: next });
                        }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                          selected
                            ? 'bg-primary text-white'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {type === 'GOTO_STEP' && (
        <label className="block text-sm font-semibold text-gray-700">
          Jump to step
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            value={String(local.targetNodeId ?? '')}
            onChange={(e) => patch('targetNodeId', e.target.value)}
          >
            <option value="">Select step…</option>
            {gotoTargets.map((n) => (
              <option key={n.id} value={n.id}>
                {NODE_LABELS[n.type] ?? n.type} · {n.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>
      )}

      {type === 'CONDITION' && (
        <ConditionGroupEditor local={local} patchMany={patchMany} channel="whatsapp" />
      )}

      {type === 'WEBHOOK' && <WebhookConfig local={local} patch={patch} />}

      {type === 'UPDATE_TAG' && (
        <>
          <label className="block text-sm font-semibold text-gray-700">
            Action
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={String(local.action ?? 'add')}
              onChange={(e) => patch('action', e.target.value)}
            >
              <option value="add">Add tags</option>
              <option value="remove">Remove tags</option>
              <option value="set">Set tags</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-gray-700">
            Tags
            <div className="mt-1">
              <TagChipInput
                compact
                value={Array.isArray(local.tags) ? (local.tags as string[]) : []}
                onChange={(tags) => patch('tags', tags)}
              />
            </div>
          </label>
        </>
      )}

      {type === 'UPDATE_FIELD' && (
        <>
          <label className="block text-sm font-semibold text-gray-700">
            Field
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={String(local.field ?? 'name')}
              onChange={(e) => patch('field', e.target.value)}
            >
              {CONTACT_FIELDS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          {local.field === 'custom' && (
            <label className="block text-sm font-semibold text-gray-700">
              Custom field key
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                value={String(local.customFieldKey ?? '')}
                onChange={(e) => patch('customFieldKey', e.target.value)}
              />
            </label>
          )}
          <label className="block text-sm font-semibold text-gray-700">
            Value
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={String(local.value ?? '')}
              onChange={(e) => patch('value', e.target.value)}
            />
          </label>
        </>
      )}

      {type === 'ADD_TO_FUNNEL' && (
        <>
          <label className="block text-sm font-semibold text-gray-700">
            Lead funnel
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={String(local.funnelId ?? '')}
              onChange={(e) => patchMany({ funnelId: e.target.value, stageId: '' })}
            >
              <option value="">Select funnel…</option>
              {funnels.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-gray-700">
            Board (optional)
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={String(local.stageId ?? '')}
              onChange={(e) => patch('stageId', e.target.value)}
              disabled={!local.funnelId}
            >
              <option value="">Default (first board)</option>
              {(funnels.find((f) => f.id === local.funnelId)?.stages ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs leading-relaxed text-slate-500">
            Creates a lead linked to this contact. Later name / email / phone captures update the
            lead. Convert to contact from a final board in Leads.
          </p>
        </>
      )}

      {type === 'OPEN_CONVERSATION' && (
        <p className="text-sm text-gray-500">
          Reopens the contact&apos;s latest conversation in the inbox.
        </p>
      )}

      {type === 'CLOSE_CONVERSATION' && (
        <label className="block text-sm font-semibold text-gray-700">
          Closing note (optional)
          <textarea
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            value={String(local.closingNote ?? '')}
            onChange={(e) => patch('closingNote', e.target.value)}
          />
        </label>
      )}

      {type === 'TRIGGER_JOURNEY' && (
        <label className="block text-sm font-semibold text-gray-700">
          Published journey
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            value={String(local.journeyId ?? '')}
            onChange={(e) => patch('journeyId', e.target.value)}
          >
            <option value="">Select journey…</option>
            {publishedJourneys.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {type === 'UPDATE_LIFECYCLE' && (
        <label className="block text-sm font-semibold text-gray-700">
          Lifecycle stage
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            value={String(local.stage ?? '')}
            onChange={(e) => patch('stage', e.target.value)}
            placeholder="e.g. lead, customer, churned"
          />
        </label>
      )}

      {(type === 'SEND_CAPI' ||
        type === 'SEND_TIKTOK' ||
        type === 'GOOGLE_SHEETS' ||
        type === 'AI_OBJECTIVE') && (
        <p className="rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary">
          This step can be added to your workflow now. Runtime execution is coming soon — the journey
          will skip this node until the integration is enabled.
        </p>
      )}
      </div>
    </div>
  );
}
