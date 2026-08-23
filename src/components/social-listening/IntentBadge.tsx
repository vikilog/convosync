import type { IntentLabel, TriageSectionId } from './types';
import { LOW_CONFIDENCE_THRESHOLD, triageSectionFor } from './types';
import { SECTION_THEMES, primaryActionFor, type PrimaryActionKind } from './intentConfig';

export function sectionForClassification(input: {
  intentLabel: IntentLabel | null;
  confidence: number | null;
  classificationStatus: string | null;
}): TriageSectionId | null {
  if (input.classificationStatus !== 'classified' || !input.intentLabel) return null;
  return triageSectionFor({
    id: '_',
    platform: 'instagram',
    username: '',
    profilePicUrl: null,
    commentText: '',
    postThumbnailUrl: '',
    postCaption: '',
    intent: input.intentLabel,
    confidence: input.confidence ?? 0,
    status: 'pending',
    suggestedDm: '',
    createdAt: new Date().toISOString(),
  });
}

export function IntentBadge({
  intentLabel,
  confidence,
  classificationStatus,
  classificationError,
  onRetry,
  retrying,
}: {
  intentLabel: IntentLabel | null;
  confidence: number | null;
  classificationStatus: string | null;
  classificationError?: string | null;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  if (classificationStatus === 'pending' || classificationStatus === null) {
    return (
      <span className="inline-flex animate-pulse items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
        Analyzing…
      </span>
    );
  }

  if (classificationStatus === 'failed') {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
          Classification failed
        </span>
        {onRetry && (
          <button
            type="button"
            disabled={retrying}
            onClick={onRetry}
            className="cursor-pointer text-[10px] font-bold text-sky-600 hover:underline disabled:opacity-50"
          >
            {retrying ? 'Retrying…' : 'Retry'}
          </button>
        )}
        {classificationError && (
          <span className="text-[10px] font-medium text-slate-400">{classificationError}</span>
        )}
      </span>
    );
  }

  const section = sectionForClassification({
    intentLabel,
    confidence,
    classificationStatus,
  });
  if (!section || !intentLabel) return null;

  const theme = SECTION_THEMES[section];
  const pct =
    confidence == null ? null : Math.round((confidence > 1 ? confidence : confidence * 100));

  const shortLabel =
    section === 'low_confidence'
      ? confidence != null && confidence < LOW_CONFIDENCE_THRESHOLD
        ? 'Low confidence'
        : intentLabel === 'Spam'
          ? 'Spam'
          : 'Unclear'
      : intentLabel;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${theme.accentBg} ${theme.accentText}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${theme.accentDot}`} />
      {shortLabel}
      {pct != null ? ` — ${pct}%` : ''}
    </span>
  );
}

export function primaryActionForComment(input: {
  intentLabel: IntentLabel | null;
  confidence: number | null;
  classificationStatus: string | null;
  status: string | null;
}): { kind: PrimaryActionKind | 'ignore_only'; label: string; className: string } | null {
  if (input.status && input.status !== 'new') return null;
  if (input.classificationStatus !== 'classified' || !input.intentLabel) return null;

  const section = sectionForClassification(input);
  if (!section) return null;

  if (section === 'low_confidence' && (input.intentLabel === 'Spam' || input.intentLabel === 'Neutral')) {
    return {
      kind: 'ignore_only',
      label: 'Ignore',
      className:
        'text-neutral-700 bg-white ring-1 ring-slate-200/80 hover:bg-surface-muted',
    };
  }

  return primaryActionFor(section);
}
