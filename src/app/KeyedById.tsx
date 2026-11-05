import { Fragment, type ReactNode } from 'react'
import { useParams } from 'react-router'

/** Remounts a detail page when only `:id` changes, so no state from the previous record carries over. */
export function KeyedById({ children }: { children: ReactNode }) {
  const { id } = useParams()
  return <Fragment key={id}>{children}</Fragment>
}
