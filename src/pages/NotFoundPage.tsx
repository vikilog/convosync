import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <Compass className="text-muted-foreground size-6" />
      </div>
      <div>
        <p className="text-lg font-semibold">Page not found</p>
        <p className="text-muted-foreground text-sm">
          The page you're looking for doesn't exist or has moved.
        </p>
      </div>
      <Button asChild size="sm">
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  )
}
