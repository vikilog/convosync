import { Search } from 'lucide-react';
import { STEP_CATEGORY_LABELS } from '../stepCatalog';
import { getStepVisual } from './stepIcons';
import { IG_CHIP } from '../igTheme';
import {
  groupPaletteItems,
  type StepCatalogSelectHandler,
} from './stepCatalogUtils';
import type { StepCatalogItem } from '../stepCatalog';
import { Input } from '../../../components/ui/input';

type Props = {
  items: StepCatalogItem[];
  query: string;
  onQueryChange: (query: string) => void;
  onSelect?: StepCatalogSelectHandler;
  autoFocusSearch?: boolean;
  emptyLabel?: string;
};

function StepRow({
  item,
  onSelect,
}: {
  item: StepCatalogItem;
  onSelect?: StepCatalogSelectHandler;
}) {
  const visual = getStepVisual(item.type);
  const Icon = visual.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(item.type)}
      className="flex w-full rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#833AB4]/30"
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${IG_CHIP}`}
        >
          <Icon className={`h-4 w-4 ${visual.accent}`} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-semibold text-slate-900">{item.label}</span>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500 line-clamp-2">
            {item.description}
          </p>
        </div>
      </div>
    </button>
  );
}

export function IgStepsCatalogList({
  items,
  query,
  onQueryChange,
  onSelect,
  autoFocusSearch = false,
  emptyLabel = 'No matching steps',
}: Props) {
  const grouped = groupPaletteItems(items);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          autoFocus={autoFocusSearch}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search steps…"
          className="h-auto w-full rounded-xl border border-swiss-line bg-slate-50/80 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#833AB4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#833AB4]/15"
        />
      </div>

      <div className="mt-2 space-y-1">
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-slate-400">{emptyLabel}</p>
        ) : (
          [...grouped.entries()].map(([category, categoryItems]) => (
            <div key={category} className="py-1">
              <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {STEP_CATEGORY_LABELS[category]}
              </p>
              <div className="space-y-0.5">
                {categoryItems.map((item) => (
                  <div key={item.type}>
                    <StepRow item={item} onSelect={onSelect} />
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
