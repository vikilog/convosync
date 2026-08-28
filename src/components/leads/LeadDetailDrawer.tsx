import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  Clock,
  Instagram,
  MessageSquare,
  NotebookPen,
  UserPlus,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { pathForContact } from '../../routes';
import { timeAgo, type Lead } from './types';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

type DrawerTab = 'origin' | 'activity' | 'notes';

function InlineField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-swiss-faint">
        {label}
      </span>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-auto mt-1 w-full rounded-lg border border-swiss-line px-3 py-2 text-sm font-medium text-swiss-ink outline-none focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

export function LeadDetailDrawer({
  lead,
  open,
  onClose,
  onChange,
  stages,
}: {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onChange: (next: Lead) => void;
  stages: { id: string; name: string; isFinal?: boolean }[];
}) {
  const [tab, setTab] = useState<DrawerTab>('origin');
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState('');
  const convertingRef = useRef(false);

  if (!lead) return null;

  const stageMeta = stages.find((s) => s.id === lead.stageId);
  const canConvert = Boolean(stageMeta?.isFinal) && !lead.contactId;

  const patch = (partial: Partial<Lead>) => {
    onChange({
      ...lead,
      ...partial,
      updatedAt: new Date().toISOString(),
    });
  };

  const convert = async () => {
    // The `converting`/`disabled` state isn't visible until the next
    // render, so a fast double-click can fire two overlapping conversion
    // requests before it updates.
    if (convertingRef.current) return;
    const confirmed = window.confirm(
      `Convert ${lead.name || 'this lead'} to a contact? This can't be undone from here.`
    );
    if (!confirmed) return;
    convertingRef.current = true;
    setConverting(true);
    setConvertError('');
    try {
      const res = await api.convertLeadToContact(lead.id);
      onChange({
        ...lead,
        ...(res.lead as Lead),
        contactId: res.contactId,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      let message = err instanceof Error ? err.message : 'Convert failed';
      try {
        const parsed = JSON.parse(message) as { error?: string };
        if (parsed.error) message = parsed.error;
      } catch {
        /* keep */
      }
      setConvertError(message);
    } finally {
      convertingRef.current = false;
      setConverting(false);
    }
  };

  const tabs: { id: DrawerTab; label: string; icon: React.ComponentType<{ className?: string }> }[] =
    [
      { id: 'origin', label: 'Origin', icon: Instagram },
      { id: 'activity', label: 'Activity', icon: Clock },
      { id: 'notes', label: 'Notes', icon: NotebookPen },
    ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close lead details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-gray-900/40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 z-50 flex h-full w-full max-w-[440px] flex-col border-l border-swiss-line bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-swiss-line px-5 py-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-swiss-faint">
                  Lead
                </p>
                <h2 className="truncate text-base font-bold text-swiss-ink">
                  {lead.name?.trim() || 'Unknown'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg p-1.5 text-swiss-faint hover:bg-gray-100 hover:text-swiss-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {canConvert && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                  <p className="text-xs font-semibold text-emerald-900">
                    Final board — add this lead as a contact
                  </p>
                  {convertError && (
                    <p className="mt-1 text-[11px] font-medium text-red-600">{convertError}</p>
                  )}
                  <button
                    type="button"
                    disabled={converting}
                    onClick={() => void convert()}
                    className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {converting ? 'Converting…' : 'Add to contact'}
                  </button>
                </div>
              )}

              {lead.contactId && (
                <Link
                  to={pathForContact(lead.contactId)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800 hover:bg-sky-100"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Contact created — open contact
                </Link>
              )}

              <div className="grid grid-cols-1 gap-3">
                <InlineField
                  label="Name"
                  value={lead.name ?? ''}
                  placeholder="Unknown"
                  onChange={(name) => patch({ name: name || null })}
                />
                <InlineField
                  label="Phone"
                  value={lead.phone ?? ''}
                  placeholder="+91 … (optional — IG leads use a synthetic id)"
                  onChange={(phone) => patch({ phone: phone || null })}
                />
                <InlineField
                  label="Email"
                  value={lead.email ?? ''}
                  placeholder="name@company.com"
                  onChange={(email) => patch({ email: email || null })}
                />
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-swiss-faint">
                  Board
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {stages.map((s) => {
                    const active = lead.stageId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          if (lead.stageId === s.id) return;
                          patch({
                            stageId: s.id,
                            stage: s.name,
                            activity: [
                              {
                                id: `act-${Date.now()}`,
                                type: 'stage_change',
                                text: `Moved from ${lead.stage} → ${s.name}`,
                                at: new Date().toISOString(),
                              },
                              ...lead.activity,
                            ],
                          });
                        }}
                        className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                          active
                            ? 'bg-primary text-white'
                            : 'border border-black/10 bg-white text-swiss-muted hover:bg-surface-muted'
                        }`}
                      >
                        {s.name}
                        {s.isFinal ? ' · Final' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-1 rounded-xl bg-white p-1">
                {tabs.map((t) => {
                  const Icon = t.icon;
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold ${
                        active
                          ? 'bg-white text-swiss-ink '
                          : 'text-swiss-muted hover:text-swiss-ink'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {tab === 'origin' && (
                <div className="space-y-3">
                  {lead.origin ? (
                    <blockquote className="rounded-2xl border border-[#E1306C]/20 bg-[#fce8f0]/40 p-4">
                      <div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#C13584]">
                        <Instagram className="h-3.5 w-3.5" />
                        Original Instagram comment
                      </div>
                      <div className="flex gap-3">
                        <img
                          src={lead.origin.postThumbnailUrl}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-xl object-cover border border-swiss-line"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-swiss-ink">
                            @{lead.origin.username}
                          </p>
                          <p className="mt-1 text-sm text-swiss-ink whitespace-pre-wrap">
                            {lead.origin.commentText}
                          </p>
                          <p className="mt-2 text-[11px] text-swiss-faint">
                            {timeAgo(lead.origin.commentedAt)}
                          </p>
                        </div>
                      </div>
                    </blockquote>
                  ) : (
                    <p className="text-sm text-swiss-faint">No Instagram origin on this lead.</p>
                  )}
                  {lead.requirement && (
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-swiss-faint">
                        Requirement
                      </span>
                      <p className="mt-1 text-sm text-swiss-ink whitespace-pre-wrap">
                        {lead.requirement}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {tab === 'activity' && (
                <ul className="space-y-2">
                  {lead.activity.length === 0 ? (
                    <p className="text-sm text-swiss-faint">No activity yet.</p>
                  ) : (
                    lead.activity.map((a) => (
                      <li
                        key={a.id}
                        className="bg-white border border-swiss-line px-3 py-2"
                      >
                        <div className="flex items-center gap-2 text-[11px] text-swiss-faint">
                          <MessageSquare className="h-3 w-3" />
                          {timeAgo(a.at)}
                        </div>
                        <p className="mt-0.5 text-sm text-swiss-ink">{a.text}</p>
                      </li>
                    ))
                  )}
                </ul>
              )}

              {tab === 'notes' && (
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-swiss-faint">
                    Notes
                  </span>
                  <Textarea
                    value={lead.notes}
                    onChange={(e) => patch({ notes: e.target.value })}
                    rows={8}
                    placeholder="Internal notes…"
                    className="min-h-0 mt-1 w-full resize-none rounded-xl border border-swiss-line px-3 py-2 text-sm text-swiss-ink outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
