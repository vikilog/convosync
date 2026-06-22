type PillTab = {
  id: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

type PillSubTabsProps = {
  tabs: PillTab[];
  activeClassName?: string;
};

export function PillSubTabs({
  tabs,
  activeClassName = 'text-[#2563EB]',
}: PillSubTabsProps) {
  return (
    <div className="shrink-0 px-4 py-2.5 border-b border-[#E2E8F0] bg-white">
      <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#F1F5F9]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={tab.onClick}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-all ${
              tab.active
                ? `bg-white shadow-sm ${activeClassName}`
                : 'text-[#64748B] hover:text-[#0F172A] bg-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
