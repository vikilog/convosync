import { ChevronDown, Loader2 } from 'lucide-react';

export function SheetsBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="shrink-0 px-4 py-2 text-xs font-medium text-[#0F172A] bg-emerald-50 border-b border-emerald-200">
      {message}
    </div>
  );
}

export function SheetsLoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-20 text-sm text-gray-400">
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      {label}
    </div>
  );
}

export function SheetsToolbarSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="appearance-none rounded-lg border border-[#E2E8F0] bg-white pl-2.5 pr-8 py-1.5 text-sm font-semibold text-[#0F172A] outline-none focus:ring-2 focus:ring-[#16A34A]/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
    </div>
  );
}
