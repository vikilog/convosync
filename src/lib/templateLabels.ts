/** WaBiz template tags — same labels as backend / Meta mapping. */

export const TEMPLATE_CATEGORIES = ['Utility', 'Marketing', 'Authentication'] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const TEMPLATE_STATUSES = [
  'draft',
  'pending',
  'approved',
  'rejected',
  'paused',
  'disabled',
] as const;
export type TemplateStatusSlug = (typeof TEMPLATE_STATUSES)[number];

export type TemplateStatusUi =
  | 'Draft'
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Paused'
  | 'Disabled';

const SLUG_TO_UI: Record<TemplateStatusSlug, TemplateStatusUi> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  paused: 'Paused',
  disabled: 'Disabled',
};

const UI_TO_SLUG: Record<TemplateStatusUi, TemplateStatusSlug> = {
  Draft: 'draft',
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
  Paused: 'paused',
  Disabled: 'disabled',
};

export function statusSlugToUi(slug: string): TemplateStatusUi {
  const key = slug.toLowerCase() as TemplateStatusSlug;
  return SLUG_TO_UI[key] ?? 'Pending';
}

export function statusUiToSlug(ui: TemplateStatusUi): TemplateStatusSlug {
  return UI_TO_SLUG[ui];
}

export const STATUS_BADGE_STYLES: Record<
  TemplateStatusUi,
  { className: string; dot?: string }
> = {
  Approved: {
    className:
      'text-xs text-[#008069] font-extrabold bg-[#e7f5f0] px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-[#008069]/15',
    dot: 'bg-[#008069]',
  },
  Pending: {
    className:
      'text-xs text-amber-800 font-extrabold bg-amber-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-100',
    dot: 'bg-amber-500',
  },
  Rejected: {
    className:
      'text-xs text-red-600 font-extrabold bg-red-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-red-100',
    dot: 'bg-red-500',
  },
  Draft: {
    className: 'text-xs text-gray-600 font-extrabold bg-gray-100 px-2.5 py-0.5 rounded-full',
    dot: 'bg-gray-400',
  },
  Paused: {
    className:
      'text-xs text-gray-700 font-extrabold bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200',
    dot: 'bg-gray-500',
  },
  Disabled: {
    className:
      'text-xs text-gray-500 font-extrabold bg-gray-50 px-2.5 py-0.5 rounded-full border border-gray-200 line-through',
    dot: 'bg-gray-400',
  },
};

export const CATEGORY_BADGE_CLASS =
  'p-1 px-1.5 bg-[#e7f5f0] text-[#008069] font-black text-meta rounded-md font-mono shrink-0';
