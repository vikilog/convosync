import type { ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Plus, Zap, type LucideIcon } from 'lucide-react';
import type { FlowChannelTheme } from './channelTheme';

const CARD =
  'w-[220px] overflow-hidden rounded-2xl border-[0.5px] border-border-subtle bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]';

export type FlowTriggerEntry = {
  name: string;
  typeLabel: string;
  Icon: LucideIcon;
  onRemove?: () => void;
};

type TriggerCardProps = {
  theme: FlowChannelTheme;
  selected?: boolean;
  /** Multi-trigger rows. Falls back to single triggerName/TriggerIcon when omitted. */
  triggers?: FlowTriggerEntry[];
  triggerName?: string;
  triggerTypeLabel?: string;
  TriggerIcon?: LucideIcon;
  keyword?: string;
  onNewTrigger?: () => void;
  /** Hide "+ New Trigger" when false (e.g. all events already selected). */
  canAddTrigger?: boolean;
  children?: ReactNode;
};

/** ManyChat-style "When..." trigger card. */
export function FlowTriggerCard({
  theme,
  selected,
  triggers,
  triggerName = 'When',
  triggerTypeLabel = 'Trigger',
  TriggerIcon = Zap,
  keyword,
  onNewTrigger,
  canAddTrigger = true,
  children,
}: TriggerCardProps) {
  const rows: FlowTriggerEntry[] =
    triggers && triggers.length > 0
      ? triggers
      : [{ name: triggerName, typeLabel: triggerTypeLabel, Icon: TriggerIcon }];

  return (
    <div className="group relative pb-1">
      <div
        className={`${CARD} ${
          selected ? `border-2 ${theme.selectedBorder}` : 'hover:border-slate-300'
        }`}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="!h-2.5 !w-2.5 !border-[1.5px] !border-white !bg-transparent !shadow-[inset_0_0_0_1.5px_var(--color-border-strong)]"
        />

        <div className="flex items-center gap-1.5 px-3 pt-2.5">
          <Zap className={`h-3.5 w-3.5 ${theme.accentText}`} strokeWidth={2.25} />
          <p className="text-[12px] font-semibold text-slate-500">When...</p>
        </div>

        <div className="space-y-1.5 px-3 pt-2">
          {rows.map((row, i) => {
            const RowIcon = row.Icon;
            return (
              <div
                key={`${row.name}-${i}`}
                className="flex items-center gap-2.5 rounded-xl border-[0.5px] border-border-subtle bg-white px-2.5 py-2"
              >
                <span
                  className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-white"
                  style={{ background: theme.iconChipBg }}
                >
                  <RowIcon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold leading-snug text-dark-navy">
                    {row.name}
                  </p>
                  <p className="truncate text-[11px] leading-snug text-slate-400">
                    {row.typeLabel}
                  </p>
                </div>
                {row.onRemove ? (
                  <button
                    type="button"
                    title="Remove trigger"
                    onClick={(e) => {
                      e.stopPropagation();
                      row.onRemove?.();
                    }}
                    className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            );
          })}
          {keyword ? (
            <span
              className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${theme.softChip}`}
            >
              Keyword: {keyword}
            </span>
          ) : null}
          {children}
        </div>

        {canAddTrigger ? (
          <div className="px-3 pb-3 pt-2">
            <button
              type="button"
              title={
                onNewTrigger
                  ? 'Add another trigger'
                  : 'Edit this trigger in the side panel'
              }
              onClick={(e) => {
                e.stopPropagation();
                onNewTrigger?.();
              }}
              className={`flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg border border-dashed border-border-strong px-2 py-1.5 text-[11px] font-semibold text-slate-500 transition-colors ${theme.accentBorderHover}`}
            >
              <Plus className="h-3 w-3" strokeWidth={2.25} />
              New Trigger
            </button>
          </div>
        ) : (
          <div className="pb-3" />
        )}

        <NextStepHandle theme={theme} />
      </div>
    </div>
  );
}

type ActionCardProps = {
  theme: FlowChannelTheme;
  selected?: boolean;
  stepName: string;
  StepIcon: LucideIcon;
  /** Dashed content area; pass null to hide */
  bodyPlaceholder?: string | null;
  body?: ReactNode;
  outputs?: 'single' | 'branch' | 'none';
  /** Labeled source handles (BUTTONS / RANDOMIZER). Takes precedence over outputs. */
  multiOutputs?: { id: string; label: string }[];
  footer?: ReactNode;
  showNextStep?: boolean;
};

/** ManyChat-style action step card. */
export function FlowActionCard({
  theme,
  selected,
  stepName,
  StepIcon,
  bodyPlaceholder = 'Add a text',
  body,
  outputs = 'single',
  multiOutputs,
  footer,
  showNextStep = true,
}: ActionCardProps) {
  return (
    <div className="group relative pb-1">
      <div
        className={`${CARD} ${
          selected ? `border-2 ${theme.selectedBorder}` : 'hover:border-slate-300'
        }`}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="!h-2.5 !w-2.5 !border-[1.5px] !border-white !bg-transparent !shadow-[inset_0_0_0_1.5px_var(--color-border-strong)]"
        />

        <div className="flex items-start gap-2.5 px-3 pt-3">
          <span
            className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] text-white"
            style={{ background: theme.iconChipBg }}
          >
            <StepIcon className="h-3 w-3" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium leading-none text-slate-400">
              {theme.channelLabel}
            </p>
            <p className="mt-0.5 truncate text-[12.5px] font-bold leading-snug text-dark-navy">
              {stepName}
            </p>
          </div>
        </div>

        {(body || bodyPlaceholder !== null) && (
          <div className="px-3 pt-2">
            {body ?? (
              <div className="rounded-lg border border-dashed border-border-strong bg-white/60 px-2.5 py-2 text-[11px] text-slate-400">
                {bodyPlaceholder}
              </div>
            )}
          </div>
        )}

        {footer ? <div className="px-3 pt-1.5">{footer}</div> : null}

        {multiOutputs && multiOutputs.length > 0 ? (
          <>
            {multiOutputs.map((out, i) => (
              <Handle
                key={out.id}
                id={out.id}
                type="source"
                position={Position.Right}
                style={{ top: `${((i + 1) / (multiOutputs.length + 1)) * 100}%` }}
                className="!h-2.5 !w-2.5 !border-[1.5px] !border-white !bg-transparent !shadow-[inset_0_0_0_1.5px_#833AB4]"
              />
            ))}
            <div className="space-y-0.5 px-3 pb-2 pt-2 text-right text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              {multiOutputs.map((out) => (
                <div key={out.id} className={`truncate ${theme.accentText}`}>
                  {out.label || out.id}
                </div>
              ))}
            </div>
          </>
        ) : outputs === 'branch' ? (
          <>
            <Handle
              id="yes"
              type="source"
              position={Position.Right}
              style={{ top: '42%' }}
              className="!h-2.5 !w-2.5 !border-[1.5px] !border-white !bg-transparent !shadow-[inset_0_0_0_1.5px_#833AB4]"
            />
            <Handle
              id="no"
              type="source"
              position={Position.Right}
              style={{ top: '72%' }}
              className="!h-2.5 !w-2.5 !border-[1.5px] !border-white !bg-transparent !shadow-[inset_0_0_0_1.5px_var(--color-danger-red)]"
            />
            <div className="flex justify-end gap-3 px-3 pb-2 pt-2 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              <span className={theme.accentText}>Yes</span>
              <span className="text-danger-red">No</span>
            </div>
          </>
        ) : outputs === 'single' && showNextStep ? (
          <NextStepHandle theme={theme} />
        ) : outputs === 'single' ? (
          <Handle
            type="source"
            position={Position.Right}
            className="!h-2.5 !w-2.5 !border-[1.5px] !border-white !bg-transparent !shadow-[inset_0_0_0_1.5px_var(--color-border-strong)]"
          />
        ) : null}
      </div>
    </div>
  );
}

function NextStepHandle({ theme }: { theme: FlowChannelTheme }) {
  return (
    <div className="flex items-center justify-end px-3 pb-2.5 pt-2 pr-5">
      <span className="mr-1 text-[10px] font-medium text-slate-400">Next Step</span>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3.5 !w-3.5 !border-[1.5px] !border-border-strong !bg-white"
        style={{ top: 'auto', bottom: 14 }}
        aria-label={`Connect next step (${theme.channelLabel})`}
      />
    </div>
  );
}

type AddStepPlaceholderProps = {
  theme: FlowChannelTheme;
  onClick: () => void;
};

/** Dashed + circle used under cards to add the next step. */
export function FlowAddStepButton({ theme, onClick }: AddStepPlaceholderProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute -bottom-3 left-1/2 z-10 flex h-7 w-7 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border border-dashed border-border-strong bg-white text-slate-400 shadow-sm transition-colors ${theme.accentBorderHover}`}
      title="Add next step"
      aria-label="Add next step"
    >
      <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
    </button>
  );
}
