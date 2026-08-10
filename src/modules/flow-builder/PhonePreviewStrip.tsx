import { useMemo } from 'react';
import type { Edge, Node } from '@xyflow/react';
import { Zap } from 'lucide-react';
import {
  FLOW_CHANNEL_THEMES,
  type FlowChannel,
} from './channelTheme';
import {
  walkVisiblePreviewSteps,
  type FlowPreviewStep,
} from './walkVisiblePreviewSteps';

type Props = {
  nodes: Node[];
  edges: Edge[];
  channel?: FlowChannel;
  /** Max phone mockups (rest collapsed into +N) */
  maxPhones?: number;
  className?: string;
  /** Highlight phone for the selected canvas node */
  selectedNodeId?: string | null;
  onSelectStep?: (nodeId: string) => void;
};

const MAX_DEFAULT = 5;

export function PhonePreviewStrip({
  nodes,
  edges,
  channel = 'instagram',
  maxPhones = MAX_DEFAULT,
  className = '',
  selectedNodeId = null,
  onSelectStep,
}: Props) {
  const theme = FLOW_CHANNEL_THEMES[channel];
  const steps = useMemo(
    () => walkVisiblePreviewSteps(nodes, edges),
    [nodes, edges]
  );
  const visible = steps.slice(0, maxPhones);
  const overflow = steps.length - visible.length;
  const hasTrigger = nodes.some((n) => n.type === 'TRIGGER');

  return (
    <div
      className={`flex max-w-[min(920px,calc(100vw-2rem))] items-end gap-3 rounded-xl border-[0.5px] border-border-subtle bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm ${className}`}
    >
      <p className="mb-1 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Preview
      </p>

      <div className="flex min-w-0 items-end gap-2 overflow-x-auto pb-0.5">
        {hasTrigger ? (
          <div
            className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[0.5px] border-border-subtle bg-white shadow-sm"
            title="Trigger"
            aria-label="Flow starts at trigger"
          >
            <Zap className={`h-3.5 w-3.5 ${theme.accentText}`} strokeWidth={2.25} />
          </div>
        ) : null}

        {hasTrigger && visible.length > 0 ? (
          <span className="mb-4 h-px w-3 shrink-0 bg-border-strong" aria-hidden />
        ) : null}

        {visible.length === 0 ? (
          <p className="mb-2 text-[11px] text-slate-400">
            Add a Send Message or Ask Question step to preview
          </p>
        ) : (
          visible.map((step, i) => (
            <div key={step.id} className="flex items-end gap-2">
              {i > 0 ? (
                <span className="mb-4 h-px w-2.5 shrink-0 bg-border-strong/80" aria-hidden />
              ) : null}
              <PhoneMock
                step={step}
                channel={channel}
                selected={step.id === selectedNodeId}
                onClick={onSelectStep ? () => onSelectStep(step.id) : undefined}
              />
            </div>
          ))
        )}

        {overflow > 0 ? (
          <div className="mb-2 flex h-[140px] w-[56px] shrink-0 flex-col items-center justify-center rounded-[12px] border border-dashed border-border-strong bg-white/80 px-1 text-center">
            <span className="text-[12px] font-bold text-slate-600">+{overflow}</span>
            <span className="text-[9px] font-medium leading-tight text-slate-400">
              more step{overflow === 1 ? '' : 's'}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PhoneMock({
  step,
  channel,
  selected,
  onClick,
}: {
  step: FlowPreviewStep;
  channel: FlowChannel;
  selected: boolean;
  onClick?: () => void;
}) {
  const screenBg = channel === 'whatsapp' ? 'bg-[#efeae2]' : 'bg-[#fafafa]';
  const bubbleClass =
    channel === 'whatsapp'
      ? 'bg-channel-green text-white'
      : 'bg-gradient-to-br from-[#833AB4] to-[#E1306C] text-white';
  const chipClass =
    channel === 'whatsapp'
      ? 'border-channel-green/50 text-channel-green'
      : 'border-[#3797F0]/50 text-[#3797F0]';

  const body =
    step.text ||
    (step.templateName ? `Template: ${step.templateName}` : '');
  const replies = step.quickReplies.slice(0, 4);

  const inner = (
    <>
      <div className="mx-auto mt-1.5 h-1 w-3 rounded-full bg-slate-300/90" />
      <div className={`mx-1 mt-1.5 min-h-0 flex-1 overflow-hidden rounded-[4px] ${screenBg} p-1`}>
        {body ? (
          <div className="flex justify-end">
            <div
              className={`max-w-[95%] rounded-[8px] rounded-br-sm px-1.5 py-1 text-[7px] font-medium leading-[1.25] whitespace-pre-wrap break-words shadow-sm ${bubbleClass}`}
            >
              {truncate(body, 90)}
            </div>
          </div>
        ) : (
          <div className="rounded border border-dashed border-border-strong/70 px-1 py-1.5 text-center text-[7px] text-slate-400">
            Empty
          </div>
        )}
        {replies.length > 0 ? (
          <div className="mt-1 flex flex-col gap-0.5">
            {replies.map((r) => (
              <span
                key={r.title}
                className={`truncate rounded-full border bg-white px-1 py-0.5 text-center text-[6.5px] font-semibold leading-none ${chipClass}`}
              >
                {r.title}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="mx-auto mb-1 mt-1 h-1 w-2 rounded-full bg-slate-300/90" />
    </>
  );

  const selectedRing =
    channel === 'whatsapp'
      ? 'border-primary ring-2 ring-primary/25'
      : 'border-[#833AB4] ring-2 ring-[#833AB4]/25';
  const shellClass = `flex h-[140px] w-[78px] shrink-0 flex-col overflow-hidden rounded-[12px] border-[0.5px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-colors ${
    selected ? selectedRing : 'border-border-subtle'
  }`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${shellClass} cursor-pointer text-left hover:border-slate-300`}
        title={
          step.type === 'ASK_QUESTION'
            ? 'Ask Question'
            : step.type === 'BUTTONS'
              ? 'Buttons'
              : 'Send Message'
        }
      >
        {inner}
      </button>
    );
  }

  return <div className={shellClass}>{inner}</div>;
}

function truncate(s: string, n: number) {
  const t = s.trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}
