import { NavLink } from 'react-router-dom';
import { GOOGLE_TOOL_META, type GoogleToolProduct } from '../../lib/googleTools';
import { pathForGoogleTool } from '../../routes';

type GoogleToolsNavProps = {
  connectedTools: GoogleToolProduct[];
};

export function GoogleToolsNav({ connectedTools }: GoogleToolsNavProps) {
  return (
    <aside className="w-[188px] shrink-0 border-r border-slate-200 bg-slate-50 py-3 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden">
      <p className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2 px-4">
        Connected tools
      </p>
      <nav className="space-y-0.5 px-2">
        {connectedTools.map((product) => {
          const meta = GOOGLE_TOOL_META[product];
          const Icon = meta.icon;
          const to = pathForGoogleTool(product);
          return (
            <NavLink
              key={product}
              to={to}
              className={({ isActive }) =>
                `w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-[#e8f4ff] text-[#4285F4] font-bold'
                    : 'text-gray-600 hover:bg-white hover:text-[#4285F4]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#4285F4]' : 'text-gray-400'}`}
                  />
                  <span className="truncate">{meta.shortLabel}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
