export type GbpAccount = {
  id: string;
  name: string;
  accountName: string;
  type?: string;
  lastSyncedAt?: string | null;
};

export type GbpAddress = {
  addressLines?: string[];
  locality?: string;
  administrativeArea?: string;
  postalCode?: string;
  regionCode?: string;
};

export type GbpTimeOfDay = {
  hours?: number;
  minutes?: number;
};

export type GbpTimePeriod = {
  openDay?: string;
  openTime?: GbpTimeOfDay;
  closeDay?: string;
  closeTime?: GbpTimeOfDay;
};

export type GbpLocation = {
  id: string;
  name?: string;
  title?: string;
  storefrontAddress?: GbpAddress;
  regularHours?: { periods?: GbpTimePeriod[] };
  metadata?: {
    mapsUri?: string;
    placeId?: string;
    hasGoogleUpdated?: boolean;
    canDelete?: boolean;
  };
};

export type GbpReview = {
  id: string;
  reviewerName: string | null;
  starRating: number | null;
  comment: string | null;
  reviewReply: string | null;
  createTime: string | null;
  updateTime: string | null;
};

export type GbpMetric = {
  id: string;
  metricType: string;
  value: Record<string, unknown> | null;
  lastSyncedAt: string | null;
};

export type BusinessProfileIntegration = {
  connectionId: string;
  connectionEmail: string | null;
  lastSyncAt: string | null;
};

export type GbpSyncStatus = {
  lastSync: {
    accounts: string | null;
    locations: string | null;
    reviews: string | null;
    metrics: string | null;
  };
  jobs: { waiting: number; active: number; failed: number };
  quotaHealth: 'healthy' | 'busy' | 'degraded';
};
