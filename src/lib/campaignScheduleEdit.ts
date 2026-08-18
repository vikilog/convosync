/** Must be more than this far before send to edit a scheduled campaign. */
export const SCHEDULED_CAMPAIGN_EDIT_LEAD_MS = 10 * 60 * 1000;

export const SCHEDULED_CAMPAIGN_EDIT_BLOCKED_HINT =
  'Can only edit when more than 10 minutes before send';

/** status === scheduled && scheduledAt more than 10 minutes from now. */
export function isScheduledCampaignEditable(
  status: string | null | undefined,
  scheduledAt: Date | string | null | undefined,
  now = Date.now()
): boolean {
  if ((status ?? '').toLowerCase() !== 'scheduled') return false;
  if (!scheduledAt) return false;
  const t = scheduledAt instanceof Date ? scheduledAt.getTime() : new Date(scheduledAt).getTime();
  if (!Number.isFinite(t)) return false;
  return t - now > SCHEDULED_CAMPAIGN_EDIT_LEAD_MS;
}

/** Wizard fields hydrated from a scheduled campaign for full edit. */
export type ScheduledWizardSeed = {
  channel: 'whatsapp' | 'email' | 'instagram';
  audienceType: 'all' | 'segment';
  segmentIds: string[];
  templateId: string | null;
  templateName: string | null;
  variableMappings: Record<string, string>;
  headerMediaStorageKey: string | null;
  headerMediaMimeType: string | null;
  headerMediaFileName: string | null;
  headerMediaAssetId: string | null;
  name: string;
  scheduledAt: string;
};

export function wizardSeedFromCampaignDetail(detail: {
  channel: string;
  audienceType: string;
  segmentIds: string[];
  template: { id: string; name: string } | null;
  variableMappings: Record<string, string>;
  headerMediaStorageKey: string | null;
  headerMediaMimeType: string | null;
  headerMediaFileName: string | null;
  headerMediaAssetId: string | null;
  name: string;
  scheduledAt: string | null;
}): ScheduledWizardSeed | null {
  if (!detail.scheduledAt) return null;
  const audienceType =
    detail.audienceType === 'all' || detail.segmentIds.some((id) => id === 'all')
      ? 'all'
      : 'segment';
  return {
    channel:
      detail.channel === 'email' || detail.channel === 'instagram' ? detail.channel : 'whatsapp',
    audienceType,
    segmentIds: audienceType === 'all' ? [] : detail.segmentIds.filter((id) => id && id !== 'all'),
    templateId: detail.template?.id ?? null,
    templateName: detail.template?.name ?? null,
    variableMappings: { ...detail.variableMappings },
    headerMediaStorageKey: detail.headerMediaStorageKey,
    headerMediaMimeType: detail.headerMediaMimeType,
    headerMediaFileName: detail.headerMediaFileName,
    headerMediaAssetId: detail.headerMediaAssetId,
    name: detail.name,
    scheduledAt: detail.scheduledAt,
  };
}

export function defaultScheduleLocal(fromMs = Date.now() + 60 * 60 * 1000): {
  date: string;
  time: string;
} {
  const d = new Date(fromMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function isoToLocalDateTime(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return defaultScheduleLocal();
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return defaultScheduleLocal();
  return defaultScheduleLocal(d.getTime());
}

/**
 * Today's date in the date <input>'s own YYYY-MM-DD shape — always
 * selectable regardless of time of day. The old `min` used
 * defaultScheduleLocal().date (computed from "1 hour from now"), which
 * rolled to tomorrow's date late at night and blocked picking a
 * legitimately-future time later today.
 */
export function todayLocal(now = Date.now()): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Minimum selectable time for the time <input> — "now" when the selected
 * date is today (any time-of-day is fine for a future date). Previously the
 * time input had no lower bound at all, so a same-day past time was only
 * caught by the generic error after clicking Launch.
 */
export function minScheduleTimeFor(selectedDate: string, now = Date.now()): string | undefined {
  if (selectedDate !== todayLocal(now)) return undefined;
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function localDateTimeToIso(date: string, time: string): string {
  const local = new Date(`${date}T${time}:00`);
  if (Number.isNaN(local.getTime())) {
    throw new Error('Invalid schedule date or time');
  }
  return local.toISOString();
}
