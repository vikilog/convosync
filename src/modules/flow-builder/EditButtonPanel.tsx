/**
 * Shared "Edit Button" sub-panel for WA BUTTONS / IG BUTTONS nodes — the only step types with
 * a real per-button edge (sourceHandle = button id). Reuses the same "create/link node on
 * canvas + focus it" machinery as "+ Add next step": every action card just ensures a
 * destination node of the right type exists and is wired to this button's handle, then the
 * caller focuses that node (mirrors clicking a node on canvas — no inline destination config
 * lives here).
 */
import { useState, type ComponentType } from 'react';
import { ArrowLeft, Check, ChevronRight, Trash2 } from 'lucide-react';
import {
  BUTTON_PRESS_ACTIONS,
  PERFORM_ACTIONS,
  buildButtonDestination,
  type ButtonActionId,
  type ButtonDestinationChannel,
  type PerformActionId,
} from './buttonActions';
import type { FlowChannelTheme } from './channelTheme';

export type ButtonDestinationInfo = {
  id: string;
  type: string;
  label: string;
  summary?: string;
};

type Props = {
  theme: FlowChannelTheme;
  channel: ButtonDestinationChannel;
  button: { id: string; title: string };
  titleMaxLen: number;
  destination: ButtonDestinationInfo | null;
  onTitleChange: (title: string) => void;
  onChooseAction: (actionId: ButtonActionId | PerformActionId) => void;
  onFocusDestination: () => void;
  onDelete: () => void;
  onClose: () => void;
};

function ActionRow({
  icon: Icon,
  label,
  description,
  active,
  onClick,
  showChevron,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  description: string;
  active?: boolean;
  onClick: () => void;
  showChevron?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors cursor-pointer ${
        active
          ? 'border-primary/30 bg-primary/5'
          : 'border-transparent hover:border-border-subtle hover:bg-slate-50'
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          active ? 'bg-primary/15 text-primary' : 'bg-surface-muted text-slate-500'
        }`}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-slate-900">{label}</span>
          {active ? <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} /> : null}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
      {showChevron ? <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" /> : null}
    </button>
  );
}

export function EditButtonPanel({
  theme,
  channel,
  button,
  titleMaxLen,
  destination,
  onTitleChange,
  onChooseAction,
  onFocusDestination,
  onDelete,
  onClose,
}: Props) {
  const [showPerformActions, setShowPerformActions] = useState(false);
  const titleLen = button.title.length;
  const overLimit = titleLen > titleMaxLen;

  const activeActionId = destination
    ? BUTTON_PRESS_ACTIONS.find(
        (a) => buildButtonDestination(a.id, { channel })?.nodeType === destination.type
      )?.id
    : undefined;
  const activePerformId = destination
    ? PERFORM_ACTIONS.find(
        (a) => buildButtonDestination(a.id, { channel })?.nodeType === destination.type
      )?.id
    : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border-[0.5px] border-border-subtle bg-white">
      <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle/70 px-3 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-surface-muted hover:text-dark-navy cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
            {theme.channelLabel} button
          </p>
          <h3 className="truncate text-[13px] font-bold text-dark-navy">Edit Button</h3>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <label className="block text-sm font-semibold text-gray-700">
          Button title
          <input
            className={`mt-1 w-full rounded-lg border px-2 py-1.5 text-sm ${
              overLimit ? 'border-rose-300' : 'border-slate-200'
            }`}
            value={button.title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Button title"
          />
          <span className={`mt-1 block text-right text-xs ${overLimit ? 'font-semibold text-rose-500' : 'text-slate-400'}`}>
            {titleLen}/{titleMaxLen}
          </span>
        </label>

        <div>
          <p className="text-sm font-semibold text-gray-700">When this button is pressed</p>
          {destination ? (
            <button
              type="button"
              onClick={onFocusDestination}
              className="mt-1.5 flex w-full items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface-muted/60 px-2.5 py-2 text-left transition-colors hover:bg-surface-muted cursor-pointer"
            >
              <span className="min-w-0 truncate text-xs text-slate-600">
                Currently: <span className="font-semibold text-dark-navy">{destination.label}</span>
                {destination.summary ? <span className="text-slate-400"> · {destination.summary}</span> : null}
              </span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            </button>
          ) : (
            <p className="mt-1 text-xs text-slate-400">Not connected yet — choose an action below.</p>
          )}

          <div className="mt-2.5 space-y-1">
            {!showPerformActions
              ? BUTTON_PRESS_ACTIONS.map((card) =>
                  card.id === 'perform_actions' ? (
                    <ActionRow
                      key={card.id}
                      icon={card.icon}
                      label={card.label}
                      description={card.description}
                      active={Boolean(activePerformId)}
                      showChevron
                      onClick={() => setShowPerformActions(true)}
                    />
                  ) : (
                    <ActionRow
                      key={card.id}
                      icon={card.icon}
                      label={card.label}
                      description={card.description}
                      active={activeActionId === card.id}
                      onClick={() => onChooseAction(card.id)}
                    />
                  )
                )
              : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowPerformActions(false)}
                      className="mb-1 flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-semibold text-slate-500 hover:text-dark-navy cursor-pointer"
                    >
                      <ArrowLeft className="h-3 w-3" /> Back
                    </button>
                    {PERFORM_ACTIONS.map((card) => (
                      <ActionRow
                        key={card.id}
                        icon={card.icon}
                        label={card.label}
                        description={card.description}
                        active={activePerformId === card.id}
                        onClick={() => onChooseAction(card.id)}
                      />
                    ))}
                  </>
                )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border-subtle/70 px-4 py-3">
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
        <button
          type="button"
          onClick={onClose}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold ${theme.primaryBtn}`}
        >
          Done
        </button>
      </div>
    </div>
  );
}
