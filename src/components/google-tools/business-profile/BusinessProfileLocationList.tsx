import { Loader2, MapPin, Search } from 'lucide-react';
import type { GbpLocation } from './types';
import { formatAddressLine, locationInitials } from './utils';
import { Input } from '../../ui/input';

type BusinessProfileLocationListProps = {
  locations: GbpLocation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  totalCount: number;
};

export function BusinessProfileLocationList({
  locations,
  selectedId,
  onSelect,
  loading,
  searchQuery,
  onSearchChange,
  totalCount,
}: BusinessProfileLocationListProps) {
  return (
    <section className="w-full lg:w-[360px] shrink-0 flex flex-col min-h-0 min-w-0 border-r border-swiss-line bg-white">
      <div className="shrink-0 px-4 py-3 border-b border-swiss-line bg-slate-50/80 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-swiss-muted">Locations</h2>
          <span className="text-meta text-swiss-faint tabular-nums">{totalCount} total</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-swiss-line bg-white px-3 py-2">
          <Search className="w-4 h-4 text-swiss-faint shrink-0" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search locations…"
            className="h-auto flex-1 min-w-0 bg-transparent text-sm text-swiss-ink placeholder:text-swiss-faint outline-none"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-swiss-faint">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading locations…
          </div>
        ) : locations.length === 0 ? (
          <div className="py-20 px-6 text-center">
            <MapPin className="w-8 h-8 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-swiss-muted">No locations found</p>
            <p className="text-xs text-swiss-faint mt-1">
              Sync your account or try another business account.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0eef5]">
            {locations.map((loc) => {
              const id = loc.id;
              const selected = selectedId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelect(id)}
                  className={`group relative w-full text-left px-4 py-3.5 transition-all duration-150 ${
                    selected
                      ? 'bg-[#e8f5e9] border-l-[3px] border-l-[#34A853] shadow-[inset_0_0_0_1px_rgba(52,168,83,0.08)]'
                      : 'border-l-[3px] border-l-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e8f5e9] to-[#f1f8e9] flex items-center justify-center text-sm font-black text-[#34A853] shrink-0">
                      {locationInitials(loc.title)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-950 truncate">
                        {loc.title || 'Untitled location'}
                      </p>
                      <p className="text-xs text-swiss-muted truncate mt-0.5">
                        {formatAddressLine(loc.storefrontAddress)}
                      </p>
                      {loc.regularHours?.periods && loc.regularHours.periods.length > 0 && (
                        <p className="text-meta text-[#34A853] font-semibold mt-1">
                          Hours available
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
