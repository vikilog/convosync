import { useEffect, useMemo, useState } from 'react';
import { MousePointerClick, Trash2 } from 'lucide-react';
import type { Node } from '@xyflow/react';
import {
  TRIGGER_EVENTS,
  CONDITION_OPERATORS,
  CONTACT_FIELDS,
  ASSIGNEE_TYPES,
  NODE_LABELS,
  type JourneyNodeType,
} from '../types';
import { getStepVisual } from './stepIcons';
import { SendMessageConfig } from './SendMessageConfig';
import { WebhookConfig } from './WebhookConfig';
import { useJourneys } from '../hooks/useJourneys';

type Props = {
  node: Node | null;
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
  onDelete?: (nodeId: string) => void;
};

export function NodeConfigPanel({ node, onUpdate, onDelete }: Props) {
  const [local, setLocal] = useState<Record<string, unknown>>({});
  const { data: journeys = [] } = useJourneys();

  const publishedJourneys = useMemo(
    () => journeys.filter((j) => j.status === 'published'),
    [journeys]
  );

  useEffect(() => {
    if (node) {
      setLocal({ ...(node.data as Record<string, unknown>) });
    }
  }, [node?.id, node?.data]);

  if (!node) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-sm">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <MousePointerClick className="h-7 w-7" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">No step selected</h3>
        <p className="mt-2 max-w-[220px] text-xs leading-relaxed text-slate-500">
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

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${visual.accentBg}`}>
            <Icon className={`h-5 w-5 ${visual.accent}`} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {NODE_LABELS[type]}
            </p>
            <h3 className="text-sm font-bold text-slate-900">Step settings</h3>
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

      <div className="max-h-[calc(100vh-16rem)] overflow-y-auto p-4 space-y-3">
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
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-semibold text-gray-700">
            Amount
            <input
              type="number"
              min={1}
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
      )}

      {type === 'CONDITION' && (
        <>
          <label className="block text-sm font-semibold text-gray-700">
            Field
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={String(local.field ?? '')}
              onChange={(e) => patch('field', e.target.value)}
              placeholder="booking_count or contact.name"
            />
          </label>
          <label className="block text-sm font-semibold text-gray-700">
            Operator
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={String(local.operator ?? 'contains')}
              onChange={(e) => patch('operator', e.target.value)}
            >
              {CONDITION_OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </label>
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
            Tags (comma separated)
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={Array.isArray(local.tags) ? (local.tags as string[]).join(', ') : ''}
              onChange={(e) =>
                patch(
                  'tags',
                  e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                )
              }
            />
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
