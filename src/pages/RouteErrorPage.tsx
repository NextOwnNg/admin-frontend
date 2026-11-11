import { useEffect } from 'react'
import { useMatches, useRouteError } from 'react-router'
import { PageHead } from '@/components/seo/PageHead'
import { ErrorState } from '@/components/ui/States'
import { reportError, routePattern } from '@/lib/observability/report-error'

/** A route failed to load or render (often a new deploy replaced the code chunk): reloading fixes it. */
export function RouteErrorPage() {
  const error = useRouteError()
  const route = routePattern(useMatches())

  useEffect(() => reportError(error, route), [error, route])

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
