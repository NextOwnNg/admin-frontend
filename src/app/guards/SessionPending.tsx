import { LoaderCircle } from 'lucide-react'

export function SessionPending() {
  return (
    <div role="status" aria-label="Checking your session" className="flex justify-center py-16 text-muted">
      <LoaderCircle aria-hidden className="size-6 animate-spin" />
    </div>
  )
}
