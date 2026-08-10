import type { TriageSectionId } from './types';

/** Brand accents for this triage UI (cyan sales CTA + navy headers). */
export const SL_CYAN = '#0EA5E9';
export const SL_NAVY = '#0F172A';

export type SectionTheme = {
  id: TriageSectionId;
  label: string;
  /** Tailwind-ish accent classes for border/header/pills */
  accentBorder: string;
  accentBg: string;
  accentText: string;
  accentDot: string;
  headerBg: string;
  /** Default collapsed? Low confidence starts collapsed. */
  defaultCollapsed: boolean;
  muted: boolean;
};

export const SECTION_ORDER: TriageSectionId[] = [
  'complaints',
  'sales',
  'questions',
  'low_confidence',
];

export const SECTION_THEMES: Record<TriageSectionId, SectionTheme> = {
  complaints: {
    id: 'complaints',
    label: 'Complaints',
    accentBorder: 'border-l-orange-500',
    accentBg: 'bg-orange-50',
    accentText: 'text-orange-800',
    accentDot: 'bg-orange-500',
    headerBg: 'bg-orange-50/80',
    defaultCollapsed: false,
    muted: false,
  },
  sales: {
    id: 'sales',
    label: 'Sales Interest',
    accentBorder: 'border-l-emerald-500',
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-800',
    accentDot: 'bg-emerald-500',
    headerBg: 'bg-emerald-50/60',
    defaultCollapsed: false,
    muted: false,
  },
  questions: {
    id: 'questions',
    label: 'Questions',
    accentBorder: 'border-l-sky-500',
    accentBg: 'bg-sky-50',
    accentText: 'text-sky-800',
    accentDot: 'bg-sky-500',
    headerBg: 'bg-sky-50/70',
    defaultCollapsed: false,
    muted: false,
  },
  low_confidence: {
    id: 'low_confidence',
    label: 'Low Confidence / Unclear',
    accentBorder: 'border-l-slate-300',
    accentBg: 'bg-slate-100',
    accentText: 'text-slate-600',
    accentDot: 'bg-slate-400',
    headerBg: 'bg-slate-50',
    defaultCollapsed: true,
    muted: true,
  },
};

export type PrimaryActionKind = 'approve_dm' | 'approve_reply' | 'escalate' | 'review';

export function primaryActionFor(section: TriageSectionId): {
  kind: PrimaryActionKind;
  label: string;
  className: string;
} {
  // Match Integrations tab button pattern: tint fill + border + accent text
  switch (section) {
    case 'sales':
      return {
        kind: 'approve_dm',
        label: 'Approve & Send DM',
        className:
          'text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15',
      };
    case 'questions':
      return {
        kind: 'approve_reply',
        label: 'Approve & Reply',
        className:
          'text-sky-700 bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/15',
      };
    case 'complaints':
      return {
        kind: 'escalate',
        label: 'Escalate to Support',
        className:
          'text-orange-700 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/15',
      };
    case 'low_confidence':
      return {
        kind: 'review',
        label: 'Review',
        className:
          'text-slate-700 bg-slate-500/10 border border-slate-500/20 hover:bg-slate-500/15',
      };
  }
}

export const IGNORE_BTN_CLASS =
  'text-neutral-700 bg-white ring-1 ring-slate-200/80 hover:bg-surface-muted';

/** Same shell as IntegrationsView IntegrationCard / ConnectedChannelCard */
export const REVIEW_CARD_SHELL =
  'bg-white rounded-xl border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]';
