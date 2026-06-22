import type { MeetMeeting, MeetTab } from './types';

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatDuration(minutes: number | null): string {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function isToday(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function filterMeetings(meetings: MeetMeeting[], tab: MeetTab): MeetMeeting[] {
  const now = Date.now();
  if (tab === 'upcoming') {
    return meetings.filter((m) => m.status === 'upcoming' || m.status === 'live');
  }
  if (tab === 'today') {
    return meetings.filter((m) => isToday(m.start));
  }
  if (tab === 'past') {
    return meetings.filter((m) => m.status === 'past' || m.status === 'cancelled');
  }
  return meetings;
}

export function meetingStats(meetings: MeetMeeting[]) {
  const now = Date.now();
  return {
    upcoming: meetings.filter((m) => m.status === 'upcoming' || m.status === 'live').length,
    today: meetings.filter((m) => isToday(m.start)).length,
    past: meetings.filter((m) => (m.end ? new Date(m.end).getTime() : 0) < now).length,
  };
}
