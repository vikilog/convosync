import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useReactFlow } from '@xyflow/react';
import { StickyNote, X } from 'lucide-react';
import { Textarea } from '../../components/ui/textarea';

/** Optional per-step annotation. Purely descriptive — never read by journey/IG execution engines. */
export type StepNoteData = {
  text: string;
  offsetX?: number;
  offsetY?: number;
};

/** Reads `data.note` off a node's data blob (WA + IG both store nodes as JSON, so no schema needed). */
export function readStepNote(data: unknown): StepNoteData | undefined {
  const raw = (data as { note?: unknown } | null | undefined)?.note;
  if (!raw || typeof raw !== 'object') return undefined;
  const { text, offsetX, offsetY } = raw as StepNoteData;
  if (typeof text !== 'string') return undefined;
  return {
    text,
    offsetX: typeof offsetX === 'number' ? offsetX : undefined,
    offsetY: typeof offsetY === 'number' ? offsetY : undefined,
  };
}

/** Just right of the 220px step card — proximity only, no connector (ManyChat-like). */
const DEFAULT_OFFSET_X = 236;
const DEFAULT_OFFSET_Y = 0;
const DRAG_THRESHOLD = 3;

/** Pure drag math (screen px -> flow px, zoom-aware) so it's unit-testable without mounting React. */
export function computeDraggedOffset(
  base: { x: number; y: number },
  start: { x: number; y: number },
  current: { x: number; y: number },
  zoom: number
): { x: number; y: number; moved: boolean } {
  const z = zoom || 1;
  const dx = (current.x - start.x) / z;
  const dy = (current.y - start.y) / z;
  const moved = Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD;
  return { x: base.x + dx, y: base.y + dy, moved };
}

type StepNoteProps = {
  note: StepNoteData;
  onChange: (text: string) => void;
  onDelete: () => void;
  onMove: (offsetX: number, offsetY: number) => void;
};

/** Sticky-note annotation anchored near a step card. Click to edit, blur to save, x to delete, drag to reposition. */
export function StepNote({ note, onChange, onDelete, onMove }: StepNoteProps) {
  // Freshly-added notes (empty text) open straight into edit mode.
  const [isEditing, setIsEditing] = useState(() => !note.text.trim());
  const [draft, setDraft] = useState(note.text);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const { getZoom } = useReactFlow();
  const drag = useRef<{ start: { x: number; y: number }; base: { x: number; y: number }; moved: boolean } | null>(
    null
  );

  const baseX = note.offsetX ?? DEFAULT_OFFSET_X;
  const baseY = note.offsetY ?? DEFAULT_OFFSET_Y;
  const x = dragPos?.x ?? baseX;
  const y = dragPos?.y ?? baseY;

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (isEditing) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { start: { x: e.clientX, y: e.clientY }, base: { x: baseX, y: baseY }, moved: false };
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const result = computeDraggedOffset(drag.current.base, drag.current.start, { x: e.clientX, y: e.clientY }, getZoom());
    drag.current.moved = drag.current.moved || result.moved;
    if (drag.current.moved) setDragPos({ x: result.x, y: result.y });
  };

  const handlePointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.moved && dragPos) {
      onMove(Math.round(dragPos.x), Math.round(dragPos.y));
    } else {
      setDraft(note.text);
      setIsEditing(true);
    }
    setDragPos(null);
  };

  const commit = () => {
    setIsEditing(false);
    const trimmed = draft.trim();
    if (trimmed) onChange(trimmed);
    else onDelete(); // empty note left on blur is discarded rather than kept as clutter
  };

  return (
    <div
      className="nodrag nopan group/note absolute z-10 w-[168px] select-none rounded-lg bg-[#FEF3C7] px-2.5 py-2 shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
      style={{ left: x, top: y, cursor: isEditing ? 'text' : 'grab' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <button
        type="button"
        title="Delete note"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-slate-500 text-white group-hover/note:flex"
      >
        <X className="h-2.5 w-2.5" strokeWidth={3} />
      </button>
      {isEditing ? (
        <Textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          onBlur={commit}
          placeholder="Add a note…"
          className="min-h-0 nodrag h-[92px] w-full resize-none bg-transparent text-[11.5px] leading-snug text-amber-950 outline-none placeholder:text-amber-700/60"
        />
      ) : (
        <p className="max-h-[92px] overflow-y-auto whitespace-pre-wrap break-words text-[11.5px] leading-snug text-amber-950">
          {note.text}
        </p>
      )}
    </div>
  );
}

/** Small hover icon on the step card — alternative entry point to the right-click "Add note" menu item. */
export function AddNoteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      title="Add note"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="nodrag absolute -right-2 -top-2 z-10 hidden h-6 w-6 items-center justify-center rounded-full border-[0.5px] border-border-subtle bg-white text-slate-400 shadow-sm hover:text-amber-600 group-hover/step:flex"
    >
      <StickyNote className="h-3 w-3" strokeWidth={2.25} />
    </button>
  );
}

type StepNoteMenuProps = {
  x: number;
  y: number;
  hasNote: boolean;
  onAddNote: () => void;
  onRemoveNote: () => void;
  onClose: () => void;
};

/** Minimal right-click menu with a single Add/Remove note action. */
export function StepNoteMenu({ x, y, hasNote, onAddNote, onRemoveNote, onClose }: StepNoteMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ left: x, top: y }}
      className="fixed z-50 min-w-[168px] overflow-hidden rounded-lg border-[0.5px] border-border-subtle bg-white py-1 shadow-lg"
    >
      <button
        type="button"
        onClick={() => {
          (hasNote ? onRemoveNote : onAddNote)();
          onClose();
        }}
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-[12.5px] font-medium text-slate-600 hover:bg-surface-muted"
      >
        <StickyNote className="h-3.5 w-3.5 text-slate-400" />
        {hasNote ? 'Remove note' : 'Add note'}
      </button>
    </div>
  );
}
