/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Mail, Phone, CalendarDays, FileText } from 'lucide-react';
import { pathForCrmAccount } from '../../../routes';
import {
  CRM_CHANGED_EVENT,
  addTimelineEntry,
  getAccount,
  getContact,
  listTasks,
  listTimeline,
  pushContactToContacts,
} from './store';
import type { TimelineEntryKind } from './types';
import { timeAgo } from './utils';
import { Textarea } from '../../../components/ui/textarea';

export function ContactDetailView({ accountId, contactId }: { accountId: string; contactId: string }) {
  const navigate = useNavigate();
  const [, forceRefresh] = useState(0);
  const [composerKind, setComposerKind] = useState<TimelineEntryKind>('meeting');
  const [composerText, setComposerText] = useState('');

  useEffect(() => {
    const refresh = () => forceRefresh((n) => n + 1);
    window.addEventListener(CRM_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(CRM_CHANGED_EVENT, refresh);
  }, []);

  const account = getAccount(accountId);
  const contact = getContact(contactId);
  if (!contact) {
    return (
      <div className="w-full max-w-xl mx-auto pt-16 text-center text-sm font-semibold text-swiss-faint">
        Contact not found.
      </div>
    );
  }

  const timeline = listTimeline(contactId);
  const linkedTasks = listTasks({ type: 'contact', id: contactId });

  const handleSaveEntry = () => {
    const text = composerText.trim();
    if (!text) return;
    addTimelineEntry(contactId, composerKind, text, 'You');
    setComposerText('');
  };

  return (
    <div className="w-full pb-12">
      <button
        type="button"
        onClick={() => navigate(pathForCrmAccount(accountId))}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-swiss-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to {account ? String(account.fields.name) : 'Account'}
      </button>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">
        <div className="bg-white rounded-2xl border border-swiss-line p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="w-13 h-13 rounded-full bg-[#eaf2ff] text-[#1d5fc9] flex items-center justify-center text-lg font-black" style={{ width: 52, height: 52 }}>
            {String(contact.fields.name ?? '?').slice(0, 2).toUpperCase()}
          </div>
          <p className="mt-3 text-base font-black text-gray-950">{String(contact.fields.name ?? 'Untitled')}</p>
          <p className="text-xs text-swiss-faint">
            {String(contact.fields.role ?? '—')}
            {account ? ` · ${String(account.fields.name)}` : ''}
          </p>

          {contact.fields.phone ? (
            <div className="flex items-center gap-2 mt-3 text-xs text-swiss-muted">
              <Phone className="w-3.5 h-3.5 text-swiss-faint" />
              {String(contact.fields.phone)}
            </div>
          ) : null}
          {contact.fields.email ? (
            <div className="flex items-center gap-2 mt-2 text-xs text-swiss-muted">
              <Mail className="w-3.5 h-3.5 text-swiss-faint" />
              {String(contact.fields.email)}
            </div>
          ) : null}

          {contact.pushedToContactId ? (
            <>
              <div className="mt-4 w-full py-2.5 rounded-lg bg-[#e6fcef] text-primary text-sm font-bold flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Synced to Contacts
              </div>
              <p className="mt-2 text-[10px] text-swiss-faint text-center">Matched on phone number</p>
            </>
          ) : (
            <button
              type="button"
              onClick={() => pushContactToContacts(contactId)}
              className="mt-4 w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-bold"
            >
              Push to Contacts
            </button>
          )}

          <div className="mt-5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-swiss-faint mb-2">Linked tasks</p>
            {linkedTasks.length === 0 ? (
              <p className="text-xs text-swiss-faint">No tasks linked to this contact.</p>
            ) : (
              linkedTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-xs text-swiss-ink py-1.5 border-t border-slate-100">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.done ? 'bg-slate-300' : 'bg-[#92400e]'}`}
                  />
                  <span className={task.done ? 'line-through text-swiss-faint' : ''}>
                    {String(task.fields.title ?? 'Untitled task')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl border border-swiss-line p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setComposerKind('meeting')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  composerKind === 'meeting' ? 'bg-[#e6fcef] text-primary' : 'bg-slate-100 text-swiss-muted'
                }`}
              >
                Log a meeting
              </button>
              <button
                type="button"
                onClick={() => setComposerKind('note')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  composerKind === 'note' ? 'bg-[#e6fcef] text-primary' : 'bg-slate-100 text-swiss-muted'
                }`}
              >
                Add a note
              </button>
            </div>
            <Textarea
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              rows={2}
              placeholder={composerKind === 'meeting' ? 'What happened in the meeting?' : 'Add a note…'}
              className="min-h-0 mt-2.5 w-full rounded-lg border border-swiss-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveEntry}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold"
              >
                Save to timeline
              </button>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-black text-swiss-ink mb-3">Timeline</p>
            {timeline.length === 0 ? (
              <p className="text-sm text-swiss-faint py-8 text-center">Nothing logged yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {timeline.map((entry) => {
                  const Icon = entry.kind === 'meeting' ? CalendarDays : FileText;
                  const iconBg = entry.kind === 'meeting' ? '#eaf2ff' : '#f1ecfb';
                  const iconColor = entry.kind === 'meeting' ? '#1d5fc9' : '#6b3fc9';
                  return (
                    <div key={entry.id} className="flex gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: iconBg, color: iconColor }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 bg-white rounded-xl border border-swiss-line px-3.5 py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-swiss-ink">
                            {entry.kind === 'meeting' ? 'Meeting logged' : 'Note added'}
                          </span>
                          <span className="text-[10px] text-swiss-faint">{timeAgo(entry.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-xs text-swiss-muted leading-relaxed">{entry.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
