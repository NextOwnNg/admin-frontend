import { ChevronRight } from 'lucide-react'
import { Fragment } from 'react'
import { Link, useMatches, type Params } from 'react-router'

/** Route `handle` contract: each route that should appear in the trail names its crumb. */
export type RouteHandle = { crumb?: string | ((params: Params) => string) }

/** Where you are, from the matched routes' `handle.crumb` (PRD §4.3 top bar). */
export function Breadcrumbs() {
  const crumbs = useMatches()
    .map((match) => {
      const crumb = (match.handle as RouteHandle | undefined)?.crumb
      if (!crumb) return null
      return { to: match.pathname, label: typeof crumb === 'function' ? crumb(match.params) : crumb }
    })
    .filter((c): c is { to: string; label: string } => c !== null)
    // A layout and its index route can name the same place; show it once
    .filter((c, i, all) => i === 0 || c.label !== all[i - 1]!.label)

  if (crumbs.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1 text-compact">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1
          return (
            <Fragment key={crumb.to + crumb.label}>
              {i > 0 && (
                <li aria-hidden className="text-muted">
                  <ChevronRight className="size-4" />
                </li>
              )}
              <li className="min-w-0 truncate">
                {last ? (
                  <span aria-current="page" className="font-semibold text-ink">
                    {crumb.label}
                  </span>
                ) : (
                  <Link to={crumb.to} className="text-muted hover:text-ink hover:underline">
                    {crumb.label}
                  </Link>
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
