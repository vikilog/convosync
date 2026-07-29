export type LeadSource = 'instagram' | 'manual' | 'whatsapp';

export type LeadRep = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type LeadActivity = {
  id: string;
  type: 'stage_change' | 'dm_sent' | 'note' | 'created' | 'converted';
  text: string;
  at: string;
  fromStage?: string;
  toStage?: string;
};

export type LeadOrigin = {
  username: string;
  commentText: string;
  postThumbnailUrl: string;
  postCaption: string;
  commentedAt: string;
};

/** Kanban column within a funnel. */
export type LeadFunnelStage = {
  id: string;
  name: string;
  position: number;
  /** Final board — leads here can convert to Contact. */
  isFinal?: boolean;
};

export type Lead = {
  id: string;
  funnelId?: string | null;
  /** Board column id (LeadFunnelStage.id) */
  stageId?: string | null;
  /** Linked CRM contact after convert */
  contactId?: string | null;
  /** Denormalized board name */
  stage: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  source: LeadSource;
  requirement: string;
  assignedRep: LeadRep | null;
  createdAt: string;
  updatedAt: string;
  origin: LeadOrigin | null;
  notes: string;
  activity: LeadActivity[];
};

export type LeadFunnel = {
  id: string;
  name: string;
  description: string;
  goal: string;
  leadCount: number;
  stages: LeadFunnelStage[];
  createdAt: string;
  updatedAt: string;
};

/** @deprecated fixed stages — funnels now own boards. Kept for type.check / mocks. */
export type LeadStage = string;

export const LEAD_STAGES: { id: string; label: string }[] = [
  { id: 'new', label: 'New' },
];

/** Move a lead to a new board (pure). */
export function moveLeadToStage(
  leads: Lead[],
  leadId: string,
  stageId: string,
  stageName: string
): Lead[] {
  return leads.map((lead) => {
    if (lead.id !== leadId || lead.stageId === stageId) return lead;
    return {
      ...lead,
      stageId,
      stage: stageName,
      updatedAt: new Date().toISOString(),
      activity: [
        {
          id: `act-${Date.now()}-${leadId}`,
          type: 'stage_change' as const,
          text: `Moved from ${lead.stage} → ${stageName}`,
          at: new Date().toISOString(),
        },
        ...lead.activity,
      ],
    };
  });
}

export function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
