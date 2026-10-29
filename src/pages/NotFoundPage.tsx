import { SearchX } from 'lucide-react'
import { PageHead } from '@/components/seo/PageHead'
import { ButtonLink } from '@/components/ui/Button'

/** Generic not-found: no hint that a private record or screen exists (PRD §3.3). */
export function NotFoundPage() {
  return (
    <>
      <PageHead title="Page not found" />
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-4 text-center">
        <SearchX aria-hidden className="size-8 text-muted" />
        <h1 className="text-h2 text-ink">Page not found</h1>
        <p className="max-w-sm text-body text-muted">Check the address, or go back to the overview.</p>
        <ButtonLink to="/" variant="secondary" className="mt-2">
          Go to overview
        </ButtonLink>
      </div>
    </>
  )
}
