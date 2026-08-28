/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Ban,
  ChevronDown,
  History,
  Pencil,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react';
import type { Contact } from '../../types';
import {
  ContactJourneyPanel,
  type ContactJourneyProgress,
} from './ContactJourneyPanel';
import { ContactInsightPanel } from './ContactInsightPanel';
import { ContactLeadJourneyPanel } from '../leads/ContactLeadJourneyPanel';

type JourneyOption = { id: string; name: string };

// ponytail: 'calls' parked for later release — re-add Phone + ConversationCallRecordings
type SidebarTab = 'profile' | 'ai';

type Props = {
  contact: Contact;
  conversationId: string;
  journeyProgress: ContactJourneyProgress | null;
  journeyInitialLoading?: boolean;
  publishedJourneys?: JourneyOption[];
  assignedJourneyId?: string | null;
  onAssignJourney?: (journeyId: string) => void;
  automationLabel?: string;
  onEditContact: () => void;
  onDeleteChat: () => void;
  onBlacklistContact: () => void;
  onViewAudits: () => void;
  contactHandle: string;
  onClose?: () => void;
};

const TABS: { id: SidebarTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'profile', label: 'Profile', icon: User },
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
  return 'bg-surface-muted text-slate-600 border-swiss-line';
}

export const InboxContactSidebar: React.FC<Props> = ({
  contact,
  conversationId: _conversationId, // ponytail: used by Calls tab when re-enabled
  journeyProgress,
  journeyInitialLoading,
  publishedJourneys,
  assignedJourneyId,
  onAssignJourney,
  automationLabel,
  onEditContact,
  onDeleteChat,
  onBlacklistContact,
  onViewAudits,
  contactHandle,
  onClose,
}) => {
  const [tab, setTab] = useState<SidebarTab>('profile');
  const [profileOpen, setProfileOpen] = useState(true);

  const initials = contact.name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="flex h-full w-full shrink-0 flex-col bg-surface-muted text-left">
      {onClose && (
        <div className="flex items-center justify-between border-b border-swiss-line bg-surface px-3 py-2.5">
          <p className="text-sm font-bold text-swiss-ink">Contact & journey</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-swiss-muted transition-colors duration-200 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Close contact details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div
        role="tablist"
        aria-label="Contact sidebar"
        className="shrink-0 flex border-b border-swiss-line bg-surface px-2 pt-2 gap-0.5"
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
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-t-lg px-2 py-2 text-[11px] font-bold transition-colors duration-200 cursor-pointer ${
                active
                  ? 'bg-surface-muted text-primary border border-b-0 border-swiss-line'
                  : 'text-swiss-muted hover:text-swiss-ink hover:bg-surface-muted/80'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-primary' : ''}`} />
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
            <article className="overflow-hidden rounded-2xl border border-swiss-line bg-surface ">
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex w-full cursor-pointer items-center gap-2 p-3 text-left transition-colors hover:bg-surface-muted"
                aria-expanded={profileOpen}
              >
                {contact.avatar ? (
                  <img
                    src={contact.avatar}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full border-2 border-sky-100 object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-sky-100 bg-sky-50 text-xs font-bold text-sky-600">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-950">{contact.name}</p>
                  <p className="truncate font-mono text-[11px] font-semibold text-swiss-muted">
                    {contactHandle}
                  </p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-swiss-faint transition-transform duration-200 ${
                    profileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {profileOpen && (
                <div className="border-t border-swiss-line px-4 pb-4 pt-3">
                  <div className="flex flex-col items-center text-center">
                    {contact.avatar ? (
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="mb-3 h-[72px] w-[72px] rounded-full border-[3px] border-sky-100 object-cover "
                      />
                    ) : (
                      <div className="mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] border-sky-100 bg-sky-50 text-xl font-bold text-sky-600">
                        {initials}
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <h3 className="text-base font-bold leading-tight text-gray-950">
                        {contact.name}
                      </h3>
                      <button
                        type="button"
                        onClick={onEditContact}
                        className="cursor-pointer rounded-md p-1 text-swiss-faint transition-colors hover:bg-sky-50 hover:text-sky-600"
                        title="Edit contact"
                        aria-label="Edit contact"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <p className="mt-1 font-mono text-xs font-semibold text-swiss-muted">
                      {contactHandle}
                    </p>

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
                      <div className="mt-4 border-t border-swiss-line pt-3 text-left">
                        {contact.instagramBio && (
                          <p className="whitespace-pre-wrap text-xs leading-relaxed text-swiss-muted">
                            {contact.instagramBio}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-swiss-muted">
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
                          <div className="mt-2 space-y-0.5 text-center text-[11px] font-medium text-swiss-faint">
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
                </div>
              )}
            </article>

            <ContactJourneyPanel
              progress={journeyProgress}
              initialLoading={journeyInitialLoading}
              publishedJourneys={publishedJourneys}
              assignedJourneyId={assignedJourneyId}
              onAssignJourney={onAssignJourney}
              automationLabel={automationLabel}
            />

            <ContactLeadJourneyPanel contactId={contact.id} />
        </div>

        <div role="tabpanel" hidden={tab !== 'ai'} className={tab === 'ai' ? '' : 'hidden'}>
          <ContactInsightPanel contactId={contact.id} />
        </div>
      </div>

      {tab === 'profile' && (
        <div className="shrink-0 border-t border-swiss-line bg-surface/90 p-3 backdrop-blur-sm">
          <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-swiss-faint">
            Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onEditContact}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-swiss-line bg-surface px-3 py-2.5 text-xs font-bold text-swiss-ink transition-colors hover:border-sky-200 hover:bg-surface-muted"
            >
              <Pencil className="h-3.5 w-3.5 text-sky-600" />
              Edit
            </button>
            <button
              type="button"
              onClick={onViewAudits}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-swiss-line bg-surface px-3 py-2.5 text-xs font-bold text-swiss-ink transition-colors hover:border-sky-200 hover:bg-surface-muted"
            >
              <History className="h-3.5 w-3.5 text-swiss-muted" />
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
            onClick={onBlacklistContact}
            disabled={contact.tags.includes('Blocked')}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-900 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-gray-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Ban className="h-3.5 w-3.5 text-[#fca5a5]" />
            {contact.tags.includes('Blocked') ? 'Blacklisted' : 'Blacklist contact'}
          </button>
        </div>
      )}
    </section>
  );
};
