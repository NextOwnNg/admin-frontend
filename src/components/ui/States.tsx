import { CircleSlash, CloudOff, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { ButtonLink, PlainButton } from '@/components/ui/Button'

/** Calm empty state that always offers a next step (PRD §8). */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon
  title: string
  body?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-mint text-action">
        <Icon aria-hidden className="size-6" />
      </span>
      <h2 className="text-h3 text-ink">{title}</h2>
      {body && <p className="max-w-sm text-body text-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Load failure with a retry. Keeps the page structure so nothing jumps when it recovers. */
export function ErrorState({
  title = "We couldn't load this",
  body = 'Check your connection and try again.',
  onRetry,
}: {
  title?: string
  body?: ReactNode
  onRetry?: () => void
}) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-cloud text-muted ring-1 ring-border">
        <CloudOff aria-hidden className="size-6" />
      </span>
      <h2 className="text-h3 text-ink">{title}</h2>
      <p className="max-w-sm text-body text-muted">{body}</p>
      {onRetry && (
        <PlainButton variant="secondary" onClick={onRetry} className="mt-2">
          Try again
        </PlainButton>
      )}
    </div>
  )
}

/** A screen or record this role can't open. Says nothing about what's behind it (PRD §2, QA-16). */
export function PermissionDenied() {
  return (
    <EmptyState
      icon={CircleSlash}
      title="You don't have permission to view this page"
      body="Ask an administrator if you need access."
      action={
        <ButtonLink to="/" variant="secondary">
          Go to overview
        </ButtonLink>
      }
    />
  )
}

/** Table loading shape: skeleton rows, never a full-page spinner (PRD §3.2). */
export function TableSkeleton({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div role="status" aria-label="Loading" aria-busy="true" className="flex flex-col divide-y divide-border">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex h-12 items-center gap-4 px-4">
          {Array.from({ length: columns }, (_, col) => (
            <div key={col} className="h-3.5 flex-1 animate-pulse rounded-small bg-cloud" />
          ))}
        </div>
      ))}
    </div>
  )
}
