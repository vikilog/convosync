import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { GoogleToolProduct } from '../../../lib/googleTools';
import { GOOGLE_TOOL_META } from '../../../lib/googleTools';
import { pathForGoogleTool } from '../../../routes';

type NavSection = {
  id: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

type GoogleToolsSidebarProps = {
  product: GoogleToolProduct;
  email?: string | null;
  connectedTools: GoogleToolProduct[];
  sections?: NavSection[];
  footer?: ReactNode;
  onClose?: () => void;
  accentClass?: string;
  accentBg?: string;
};

export function GoogleToolsSidebar({
  product,
  email,
  connectedTools,
  sections,
  footer,
  onClose,
  accentClass = 'text-primary',
  accentBg = 'bg-[#f3eeff]',
}: GoogleToolsSidebarProps) {
  const meta = GOOGLE_TOOL_META[product];
  const ProductIcon = meta.icon;

  return (
    <aside className="shrink-0 w-[240px] flex flex-col min-h-0 bg-slate-50 border-r border-slate-200 overflow-y-auto overflow-x-hidden">
      <div className="p-3 border-b border-slate-200 bg-white/70">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-sm font-bold uppercase tracking-wider text-gray-400">Google tools</p>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-slate-50"
              aria-label="Close sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
        <nav className="space-y-0.5">
          {connectedTools.map((tool) => {
            const toolMeta = GOOGLE_TOOL_META[tool];
            const Icon = toolMeta.icon;
            return (
              <NavLink
                key={tool}
                to={pathForGoogleTool(tool)}
                onClick={onClose}
                className={({ isActive }) =>
                  `w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? `${accentBg} ${accentClass} font-bold`
                      : 'text-gray-600 hover:bg-white hover:text-gray-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isActive ? accentClass : 'text-gray-400'}`}
                    />
                    <span className="truncate">{toolMeta.shortLabel}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {sections && sections.length > 0 && (
        <div className="p-3 border-b border-slate-200 space-y-0.5">
          <p className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
            Browse
          </p>
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={section.onClick}
              className={`w-full text-left px-2.5 py-2 rounded-lg text-sm transition-all ${
                section.active
                  ? `${accentBg} ${accentClass} font-bold`
                  : 'text-gray-600 hover:bg-white'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 border-b border-slate-200">
        <p className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Account</p>
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 shadow-sm ${accentBg} ${accentClass}`}
          >
            {(email?.[0] ?? meta.shortLabel[0]).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-950 truncate">{meta.label}</p>
            <p className="text-meta text-gray-500 truncate">{email ?? 'Connected account'}</p>
          </div>
        </div>
      </div>

      {footer && (
        <div className="p-4 mt-auto border-t border-slate-200 text-xs text-gray-400">{footer}</div>
      )}

      {!footer && (
        <div className="p-4 mt-auto border-t border-slate-200 text-xs text-gray-400 flex items-center gap-1.5">
          <ProductIcon className="w-3 h-3" />
          ConvoSync · {meta.shortLabel}
        </div>
      )}
    </aside>
  );
}
