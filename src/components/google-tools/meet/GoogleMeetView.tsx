import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Calendar,
  Copy,
  ExternalLink,
  GitBranch,
  Loader2,
  Plus,
  Search,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { api, formatCatchError } from '../../../lib/api';
import { pathForTab } from '../../../routes';
import { useRegisterGoogleToolsToolbar } from '../GoogleToolsToolbarContext';
import type { MeetTab } from './types';
import { formatDate, formatDuration, formatTime, meetingStats } from './utils';
import { useGoogleMeet } from './useGoogleMeet';

const TABS: { id: MeetTab; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'today', label: "Today's" },
  { id: 'past', label: 'Past' },
  { id: 'all', label: 'All' },
];

export function GoogleMeetView() {
  const navigate = useNavigate();
  const [mobileDetail, setMobileDetail] = useState(false);
  const meet = useGoogleMeet();

  const onRefresh = useCallback(() => {
    meet.refresh?.();
  }, [meet.refresh]);

  const onSync = useCallback(async () => {
    if (!meet.integration?.connectionId) return;
    try {
      await api.syncGoogleProduct('meet', meet.integration.connectionId);
      meet.refresh?.();
      meet.setMessage('Meet synced.');
    } catch (err) {
      meet.setMessage(formatCatchError(err));
    }
  }, [meet.integration?.connectionId, meet.refresh, meet.setMessage]);

  useRegisterGoogleToolsToolbar(
    meet.integration
      ? {
          tool: 'meet',
          email: meet.integration.connectionEmail,
          lastSyncAt: meet.integration.lastSyncAt,
          syncing: false,
          onRefresh,
          onSync,
        }
      : { tool: 'meet' }
  );

  if (!meet.loading && !meet.integration) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 bg-slate-50">
        <div className="max-w-md text-center rounded-2xl border border-slate-200 bg-white px-8 py-10">
          <Video className="w-10 h-10 mx-auto text-[#4285F4] mb-4" />
          <h2 className="text-lg font-black text-gray-950">Google Meet not connected</h2>
          <p className="text-sm text-gray-500 mt-2">Connect Meet from Integrations → Google.</p>
          <button type="button" onClick={() => navigate(`${pathForTab('integrations')}?channel=google`)} className="mt-5 px-4 py-2.5 rounded-xl bg-[#4285F4] text-white text-sm font-bold">Go to Integrations</button>
        </div>
      </div>
    );
  }

  if (meet.loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading Google Meet…
      </div>
    );
  }

  const stats = meetingStats(meet.allMeetings);

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden bg-white flex-col">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-2.5 flex items-center justify-end">
        <button type="button" onClick={() => meet.setCreateOpen(true)} className="h-9 px-3 rounded-xl text-sm font-bold bg-[#4285F4] text-white flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Create meeting
        </button>
      </header>

      {meet.message && <div className="shrink-0 px-4 py-2 text-sm font-semibold bg-[#e8f4ff] border-b border-[#4285F4]/15">{meet.message}</div>}

      <div className="shrink-0 grid grid-cols-3 gap-3 p-4 border-b border-slate-200 bg-slate-50/50">
        {[
          { label: 'Upcoming', value: stats.upcoming },
          { label: "Today's", value: stats.today },
          { label: 'Past', value: stats.past },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-sm font-bold uppercase text-gray-400">{card.label}</p>
            <p className="text-2xl font-black text-gray-950 mt-1 tabular-nums">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <section className={`flex-1 min-w-0 flex flex-col min-h-0 ${mobileDetail ? 'hidden lg:flex' : 'flex'}`}>
          <div className="shrink-0 px-4 py-3 border-b border-slate-200 flex flex-wrap gap-2 items-center">
            <div className="flex gap-1">
              {TABS.map((t) => (
                <button key={t.id} type="button" onClick={() => meet.setTab(t.id)} className={`px-3 py-1.5 rounded-lg text-sm font-bold ${meet.tab === t.id ? 'bg-[#e8f4ff] text-[#4285F4]' : 'text-gray-600 hover:bg-slate-50'}`}>{t.label}</button>
              ))}
            </div>
            <div className="flex-1 min-w-[160px] flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 ml-auto max-w-xs">
              <Search className="w-4 h-4 text-gray-400" />
              <input value={meet.searchQuery} onChange={(e) => meet.setSearchQuery(e.target.value)} placeholder="Search meetings…" className="flex-1 bg-transparent text-sm outline-none" />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            {meet.listLoading ? (
              <div className="py-20 text-center text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading meetings…</div>
            ) : meet.meetings.length === 0 ? (
              <div className="py-20 text-center">
                <Video className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-600">No meetings in this view</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f0eef5]">
                {meet.meetings.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { meet.setSelectedId(m.id); setMobileDetail(true); }}
                    className={`w-full text-left px-4 py-4 hover:bg-slate-50 ${meet.selectedId === m.id ? 'bg-[#e8f4ff]/50' : ''}`}
                  >
                    <p className="text-sm font-bold text-gray-950 truncate">{m.summary ?? 'Untitled meeting'}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(m.start)} · {formatTime(m.start)} · {formatDuration(m.start, m.end)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className={`w-full lg:w-[420px] shrink-0 border-l border-slate-200 flex flex-col min-h-0 bg-slate-50 ${mobileDetail ? 'flex' : 'hidden lg:flex'}`}>
          {!meet.selected ? (
            <div className="flex-1 flex items-center justify-center p-8 text-sm text-gray-500">Select a meeting</div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <button type="button" className="lg:hidden mb-4 text-sm font-semibold text-gray-600" onClick={() => setMobileDetail(false)}>← Back</button>
              <h2 className="text-lg font-black text-gray-950">{meet.selected.summary ?? 'Meeting'}</h2>
              <p className="text-sm text-gray-500 mt-2">{formatDate(meet.selected.start)} · {formatTime(meet.selected.start)}</p>
              {meet.selected.hangoutLink && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={meet.selected.hangoutLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-bold bg-[#4285F4] text-white">
                    <ExternalLink className="w-3.5 h-3.5" /> Join Meet
                  </a>
                  <button type="button" onClick={() => meet.copyLink(meet.selected!.hangoutLink!)} className="h-9 px-3 rounded-xl text-sm font-bold border border-slate-200 bg-white flex items-center gap-1">
                    <Copy className="w-3.5 h-3.5" /> Copy link
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 mt-6">
                {[
                  { icon: Calendar, label: 'Journey trigger', hint: 'Start workflow on join' },
                  { icon: GitBranch, label: 'Automation', hint: 'Post-meeting actions' },
                  { icon: Bot, label: 'AI notes', hint: 'Summarize transcript' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-dashed border-slate-200 bg-white p-3">
                    <item.icon className="w-4 h-4 text-[#4285F4] mb-1" />
                    <p className="text-sm font-bold text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.hint}</p>
                  </div>
                ))}
              </div>
              {meet.selected.status !== 'cancelled' && (
                <button type="button" onClick={() => void meet.handleCancel(meet.selected!.id)} className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-red-600 hover:text-red-700">
                  <Trash2 className="w-3.5 h-3.5" /> Cancel meeting
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {meet.createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <form onSubmit={(e) => void meet.handleCreate(e)} className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-950">Create Meet</h3>
              <button type="button" onClick={() => meet.setCreateOpen(false)} className="p-1 rounded-lg text-gray-400 hover:bg-slate-50"><X className="w-5 h-5" /></button>
            </div>
            <input value={meet.form.summary} onChange={(e) => meet.setForm((f) => ({ ...f, summary: e.target.value }))} placeholder="Meeting title" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
            <input type="datetime-local" value={meet.form.start} onChange={(e) => meet.setForm((f) => ({ ...f, start: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
            <input type="datetime-local" value={meet.form.end} onChange={(e) => meet.setForm((f) => ({ ...f, end: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
            <button type="submit" disabled={meet.creating} className="w-full h-10 rounded-xl bg-[#4285F4] text-white text-sm font-bold disabled:opacity-50">
              {meet.creating ? 'Creating…' : 'Create meeting'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
