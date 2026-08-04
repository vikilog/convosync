import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ConditionRow } from './ConditionRow';
import { ConditionTypePicker } from './ConditionTypePicker';
import {
  conditionTypeDef,
  normalizeConditionGroup,
  type Condition,
  type ConditionChannel,
  type ConditionCombinator,
  type ConditionTypeDef,
} from './conditionTypes';

type Props = {
  local: Record<string, unknown>;
  patchMany: (updates: Record<string, unknown>) => void;
  channel: ConditionChannel;
};

/**
 * Shared CONDITION step editor (WhatsApp + Instagram journey builders): ALL/ANY header,
 * a row per condition (add/remove via the categorized type picker), and Yes/No branch
 * guidance — the actual Yes/No handles already live on the canvas node (`outputs="branch"`).
 */
export function ConditionGroupEditor({ local, patchMany, channel }: Props) {
  const { conditions, combinator } = normalizeConditionGroup(local);
  const [pickerOpen, setPickerOpen] = useState(false);

  const setGroup = (nextConditions: Condition[], nextCombinator: ConditionCombinator = combinator) => {
    patchMany({ conditions: nextConditions, combinator: nextCombinator });
  };

  const updateAt = (idx: number, next: Condition) => {
    setGroup(conditions.map((c, i) => (i === idx ? next : c)));
  };

  const removeAt = (idx: number) => {
    const next = conditions.filter((_, i) => i !== idx);
    setGroup(next.length > 0 ? next : [conditionTypeDef('field')!.createCondition()]);
  };

  const addType = (def: ConditionTypeDef) => {
    if (def.status === 'coming_soon') return;
    setGroup([...conditions, def.createCondition()]);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-slate-50 px-3 py-2.5">
        <p className="text-sm font-semibold leading-relaxed text-slate-700">
          Does the contact match{' '}
          <select
            className="mx-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-sm font-bold text-primary"
            value={combinator}
            onChange={(e) => setGroup(conditions, e.target.value === 'any' ? 'any' : 'all')}
          >
            <option value="all">all</option>
            <option value="any">any</option>
          </select>{' '}
          of the following conditions?
        </p>
      </div>

      <div className="space-y-2">
        {conditions.map((cond, idx) => (
          <ConditionRow
            key={idx}
            condition={cond}
            onChange={(next) => updateAt(idx, next)}
            onRemove={() => removeAt(idx)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-strong px-2.5 py-2 text-xs font-semibold text-slate-500 transition-colors hover:border-primary/40 hover:text-primary"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
        Condition
      </button>

      <ConditionTypePicker
        open={pickerOpen}
        channel={channel}
        onClose={() => setPickerOpen(false)}
        onSelect={addType}
      />

      <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
        <p>
          <span className="font-semibold text-emerald-600">Yes, the contact matches</span> — connect the{' '}
          <strong>Yes</strong> handle on the canvas to the next step.
        </p>
        <p>
          <span className="font-semibold text-rose-600">If not</span> — connect the <strong>No</strong> handle
          to a different step (or leave it to end the branch).
        </p>
      </div>
    </div>
  );
}
