import { useEffect, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { StepsCatalogList } from './StepsCatalogList';
import { filterPaletteItems, PALETTE_ITEMS } from './stepCatalogUtils';
import type { JourneyNodeType } from '../types';

type Props = {
  open: boolean;
  onSelect: (type: JourneyNodeType) => void;
  onClose: () => void;
  hasTrigger?: boolean;
};

/** Right sidesheet inside the journey builder content area (not a floating canvas popover). */
export function AddStepsMenu({ open, onSelect, onClose, hasTrigger = false }: Props) {
  const [query, setQuery] = useState('');

  const items = useMemo(
    () => filterPaletteItems(PALETTE_ITEMS, { query, hasTrigger }),
    [query, hasTrigger]
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close add step"
        className="absolute inset-0 z-20 cursor-pointer bg-dark-navy/20"
        onClick={onClose}
      />
      <aside
        className="absolute inset-y-0 right-0 z-30 flex w-full max-w-[380px] flex-col border-l-[0.5px] border-border-subtle bg-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-step-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b-[0.5px] border-border-subtle px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-primary/10 text-primary">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
            </span>
            <div>
              <p id="add-step-title" className="text-[14px] font-bold text-dark-navy">
                Add next step
              </p>
              <p className="text-[12px] text-slate-500">Choose an action for this branch</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors duration-150 hover:bg-surface-muted hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
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
      </aside>
    </>
  );
}
