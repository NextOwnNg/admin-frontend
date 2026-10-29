import { PageHead } from '@/components/seo/PageHead'
import { ErrorState } from '@/components/ui/States'

/** A route failed to load or render (often a new deploy replaced the code chunk): reloading fixes it. */
export function RouteErrorPage() {
  return (
    <>
      <PageHead title="Something went wrong" />
      <ErrorState
        title="Something went wrong"
        body="This page didn't load. Reload to try again."
        onRetry={() => window.location.reload()}
      />
    </>
  )
}
