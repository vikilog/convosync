import { Trash2 } from 'lucide-react';
import {
  CONDITION_OPERATORS,
  MESSAGING_WINDOW_OPTIONS,
  conditionDefFor,
  parseCurrentTimeValue,
  systemFieldDef,
  type Condition,
} from './conditionTypes';
import { useWorkspaceTags } from '../../../lib/useWorkspaceTags';
import { Input } from '../../../components/ui/input';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const INPUT = 'w-full rounded-lg border border-swiss-line px-2 py-1.5 text-sm';
const LABEL = 'block text-xs font-semibold text-slate-500';

type Props = {
  condition: Condition;
  onChange: (next: Condition) => void;
  onRemove: () => void;
};

function YesNoSelect({ value, onChange }: { value: string | number; onChange: (v: string) => void }) {
  return (
    <select className={INPUT} value={String(value) === 'no' ? 'no' : 'yes'} onChange={(e) => onChange(e.target.value)}>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  );
}

export function ConditionRow({ condition, onChange, onRemove }: Props) {
  const tags = useWorkspaceTags();
  const def = conditionDefFor(condition);
  const type = condition.type ?? 'field';
  const fieldDef = type === 'system_field' ? systemFieldDef(condition.field) : undefined;

  const patch = (updates: Partial<Condition>) => onChange({ ...condition, ...updates });

  return (
    <div className="space-y-2 rounded-xl border border-swiss-line bg-white p-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-700">{def?.label ?? 'Condition'}</p>
        <button
          type="button"
          onClick={onRemove}
          title="Remove condition"
          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {type === 'tag' && (
        <div className="grid grid-cols-2 gap-2">
          <label className={LABEL}>
            Match
            <select
              className={INPUT}
              value={condition.operator === '!=' ? '!=' : '='}
              onChange={(e) => patch({ operator: e.target.value as Condition['operator'] })}
            >
              <option value="=">Has tag</option>
              <option value="!=">Doesn't have tag</option>
            </select>
          </label>
          <label className={LABEL}>
            Tag
            <Input
              className={INPUT}
              list="condition-row-tag-options"
              value={String(condition.value ?? '')}
              onChange={(e) => patch({ value: e.target.value })}
              placeholder="e.g. vip"
            />
            <datalist id="condition-row-tag-options">
              {tags.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </label>
        </div>
      )}

      {(type === 'email_known' || type === 'phone_known' || type === 'follows_account') && (
        <label className={LABEL}>
          {type === 'follows_account' ? 'Follows account' : 'Known'}
          <YesNoSelect value={condition.value} onChange={(v) => patch({ value: v })} />
        </label>
      )}

      {type === 'custom_field' && (
        <div className="grid grid-cols-3 gap-2">
          <label className={`${LABEL} col-span-1`}>
            Field key
            <Input
              className={INPUT}
              value={condition.field}
              onChange={(e) => patch({ field: e.target.value })}
              placeholder="plan"
            />
          </label>
          <label className={LABEL}>
            Operator
            <select className={INPUT} value={condition.operator} onChange={(e) => patch({ operator: e.target.value as Condition['operator'] })}>
              {CONDITION_OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </label>
          <label className={LABEL}>
            Value
            <Input className={INPUT} value={String(condition.value ?? '')} onChange={(e) => patch({ value: e.target.value })} />
          </label>
        </div>
      )}

      {type === 'channel' && (
        <label className={LABEL}>
          Channel
          <select className={INPUT} value={String(condition.value ?? 'whatsapp')} onChange={(e) => patch({ value: e.target.value })}>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="messenger">Messenger</option>
          </select>
        </label>
      )}

      {type === 'journey_status' && (
        <div className="grid grid-cols-2 gap-2">
          <label className={LABEL}>
            Operator
            <select className={INPUT} value={condition.operator} onChange={(e) => patch({ operator: e.target.value as Condition['operator'] })}>
              {CONDITION_OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </label>
          <label className={LABEL}>
            Status
            <Input className={INPUT} value={String(condition.value ?? '')} onChange={(e) => patch({ value: e.target.value })} placeholder="active" />
          </label>
        </div>
      )}

      {type === 'field' && (
        <div className="grid grid-cols-3 gap-2">
          <label className={`${LABEL} col-span-1`}>
            Field
            <Input
              className={`h-auto ${INPUT} font-mono text-xs`}
              value={condition.field}
              onChange={(e) => patch({ field: e.target.value })}
              placeholder="contact.name"
            />
          </label>
          <label className={LABEL}>
            Operator
            <select className={INPUT} value={condition.operator} onChange={(e) => patch({ operator: e.target.value as Condition['operator'] })}>
              {CONDITION_OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </label>
          <label className={LABEL}>
            Value
            <Input className={INPUT} value={String(condition.value ?? '')} onChange={(e) => patch({ value: e.target.value })} />
          </label>
        </div>
      )}

      {type === 'system_field' && fieldDef?.valueKind === 'boolean' && (
        <label className={LABEL}>
          {fieldDef.label}
          <YesNoSelect value={condition.value} onChange={(v) => patch({ value: v, operator: '=' })} />
        </label>
      )}

      {type === 'system_field' && fieldDef?.valueKind === 'messaging_window' && (
        <label className={LABEL}>
          {fieldDef.label}
          <select
            className={INPUT}
            value={String(condition.value ?? 'within_24h')}
            onChange={(e) => patch({ value: e.target.value, operator: '=' })}
          >
            {MESSAGING_WINDOW_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {type === 'system_field' && fieldDef?.valueKind === 'number' && (
        <div className="grid grid-cols-2 gap-2">
          <label className={LABEL}>
            Operator
            <select className={INPUT} value={condition.operator} onChange={(e) => patch({ operator: e.target.value as Condition['operator'] })}>
              {(['>', '<', '=', '!='] as const).map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </label>
          <label className={LABEL}>
            Days
            <Input
              type="number"
              className={INPUT}
              value={String(condition.value ?? '')}
              onChange={(e) => patch({ value: e.target.value })}
            />
          </label>
        </div>
      )}

      {type === 'system_field' && fieldDef?.valueKind === 'text' && (
        <div className="grid grid-cols-2 gap-2">
          <label className={LABEL}>
            Operator
            <select className={INPUT} value={condition.operator} onChange={(e) => patch({ operator: e.target.value as Condition['operator'] })}>
              {(['=', '!=', 'contains'] as const).map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </label>
          <label className={LABEL}>
            Value
            <Input className={INPUT} value={String(condition.value ?? '')} onChange={(e) => patch({ value: e.target.value })} />
          </label>
        </div>
      )}

      {type === 'current_time' && (
        <CurrentTimeFields
          operator={condition.operator}
          value={condition.value}
          onChange={(next) => patch(next)}
        />
      )}
    </div>
  );
}

function CurrentTimeFields({
  operator,
  value,
  onChange,
}: {
  operator: Condition['operator'];
  value: Condition['value'];
  onChange: (updates: Partial<Condition>) => void;
}) {
  const timeWindow = parseCurrentTimeValue(value);
  const patchWindow = (updates: Partial<typeof timeWindow>) => {
    onChange({ value: JSON.stringify({ ...timeWindow, ...updates }) });
  };

  return (
    <div className="space-y-2">
      <label className={LABEL}>
        Match
        <select className={INPUT} value={operator === '!=' ? '!=' : '='} onChange={(e) => onChange({ operator: e.target.value as Condition['operator'] })}>
          <option value="=">Is within window</option>
          <option value="!=">Is outside window</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className={LABEL}>
          Start
          <Input
            type="time"
            className={INPUT}
            value={timeWindow.startTime}
            onChange={(e) => patchWindow({ startTime: e.target.value || '09:00' })}
          />
        </label>
        <label className={LABEL}>
          End
          <Input
            type="time"
            className={INPUT}
            value={timeWindow.endTime}
            onChange={(e) => patchWindow({ endTime: e.target.value || '18:00' })}
          />
        </label>
      </div>
      <div>
        <p className={LABEL}>Days ({timeWindow.daysOfWeek.length === 0 ? 'any day' : 'selected only'})</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {DAYS_OF_WEEK.map((day) => {
            const selected = timeWindow.daysOfWeek.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => {
                  const next = selected
                    ? timeWindow.daysOfWeek.filter((d) => d !== day.value)
                    : [...timeWindow.daysOfWeek, day.value].sort((a, b) => a - b);
                  patchWindow({ daysOfWeek: next });
                }}
                className={`rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
                  selected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
