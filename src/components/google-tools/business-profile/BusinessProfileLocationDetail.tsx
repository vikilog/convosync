import {
  ArrowLeft,
  BarChart3,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  MessageSquare,
  Star,
} from 'lucide-react';
import type { GbpLocation, GbpMetric, GbpReview } from './types';
import { formatAddress, groupHoursByDay, locationInitials, mapsUrl } from './utils';

type BusinessProfileLocationDetailProps = {
  location: GbpLocation | null;
  reviews: GbpReview[];
  metrics: GbpMetric[];
  reviewsLoading: boolean;
  metricsLoading: boolean;
  onLoadMetrics: () => void;
  empty: boolean;
  showBack?: boolean;
  onBack?: () => void;
};

function starRow(rating: number | null) {
  if (!rating) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? 'fill-current' : 'text-gray-200'}`}
        />
      ))}
    </span>
  );
}

export function BusinessProfileLocationDetail({
  location,
  reviews,
  metrics,
  reviewsLoading,
  metricsLoading,
  onLoadMetrics,
  empty,
  showBack,
  onBack,
}: BusinessProfileLocationDetailProps) {
  if (empty) {
    return (
      <section className="flex-1 min-w-0 flex flex-col items-center justify-center bg-slate-50 p-8">
        <div className="max-w-sm text-center rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-[0_4px_24px_rgba(52,168,83,0.06)]">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#e8f5e9] flex items-center justify-center mb-4">
            <MapPin className="w-7 h-7 text-[#34A853]" />
          </div>
          <h3 className="text-base font-black text-gray-950">Select a location</h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Choose a business location to view address, hours, and profile details.
          </p>
        </div>
      </section>
    );
  }

  if (!location) return null;

  const hours = groupHoursByDay(location.regularHours?.periods ?? []);
  const mapLink = mapsUrl(location);
  const reviewSummary = metrics.find((m) => m.metricType === 'review_summary');

  return (
    <section className="flex-1 min-w-0 flex flex-col bg-slate-50 overflow-hidden">
      <div className="sticky top-0 z-10 shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        {showBack && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-slate-50"
            aria-label="Back to list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        {mapLink && (
          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-bold text-[#34A853] bg-[#e8f5e9] hover:bg-[#d7f0db] transition-all ml-auto"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View on Maps
          </a>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">
          <article className="rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.04)] overflow-hidden">
            <header className="px-6 py-5 border-b border-[#f0eef5]">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#e8f5e9] to-[#f1f8e9] flex items-center justify-center text-base font-black text-[#34A853] shrink-0">
                  {locationInitials(location.title)}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-black text-gray-950 leading-tight break-words">
                    {location.title || 'Untitled location'}
                  </h1>
                  {location.metadata?.placeId && (
                    <p className="text-meta text-gray-400 mt-1 font-mono truncate">
                      Place ID: {location.metadata.placeId}
                    </p>
                  )}
                </div>
              </div>
            </header>

            <div className="px-6 py-5 grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-[#34A853]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Address</h2>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                  {formatAddress(location.storefrontAddress)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#34A853]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                    Business hours
                  </h2>
                </div>
                {hours.length === 0 ? (
                  <p className="text-sm text-gray-500">No hours listed for this location.</p>
                ) : (
                  <dl className="space-y-1.5">
                    {hours.map((row) => (
                      <div key={row.day} className="flex justify-between gap-3 text-sm">
                        <dt className="font-semibold text-gray-700 shrink-0">{row.label}</dt>
                        <dd className="text-gray-600 text-right">{row.hours}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.04)] overflow-hidden">
            <header className="px-6 py-4 border-b border-[#f0eef5] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#34A853]" />
              <h2 className="text-sm font-bold text-gray-900">Metrics</h2>
              <button
                type="button"
                onClick={onLoadMetrics}
                disabled={metricsLoading}
                className="ml-auto text-sm font-bold uppercase tracking-wider px-2 py-1 rounded-lg border border-[#34A853]/25 text-[#34A853] hover:bg-[#e8f5e9] disabled:opacity-50"
              >
                {metricsLoading ? 'Loading…' : 'Load metrics'}
              </button>
            </header>
            <div className="px-6 py-5">
              {metricsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading metrics…
                </div>
              ) : reviewSummary?.value ? (
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-500 text-sm font-bold uppercase">Total reviews</dt>
                    <dd className="text-lg font-black text-gray-900 mt-1">
                      {String(reviewSummary.value.totalReviews ?? 0)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 text-sm font-bold uppercase">Avg rating</dt>
                    <dd className="text-lg font-black text-gray-900 mt-1">
                      {reviewSummary.value.averageRating != null
                        ? String(reviewSummary.value.averageRating)
                        : '—'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-500">
                  Metrics load separately from location details. Queue a metrics sync from
                  Integrations if empty.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.04)] overflow-hidden">
            <header className="px-6 py-4 border-b border-[#f0eef5] flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-gray-900">Reviews</h2>
              <span className="ml-auto text-meta text-gray-400 tabular-nums">
                {reviews.length} cached
              </span>
            </header>
            <div className="px-6 py-4">
              {reviewsLoading ? (
                <div className="flex items-center justify-center py-8 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading reviews…
                </div>
              ) : reviews.length === 0 ? (
                <div className="py-8 text-center">
                  <MessageSquare className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-semibold text-gray-600">No cached reviews yet</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    Run a reviews sync from Integrations → Google Business Profile. AI replies and
                    automation hooks are prepared for a future release.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-[#f0eef5]">
                  {reviews.map((review) => (
                    <li key={review.id} className="py-4 first:pt-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900">
                          {review.reviewerName ?? 'Anonymous'}
                        </p>
                        {starRow(review.starRating)}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
                      )}
                      {review.reviewReply && (
                        <p className="text-xs text-gray-500 mt-2 pl-3 border-l-2 border-[#34A853]/30">
                          Reply: {review.reviewReply}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
