const safeNum = (n: number | null | undefined) =>
  typeof n === 'number' && Number.isFinite(n) ? n : 0;

export const fmt = (n: number | null | undefined) => {
  const v = safeNum(n);
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString();
};

export const fmtInr = (n: number | null | undefined) =>
  `₹${safeNum(n).toLocaleString('en-IN')}`;

export const fmtPct = (n: number | null | undefined) => `${safeNum(n).toFixed(2)}%`;

export const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700 border-green-200',
  PAUSED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  DELETED: 'bg-red-50 text-red-600 border-red-200',
  IN_PROCESS: 'bg-blue-50 text-blue-700 border-blue-200',
  WITH_ISSUES: 'bg-red-50 text-red-600 border-red-200',
};

export type AdPlatformSource = 'meta' | 'google';
export type PlatformScope = AdPlatformSource;
