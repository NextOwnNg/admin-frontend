import type { RecordKind } from '@/lib/api/types/records'

/** Global search (Phase C design §4.3): IDs and names only, scoped by the API to what the viewer may open */

export type SearchKind = RecordKind | 'cases'
export type SearchResult = { kind: SearchKind; id: string; label: string; href: string }
export type SearchResponse = {
  /** The one result whose ID is exactly the query, if any */
  exact: SearchResult | null
  /** Cases, Transactions, Members, Listings, Items, Offers, Feed, Reports; empty groups left out */
  groups: { kind: SearchKind; results: SearchResult[] }[]
}
