import type { Redaction } from '@/lib/api/types/cases'
import type {
  Availability,
  DetailKind,
  FeedDetail,
  FeedRow,
  ItemDetail,
  ItemRow,
  ListingDetail,
  ListingRow,
  MemberDetail,
  MemberRow,
  ModerationState,
  OfferDetail,
  OfferRow,
  RecordCase,
  RecordDetailFor,
  RecordKind,
  RecordLinkGroup,
  RecordPage,
  RecordRef,
  RecordRowFor,
  ReportDetail,
  ReportRow,
  TransactionRow,
} from '@/lib/api/types/records'
import type { SearchResponse } from '@/lib/api/types/search'
import { recordHref } from '@/lib/copy/records'
import { ACTIVE_CASE_STATUSES, REDACTION } from '@/lib/copy/status'
import { auditDb, page } from '@/mocks/db/audit'
import { store } from '@/mocks/db/store'
import type { FeedRec, ItemRec, ListingRec, MemberRec, OfferRec, ReportRec } from '@/mocks/records-seed'
import type { CaseRecord, TransactionRecord } from '@/mocks/seed'

/** The record browsers' read model (Phase C design §5). Lists never carry phones or message text (PRD §7). */

const records = () => store().records
const cases = () => store().cases
const transactions = () => store().transactions

const TERMINAL_TX = new Set([
  'COMPLETED',
  'CANCELLED',
  'RESOLVED_BY_SUPPORT_CANCELLED',
  'RESOLVED_BY_SUPPORT_NO_COMPLETION',
])

/** Content redaction as it stands now: a moderator's hide on any case about it wins over the seed */
function liveRedaction(id: string, own: Redaction): Redaction {
  const hidden = cases().find((c) => c.content?.id === id && c.content.redaction)
  return hidden?.content?.redaction ?? own
}

// References: a name or title, never private data

const memberRef = (id: string): RecordRef => ({
  kind: 'users',
  id,
  label: records().members.find((m) => m.id === id)?.displayName ?? id,
})
const itemRef = (id: string): RecordRef => ({
  kind: 'items',
  id,
  label: records().items.find((i) => i.id === id)?.title ?? id,
})
const listingRef = (id: string): RecordRef => ({
  kind: 'listings',
  id,
  label: records().listings.find((l) => l.id === id)?.title ?? id,
})
const offerRef = (o: OfferRec): RecordRef => ({
  kind: 'offers',
  id: o.id,
  label: `Offer on ${listingRef(o.listingId).label}`,
})
const transactionRef = (id: string): RecordRef => ({ kind: 'transactions', id, label: `Transaction ${id}` })
const caseRef = (id: string): RecordRef => ({ kind: 'cases', id, label: `Case ${id}` })
const feedLabel = (f: FeedRec) => {
  const redaction = liveRedaction(f.id, f.redaction)
  return redaction ? REDACTION[redaction] : f.caption
}
const feedRef = (f: FeedRec): RecordRef => ({ kind: 'feed', id: f.id, label: feedLabel(f) })

// Rows

function listingModeration(l: ListingRec): ModerationState {
  const redaction = liveRedaction(l.id, l.redaction)
  if (l.moderation === 'removed' || redaction === 'removed_by_moderation') return 'removed'
  return redaction === 'hidden_by_moderation' ? 'hidden' : l.moderation
}

function availability(item: ItemRec): Availability {
  const held = transactions().some(
    (t) => !TERMINAL_TX.has(t.status) && t.reservations.some((r) => r.itemId === item.id && !r.releasedAt),
  )
  if (held) return 'reserved'
  const listing = records().listings.find((l) => l.itemId === item.id)
  if (listing && ['COMPLETED', 'CLOSED', 'REMOVED'].includes(listing.status)) return 'closed'
  return 'available'
}

const involves = (c: CaseRecord, memberId: string) =>
  c.parties.some((p) => p.userId === memberId && p.role !== 'reporter')

function memberRow(m: MemberRec): MemberRow {
  return {
    id: m.id,
    displayName: m.displayName,
    area: m.area,
    joinedAt: m.joinedAt,
    status: m.restrictedUntil ? 'restricted' : 'active',
    restrictedUntil: m.restrictedUntil,
    openCases: cases().filter((c) => ACTIVE_CASE_STATUSES.includes(c.status) && involves(c, m.id)).length,
  }
}

const itemRow = (i: ItemRec): ItemRow => ({
  id: i.id,
  title: i.title,
  owner: memberRef(i.ownerId),
  category: i.category,
  availability: availability(i),
})

const listingRow = (l: ListingRec): ListingRow => ({
  id: l.id,
  title: l.title,
  seller: memberRef(l.sellerId),
  askingKobo: l.askingKobo,
  modes: l.modes,
  status: l.status,
  urgentUntil: l.urgentUntil,
  moderation: listingModeration(l),
  category: l.category,
  area: l.area,
})

function offerRow(o: OfferRec): OfferRow {
  const current = o.versions[0]!
  return {
    id: o.id,
    listing: listingRef(o.listingId),
    initiator: memberRef(o.initiatorId),
    recipient: memberRef(o.recipientId),
    current: {
      number: current.number,
      cashKobo: current.terms.cashKobo,
      cashDirection: current.terms.cashDirection,
      offeredItem: o.offeredItemId ? itemRef(o.offeredItemId) : null,
    },
    status: o.status,
    expiresAt: o.expiresAt,
  }
}

function participantsOf(t: TransactionRecord): [string, string] {
  const offer = records().offers.find((o) => o.transactionId === t.id)!
  return [offer.initiatorId, offer.recipientId]
}

const transactionRow = (t: TransactionRecord): TransactionRow => {
  const [a, b] = participantsOf(t)
  return {
    id: t.id,
    participants: [memberRef(a), memberRef(b)],
    status: t.status,
    flags: t.flags,
    createdAt: t.acceptedAt,
  }
}

function feedRow(f: FeedRec): FeedRow {
  const redaction = liveRedaction(f.id, f.redaction)
  return {
    id: f.id,
    author: memberRef(f.authorId),
    listing: listingRef(f.listingId),
    caption: redaction ? null : f.caption,
    redaction,
    status:
      f.status !== 'visible'
        ? f.status
        : redaction === 'hidden_by_moderation'
          ? 'hidden'
          : redaction === 'removed_by_moderation'
            ? 'removed'
            : f.status,
    createdAt: f.createdAt,
  }
}

const reportRow = (r: ReportRec): ReportRow => ({
  id: r.id,
  targetType: r.targetType,
  target: r.target,
  reporter: memberRef(r.reporterId),
  reasonCode: r.reasonCode,
  case: caseRef(r.caseId),
  receivedAt: r.receivedAt,
})

// Lists

type Listed<K extends RecordKind> = { row: RecordRowFor[K]; at: string; text: string }

function rowsFor<K extends RecordKind>(kind: K): Listed<K>[] {
  const r = records()
  const out: Record<RecordKind, () => Listed<RecordKind>[]> = {
    users: () => r.members.map((m) => ({ row: memberRow(m), at: m.joinedAt, text: m.displayName })),
    items: () => r.items.map((i) => ({ row: itemRow(i), at: i.createdAt, text: i.title })),
    listings: () => r.listings.map((l) => ({ row: listingRow(l), at: l.createdAt, text: l.title })),
    offers: () => r.offers.map((o) => ({ row: offerRow(o), at: o.createdAt, text: listingRef(o.listingId).label })),
    transactions: () =>
      transactions().map((t) => {
        const row = transactionRow(t)
        return { row, at: t.acceptedAt, text: row.participants.map((p) => p.label).join(' ') }
      }),
    feed: () => r.feed.map((f) => ({ row: feedRow(f), at: f.createdAt, text: feedLabel(f) })),
    reports: () => r.reports.map((rep) => ({ row: reportRow(rep), at: rep.receivedAt, text: rep.target.label })),
  }
  return out[kind]() as Listed<K>[]
}

const csv = (params: URLSearchParams, key: string) =>
  (params.get(key) ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

/** Each browser's own filters (Phase C design §4.1); unknown values match nothing they name */
function matchesFilters(kind: RecordKind, row: RecordRowFor[RecordKind], params: URLSearchParams): boolean {
  const has = (key: string, value: string) => {
    const wanted = csv(params, key)
    return wanted.length === 0 || wanted.includes(value)
  }
  switch (kind) {
    case 'users': {
      const m = row as MemberRow
      return has('status', m.status) && has('area', m.area)
    }
    case 'items': {
      const i = row as ItemRow
      return has('category', i.category) && has('availability', i.availability)
    }
    case 'listings': {
      const l = row as ListingRow
      const modes = csv(params, 'mode')
      return (
        has('status', l.status) &&
        has('category', l.category) &&
        has('area', l.area) &&
        (modes.length === 0 || l.modes.some((m) => modes.includes(m))) &&
        (params.get('urgent') !== '1' || l.urgentUntil !== null)
      )
    }
    case 'offers':
      return has('status', (row as OfferRow).status)
    case 'transactions': {
      const t = row as TransactionRow
      const flags = csv(params, 'flag')
      return has('status', t.status) && (flags.length === 0 || t.flags.some((f) => flags.includes(f)))
    }
    case 'feed':
      return has('status', (row as FeedRow).status)
    case 'reports': {
      const rep = row as ReportRow
      return has('type', rep.targetType) && has('reason', rep.reasonCode)
    }
  }
}

// Details

const casesAbout = (predicate: (c: CaseRecord) => boolean): RecordCase[] =>
  cases()
    .filter(predicate)
    .map(({ id, severity, status, summary, redaction }) => ({ id, severity, status, summary, redaction }))

const group = (label: string, refs: RecordRef[]): RecordLinkGroup[] =>
  refs.length > 0 ? [{ label, records: refs }] : []
const unique = (refs: RecordRef[]) => refs.filter((r, i) => refs.findIndex((o) => o.id === r.id) === i)

function memberDetail(m: MemberRec): MemberDetail {
  const r = records()
  const items = r.items.filter((i) => i.ownerId === m.id)
  const listings = r.listings.filter((l) => l.sellerId === m.id)
  const offers = r.offers.filter((o) => o.initiatorId === m.id || o.recipientId === m.id)
  const txs = transactions().filter((t) => participantsOf(t).includes(m.id))
  return {
    ...memberRow(m),
    hasPhone: m.phone !== null,
    items: items.map(itemRow),
    listings: listings.map(listingRow),
    offers: offers.map(offerRow),
    transactions: txs.map(transactionRow),
    reportsFiled: r.reports.filter((rep) => rep.reporterId === m.id).map(reportRow),
    reportsReceived: r.reports.filter((rep) => rep.target.kind === 'users' && rep.target.id === m.id).map(reportRow),
    history: auditDb.forTarget(m.id),
    links: [
      ...group(
        'Items',
        items.map((i) => itemRef(i.id)),
      ),
      ...group(
        'Listings',
        listings.map((l) => listingRef(l.id)),
      ),
      ...group('Offers', offers.map(offerRef)),
      ...group(
        'Transactions',
        txs.map((t) => transactionRef(t.id)),
      ),
    ],
    cases: casesAbout((c) => c.parties.some((p) => p.userId === m.id)),
  }
}

function itemDetail(i: ItemRec): ItemDetail {
  const r = records()
  const listings = r.listings.filter((l) => l.itemId === i.id)
  const offers = r.offers.filter((o) => o.offeredItemId === i.id || listings.some((l) => l.id === o.listingId))
  const txs = transactions().filter((t) => t.reservations.some((res) => res.itemId === i.id))
  return {
    ...itemRow(i),
    model: i.model,
    condition: i.condition,
    defects: i.defects,
    repairs: i.repairs,
    ownershipDeclared: i.ownershipDeclared,
    visibility: i.visibility,
    listings: listings.map(listingRow),
    offers: offers.map(offerRow),
    reservations: txs.flatMap((t) => t.reservations.filter((res) => res.itemId === i.id)),
    links: [
      ...group('Owner', [memberRef(i.ownerId)]),
      ...group(
        'Listings',
        listings.map((l) => listingRef(l.id)),
      ),
      ...group('Offers', offers.map(offerRef)),
      ...group(
        'Transactions',
        txs.map((t) => transactionRef(t.id)),
      ),
    ],
    cases: casesAbout((c) => txs.some((t) => t.id === c.transactionId) || listings.some((l) => l.id === c.content?.id)),
  }
}

function listingDetail(l: ListingRec): ListingDetail {
  const r = records()
  const offers = r.offers.filter((o) => o.listingId === l.id)
  const posts = r.feed.filter((f) => f.listingId === l.id)
  const txIds = offers.flatMap((o) => (o.transactionId ? [o.transactionId] : []))
  const redaction = liveRedaction(l.id, l.redaction)
  return {
    ...listingRow(l),
    item: itemRef(l.itemId),
    desiredItems: l.desiredItems,
    description: redaction ? null : l.description,
    redaction,
    publishedAt: l.publishedAt,
    statusHistory: l.statusHistory,
    offers: offers.map(offerRow),
    feedPosts: posts.map(feedRow),
    reports: r.reports.filter((rep) => rep.target.kind === 'listings' && rep.target.id === l.id).map(reportRow),
    links: [
      ...group('Seller', [memberRef(l.sellerId)]),
      ...group('Item', [itemRef(l.itemId)]),
      ...group('Offers', offers.map(offerRef)),
      ...group('Feed posts', posts.map(feedRef)),
      ...group('Transactions', txIds.map(transactionRef)),
    ],
    cases: casesAbout((c) => c.content?.id === l.id || txIds.includes(c.transactionId ?? '')),
  }
}

function offerDetail(o: OfferRec): OfferDetail {
  return {
    ...offerRow(o),
    versions: o.versions,
    transaction: o.transactionId ? transactionRef(o.transactionId) : null,
    links: [
      ...group('Listing', [listingRef(o.listingId)]),
      ...group('People', unique([memberRef(o.initiatorId), memberRef(o.recipientId)])),
      ...group('Offered item', o.offeredItemId ? [itemRef(o.offeredItemId)] : []),
      ...group('Transaction', o.transactionId ? [transactionRef(o.transactionId)] : []),
    ],
    cases: casesAbout((c) => Boolean(o.transactionId) && c.transactionId === o.transactionId),
  }
}

function feedDetail(f: FeedRec): FeedDetail {
  return {
    ...feedRow(f),
    comments: f.comments.map((m) => {
      const redaction = liveRedaction(m.id, m.redaction)
      return { id: m.id, author: memberRef(m.authorId), text: redaction ? null : m.text, redaction, at: m.at }
    }),
    reports: records()
      .reports.filter((rep) => rep.target.kind === 'feed' && rep.target.id === f.id)
      .map(reportRow),
    links: [...group('Author', [memberRef(f.authorId)]), ...group('Listing', [listingRef(f.listingId)])],
    cases: casesAbout((c) => c.content?.id === f.id || f.comments.some((m) => m.id === c.content?.id)),
  }
}

function reportDetail(rep: ReportRec): ReportDetail {
  const target: RecordRef = rep.target
  return {
    ...reportRow(rep),
    description: rep.description,
    evidenceCount: rep.evidenceCount,
    links: [
      ...group('Reporter', [memberRef(rep.reporterId)]),
      ...group('Reported', [target]),
      ...group('Case', [caseRef(rep.caseId)]),
    ],
    cases: casesAbout((c) => c.id === rep.caseId),
  }
}

export const recordsDb = {
  list<K extends RecordKind>(kind: K, params: URLSearchParams): RecordPage<RecordRowFor[K]> {
    const q = (params.get('q') ?? '').trim().toLowerCase()
    const rows = rowsFor(kind)
      .filter(({ row, text }) => !q || row.id.toLowerCase().startsWith(q) || text.toLowerCase().includes(q))
      .filter(({ row }) => matchesFilters(kind, row, params))
      .sort((a, b) => b.at.localeCompare(a.at) || b.row.id.localeCompare(a.row.id))
      .map(({ row }) => row)
    return structuredClone(page(rows, params.get('cursor') ?? undefined))
  },

  detail<K extends DetailKind>(kind: K, id: string): RecordDetailFor[K] | undefined {
    const r = records()
    const find: { [P in DetailKind]: () => RecordDetailFor[P] | undefined } = {
      users: () => {
        const m = r.members.find((x) => x.id === id)
        return m && memberDetail(m)
      },
      items: () => {
        const i = r.items.find((x) => x.id === id)
        return i && itemDetail(i)
      },
      listings: () => {
        const l = r.listings.find((x) => x.id === id)
        return l && listingDetail(l)
      },
      offers: () => {
        const o = r.offers.find((x) => x.id === id)
        return o && offerDetail(o)
      },
      feed: () => {
        const f = r.feed.find((x) => x.id === id)
        return f && feedDetail(f)
      },
      reports: () => {
        const rep = r.reports.find((x) => x.id === id)
        return rep && reportDetail(rep)
      },
    }
    const found = find[kind]()
    return found && structuredClone(found)
  },

  member: (id: string) => records().members.find((m) => m.id === id),

  /** Global search over IDs and names (Phase C design §4.3); the handler scopes cases for support agents */
  search(q: string, visibleCase: (c: CaseRecord) => boolean, browse: boolean): SearchResponse {
    const needle = q.toLowerCase()
    const hit = (id: string, text: string) => id.toLowerCase().startsWith(needle) || text.toLowerCase().includes(needle)
    const r = records()
    const seen = cases().filter(visibleCase)
    const groups: SearchResponse['groups'] = [
      {
        kind: 'cases',
        results: seen
          .filter((c) => hit(c.id, c.redaction ? '' : c.summary))
          .map((c) => ({
            kind: 'cases',
            id: c.id,
            label: c.redaction ? REDACTION[c.redaction] : c.summary,
            href: `/cases/${c.id}`,
          })),
      },
      {
        kind: 'transactions',
        results: transactions()
          .flatMap((t) => {
            if (browse) return [{ t, caseId: null as string | null }]
            const through = seen.find((c) => c.transactionId === t.id)
            return through ? [{ t, caseId: through.id }] : []
          })
          .filter(({ t }) => hit(t.id, ''))
          .map(({ t, caseId }) => ({
            kind: 'transactions',
            id: t.id,
            label: `Transaction ${t.id}`,
            href: caseId ? `/transactions/${t.id}?case=${caseId}` : `/transactions/${t.id}`,
          })),
      },
    ]
    if (browse) {
      const ref = (row: RecordRef) => ({ ...row, href: recordHref(row) })
      groups.push(
        { kind: 'users', results: r.members.filter((m) => hit(m.id, m.displayName)).map((m) => ref(memberRef(m.id))) },
        { kind: 'listings', results: r.listings.filter((l) => hit(l.id, l.title)).map((l) => ref(listingRef(l.id))) },
        { kind: 'items', results: r.items.filter((i) => hit(i.id, i.title)).map((i) => ref(itemRef(i.id))) },
        { kind: 'offers', results: r.offers.filter((o) => hit(o.id, '')).map((o) => ref(offerRef(o))) },
        {
          kind: 'feed',
          results: r.feed.flatMap((f) => {
            const own = hit(f.id, liveRedaction(f.id, f.redaction) ? '' : f.caption) ? [ref(feedRef(f))] : []
            // A comment is found through its post
            const comments = f.comments
              .filter((c) => c.id.toLowerCase().startsWith(needle))
              .map((c) => ({
                kind: 'feed' as const,
                id: f.id,
                label: `Comment ${c.id} on post ${f.id}`,
                href: recordHref({ kind: 'feed', id: f.id }),
              }))
            return [...own, ...comments]
          }),
        },
        {
          kind: 'reports',
          results: r.reports
            .filter((rep) => hit(rep.id, ''))
            .map((rep) => ref({ kind: 'reports', id: rep.id, label: `Report ${rep.id}` })),
        },
      )
    }
    const all = groups.flatMap((g) => g.results)
    const exact =
      all.find((x) => x.id.toLowerCase() === needle) ??
      all.find((x) => x.label.toLowerCase().startsWith(`comment ${needle} `)) ??
      null
    return structuredClone({
      exact,
      groups: groups.filter((g) => g.results.length > 0).map((g) => ({ ...g, results: g.results.slice(0, 5) })),
    })
  },

  /** A transaction's participants, items and offer as records */
  transactionLinks(id: string): RecordLinkGroup[] {
    const t = transactions().find((x) => x.id === id)
    const offer = records().offers.find((o) => o.transactionId === id)
    if (!t || !offer) return []
    return [
      ...group('Participants', participantsOf(t).map(memberRef)),
      ...group(
        'Items',
        t.reservations.map((r) => itemRef(r.itemId)),
      ),
      ...group('Offer', [offerRef(offer)]),
      ...group('Listing', [listingRef(offer.listingId)]),
    ]
  },
}
