/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Check, Plus, UserRound } from 'lucide-react';
import { pathForCrmAccounts, pathForCrmAccount, pathForCrmContact, pathForCrmNewTask } from '../../../routes';
import { CRM_CHANGED_EVENT, getAccount, getContact, listTasks, toggleTaskDone } from './store';
import { EditTaskButton, PrioritySelect, TaskImageThumbs } from './TaskQuickActions';

type Filter = 'all' | 'open' | 'done';

export function TasksListView() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [, forceRefresh] = useState(0);

  useEffect(() => {
    const refresh = () => forceRefresh((n) => n + 1);
    window.addEventListener(CRM_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(CRM_CHANGED_EVENT, refresh);
  }, []);

  const tasks = listTasks().filter((t) => {
    if (filter === 'open') return !t.done;
    if (filter === 'done') return t.done;
    return true;
  });

  const openLink = (link: { type: 'account' | 'contact'; id: string } | null) => {
    if (!link) return;
    if (link.type === 'account') navigate(pathForCrmAccount(link.id));
    else {
      const contact = getContact(link.id);
      if (contact) navigate(pathForCrmContact(contact.accountId, contact.id));
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <button
        type="button"
        onClick={() => navigate(pathForCrmAccounts())}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-swiss-muted hover:text-primary transition-colors self-start"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Accounts
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-950">Tasks</h1>
          <p className="text-xs text-swiss-muted font-medium mt-0.5">Everything due across your accounts and contacts.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(pathForCrmNewTask())}
          className="px-3 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-meta font-bold flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          New Task
        </button>
      </div>

      <div className="flex gap-1.5">
        {(['all', 'open', 'done'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-[13px] font-bold border transition-colors ${
              filter === f ? 'bg-primary border-primary text-white' : 'bg-white border-border-subtle text-swiss-muted hover:bg-black/[0.03]'
            }`}
          >
            {f === 'all' ? 'All' : f === 'open' ? 'Open' : 'Done'}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-swiss-line overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="grid grid-cols-[2fr_1.2fr_0.9fr_0.8fr_0.9fr_1.1fr] px-5 py-3 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wide text-swiss-faint">
            <div>Task</div>
            <div>Linked to</div>
            <div>Due</div>
            <div>Priority</div>
            <div>Assignee</div>
            <div className="text-right">Actions</div>
          </div>

          {tasks.length === 0 ? (
            <div className="py-16 text-center text-sm font-semibold text-swiss-faint">No tasks yet.</div>
          ) : (
            tasks.map((task) => {
              const linkLabel =
                task.link?.type === 'account'
                  ? getAccount(task.link.id)?.fields.name
                  : task.link?.type === 'contact'
                    ? getContact(task.link.id)?.fields.name
                    : null;
              const LinkIcon = task.link?.type === 'contact' ? UserRound : Building2;
              const dueDate = task.fields.dueDate ? String(task.fields.dueDate) : '—';
              return (
                <div
                  key={task.id}
                  className="grid grid-cols-[2fr_1.2fr_0.9fr_0.8fr_0.9fr_1.1fr] items-center px-5 py-3 border-b border-slate-50 last:border-b-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleTaskDone(task.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        task.done ? 'bg-primary border-primary text-white' : 'border-slate-300'
                      }`}
                    >
                      {task.done ? <Check className="w-3 h-3" /> : null}
                    </button>
                    <div className="min-w-0">
                      <span className={`text-sm font-bold truncate ${task.done ? 'line-through text-swiss-faint' : 'text-swiss-ink'}`}>
                        {String(task.fields.title ?? 'Untitled task')}
                      </span>
                      <TaskImageThumbs images={task.images} />
                    </div>
                  </div>
                  <div>
                    {linkLabel ? (
                      <button
                        type="button"
                        onClick={() => openLink(task.link)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          task.link?.type === 'contact' ? 'bg-[#eaf2ff] text-[#1d5fc9]' : 'bg-[#e6fcef] text-primary'
                        }`}
                      >
                        <LinkIcon className="w-3 h-3" />
                        {String(linkLabel)}
                      </button>
                    ) : (
                      <span className="text-xs text-swiss-faint">—</span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-swiss-muted">{dueDate}</div>
                  <div>
                    <PrioritySelect taskId={task.id} value={String(task.fields.priority ?? 'Medium')} />
                  </div>
                  <div className="text-xs font-semibold text-swiss-muted">{String(task.fields.assignee ?? '—')}</div>
                  <div className="flex justify-end">
                    <EditTaskButton taskId={task.id} />
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
