import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';
import { api, formatCatchError } from '../../lib/api';
import { pathForTab } from '../../routes';
import { CalendarLeftPanel } from './calendar/CalendarLeftPanel';
import {
  type CalendarDay,
  type CalendarEvent,
  type CalViewMode,
  WEEKDAY_LABELS,
  VIEW_MODES,
  DAY_START_HOUR,
  DAY_END_HOUR,
  HOUR_PX,
  TIMELINE_HEIGHT,
  buildMonthGrid,
  dateKey,
  defaultFormForDay,
  eventsForDay,
  formatEventTime,
  getVisibleRange,
  isAllDayEvent,
  isPastDay,
  periodLabel,
  timedEventStyle,
  weekDays,
} from './calendar/calendarHelpers';

type CalendarOption = {
  id: string;
  summary?: string | null;
  primary?: boolean;
};

type CalendarIntegration = {
  connectionId: string;
  connectionEmail: string | null;
  lastSyncAt: string | null;
  config: Record<string, unknown> | null;
};

export function GoogleCalendarView() {
  const navigate = useNavigate();
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<CalViewMode>('month');
  const [selectedDayKey, setSelectedDayKey] = useState(() => dateKey(new Date()));
  const [integration, setIntegration] = useState<CalendarIntegration | null>(null);
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState('primary');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [busyEventId, setBusyEventId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(() => defaultFormForDay(new Date()));

  const visibleRange = useMemo(
    () => getVisibleRange(viewMode, anchorDate),
    [viewMode, anchorDate]
  );

  const monthDays = useMemo(
    () => buildMonthGrid(anchorDate.getFullYear(), anchorDate.getMonth()),
    [anchorDate]
  );

  const miniMonthDays = monthDays;

  const weekDayList = useMemo(() => weekDays(anchorDate), [anchorDate]);

  const eventsByDay = useMemo(() => {
    const keys = new Set<string>();
    if (viewMode === 'week') weekDayList.forEach((d) => keys.add(d.key));
    else if (viewMode === 'month') monthDays.forEach((d) => keys.add(d.key));
    else if (viewMode === 'year') {
      for (let m = 0; m < 12; m++) {
        buildMonthGrid(anchorDate.getFullYear(), m).forEach((d) => keys.add(d.key));
      }
    } else {
      keys.add(dateKey(anchorDate));
    }
    const map = new Map<string, CalendarEvent[]>();
    for (const key of keys) {
      const [y, mo, da] = key.split('-').map(Number);
      const day = new Date(y, mo - 1, da);
      map.set(key, eventsForDay(events, day));
    }
    return map;
  }, [events, viewMode, weekDayList, monthDays, anchorDate]);

  const selectedDay = useMemo(() => {
    const [y, m, d] = selectedDayKey.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDayKey]);

  const selectedDayEvents = useMemo(
    () => eventsForDay(events, selectedDay),
    [events, selectedDay]
  );

  const selectedCalendar = useMemo(
    () => calendars.find((c) => c.id === selectedCalendarId),
    [calendars, selectedCalendarId]
  );

  const loadIntegration = useCallback(async () => {
    const res = await api.getGoogleProducts();
    const calendar = (res.products ?? []).find(
      (p) => p.product === 'calendar' && p.status === 'connected' && p.connectionId
    );
    if (!calendar?.connectionId) {
      setIntegration(null);
      return null;
    }
    const row: CalendarIntegration = {
      connectionId: calendar.connectionId,
      connectionEmail: calendar.connectionEmail,
      lastSyncAt: calendar.lastSyncAt,
      config: calendar.config,
    };
    setIntegration(row);
    const defaultId =
      (calendar.config?.defaultCalendarId as string | undefined) ||
      (calendar.config?.calendars as Array<{ id: string; primary?: boolean }> | undefined)?.find(
        (c) => c.primary
      )?.id ||
      'primary';
    setSelectedCalendarId(defaultId);
    return row;
  }, []);

  const loadCalendars = useCallback(async (connectionId: string) => {
    const res = await api.listGoogleCalendars(connectionId);
    setCalendars(res.calendars ?? []);
  }, []);

  const loadEvents = useCallback(
    async (connectionId: string, calendarId: string, range: { timeMin: string; timeMax: string }) => {
      setEventsLoading(true);
      try {
        const res = await api.listGoogleCalendarEvents({
          connectionId,
          calendarId: calendarId === 'primary' ? undefined : calendarId,
          timeMin: range.timeMin,
          timeMax: range.timeMax,
          maxResults: viewMode === 'year' ? 500 : 250,
        });
        setEvents(res.events ?? []);
      } finally {
        setEventsLoading(false);
      }
    },
    [viewMode]
  );

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const row = await loadIntegration();
      if (!row) return;
      await loadCalendars(row.connectionId);
      await loadEvents(row.connectionId, selectedCalendarId, visibleRange);
    } catch (err) {
      setMessage(formatCatchError(err));
    } finally {
      setLoading(false);
    }
  }, [loadCalendars, loadEvents, loadIntegration, selectedCalendarId, visibleRange]);

  useEffect(() => {
    void refreshAll();
  }, []);

  useEffect(() => {
    if (!integration?.connectionId || loading) return;
    void loadEvents(integration.connectionId, selectedCalendarId, visibleRange).catch((err) =>
      setMessage(formatCatchError(err))
    );
  }, [integration?.connectionId, selectedCalendarId, visibleRange, loadEvents, loading]);

  const shiftPeriod = (delta: -1 | 1) => {
    setAnchorDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'day') d.setDate(d.getDate() + delta);
      else if (viewMode === 'week') d.setDate(d.getDate() + delta * 7);
      else if (viewMode === 'month') d.setMonth(d.getMonth() + delta);
      else d.setFullYear(d.getFullYear() + delta);
      return d;
    });
  };

  const shiftMiniMonth = (delta: -1 | 1) => {
    setAnchorDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  };

  const goToday = () => {
    const now = new Date();
    setAnchorDate(now);
    setSelectedDayKey(dateKey(now));
  };

  const openCreateForDay = (day: Date) => {
    setSelectedDayKey(dateKey(day));
    setForm(defaultFormForDay(day));
    setShowCreate(true);
  };

  const selectDay = (day: Date) => {
    setSelectedDayKey(dateKey(day));
    if (viewMode === 'year') {
      setAnchorDate(new Date(day.getFullYear(), day.getMonth(), 1));
      setViewMode('month');
    }
  };

  const handleSync = useCallback(async () => {
    if (!integration) return;
    setSyncing(true);
    setMessage('');
    try {
      await api.syncGoogleProduct('calendar', integration.connectionId);
      await loadEvents(integration.connectionId, selectedCalendarId, visibleRange);
      setMessage('Calendar synced successfully.');
    } catch (err) {
      setMessage(formatCatchError(err));
    } finally {
      setSyncing(false);
    }
  }, [integration, loadEvents, selectedCalendarId, visibleRange]);

  const handleDelete = async (eventId: string) => {
    if (!integration || !window.confirm('Delete this event from Google Calendar?')) return;
    setBusyEventId(eventId);
    setMessage('');
    try {
      await api.deleteGoogleCalendarEvent({
        connectionId: integration.connectionId,
        eventId,
        calendarId: selectedCalendarId === 'primary' ? undefined : selectedCalendarId,
      });
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err) {
      setMessage(formatCatchError(err));
    } finally {
      setBusyEventId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!integration) return;
    if (!form.summary.trim() || !form.start || !form.end) {
      setMessage('Title, start, and end are required.');
      return;
    }
    setCreating(true);
    setMessage('');
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await api.createGoogleCalendarEvent({
        connectionId: integration.connectionId,
        calendarId: selectedCalendarId === 'primary' ? undefined : selectedCalendarId,
        summary: form.summary.trim(),
        description: form.description.trim() || undefined,
        start: new Date(form.start).toISOString(),
        end: new Date(form.end).toISOString(),
        timeZone: tz,
      });
      setShowCreate(false);
      await loadEvents(integration.connectionId, selectedCalendarId, visibleRange);
      setMessage('Event created.');
    } catch (err) {
      setMessage(formatCatchError(err));
    } finally {
      setCreating(false);
    }
  };

  const renderAllDayRow = (days: CalendarDay[]) => {
    const allDayByDay = days.map((day) =>
      (eventsByDay.get(day.key) ?? []).filter(isAllDayEvent)
    );
    const hasAny = allDayByDay.some((list) => list.length > 0);
    if (!hasAny) return null;
    return (
      <div className="flex border-b border-[#E2E8F0] bg-[#F8FAFC] min-h-[36px]">
        <div className="w-14 shrink-0 border-r border-[#E2E8F0] px-1 py-1 text-meta font-bold text-[#64748B] text-right">
          all-day
        </div>
        {days.map((day, i) => (
          <div
            key={day.key}
            className={`flex-1 border-r border-[#E2E8F0] p-0.5 space-y-0.5 min-w-0 ${
              day.key === selectedDayKey ? 'bg-[#2563EB]/5' : ''
            }`}
          >
            {allDayByDay[i].map((event) => (
              <div
                key={event.id}
                className="truncate rounded px-1 py-0.5 text-meta font-bold bg-[#059669] text-white"
                title={event.summary ?? 'Event'}
              >
                {event.summary || '(No title)'}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderTimeGrid = (days: CalendarDay[]) => {
    const hours = Array.from(
      { length: DAY_END_HOUR - DAY_START_HOUR },
      (_, i) => DAY_START_HOUR + i
    );

    return (
      <div className="h-full overflow-auto">
        {renderAllDayRow(days)}
        <div className="flex">
          <div className="w-14 shrink-0 border-r border-[#E2E8F0] bg-white">
            {hours.map((h) => (
              <div
                key={h}
                className="border-b border-[#E2E8F0] text-xs text-[#64748B] font-medium text-right pr-2"
                style={{ height: HOUR_PX }}
              >
                {new Date(2000, 0, 1, h).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                })}
              </div>
            ))}
          </div>
          {days.map((day, colIndex) => {
            const dayEvents = (eventsByDay.get(day.key) ?? []).filter((e) => !isAllDayEvent(e));
            const isSelected = day.key === selectedDayKey;
            const isWeekend = colIndex % 7 === 0 || colIndex % 7 === 6;
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => selectDay(day.date)}
                onDoubleClick={() => openCreateForDay(day.date)}
                className={`flex-1 min-w-0 border-r border-[#E2E8F0] relative hover:bg-[#2563EB]/5 transition-colors ${
                  isWeekend ? 'bg-[#F8FAFC]/80' : 'bg-white'
                } ${isSelected ? 'ring-2 ring-inset ring-[#2563EB]/30 bg-[#2563EB]/5' : ''} ${
                  isPastDay(day) ? 'opacity-40' : ''
                }`}
                style={{ height: TIMELINE_HEIGHT }}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-b border-[#E2E8F0]/80"
                    style={{ top: (h - DAY_START_HOUR) * HOUR_PX, height: HOUR_PX }}
                  />
                ))}
                {dayEvents.map((event) => {
                  const style = timedEventStyle(event, day.date);
                  if (!style) return null;
                  return (
                    <div
                      key={event.id}
                      className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-meta font-bold bg-[#2563EB] text-white overflow-hidden z-10 text-left"
                      style={{ top: style.top, height: style.height, minHeight: 20 }}
                      title={`${formatEventTime(event)} ${event.summary ?? ''}`}
                    >
                      <span className="block truncate">{event.summary || '(No title)'}</span>
                    </div>
                  );
                })}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const day: CalendarDay = {
      date: anchorDate,
      key: dateKey(anchorDate),
      inMonth: true,
      isToday: dateKey(anchorDate) === dateKey(new Date()),
    };
    return renderTimeGrid([day]);
  };

  const renderWeekView = () => (
    <>
      <div className="grid grid-cols-7 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
        {weekDayList.map((day, i) => {
          const isSelected = day.key === selectedDayKey;
          const isWeekend = i === 0 || i === 6;
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => selectDay(day.date)}
              className={`py-2 text-center border-r border-[#E2E8F0] last:border-r-0 ${
                isWeekend ? 'bg-[#F1F5F9]/60' : ''
              } ${isSelected ? 'bg-[#2563EB]/5' : 'hover:bg-white'}`}
            >
              <p className="text-sm font-semibold uppercase text-[#64748B]">
                {WEEKDAY_LABELS[day.date.getDay()]}
              </p>
              <span
                className={`inline-flex mt-0.5 items-center justify-center w-8 h-8 text-sm font-bold rounded-full ${
                  day.isToday ? 'bg-[#2563EB] text-white' : 'text-[#0F172A]'
                }`}
              >
                {day.date.getDate()}
              </span>
            </button>
          );
        })}
      </div>
      {renderTimeGrid(weekDayList)}
    </>
  );

  const renderMonthView = () => (
    <>
      <div className="grid grid-cols-7 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={`py-2 text-center text-sm font-semibold uppercase tracking-wider text-[#64748B] ${
              i === 0 || i === 6 ? 'bg-[#F1F5F9]/60' : ''
            }`}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthDays.map((day, index) => {
          const dayEvents = eventsByDay.get(day.key) ?? [];
          const isSelected = day.key === selectedDayKey;
          const visibleEvents = dayEvents.slice(0, 3);
          const overflow = dayEvents.length - visibleEvents.length;
          const isWeekend = index % 7 === 0 || index % 7 === 6;
          const past = isPastDay(day);
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => selectDay(day.date)}
              onDoubleClick={() => openCreateForDay(day.date)}
              className={`min-h-[100px] border-r border-b border-[#E2E8F0] p-1.5 text-left transition-colors hover:bg-[#2563EB]/5 ${
                isWeekend ? 'bg-[#F8FAFC]/80' : day.inMonth ? 'bg-white' : 'bg-[#F8FAFC]'
              } ${isSelected ? 'ring-2 ring-inset ring-[#2563EB]/30 bg-[#2563EB]/5' : ''} ${
                past ? 'opacity-40' : ''
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-7 h-7 text-sm font-bold rounded-full mb-1 ${
                  day.isToday
                    ? 'bg-[#2563EB] text-white'
                    : day.inMonth
                      ? 'text-[#0F172A]'
                      : 'text-[#CBD5E1]'
                }`}
              >
                {day.date.getDate()}
              </span>
              <div className="space-y-0.5">
                {visibleEvents.map((event) => (
                  <div
                    key={event.id}
                    className="truncate rounded px-1.5 py-0.5 text-sm font-semibold bg-[#2563EB] text-white leading-tight"
                    title={event.summary ?? 'Event'}
                  >
                    {!isAllDayEvent(event) ? `${formatEventTime(event).split(' – ')[0]} ` : ''}
                    {event.summary || '(No title)'}
                  </div>
                ))}
                {overflow > 0 && (
                  <p className="text-sm font-semibold text-[#64748B] px-1">+{overflow} more</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );

  const renderYearView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {Array.from({ length: 12 }, (_, month) => {
        const miniDays = buildMonthGrid(anchorDate.getFullYear(), month);
        const monthName = new Date(anchorDate.getFullYear(), month, 1).toLocaleString(undefined, {
          month: 'long',
        });
        return (
          <button
            key={month}
            type="button"
            onClick={() => {
              setAnchorDate(new Date(anchorDate.getFullYear(), month, 1));
              setViewMode('month');
            }}
            className="text-left rounded-xl border border-[#E2E8F0] bg-white p-3 hover:border-[#2563EB]/30 hover:bg-[#2563EB]/5 transition-colors"
          >
            <p className="text-sm font-bold text-[#0F172A] mb-2">{monthName}</p>
            <div className="grid grid-cols-7 gap-0.5">
              {WEEKDAY_LABELS.map((l) => (
                <span key={l} className="text-badge font-semibold text-[#CBD5E1] text-center">
                  {l.charAt(0)}
                </span>
              ))}
              {miniDays.map((day) => {
                const count = (eventsByDay.get(day.key) ?? []).length;
                return (
                  <span
                    key={day.key}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectDay(day.date);
                    }}
                    className={`aspect-square flex items-center justify-center text-meta rounded-full ${
                      !day.inMonth
                        ? 'text-[#E2E8F0]'
                        : count > 0
                          ? 'font-bold text-[#2563EB] bg-[#2563EB]/10'
                          : 'text-[#64748B]'
                    } ${day.isToday ? 'bg-[#2563EB] text-white' : ''}`}
                  >
                    {day.inMonth ? day.date.getDate() : ''}
                  </span>
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );

  let mainView: ReactNode = null;
  if (viewMode === 'day') mainView = renderDayView();
  else if (viewMode === 'week') mainView = renderWeekView();
  else if (viewMode === 'month') mainView = renderMonthView();
  else mainView = renderYearView();

  if (!loading && !integration) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-lg bg-white border border-[#E2E8F0] rounded-xl p-8 text-center space-y-4">
          <Calendar className="w-10 h-10 mx-auto text-[#2563EB]" />
          <h2 className="text-lg font-bold text-[#0F172A]">Google Calendar not connected</h2>
          <p className="text-sm text-[#64748B]">
            Connect Calendar from Integrations → Google to manage events here.
          </p>
          <button
            type="button"
            onClick={() => navigate(`${pathForTab('integrations')}?channel=google`)}
            className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8]"
          >
            Go to Integrations
          </button>
        </div>
      </div>
    );
  }

  const focusDay = viewMode === 'day' ? anchorDate : selectedDay;
  const miniMonthLabel = anchorDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden bg-[#F8FAFC]">
      <CalendarLeftPanel
        email={integration?.connectionEmail ?? null}
        miniMonthDays={miniMonthDays}
        miniMonthLabel={miniMonthLabel}
        selectedDayKey={selectedDayKey}
        selectedDay={selectedDay}
        selectedDayEvents={selectedDayEvents}
        busyEventId={busyEventId}
        onPrevMonth={() => shiftMiniMonth(-1)}
        onNextMonth={() => shiftMiniMonth(1)}
        onSelectDay={selectDay}
        onCreateEvent={openCreateForDay}
        onDeleteEvent={(id) => void handleDelete(id)}
      />

      <div className="flex flex-1 min-w-0 min-h-0 flex-col overflow-hidden">
        <header className="shrink-0 flex flex-wrap items-center justify-end gap-3 px-4 py-3 border-b border-[#E2E8F0] bg-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleSync()}
              disabled={syncing || !integration}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-[#E2E8F0] text-[#0F172A] bg-white hover:bg-[#F8FAFC] disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Sync
            </button>
            <button
              type="button"
              onClick={() => openCreateForDay(focusDay)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create event
            </button>
          </div>
        </header>

        {message && (
          <p className="shrink-0 mx-4 mt-3 text-xs font-medium text-[#0F172A] bg-[#2563EB]/10 border border-[#2563EB]/20 rounded-lg px-4 py-2">
            {message}
          </p>
        )}

        <div className="shrink-0 px-4 py-3 flex flex-wrap items-center gap-3 border-b border-[#E2E8F0] bg-white">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goToday}
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
              title="Today"
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => shiftPeriod(-1)}
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
              aria-label="Previous period"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => shiftPeriod(1)}
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
              aria-label="Next period"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[#0F172A] ml-2">
              {periodLabel(viewMode, anchorDate)}
            </h2>
            {(loading || eventsLoading) && (
              <Loader2 className="w-4 h-4 animate-spin text-[#64748B] ml-1" />
            )}
          </div>

          <div className="flex items-center rounded-lg border border-[#E2E8F0] p-0.5 bg-[#F8FAFC] ml-auto">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setViewMode(mode.id);
                  if (mode.id === 'day') setAnchorDate(selectedDay);
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  viewMode === mode.id
                    ? 'bg-white text-[#2563EB] shadow-sm'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <select
              value={selectedCalendarId}
              onChange={(e) => setSelectedCalendarId(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2 text-sm font-medium border border-[#E2E8F0] rounded-lg bg-white text-[#0F172A] min-w-[140px] max-w-[200px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            >
              {calendars.length === 0 ? (
                <option value="primary">Primary calendar</option>
              ) : (
                calendars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.summary || c.id}
                    {c.primary ? ' (primary)' : ''}
                  </option>
                ))
              )}
            </select>
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-sm font-bold flex items-center justify-center">
              {(selectedCalendar?.summary?.[0] ?? integration?.connectionEmail?.[0] ?? 'C').toUpperCase()}
            </span>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="m-4 rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-sm">
            {mainView}
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A]">New event</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="p-1 rounded-lg text-[#64748B] hover:bg-[#F8FAFC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="text-meta font-semibold text-[#64748B] uppercase">Title</span>
                <input
                  value={form.summary}
                  onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                  className="mt-1 w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2"
                  required
                  autoFocus
                />
              </label>
              <label className="block">
                <span className="text-meta font-semibold text-[#64748B] uppercase">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-meta font-semibold text-[#64748B] uppercase">Start</span>
                <input
                  type="datetime-local"
                  value={form.start}
                  onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                  className="mt-1 w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2"
                  required
                />
              </label>
              <label className="block">
                <span className="text-meta font-semibold text-[#64748B] uppercase">End</span>
                <input
                  type="datetime-local"
                  value={form.end}
                  onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                  className="mt-1 w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2"
                  required
                />
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Save event'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
