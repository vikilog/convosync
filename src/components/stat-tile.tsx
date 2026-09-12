import { Card, CardContent } from '@/components/ui/card'

export function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  tone?: string
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-2">
        <div>
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className={`text-lg font-semibold tabular-nums ${tone ?? ''}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <Icon className="text-muted-foreground size-4" />
      </CardContent>
    </Card>
  )
}
