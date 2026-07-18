/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Ban,
  History,
  MessageSquare,
  Pencil,
  Phone,
  Sparkles,
  Tag,
  Trash2,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import type { Contact } from '../../types';
import {
  ContactJourneyPanel,
  type ContactJourneyProgress,
} from './ContactJourneyPanel';
import { ConversationCallRecordings } from './ConversationCallRecordings';
import { ContactInsightPanel } from './ContactInsightPanel';

type JourneyOption = { id: string; name: string };

type SidebarTab = 'profile' | 'calls' | 'ai';

type Props = {
  contact: Contact;
  conversationId: string;
  assigneeLabel: string;
  journeyProgress: ContactJourneyProgress | null;
  journeyInitialLoading?: boolean;
  publishedJourneys?: JourneyOption[];
  assignedJourneyId?: string | null;
  onAssignJourney?: (journeyId: string) => void;
  onEditContact: () => void;
  onDeleteChat: () => void;
  onViewAudits: () => void;
  contactHandle: string;
  onClose?: () => void;
};

const TABS: { id: SidebarTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'calls', label: 'Calls', icon: Phone },
  { id: 'ai', label: 'AI Summary', icon: Sparkles },
];

function tagStyles(tag: string): string {
  const normalized = tag.toLowerCase();
  if (normalized.includes('hot')) {
    return 'bg-[#fff5e6] text-[#b45309] border-[#f2994a]/25';
  }
  if (normalized.includes('lead')) {
    return 'bg-[#e6f7ec] text-[#006d2f] border-[#5dfd8a]/30';
  }
  if (normalized.includes('cold')) {
    return 'bg-sky-50 text-sky-600 border-sky-100';
  }
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

function DetailRow({
  icon: Icon,
  label,
  value,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 py-2">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p
          className="mt-0.5 text-sm font-semibold text-gray-900 break-words leading-snug"
          title={title ?? value}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export const InboxContactSidebar: React.FC<Props> = ({
  contact,
  conversationId,
  assigneeLabel,
  journeyProgress,
  journeyInitialLoading,
  publishedJourneys,
  assignedJourneyId,
  onAssignJourney,
  onEditContact,
  onDeleteChat,
  onViewAudits,
  contactHandle,
  onClose,
}) => {
  const [tab, setTab] = useState<SidebarTab>('profile');

  const initials = contact.name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="flex h-full w-full xl:w-[380px] shrink-0 flex-col border-l border-slate-200 bg-slate-50 text-left">
      {onClose && (
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2.5 xl:hidden">
          <p className="text-sm font-bold text-gray-900">Contact details</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-sky-50 hover:text-sky-600 transition-colors"
            aria-label="Close contact details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div
        role="tablist"
        aria-label="Contact sidebar"
        className="shrink-0 flex border-b border-slate-200 bg-white px-2 pt-2 gap-0.5"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-t-lg px-2 py-2 text-[11px] font-bold transition-colors cursor-pointer ${
                active
                  ? 'bg-slate-50 text-sky-700 border border-b-0 border-slate-200'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-slate-50/80'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-sky-600' : ''}`} />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div
          role="tabpanel"
          hidden={tab !== 'profile'}
          className={tab === 'profile' ? 'space-y-3' : 'hidden'}
        >
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col items-center text-center">
                {contact.avatar ? (
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="mb-3 h-[72px] w-[72px] rounded-full border-[3px] border-sky-100 object-cover shadow-sm"
                  />
                ) : (
                  <div className="mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] border-sky-100 bg-sky-50 text-xl font-bold text-sky-600">
                    {initials}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <h3 className="text-base font-bold leading-tight text-gray-950">{contact.name}</h3>
                  <button
                    type="button"
                    onClick={onEditContact}
                    className="cursor-pointer rounded-md p-1 text-gray-400 transition-colors hover:bg-sky-50 hover:text-sky-600"
                    title="Edit contact"
                    aria-label="Edit contact"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="mt-1 font-mono text-xs font-semibold text-gray-500">{contactHandle}</p>

                {contact.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {contact.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tagStyles(tag)}`}
                      >
                        {tag.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {contact.channel === 'instagram' &&
                (contact.instagramBio ||
                  contact.instagramFollowerCount ||
                  contact.instagramVerified) && (
                  <div className="mt-4 border-t border-slate-200 pt-3 text-left">
                    {contact.instagramBio && (
                      <p className="text-xs leading-relaxed text-gray-600 whitespace-pre-wrap">
                        {contact.instagramBio}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-gray-500">
                      {contact.instagramFollowerCount && (
                        <span>{contact.instagramFollowerCount} followers</span>
                      )}
                      {contact.instagramFollowsCount && (
                        <span>{contact.instagramFollowsCount} following</span>
                      )}
                      {contact.instagramMediaCount && (
                        <span>{contact.instagramMediaCount} posts</span>
                      )}
                      {contact.instagramVerified && (
                        <span className="text-sky-600">Verified</span>
                      )}
                    </div>
                    {(contact.instagramFollowsBusiness != null ||
                      contact.instagramBusinessFollowsUser != null) && (
                      <div className="mt-2 space-y-0.5 text-center text-[11px] font-medium text-gray-400">
                        {contact.instagramFollowsBusiness != null && (
                          <p>
                            {contact.instagramFollowsBusiness
                              ? 'Follows your business'
                              : 'Does not follow your business'}
                          </p>
                        )}
                        {contact.instagramBusinessFollowsUser != null && (
                          <p>
                            {contact.instagramBusinessFollowsUser
                              ? 'Your business follows them'
                              : 'Your business does not follow them'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <h4 className="px-1 text-xs font-bold text-gray-500">Contact details</h4>
              <div className="mt-1 divide-y divide-slate-100">
                <DetailRow icon={MessageSquare} label="Source" value={contact.source || '—'} />
                {contact.channel === 'instagram' && contact.instagramFollowerCount && (
                  <DetailRow
                    icon={Sparkles}
                    label="Followers"
                    value={contact.instagramFollowerCount}
                  />
                )}
                {contact.channel === 'instagram' && contact.handle && (
                  <DetailRow icon={MessageSquare} label="Username" value={contact.handle} />
                )}
                <DetailRow
                  icon={Tag}
                  label="Interest"
                  value={contact.courseInterest || '—'}
                  title={contact.courseInterest}
                />
                <DetailRow
                  icon={UserCheck}
                  label="Assigned to"
                  value={assigneeLabel}
                  title={assigneeLabel}
                />
              </div>
            </article>

            <ContactJourneyPanel
              progress={journeyProgress}
              initialLoading={journeyInitialLoading}
              publishedJourneys={publishedJourneys}
              assignedJourneyId={assignedJourneyId}
              onAssignJourney={onAssignJourney}
            />
        </div>

        {/* Keep mounted so tab switches don't remount / re-fetch; prefetch while on Profile */}
        <div role="tabpanel" hidden={tab !== 'calls'} className={tab === 'calls' ? '' : 'hidden'}>
          <ConversationCallRecordings conversationId={conversationId} />
        </div>

        <div role="tabpanel" hidden={tab !== 'ai'} className={tab === 'ai' ? '' : 'hidden'}>
          <ContactInsightPanel contactId={contact.id} />
        </div>
      </div>

      {tab === 'profile' && (
        <div className="shrink-0 border-t border-slate-200 bg-white/90 p-3 backdrop-blur-sm">
          <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">
            Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onEditContact}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-800 transition-colors hover:border-sky-200 hover:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5 text-sky-600" />
              Edit
            </button>
            <button
              type="button"
              onClick={onViewAudits}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-800 transition-colors hover:border-sky-200 hover:bg-slate-50"
            >
              <History className="h-3.5 w-3.5 text-gray-500" />
              Audits
            </button>
          </div>

          <button
            type="button"
            onClick={onDeleteChat}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#fecaca] bg-[#fffafa] px-3 py-2.5 text-xs font-bold text-[#ba1a1a] transition-colors hover:bg-[#fef2f2]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete chat
          </button>

          <button
            type="button"
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-900 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-gray-950"
          >
            <Ban className="h-3.5 w-3.5 text-[#fca5a5]" />
            Blacklist contact
          </button>
        </div>
      )}
    </section>
  );
};
