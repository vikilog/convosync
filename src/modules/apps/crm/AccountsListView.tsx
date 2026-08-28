/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2 } from 'lucide-react';
import { pathForCrmAccount, pathForCrmNewAccount } from '../../../routes';
import { CRM_CHANGED_EVENT, deleteAccount, listAccounts, listContacts, listTasksForAccount } from './store';
import { mostRecent, timeAgo } from './utils';
import { Input } from '../../../components/ui/input';

export function AccountsListView() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [, forceRefresh] = useState(0);

  useEffect(() => {
    const refresh = () => forceRefresh((n) => n + 1);
    window.addEventListener(CRM_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(CRM_CHANGED_EVENT, refresh);
  }, []);

  const accounts = listAccounts();
  const filtered = useMemo(
    () =>
      accounts.filter((a) =>
        String(a.fields.name ?? '').toLowerCase().includes(search.toLowerCase())
      ),
    [accounts, search]
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-950">Accounts</h1>
          <p className="text-xs text-swiss-muted font-medium mt-0.5">
            Businesses you deal with — each holds its own contacts, tasks and activity.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(pathForCrmNewAccount())}
          className="px-3 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-meta font-bold flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          New Account
        </button>
      </div>

      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-swiss-faint" />
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search accounts..."
          className="h-auto w-full bg-white border border-swiss-line rounded-xl py-1.5 pl-9 pr-3 text-meta font-semibold outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-swiss-line overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_2.5rem] px-5 py-3 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wide text-swiss-faint">
            <div>Account</div>
            <div>Owner</div>
            <div>Contacts</div>
            <div>Open Tasks</div>
            <div>Last Activity</div>
            <div />
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center text-sm font-semibold text-swiss-faint">
              {accounts.length === 0 ? 'No accounts yet — create your first one.' : 'No accounts match your search.'}
            </div>
          ) : (
            filtered.map((account) => {
              const contacts = listContacts(account.id);
              const tasks = listTasksForAccount(account.id);
              const contactCount = contacts.length;
              const openTasks = tasks.filter((t) => !t.done).length;
              const lastActivity = mostRecent([
                account.updatedAt,
                ...contacts.map((c) => c.updatedAt),
                ...tasks.map((t) => t.updatedAt),
              ]);
              return (
                <div
                  key={account.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(pathForCrmAccount(account.id))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(pathForCrmAccount(account.id));
                  }}
                  className="group grid grid-cols-[2fr_1fr_1fr_1fr_1fr_2.5rem] items-center px-5 py-3 border-b border-slate-50 last:border-b-0 text-left hover:bg-black/[0.02] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black text-primary bg-[#e6fcef] shrink-0">
                      {String(account.fields.name ?? '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-swiss-ink truncate">{String(account.fields.name ?? 'Untitled')}</p>
                      <p className="text-xs text-swiss-faint truncate">{String(account.fields.industry ?? '—')}</p>
                    </div>
                  </div>
                  <div className="text-sm text-swiss-muted">{String(account.fields.owner ?? '—')}</div>
                  <div className="text-sm text-swiss-muted">{contactCount}</div>
                  <div className="text-sm text-swiss-muted">{openTasks}</div>
                  <div className="text-sm text-swiss-muted">{lastActivity ? timeAgo(lastActivity) : '—'}</div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const warning =
                          contactCount > 0
                            ? `Delete "${String(account.fields.name)}"? This also deletes its ${contactCount} contact${contactCount === 1 ? '' : 's'} and any linked tasks. This cannot be undone.`
                            : `Delete "${String(account.fields.name)}"? This cannot be undone.`;
                        if (!window.confirm(warning)) return;
                        deleteAccount(account.id);
                      }}
                      className="p-1.5 rounded-md text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-danger-red transition-colors"
                      aria-label={`Delete ${String(account.fields.name ?? 'account')}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
