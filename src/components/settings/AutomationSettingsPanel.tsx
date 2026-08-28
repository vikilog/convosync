/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { AutomationControlsPanel } from './AutomationControlsPanel';
import { TagsPanel } from './TagsPanel';

const TABS = [
  { key: 'controls', label: 'Controls', path: '/settings/automation' },
  { key: 'tags', label: 'Tags', path: '/settings/automation/tags' },
] as const;

/** Settings → Automation, with a Tags sub-tab (Settings → Automation → Tags). */
export function AutomationSettingsPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const isTags = location.pathname.replace(/\/$/, '').endsWith('/tags');
  const activeKey = isTags ? 'tags' : 'controls';

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg bg-white ring-1 ring-swiss-line p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => navigate(tab.path)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
              activeKey === tab.key
                ? 'bg-primary/10 text-primary'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeKey === 'tags' ? <TagsPanel /> : <AutomationControlsPanel />}
    </div>
  );
}
