import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, formatCatchError } from '../../../lib/api';
import type { MeetIntegration, MeetMeeting, MeetTab } from './types';
import { filterMeetings } from './utils';

function rangeForTab(tab: MeetTab): { timeMin: string; timeMax: string } {
  const now = new Date();
  if (tab === 'today') {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    return { timeMin: startOfDay.toISOString(), timeMax: endOfDay.toISOString() };
  }
  if (tab === 'past') {
    const pastStart = new Date(now);
    pastStart.setMonth(pastStart.getMonth() - 3);
    return { timeMin: pastStart.toISOString(), timeMax: now.toISOString() };
  }
  if (tab === 'all') {
    const pastStart = new Date(now);
    pastStart.setMonth(pastStart.getMonth() - 3);
    const future = new Date(now);
    future.setMonth(future.getMonth() + 6);
    return { timeMin: pastStart.toISOString(), timeMax: future.toISOString() };
  }
  const future = new Date(now);
  future.setMonth(future.getMonth() + 3);
  return { timeMin: now.toISOString(), timeMax: future.toISOString() };
}

export function useGoogleMeet() {
  const [integration, setIntegration] = useState<MeetIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<MeetTab>('upcoming');
  const [meetings, setMeetings] = useState<MeetMeeting[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ summary: '', start: '', end: '', attendees: '' });

  const loadIntegration = useCallback(async () => {
    const res = await api.getGoogleProducts();
    const row = (res.products ?? []).find(
      (p) => p.product === 'meet' && p.status === 'connected' && p.connectionId
    );
    if (!row?.connectionId) {
      setIntegration(null);
      return null;
    }
    return {
      connectionId: row.connectionId,
      connectionEmail: row.connectionEmail,
      lastSyncAt: row.lastSyncAt,
    } satisfies MeetIntegration;
  }, []);

  const loadMeetings = useCallback(async (connectionId: string, activeTab: MeetTab) => {
    setListLoading(true);
    try {
      const range = rangeForTab(activeTab);
      const res = await api.listGoogleMeetings({
        connectionId,
        ...range,
        maxResults: 100,
      });
      const rows = (res.meetings ?? []) as MeetMeeting[];
      setMeetings(rows);
      setSelectedId((prev) => {
        if (prev && rows.some((m) => m.id === prev)) return prev;
        return rows[0]?.id ?? null;
      });
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const row = await loadIntegration();
        if (cancelled) return;
        setIntegration(row);
        if (row) await loadMeetings(row.connectionId, tab);
      } catch (err) {
        if (!cancelled) setMessage(formatCatchError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadIntegration, loadMeetings, tab]);

  useEffect(() => {
    if (!integration?.connectionId || loading) return;
    void loadMeetings(integration.connectionId, tab).catch((err) => setMessage(formatCatchError(err)));
  }, [integration?.connectionId, tab, loading, loadMeetings]);

  const filtered = useMemo(() => {
    let rows = filterMeetings(meetings, tab);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (m) =>
          (m.summary ?? '').toLowerCase().includes(q) ||
          (m.organizer ?? '').toLowerCase().includes(q) ||
          m.attendees.some((a) => (a.email ?? '').toLowerCase().includes(q))
      );
    }
    return rows;
  }, [meetings, tab, searchQuery]);

  const selected = useMemo(
    () => meetings.find((m) => m.id === selectedId) ?? null,
    [meetings, selectedId]
  );

  const handleCreate = useCallback(async () => {
    if (!integration || !form.summary || !form.start || !form.end) return;
    setCreating(true);
    setMessage('');
    try {
      await api.createGoogleMeet({
        connectionId: integration.connectionId,
        summary: form.summary,
        start: new Date(form.start).toISOString(),
        end: new Date(form.end).toISOString(),
        attendees: form.attendees
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean),
      });
      setCreateOpen(false);
      setForm({ summary: '', start: '', end: '', attendees: '' });
      await loadMeetings(integration.connectionId, tab);
      setMessage('Meeting created.');
    } catch (err) {
      setMessage(formatCatchError(err));
    } finally {
      setCreating(false);
    }
  }, [integration, form, loadMeetings, tab]);

  const handleCancel = useCallback(
    async (eventId: string) => {
      if (!integration) return;
      try {
        await api.cancelGoogleMeet(integration.connectionId, eventId);
        await loadMeetings(integration.connectionId, tab);
        setMessage('Meeting cancelled.');
      } catch (err) {
        setMessage(formatCatchError(err));
      }
    },
    [integration, loadMeetings, tab]
  );

  const copyLink = useCallback((link: string) => {
    void navigator.clipboard.writeText(link);
    setMessage('Meet link copied.');
  }, []);

  return {
    integration,
    loading,
    listLoading,
    message,
    setMessage,
    tab,
    setTab,
    meetings: filtered,
    allMeetings: meetings,
    selected,
    selectedId,
    setSelectedId,
    searchQuery,
    setSearchQuery,
    createOpen,
    setCreateOpen,
    creating,
    form,
    setForm,
    handleCreate,
    handleCancel,
    copyLink,
    refresh: () => integration && loadMeetings(integration.connectionId, tab),
  };
}
