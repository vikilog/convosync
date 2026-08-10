import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CONDITION_CATEGORIES,
  CONDITION_CATEGORY_LABELS,
  conditionTypesForChannel,
  type ConditionCategory,
  type ConditionChannel,
  type ConditionTypeDef,
} from './conditionTypes';

type Tab = 'recommended' | ConditionCategory;

type Props = {
  open: boolean;
  channel: ConditionChannel;
  onClose: () => void;
  onSelect: (def: ConditionTypeDef) => void;
};

/** ManyChat-style condition-type picker: search + left category tabs + right item list. */
export function ConditionTypePicker({ open, channel, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('recommended');
  const [igOpen, setIgOpen] = useState(false);

  const available = useMemo(() => conditionTypesForChannel(channel), [channel]);

  const tabs = useMemo<Tab[]>(
    () => ['recommended', ...CONDITION_CATEGORIES.filter((cat) => available.some((def) => def.category === cat))],
    [available]
  );

  const searching = query.trim().length > 0;
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return available.filter(
      (def) => def.label.toLowerCase().includes(q) || def.description.toLowerCase().includes(q)
    );
  }, [available, query]);

  const tabItems = useMemo(() => {
    if (tab === 'recommended') return available.filter((def) => def.recommended);
    return available.filter((def) => def.category === tab && !def.instagramGroup);
  }, [available, tab]);

  const igItems = useMemo(
    () => (tab === 'system' ? available.filter((def) => def.category === 'system' && def.instagramGroup) : []),
    [available, tab]
  );

  const handleSelect = (def: ConditionTypeDef) => {
    if (def.status === 'coming_soon') return;
    onSelect(def);
    onClose();
    setQuery('');
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="relative flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
              <h3 className="text-sm font-bold text-gray-900">Add a condition</h3>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-black/5 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search conditions…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>

            <div className="flex min-h-0 flex-1">
              {!searching && (
                <div className="w-2/5 shrink-0 space-y-0.5 overflow-y-auto border-r border-black/5 p-2">
                  {tabs.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      className={`w-full rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors ${
                        tab === t ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {t === 'recommended' ? 'Recommended' : CONDITION_CATEGORY_LABELS[t]}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
                {searching ? (
                  searchResults.length === 0 ? (
                    <p className="px-2 py-6 text-center text-xs text-slate-400">No matching conditions</p>
                  ) : (
                    searchResults.map((def) => (
                      <ConditionTypeRow key={def.key} def={def} onSelect={handleSelect} />
                    ))
                  )
                ) : (
                  <>
                    {tabItems.map((def) => (
                      <ConditionTypeRow key={def.key} def={def} onSelect={handleSelect} />
                    ))}

                    {igItems.length > 0 && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setIgOpen((v) => !v)}
                          className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50"
                        >
                          {igOpen ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                          Instagram
                          <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                            {igItems.length}
                          </span>
                        </button>
                        {igOpen && (
                          <div className="ml-1 space-y-0.5 border-l border-black/5 pl-2">
                            {igItems.map((def) => (
                              <ConditionTypeRow key={def.key} def={def} onSelect={handleSelect} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {tabItems.length === 0 && igItems.length === 0 && (
                      <p className="px-2 py-6 text-center text-xs text-slate-400">No conditions here yet</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ConditionTypeRow({
  def,
  onSelect,
}: {
  def: ConditionTypeDef;
  onSelect: (def: ConditionTypeDef) => void;
}) {
  const Icon = def.icon;
  const disabled = def.status === 'coming_soon';
  return (
    <button
      type="button"
      disabled={disabled}
      title={disabled ? def.comingSoonNote : undefined}
      onClick={() => onSelect(def)}
      className={`flex w-full items-start gap-2.5 rounded-xl px-2 py-2 text-left transition-colors ${
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-slate-50'
      }`}
    >
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          disabled ? 'bg-slate-100 text-slate-400' : 'bg-primary/10 text-primary'
        }`}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="block text-sm font-semibold text-slate-900">{def.label}</span>
          {disabled && (
            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
              Coming soon
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500 line-clamp-2">
          {disabled ? def.comingSoonNote : def.description}
        </span>
      </span>
    </button>
  );
}
