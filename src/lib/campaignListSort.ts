import type { CampaignRecord } from '../types';

export type CampaignListSortKey = 'created' | 'when' | 'status' | 'channel';
export type CampaignListSortDir = 'asc' | 'desc';

function compareStrings(a: string, b: string, dir: CampaignListSortDir): number {
  const cmp = a.localeCompare(b);
  return dir === 'asc' ? cmp : -cmp;
}

/** Same datetime the When column cell displays. */
export function campaignWhenAt(
  c: Pick<CampaignRecord, 'status' | 'scheduledAt' | 'sentAt'>
): string | null {
  return c.status === 'Scheduled' && c.scheduledAt ? c.scheduledAt : c.sentAt;
}

/** Missing / invalid dates sort last (or first). */
export function compareIsoDates(
  a: string | null | undefined,
  b: string | null | undefined,
  dir: CampaignListSortDir,
  missing: 'last' | 'first' = 'last'
): number {
  const ta = a ? Date.parse(a) : NaN;
  const tb = b ? Date.parse(b) : NaN;
  const aMissing = !Number.isFinite(ta);
  const bMissing = !Number.isFinite(tb);
  if (aMissing && bMissing) return 0;
  if (aMissing) return missing === 'last' ? 1 : -1;
  if (bMissing) return missing === 'last' ? -1 : 1;
  const cmp = ta - tb;
  return dir === 'asc' ? cmp : -cmp;
}

export function sortCampaignsForList(
  campaigns: CampaignRecord[],
  key: CampaignListSortKey,
  dir: CampaignListSortDir
): CampaignRecord[] {
  return [...campaigns].sort((a, b) => {
    if (key === 'created') {
      return compareIsoDates(a.createdAt, b.createdAt, dir);
    }
    if (key === 'status') {
      return compareStrings(a.status, b.status, dir);
    }
    if (key === 'channel') {
      return compareStrings(a.channel, b.channel, dir);
    }
    return compareIsoDates(campaignWhenAt(a), campaignWhenAt(b), dir);
  });
}

/** First click on a column → newest first; same column again toggles. */
export function nextCampaignListSort(
  currentKey: CampaignListSortKey,
  currentDir: CampaignListSortDir,
  clicked: CampaignListSortKey
): { key: CampaignListSortKey; dir: CampaignListSortDir } {
  if (currentKey === clicked) {
    return { key: clicked, dir: currentDir === 'desc' ? 'asc' : 'desc' };
  }
  return { key: clicked, dir: 'desc' };
}
