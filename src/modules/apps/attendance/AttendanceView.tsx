/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { Search, Plus, LogIn, LogOut } from 'lucide-react';
import { Input } from '../../../components/ui/input';

type AttendanceStatus = 'in' | 'out' | 'late' | 'leave';

type StaffMember = {
  id: string;
  name: string;
  role: string;
  status: AttendanceStatus;
  time: string | null;
  avatarColor: string;
  initials: string;
};

const INITIAL_STAFF: StaffMember[] = [
  { id: 's1', name: 'Rohan Kapoor', role: 'Front Desk', status: 'in', time: '8:58 AM', avatarColor: '#078038', initials: 'RK' },
  { id: 's2', name: 'Priya Sharma', role: 'Trainer', status: 'in', time: '9:02 AM', avatarColor: '#1d5fc9', initials: 'PS' },
  { id: 's3', name: 'Arjun Verma', role: 'Trainer', status: 'late', time: '9:41 AM', avatarColor: '#c9720f', initials: 'AV' },
  { id: 's4', name: 'Sana Nair', role: 'Nutritionist', status: 'leave', time: null, avatarColor: '#ba1a1a', initials: 'SN' },
  { id: 's5', name: 'Manav Deshmukh', role: 'Cleaning Staff', status: 'out', time: null, avatarColor: '#6b3fc9', initials: 'MD' },
  { id: 's6', name: 'Kavya Iyer', role: 'Front Desk', status: 'out', time: null, avatarColor: '#c9317e', initials: 'KI' },
];

const STATUS_PILL_CLASS: Record<AttendanceStatus, string> = {
  in: 'bg-[#e6f7ec] text-[#0d9448]',
  out: 'bg-slate-100 text-swiss-muted',
  late: 'bg-[#fff3e6] text-[#c9720f]',
  leave: 'bg-[#fdecec] text-[#ba1a1a]',
};

function statusLabel(staff: StaffMember): string {
  if (staff.status === 'in') return `Checked In · ${staff.time}`;
  if (staff.status === 'late') return `Late · ${staff.time}`;
  if (staff.status === 'leave') return 'On Leave';
  return 'Not Checked In';
}

function nowTime(): string {
  const now = new Date();
  const hours24 = now.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const period = hours24 < 12 ? 'AM' : 'PM';
  return `${hours12}:${minutes} ${period}`;
}

export function AttendanceView() {
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => staff.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    [staff, search]
  );

  const stats = useMemo(() => {
    const present = staff.filter((s) => s.status === 'in' || s.status === 'late').length;
    const onLeave = staff.filter((s) => s.status === 'leave').length;
    const late = staff.filter((s) => s.status === 'late').length;
    return { present, onLeave, late, total: staff.length };
  }, [staff]);

  const toggleCheck = (id: string) => {
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (s.status === 'in' || s.status === 'late') {
          return { ...s, status: 'out', time: null };
        }
        if (s.status === 'out') {
          return { ...s, status: 'in', time: nowTime() };
        }
        return s;
      })
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-950">Attendance</h1>
          <p className="text-xs text-swiss-muted font-medium mt-0.5">
            Today, {new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long' })} · Central branch
          </p>
        </div>
        <button
          type="button"
          className="px-3 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-meta font-bold flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Staff
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-swiss-line p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-bold uppercase tracking-wide text-swiss-faint">Present Today</p>
          <p className="mt-1.5 text-2xl font-black text-gray-950">{stats.present}</p>
        </div>
        <div className="bg-white rounded-2xl border border-swiss-line p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-bold uppercase tracking-wide text-swiss-faint">On Leave</p>
          <p className="mt-1.5 text-2xl font-black text-[#ba1a1a]">{stats.onLeave}</p>
        </div>
        <div className="bg-white rounded-2xl border border-swiss-line p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-bold uppercase tracking-wide text-swiss-faint">Late Check-ins</p>
          <p className="mt-1.5 text-2xl font-black text-[#c9720f]">{stats.late}</p>
        </div>
        <div className="bg-white rounded-2xl border border-swiss-line p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-bold uppercase tracking-wide text-swiss-faint">Total Staff</p>
          <p className="mt-1.5 text-2xl font-black text-gray-950">{stats.total}</p>
        </div>
      </div>

      <div className="p-3 bg-white border border-swiss-line flex items-center justify-end">
        <div className="relative w-48 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-swiss-faint" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff..."
            className="h-auto w-full bg-slate-50 border border-swiss-line rounded-xl py-1.5 pl-9 pr-3 text-meta font-semibold outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-swiss-line overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="grid grid-cols-[2fr_1.3fr_1.3fr_1.2fr] px-5 py-3 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wide text-swiss-faint">
            <div>Staff</div>
            <div>Role</div>
            <div>Status</div>
            <div className="text-right">Action</div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center text-sm font-semibold text-swiss-faint">
              No staff match your search.
            </div>
          ) : (
            filtered.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-[2fr_1.3fr_1.3fr_1.2fr] items-center px-5 py-3 border-b border-slate-50 last:border-b-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                    style={{ backgroundColor: s.avatarColor, width: 34, height: 34 }}
                  >
                    {s.initials}
                  </div>
                  <p className="text-sm font-bold text-swiss-ink truncate">{s.name}</p>
                </div>
                <div className="text-[13.5px] text-swiss-muted">{s.role}</div>
                <div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_PILL_CLASS[s.status]}`}
                  >
                    {statusLabel(s)}
                  </span>
                </div>
                <div className="flex justify-end">
                  {s.status === 'leave' ? (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-border-subtle text-gray-300 cursor-not-allowed"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Check In
                    </button>
                  ) : s.status === 'out' ? (
                    <button
                      type="button"
                      onClick={() => toggleCheck(s.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-hover"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Check In
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleCheck(s.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-border-subtle text-swiss-muted hover:bg-black/[0.03]"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Check Out
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
