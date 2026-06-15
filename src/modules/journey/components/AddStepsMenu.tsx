import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';
import { StepsCatalogList } from './StepsCatalogList';
import { filterPaletteItems, PALETTE_ITEMS } from './stepCatalogUtils';
import type { JourneyNodeType } from '../types';

type Props = {
  onSelect: (type: JourneyNodeType) => void;
  onClose: () => void;
  hasTrigger?: boolean;
  anchor?: { top: number; left: number } | null;
};

export function AddStepsMenu({ onSelect, onClose, hasTrigger = false, anchor = null }: Props) {
  const [query, setQuery] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const items = useMemo(
    () => filterPaletteItems(PALETTE_ITEMS, { query, hasTrigger }),
    [query, hasTrigger]
  );

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const panel = (
    <div
      ref={panelRef}
      className="w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)] backdrop-blur-md overflow-hidden"
      onClick={(e) => e.stopPropagation()}
      style={
        anchor
          ? {
              position: 'fixed',
              top: Math.min(anchor.top, window.innerHeight - 420),
              left: Math.min(Math.max(16, anchor.left - 160), window.innerWidth - 336),
              zIndex: 9999,
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Plus className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">Add next step</p>
            <p className="text-xs text-slate-500">Choose an action for this branch</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 pb-3 pt-2">
        <StepsCatalogList
          items={items}
          query={query}
          onQueryChange={setQuery}
          mode="click"
          autoFocusSearch
          onSelect={(type) => {
            onSelect(type);
            onClose();
          }}
        />
      </div>
    </div>
  );

  if (anchor) {
    return createPortal(panel, document.body);
  }

  return panel;
}
