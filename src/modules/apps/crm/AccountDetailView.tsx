/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Check, Trash2 } from 'lucide-react';
import { pathForCrmAccounts, pathForCrmContact, pathForCrmNewContact, pathForCrmNewTask } from '../../../routes';
import {
  CRM_CHANGED_EVENT,
  deleteAccount,
  getAccount,
  getContact,
  listContacts,
  listTasksForAccount,
  toggleTaskDone,
} from './store';
import { EditTaskButton, PrioritySelect, TaskImageThumbs } from './TaskQuickActions';
import { mostRecent, timeAgo } from './utils';

type Tab = 'contacts' | 'tasks';

export function AccountDetailView({ accountId }: { accountId: string }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('contacts');
  const [, forceRefresh] = useState(0);

  useEffect(() => {
    const refresh = () => forceRefresh((n) => n + 1);
    window.addEventListener(CRM_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(CRM_CHANGED_EVENT, refresh);
  }, []);

  const account = getAccount(accountId);
  if (!account) {
    return (
      <div className="w-full max-w-xl mx-auto pt-16 text-center text-sm font-semibold text-swiss-faint">
        Account not found.
      </div>
    );
  }

  const contacts = listContacts(accountId);
  const tasks = listTasksForAccount(accountId);
  const openTaskCount = tasks.filter((t) => !t.done).length;
  const lastActivity = mostRecent([
    account.updatedAt,
    ...contacts.map((c) => c.updatedAt),
    ...tasks.map((t) => t.updatedAt),
  ]);

  return (
    <div className="w-full pb-12">
      <button
        type="button"
        onClick={() => navigate(pathForCrmAccounts())}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-swiss-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Accounts
      </button>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#e6fcef] text-primary flex items-center justify-center text-base font-black">
            {String(account.fields.name ?? '?').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-950">{String(account.fields.name ?? 'Untitled')}</h1>
            <div className="mt-1 flex gap-1.5">
              {account.fields.industry ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-swiss-muted">
                  {String(account.fields.industry)}
                </span>
              ) : null}
              {account.fields.owner ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#e8ece8] text-primary">
                  {String(account.fields.owner)} · Owner
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const contactCount = listContacts(accountId).length;
            const warning =
              contactCount > 0
                ? `Delete "${String(account.fields.name)}"? This also deletes its ${contactCount} contact${contactCount === 1 ? '' : 's'} and any linked tasks. This cannot be undone.`
                : `Delete "${String(account.fields.name)}"? This cannot be undone.`;
            if (!window.confirm(warning)) return;
            deleteAccount(accountId);
            navigate(pathForCrmAccounts());
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-red-100 bg-white text-danger-red hover:bg-red-50 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Account
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-swiss-line p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-bold uppercase tracking-wide text-swiss-faint">Contacts</p>
          <p className="mt-1.5 text-xl font-black text-gray-950">{contacts.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-swiss-line p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-bold uppercase tracking-wide text-swiss-faint">Open Tasks</p>
          <p className="mt-1.5 text-xl font-black text-gray-950">{openTaskCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-swiss-line p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-bold uppercase tracking-wide text-swiss-faint">Total Tasks</p>
          <p className="mt-1.5 text-xl font-black text-gray-950">{tasks.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-swiss-line p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-bold uppercase tracking-wide text-swiss-faint">Last Activity</p>
          <p className="mt-1.5 text-sm font-black text-gray-950">{lastActivity ? timeAgo(lastActivity) : '—'}</p>
        </div>
      </div>

      <div className="mt-6 flex gap-5 border-b border-swiss-line">
        <button
          type="button"
          onClick={() => setTab('contacts')}
          className={`pb-2.5 text-sm font-bold border-b-2 ${
            tab === 'contacts' ? 'border-primary text-primary' : 'border-transparent text-swiss-faint'
          }`}
        >
          Contacts
        </button>
        <button
          type="button"
          onClick={() => setTab('tasks')}
          className={`pb-2.5 text-sm font-bold border-b-2 ${
            tab === 'tasks' ? 'border-primary text-primary' : 'border-transparent text-swiss-faint'
          }`}
        >
          Tasks
        </button>
      </div>

      {tab === 'contacts' ? (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-swiss-ink">Contacts at {String(account.fields.name)}</h3>
            <button
              type="button"
              onClick={() => navigate(pathForCrmNewContact(accountId))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e6fcef] text-primary rounded-lg text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Contact
            </button>
          </div>

          {contacts.length === 0 ? (
            <p className="text-sm text-swiss-faint py-8 text-center">No contacts yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => navigate(pathForCrmContact(accountId, contact.id))}
                  className="flex items-start gap-3 bg-white rounded-2xl border border-swiss-line p-4 text-left hover:border-primary/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[#eaf2ff] text-[#1d5fc9] flex items-center justify-center text-xs font-black shrink-0">
                    {String(contact.fields.name ?? '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-swiss-ink truncate">{String(contact.fields.name ?? 'Untitled')}</p>
                    <p className="text-xs text-swiss-faint">{String(contact.fields.role ?? '—')}</p>
                    <p className="text-xs text-swiss-muted mt-1">{String(contact.fields.phone ?? '')}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-swiss-ink">All tasks — account &amp; its contacts</h3>
            <button
              type="button"
              onClick={() => navigate(pathForCrmNewTask())}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e6fcef] text-primary rounded-lg text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              New Task
            </button>
          </div>

          {tasks.length === 0 ? (
            <p className="text-sm text-swiss-faint py-8 text-center">No tasks linked to this account.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {tasks.map((task) => {
                const linkedContactName =
                  task.link?.type === 'contact' ? getContact(task.link.id)?.fields.name : null;
                const dueDate = task.fields.dueDate ? String(task.fields.dueDate) : null;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 bg-white rounded-xl border border-swiss-line px-4 py-3"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTaskDone(task.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        task.done ? 'bg-primary border-primary text-white' : 'border-slate-300'
                      }`}
                    >
                      {task.done ? <Check className="w-3 h-3" /> : null}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-sm font-bold ${task.done ? 'line-through text-swiss-faint' : 'text-swiss-ink'}`}
                      >
                        {String(task.fields.title ?? 'Untitled task')}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {linkedContactName ? (
                          <span className="text-[10.5px] font-bold text-[#1d5fc9]">via {String(linkedContactName)}</span>
                        ) : null}
                        {dueDate ? <span className="text-[10.5px] text-swiss-faint">Due {dueDate}</span> : null}
                      </div>
                      <TaskImageThumbs images={task.images} />
                    </div>
                    <PrioritySelect taskId={task.id} value={String(task.fields.priority ?? 'Medium')} />
                    <EditTaskButton taskId={task.id} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
