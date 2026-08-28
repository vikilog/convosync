import { NavLink } from 'react-router-dom';
import { ChevronLeft, MapPin } from 'lucide-react';
import type { GoogleToolProduct } from '../../../lib/googleTools';
import { GOOGLE_TOOL_META } from '../../../lib/googleTools';
import { pathForGoogleTool } from '../../../routes';

type BusinessProfileSidebarProps = {
  email?: string | null;
  connectedTools: GoogleToolProduct[];
  onClose?: () => void;
};

export function BusinessProfileSidebar({
  email,
  connectedTools,
  onClose,
}: BusinessProfileSidebarProps) {
  return (
    <aside className="shrink-0 w-[240px] flex flex-col min-h-0 bg-slate-50 border-r border-swiss-line overflow-y-auto overflow-x-hidden">
      <div className="p-3 border-b border-swiss-line bg-white/70">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-sm font-bold uppercase tracking-wider text-swiss-faint">
            Google tools
          </p>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-swiss-faint hover:bg-slate-50"
              aria-label="Close sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
        <nav className="space-y-0.5">
          {connectedTools.map((product) => {
            const meta = GOOGLE_TOOL_META[product];
            const Icon = meta.icon;
            return (
              <NavLink
                key={product}
                to={pathForGoogleTool(product)}
                onClick={onClose}
                className={({ isActive }) =>
                  `w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-[#e8f5e9] text-[#34A853] font-bold'
                      : 'text-swiss-muted hover:bg-white hover:text-[#34A853]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#34A853]' : 'text-swiss-faint'}`}
                    />
                    <span className="truncate">{meta.shortLabel}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-b border-swiss-line">
        <p className="text-sm font-bold uppercase tracking-wider text-swiss-faint mb-2">
          Account
        </p>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#e8f5e9] to-[#f1f8e9] flex items-center justify-center text-sm font-black text-[#34A853] shrink-0 ">
            {(email?.[0] ?? 'B').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-950 truncate">Business Profile</p>
            <p className="text-meta text-swiss-muted truncate">{email ?? 'Connected account'}</p>
          </div>
        </div>
      </div>

      <div className="p-4 mt-auto border-t border-swiss-line text-xs text-swiss-faint flex items-center gap-1.5">
        <MapPin className="w-3 h-3" />
        ConvoSync Local
      </div>
    </aside>
  );
}
