import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { CalendarDay, CalendarEvent } from './types';
import { formatDayHeading, formatEventTime, WEEKDAY_LABELS } from './calendarHelpers';

type CalendarLeftPanelProps = {
  email: string | null;
  miniMonthDays: CalendarDay[];
  miniMonthLabel: string;
  selectedDayKey: string;
  selectedDay: Date;
  selectedDayEvents: CalendarEvent[];
  busyEventId: string | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (day: Date) => void;
  onCreateEvent: (day: Date) => void;
  onDeleteEvent: (eventId: string) => void;
};

const EVENT_DOT_CLASSES = [
  'bg-[#2563EB]',
  'bg-violet-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-red-600',
];

export function CalendarLeftPanel({
  email,
  miniMonthDays,
  miniMonthLabel,
  selectedDayKey,
  selectedDay,
  selectedDayEvents,
  busyEventId,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
  onCreateEvent,
  onDeleteEvent,
}: CalendarLeftPanelProps) {
  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-[#E2E8F0] bg-white h-full min-h-0 overflow-y-auto">
      <div className="shrink-0 p-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center text-sm font-bold shrink-0">
            {(email?.[0] ?? 'G').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0F172A] truncate">Google Calendar</p>
            <p className="text-xs text-[#64748B] truncate">{email ?? 'Connected account'}</p>
          </div>
        </div>
      </div>

      <div className="shrink-0 p-4 border-b border-[#E2E8F0]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-[#0F172A]">{miniMonthLabel}</p>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onPrevMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} className="text-sm font-semibold text-[#64748B] text-center py-1">
              {label.charAt(0)}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {miniMonthDays.map((day) => {
            const isSelected = day.key === selectedDayKey;
            const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => onSelectDay(day.date)}
                className={`aspect-square flex items-center justify-center text-xs font-medium rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-[#2563EB] text-white'
                    : day.isToday
                      ? 'bg-[#2563EB]/10 text-[#2563EB] font-bold'
                      : day.inMonth
                        ? isWeekend
                          ? 'text-[#64748B] hover:bg-[#F8FAFC]'
                          : 'text-[#0F172A] hover:bg-[#F8FAFC]'
                        : 'text-[#CBD5E1]'
                }`}
              >
                {day.date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col min-h-0 flex-1 p-4">
        <p className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-3 shrink-0">
          {formatDayHeading(selectedDay)}
        </p>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 max-h-[calc(100vh-400px)] pr-1">
          {selectedDayEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-6 text-center">
              <Calendar className="w-8 h-8 mx-auto text-[#CBD5E1] mb-2" />
              <p className="text-sm font-medium text-[#64748B]">No events</p>
              <p className="text-xs text-[#94A3B8] mt-1 mb-4">Your schedule is clear for this day.</p>
              <button
                type="button"
                onClick={() => onCreateEvent(selectedDay)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Event
              </button>
            </div>
          ) : (
            selectedDayEvents.map((event, index) => (
              <div
                key={event.id}
                className="flex gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <p className="text-meta font-medium text-[#64748B] w-14 shrink-0 pt-0.5 tabular-nums">
                  {formatEventTime(event).split(' – ')[0] || 'All day'}
                </p>
                <div className="flex-1 min-w-0 flex items-start gap-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                      EVENT_DOT_CLASSES[index % EVENT_DOT_CLASSES.length]
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#0F172A] truncate">
                      {event.summary || '(No title)'}
                    </p>
                    {event.location && (
                      <p className="text-meta text-[#64748B] truncate mt-0.5">{event.location}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busyEventId === event.id}
                  onClick={() => onDeleteEvent(event.id)}
                  className="text-xs text-[#94A3B8] hover:text-red-500 shrink-0 disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
