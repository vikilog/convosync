import { Skeleton } from '@/components/ui/skeleton'

/** Suspense fallback shown while a lazy-loaded route chunk downloads. */
export function PageSkeleton() {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="min-h-0 w-full flex-1" />
    </div>
  )
}
