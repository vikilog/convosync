import { AlignHorizontalSpaceAround, Minus, Plus } from 'lucide-react';
import { Panel, useReactFlow } from '@xyflow/react';

type Props = {
  onAutoAlign?: () => void;
  /** right = floating on canvas edge (ManyChat-like) */
  position?: 'bottom-left' | 'top-right' | 'center-right';
};

export function FlowCanvasToolbar({ onAutoAlign, position = 'center-right' }: Props) {
  const { zoomIn, zoomOut } = useReactFlow();
  const panelPos =
    position === 'center-right'
      ? 'top-right'
      : position;

  return (
    <Panel
      position={panelPos}
      className={
        position === 'center-right'
          ? '!top-1/2 !right-3 !m-0 flex -translate-y-1/2 flex-col gap-1'
          : '!m-3 flex flex-col gap-1'
      }
    >
      {onAutoAlign ? (
        <button
          type="button"
          onClick={onAutoAlign}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-[0.5px] border-border-subtle bg-white text-slate-600 transition-colors duration-150 hover:bg-surface-muted"
          aria-label="Auto-align steps"
          title="Auto-align steps"
        >
          <AlignHorizontalSpaceAround className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => zoomIn({ duration: 150 })}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-[0.5px] border-border-subtle bg-white text-slate-600 transition-colors duration-150 hover:bg-surface-muted"
        aria-label="Zoom in"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
      <button
        type="button"
        onClick={() => zoomOut({ duration: 150 })}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-[0.5px] border-border-subtle bg-white text-slate-600 transition-colors duration-150 hover:bg-surface-muted"
        aria-label="Zoom out"
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
    </Panel>
  );
}
