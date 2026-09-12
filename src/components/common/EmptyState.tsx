import type { ReactNode } from 'react'

/** Generic empty-state panel used by every list/grid page — dashed border,
 * centered icon, title + description, optional action slot. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-12 text-center ${className}`}
    >
      <Icon className="text-muted-foreground size-8" />
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="text-muted-foreground max-w-sm text-xs">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
