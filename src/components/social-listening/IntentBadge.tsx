import { LOW_CONFIDENCE_THRESHOLD, triageSectionFor, type IntentLabel } from '@/lib/socialListening'
import { TRIAGE_THEME } from '@/components/social-listening/intentConfig'

export function IntentBadge({
  intent,
  confidence,
  classificationStatus,
  classificationError,
  onRetry,
  retrying,
}: {
  intent?: IntentLabel | null
  confidence?: number | null
  classificationStatus?: string | null
  classificationError?: string | null
  onRetry?: () => void
  retrying?: boolean
}) {
  if (classificationStatus === 'pending' || classificationStatus === null) {
    return (
      <span className="bg-muted text-muted-foreground inline-flex animate-pulse items-center rounded-full px-2 py-0.5 text-[11px] font-medium">
        Analyzing…
      </span>
    )
  }

  if (classificationStatus === 'failed') {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
          Classification failed
        </span>
        {onRetry ? (
          <button
            type="button"
            disabled={retrying}
            onClick={onRetry}
            className="text-primary text-[11px] font-medium hover:underline disabled:opacity-50"
          >
            {retrying ? 'Retrying…' : 'Retry'}
          </button>
        ) : null}
        {classificationError ? (
          <span className="text-muted-foreground text-[11px]">{classificationError}</span>
        ) : null}
      </span>
    )
  }

  if (!intent) return null
  const section = triageSectionFor(intent, confidence ?? 0)
  const theme = TRIAGE_THEME[section]
  const pct = confidence == null ? null : Math.round(confidence > 1 ? confidence : confidence * 100)
  const label =
    section === 'low_confidence'
      ? confidence != null && confidence < LOW_CONFIDENCE_THRESHOLD
        ? 'Low confidence'
        : intent === 'Spam'
          ? 'Spam'
          : 'Unclear'
      : intent

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${theme.bg} ${theme.text}`}
    >
      <span className={`size-1.5 rounded-full ${theme.dot}`} />
      {label}
      {pct != null ? ` · ${pct}%` : ''}
    </span>
  )
}
