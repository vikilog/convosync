import { Search } from 'lucide-react';
import { STEP_CATEGORY_LABELS } from '../stepCatalog';
import { getStepVisual } from './stepIcons';
import { groupPaletteItems, type StepCatalogItem, type StepCatalogSelectHandler } from './stepCatalogUtils';

type Props = {
  items: StepCatalogItem[];
  query: string;
  onQueryChange: (query: string) => void;
  mode: 'click' | 'drag';
  onSelect?: StepCatalogSelectHandler;
  autoFocusSearch?: boolean;
  emptyLabel?: string;
  className?: string;
};

function StepRow({
  item,
  mode,
  onSelect,
}: {
  item: StepCatalogItem;
  mode: 'click' | 'drag';
  onSelect?: StepCatalogSelectHandler;
}) {
  const visual = getStepVisual(item.type);
  const Icon = visual.icon;

  const inner = (
    <div className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${visual.accentBg} ${visual.accent}`}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{item.label}</span>
          {item.comingSoon ? (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
              Soon
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500 line-clamp-2">{item.description}</p>
      </div>
    </div>
  );

  if (mode === 'drag') {
    return (
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/journey-node', item.type);
          e.dataTransfer.effectAllowed = 'move';
        }}
        className="cursor-grab rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition-colors active:cursor-grabbing hover:border-primary/30 hover:bg-slate-50/80"
      >
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect?.(item.type)}
      className="flex w-full rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      {inner}
    </button>
  );
}

export function StepsCatalogList({
  items,
  query,
  onQueryChange,
  mode,
  onSelect,
  autoFocusSearch = false,
  emptyLabel = 'No matching steps',
  className = '',
}: Props) {
  const grouped = groupPaletteItems(items);

  return (
    <div className={className}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus={autoFocusSearch}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search steps…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <div className={mode === 'click' ? 'mt-2 max-h-[min(22rem,50vh)] overflow-y-auto' : 'mt-2 space-y-3'}>
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-slate-400">{emptyLabel}</p>
        ) : (
          [...grouped.entries()].map(([category, categoryItems]) => (
            <div key={category} className={mode === 'click' ? 'py-1' : 'space-y-1'}>
              <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {STEP_CATEGORY_LABELS[category]}
              </p>
              <div className={mode === 'drag' ? 'space-y-1' : 'space-y-0.5'}>
                {categoryItems.map((item) => (
                  <div key={item.type}>
                    <StepRow item={item} mode={mode} onSelect={onSelect} />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
