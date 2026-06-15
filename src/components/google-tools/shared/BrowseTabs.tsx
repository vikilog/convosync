type BrowseTab = {
  id: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

type BrowseTabsProps = {
  tabs: BrowseTab[];
  accentClass?: string;
  accentBg?: string;
  className?: string;
};

/** Horizontal in-tool navigation (replaces vertical Google Tools sidebars). */
export function BrowseTabs({
  tabs,
  accentClass = 'text-[#4285F4]',
  accentBg = 'bg-[#e8f4ff]',
  className = '',
}: BrowseTabsProps) {
  return (
    <div className={`flex flex-wrap items-center gap-1 shrink-0 overflow-x-auto ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={tab.onClick}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
            tab.active ? `${accentBg} ${accentClass}` : 'text-gray-600 hover:bg-slate-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
