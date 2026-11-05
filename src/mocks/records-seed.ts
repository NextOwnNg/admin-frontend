import type { Redaction } from '@/lib/api/types/cases'
import type { TargetType } from '@/lib/api/types/reference'
import type { FeedStatus, ListingMode, ListingStatus, ModerationState, OfferStatus } from '@/lib/api/types/records'
import type { OfferTerms, OfferVersion } from '@/lib/api/types/transactions'
import {
  MEMBERS,
  PRICE_EDITED_LISTING_NOW_KOBO,
  SCENARIO,
  TX,
  type CaseRecord,
  type Member,
  type TransactionRecord,
} from '@/mocks/seed'

/**
 * Members, items, listings, offers, feed posts and reports around the Phase B cases and transactions, so every
 * case and transaction sits on a complete chain (Phase C design §5). FICTIONAL people and places.
 */

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export type MemberRec = {
  id: string
  displayName: string
  area: string
  joinedAt: string
  restrictedUntil: string | null
  /** Never leaves the mock except through an audited reveal */
  phone: string | null
}
export type ItemRec = {
  id: string
  title: string
  ownerId: string
  category: string
  model: string | null
  condition: string
  defects: string | null
  repairs: string | null
  ownershipDeclared: boolean
  visibility: 'PUBLIC_LISTED' | 'OFFER_ONLY'
  createdAt: string
}
export type ListingRec = {
  id: string
  itemId: string
  sellerId: string
  title: string
  askingKobo: number | null
  modes: ListingMode[]
  status: ListingStatus
  urgentUntil: string | null
  moderation: ModerationState
  redaction: Redaction
  category: string
  area: string
  desiredItems: string | null
  description: string
  publishedAt: string | null
  statusHistory: { status: ListingStatus; at: string }[]
  createdAt: string
}
export type OfferRec = {
  id: string
  listingId: string
  initiatorId: string
  recipientId: string
  status: OfferStatus
  expiresAt: string | null
  versions: OfferVersion[]
  offeredItemId: string | null
  transactionId: string | null
  createdAt: string
}
export type CommentRec = { id: string; authorId: string; text: string; redaction: Redaction; at: string }
export type FeedRec = {
  id: string
  authorId: string
  listingId: string
  caption: string
  redaction: Redaction
  status: FeedStatus
  createdAt: string
  comments: CommentRec[]
}
export type ReportRec = {
  id: string
  targetType: TargetType
  /** The record the report is about; a comment's report points at its feed post */
  target: { kind: 'users' | 'listings' | 'feed' | 'transactions'; id: string; label: string }
  reporterId: string
  reasonCode: string
  caseId: string
  receivedAt: string
  description: string
  evidenceCount: number
}
export type RecordsState = {
  members: MemberRec[]
  items: ItemRec[]
  listings: ListingRec[]
  offers: OfferRec[]
  feed: FeedRec[]
  reports: ReportRec[]
}

/** Scenario record IDs for tests and the walkthrough */
export const REC = {
  /** Kunle's MacBook: listed, offered for by Ada, accepted into the disputed transaction */
  chain: {
    member: 'u-kunle',
    item: 'I-1102',
    listing: 'L-5101',
    offer: 'O-6101',
    transaction: TX.paymentDispute,
    case: SCENARIO.paymentDispute,
  },
  restrictedMember: 'u-segun',
  /** No items, listings, offers or phone */
  emptyMember: 'u-yemi',
  removedListing: 'L-5214',
  hiddenListing: 'L-5218',
  redactedFeedPost: 'F-910',
  multiVersionOffer: 'O-6201',
} as const

const EXTRA_MEMBERS: Member[] = [
  {
    userId: 'u-chidi',
    displayName: 'Chidi E.',
    memberSince: '2025-02-11T09:00:00Z',
    priorActions90d: 0,
    phone: '+2348000001209',
  },
  {
    userId: 'u-bisi',
    displayName: 'Bisi A.',
    memberSince: '2025-05-23T09:00:00Z',
    priorActions90d: 0,
    phone: '+2348000001210',
  },
  {
    userId: 'u-musa',
    displayName: 'Musa D.',
    memberSince: '2025-10-01T09:00:00Z',
    priorActions90d: 0,
    phone: '+2348000001211',
  },
  { userId: 'u-yemi', displayName: 'Yemi K.', memberSince: '2026-10-30T09:00:00Z', priorActions90d: 0, phone: '' },
]

const AREAS: Record<string, string> = {
  'u-ada': 'Yaba',
  'u-kunle': 'Surulere',
  'u-ifeoma': 'Ikeja',
  'u-emeka': 'Lekki',
  'u-halima': 'Yaba',
  'u-segun': 'Ikeja',
  'u-zainab': 'Ajah',
  'u-tobi': 'Surulere',
  'u-chidi': 'Lekki',
  'u-bisi': 'Ikeja',
  'u-musa': 'Yaba',
  'u-yemi': 'Ajah',
}

const CATEGORY_RULES: [RegExp, string][] = [
  [/phone|iphone|pixel|galaxy s|samsung galaxy|airpods/i, 'Phones'],
  [/laptop|macbook|thinkpad|xps|hp /i, 'Laptops'],
  [/playstation|xbox|nintendo|ps4|ps5|gaming/i, 'Gaming'],
  [/bicycle|bike/i, 'Bikes'],
  [/shirt|polo|shoe/i, 'Fashion'],
  [/chair|fan|fryer|cooker|microwave|blender|generator|sewing/i, 'Home'],
]
const categoryOf = (title: string) => CATEGORY_RULES.find(([re]) => re.test(title))?.[1] ?? 'Electronics'

/** A short title from a report summary, for content the seed only knows by its report */
const titleFrom = (text: string) => (text.length > 48 ? `${text.slice(0, 45).trimEnd()}…` : text)

type ExtraListing = [
  id: string,
  owner: string,
  title: string,
  status: ListingStatus,
  askingKobo: number | null,
  modes: ListingMode[],
  urgentHours: number | null,
  moderation: ModerationState,
]

/** Ordinary listings, so every state appears and the browser pages past 25 */
const EXTRA_LISTINGS: ExtraListing[] = [
  ['L-5201', 'u-chidi', 'iPhone 13 Pro, 256 GB', 'ACTIVE', 45_000_000, ['CASH', 'SWAP_PLUS_CASH'], 48, 'clear'],
  ['L-5202', 'u-chidi', 'Dell XPS 13 laptop', 'ACTIVE', 60_000_000, ['CASH'], null, 'clear'],
  ['L-5203', 'u-bisi', 'Nintendo Switch with two games', 'ACTIVE', null, ['SWAP'], null, 'clear'],
  ['L-5204', 'u-bisi', 'Air fryer, 4 litre', 'DRAFT', 4_500_000, ['CASH'], null, 'clear'],
  ['L-5205', 'u-musa', 'Xbox Series S', 'PENDING_REVIEW', 28_000_000, ['CASH'], null, 'clear'],
  ['L-5206', 'u-musa', 'Road bicycle, 54 cm frame', 'EXPIRED', 15_000_000, ['CASH'], -24, 'clear'],
  ['L-5207', 'u-ada', 'Kindle Paperwhite', 'ACTIVE', 7_500_000, ['CASH', 'SWAP'], 24, 'clear'],
  ['L-5208', 'u-kunle', 'Bluetooth speaker', 'CLOSED', 3_000_000, ['CASH'], null, 'clear'],
  ['L-5209', 'u-ifeoma', 'Samsung Galaxy S21', 'ACTIVE', 25_000_000, ['CASH', 'SWAP_PLUS_CASH'], null, 'clear'],
  ['L-5210', 'u-halima', 'Gaming chair', 'ACTIVE', 9_000_000, ['CASH'], null, 'clear'],
  ['L-5211', 'u-segun', 'Microwave oven', 'ACTIVE', 6_000_000, ['CASH'], 72, 'clear'],
  ['L-5212', 'u-zainab', 'Lenovo ThinkPad T480', 'ACTIVE', 22_000_000, ['CASH', 'SWAP_PLUS_CASH'], null, 'clear'],
  ['L-5213', 'u-chidi', 'PS4 controller', 'ACTIVE', 2_500_000, ['CASH'], null, 'clear'],
  ['L-5214', 'u-emeka', 'iPad Air, 4th generation', 'REMOVED', 30_000_000, ['CASH'], null, 'removed'],
  ['L-5215', 'u-bisi', 'Rice cooker', 'COMPLETED', 3_500_000, ['CASH'], null, 'clear'],
  ['L-5216', 'u-ifeoma', 'Canon printer', 'ACTIVE', 5_000_000, ['CASH'], null, 'clear'],
  ['L-5217', 'u-kunle', 'Polo shirts, bundle of five', 'ACTIVE', 2_000_000, ['CASH'], null, 'clear'],
  ['L-5218', 'u-tobi', 'AirPods Pro', 'ACTIVE', 12_000_000, ['CASH'], null, 'hidden'],
]

/** How the latest version of an offer ended, or `pending` while it waits for a reply */
const LAST_VERSION_STATE: Record<OfferStatus, OfferVersion['state']> = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  WITHDRAWN: 'withdrawn',
}

export function buildRecords(now: number, base: { cases: CaseRecord[]; transactions: TransactionRecord[] }) {
  const iso = (ms: number) => new Date(ms).toISOString()
  const ago = (minutes: number) => iso(now - minutes * MINUTE)
  const allMembers = [...Object.values(MEMBERS), ...EXTRA_MEMBERS]
  const byName = new Map(allMembers.map((m) => [m.displayName, m.userId]))

  const members: MemberRec[] = allMembers.map((m) => ({
    id: m.userId,
    displayName: m.displayName,
    area: AREAS[m.userId] ?? 'Yaba',
    joinedAt: m.memberSince,
    restrictedUntil: m.userId === REC.restrictedMember ? iso(now + 5 * DAY) : null,
    phone: m.phone || null,
  }))

  const items: ItemRec[] = []
  const listings: ListingRec[] = []
  const addItem = (
    item: Omit<ItemRec, 'category' | 'model' | 'repairs' | 'ownershipDeclared' | 'createdAt'> & { minutesAgo: number },
  ) => {
    const { minutesAgo, ...rest } = item
    items.push({
      ...rest,
      category: categoryOf(item.title),
      model: null,
      repairs: null,
      ownershipDeclared: true,
      createdAt: ago(minutesAgo),
    })
  }
  const addListing = (
    listing: Pick<
      ListingRec,
      'id' | 'itemId' | 'sellerId' | 'title' | 'askingKobo' | 'modes' | 'status' | 'moderation'
    > &
      Partial<Pick<ListingRec, 'redaction' | 'urgentUntil' | 'description'>> & { minutesAgo: number },
  ) => {
    const { minutesAgo, ...rest } = listing
    const createdAt = ago(minutesAgo)
    const published = rest.status !== 'DRAFT' && rest.status !== 'PENDING_REVIEW'
    listings.push({
      redaction: null,
      urgentUntil: null,
      description: `${rest.title}. Works well, pick up in ${AREAS[rest.sellerId] ?? 'Lagos'}.`,
      ...rest,
      category: categoryOf(rest.title),
      area: AREAS[rest.sellerId] ?? 'Yaba',
      desiredItems: rest.modes.includes('SWAP') || rest.modes.includes('SWAP_PLUS_CASH') ? 'A phone or laptop' : null,
      publishedAt: published ? createdAt : null,
      statusHistory: [
        ...(published ? [{ status: 'ACTIVE' as const, at: createdAt }] : []),
        ...(rest.status !== 'ACTIVE' ? [{ status: rest.status, at: ago(Math.max(1, minutesAgo - 600)) }] : []),
      ],
      createdAt,
    })
  }

  // Every transaction: the listed item, the item offered for it, and the accepted offer
  const offers: OfferRec[] = []
  base.transactions.forEach((tx, index) => {
    const txCase = base.cases.find((c) => c.transactionId === tx.id)
    const partyId = (role: 'participant_a' | 'participant_b', name: string) =>
      txCase?.parties.find((p) => p.role === role)?.userId ?? byName.get(name) ?? 'u-ada'
    const initiatorId = partyId('participant_a', tx.terms.gives.displayName)
    const recipientId = partyId('participant_b', tx.terms.receives.displayName)
    const acceptedMinutes = (now - Date.parse(tx.acceptedAt)) / MINUTE
    const offered = tx.terms.gives.items[0]!
    const listed = tx.terms.receives.items[0]!
    addItem({
      id: offered.id,
      title: offered.title,
      ownerId: initiatorId,
      condition: offered.condition,
      defects: offered.defects,
      visibility: 'OFFER_ONLY',
      minutesAgo: acceptedMinutes + 2000,
    })
    addItem({
      id: listed.id,
      title: listed.title,
      ownerId: recipientId,
      condition: listed.condition,
      defects: listed.defects,
      visibility: 'PUBLIC_LISTED',
      minutesAgo: acceptedMinutes + 3000,
    })
    const listingId = `L-${5101 + index}`
    const status: ListingStatus =
      tx.status === 'AWAITING_HANDOVER' || tx.status === 'DISPUTED'
        ? 'RESERVED'
        : tx.status === 'COMPLETED'
          ? 'COMPLETED'
          : 'ACTIVE'
    addListing({
      id: listingId,
      itemId: listed.id,
      sellerId: recipientId,
      title: listed.title,
      askingKobo:
        tx.id === TX.priceEditedAfterAcceptance ? PRICE_EDITED_LISTING_NOW_KOBO : 30_000_000 + index * 2_500_000,
      modes: ['CASH', 'SWAP_PLUS_CASH'],
      status,
      moderation: 'clear',
      minutesAgo: acceptedMinutes + 2900,
    })
    offers.push({
      id: `O-${6101 + index}`,
      listingId,
      initiatorId,
      recipientId,
      status: 'ACCEPTED',
      expiresAt: null,
      versions: tx.versions,
      offeredItemId: offered.id,
      transactionId: tx.id,
      createdAt: tx.versions.at(-1)?.at ?? tx.acceptedAt,
    })
  })

  // Content the cases are about: listings, feed posts and comments
  const reportedIn = (c: CaseRecord) =>
    c.parties.find((p) => p.role === 'reported')?.userId ?? c.parties.at(-1)?.userId ?? 'u-ada'
  const caseMinutes = (c: CaseRecord) => (now - Date.parse(c.openedAt)) / MINUTE
  for (const c of base.cases) {
    if (c.content?.type !== 'listing' || listings.some((l) => l.id === c.content!.id)) continue
    const sellerId = reportedIn(c)
    const title = titleFrom(c.content.text ?? c.summary)
    const itemId = `I-${c.content.id.slice(2)}`
    addItem({
      id: itemId,
      title,
      ownerId: sellerId,
      condition: 'Used, good',
      defects: null,
      visibility: 'PUBLIC_LISTED',
      minutesAgo: caseMinutes(c) + 4000,
    })
    addListing({
      id: c.content.id,
      itemId,
      sellerId,
      title,
      askingKobo: 18_000_000,
      modes: ['CASH'],
      // An author's own removal closes the listing; a moderator's hide leaves it in place, hidden
      status: c.content.redaction === 'removed_by_author' ? 'CLOSED' : 'ACTIVE',
      moderation: c.content.redaction === 'hidden_by_moderation' ? 'hidden' : 'clear',
      redaction: c.content.redaction,
      description: c.content.text ?? `${title}.`,
      minutesAgo: caseMinutes(c) + 3900,
    })
  }

  for (const [id, sellerId, title, status, askingKobo, modes, urgentHours, moderation] of EXTRA_LISTINGS) {
    const n = Number(id.slice(2))
    const itemId = `I-${n + 1000}`
    const minutesAgo = (n - 5200) * 900 + 300
    addItem({
      id: itemId,
      title,
      ownerId: sellerId,
      condition: 'Used, good',
      defects: null,
      visibility: 'PUBLIC_LISTED',
      minutesAgo: minutesAgo + 60,
    })
    addListing({
      id,
      itemId,
      sellerId,
      title,
      status,
      askingKobo,
      modes,
      moderation,
      redaction:
        moderation === 'hidden' ? 'hidden_by_moderation' : moderation === 'removed' ? 'removed_by_moderation' : null,
      urgentUntil: urgentHours === null ? null : iso(now + urgentHours * HOUR),
      minutesAgo,
    })
  }

  // Offers still in negotiation, or ended without a deal
  const itemOf = (listingId: string) => items.find((i) => i.id === listings.find((l) => l.id === listingId)!.itemId)!
  const sideOf = (memberId: string, participant: 'A' | 'B', itemIds: string[]) => ({
    participant,
    displayName: members.find((m) => m.id === memberId)!.displayName,
    items: itemIds.map((id) => {
      const item = items.find((i) => i.id === id)!
      return { id: item.id, title: item.title, condition: item.condition, defects: item.defects }
    }),
  })
  const termsFor = (
    initiatorId: string,
    recipientId: string,
    listingId: string,
    cashKobo: number,
    offeredItemId: string | null,
  ): OfferTerms => ({
    gives: sideOf(initiatorId, 'A', offeredItemId ? [offeredItemId] : []),
    receives: sideOf(recipientId, 'B', [itemOf(listingId).id]),
    cashKobo,
    cashDirection: cashKobo > 0 ? 'OffererPays' : 'None',
  })
  const openOffers: [
    id: string,
    initiatorId: string,
    listingId: string,
    status: OfferStatus,
    cash: number[],
    offeredItemId: string | null,
    minutesAgo: number,
  ][] = [
    // Three versions: Ada offers, Chidi counters, Ada meets in the middle; the latest is still open
    [REC.multiVersionOffer, 'u-ada', 'L-5201', 'PENDING', [35_000_000, 42_000_000, 40_000_000], null, 600],
    ['O-6202', 'u-kunle', 'L-5212', 'PENDING', [20_000_000], null, 300],
    ['O-6203', 'u-tobi', 'L-5210', 'REJECTED', [7_000_000], null, 2000],
    ['O-6204', 'u-segun', 'L-5209', 'EXPIRED', [18_000_000], null, 6000],
    ['O-6205', 'u-zainab', 'L-5202', 'WITHDRAWN', [50_000_000], null, 1500],
    ['O-6206', 'u-musa', 'L-5203', 'PENDING', [0], 'I-6205', 240],
    ['O-6207', 'u-ifeoma', 'L-5207', 'PENDING', [7_000_000], null, 90],
    ['O-6208', 'u-segun', 'L-5217', 'EXPIRED', [1_500_000], null, 8000],
    ['O-6209', 'u-ada', 'L-5216', 'REJECTED', [4_000_000], null, 4000],
    ['O-6210', 'u-tobi', 'L-5213', 'WITHDRAWN', [2_000_000], null, 700],
    ['O-6211', 'u-emeka', 'L-5212', 'EXPIRED', [15_000_000], null, 9000],
    ['O-6212', 'u-halima', 'L-5211', 'PENDING', [5_500_000], null, 45],
  ]
  for (const [id, initiatorId, listingId, status, cash, offeredItemId, minutesAgo] of openOffers) {
    const recipientId = listings.find((l) => l.id === listingId)!.sellerId
    const last = cash.length - 1
    const versions: OfferVersion[] = cash
      .map((cashKobo, i) => ({
        number: i + 1,
        // Turns alternate: the offerer, then the owner's counter, and so on
        proposedBy: members.find((m) => m.id === (i % 2 === 0 ? initiatorId : recipientId))!.displayName,
        at: ago(minutesAgo - i * 60),
        terms: termsFor(initiatorId, recipientId, listingId, cashKobo, offeredItemId),
        state: i < last ? 'superseded' : LAST_VERSION_STATE[status],
      }))
      .reverse()
    offers.push({
      id,
      listingId,
      initiatorId,
      recipientId,
      status,
      expiresAt: status === 'PENDING' ? iso(now - (minutesAgo - last * 60) * MINUTE + 72 * HOUR) : null,
      versions,
      offeredItemId,
      transactionId: null,
      createdAt: ago(minutesAgo),
    })
  }

  // The feed: posts point at live listings; comments live under posts
  const feed: FeedRec[] = []
  const firstListingOf = (memberId: string) =>
    listings.find((l) => l.sellerId === memberId && l.status === 'ACTIVE')?.id ??
    listings.find((l) => l.sellerId === memberId)!.id
  const post = (id: string, authorId: string, caption: string, minutesAgo: number, extra: Partial<FeedRec> = {}) => {
    const rec: FeedRec = {
      id,
      authorId,
      listingId: firstListingOf(authorId),
      caption,
      redaction: null,
      status: 'visible',
      createdAt: ago(minutesAgo),
      comments: [],
      ...extra,
    }
    feed.push(rec)
    return rec
  }
  for (const c of base.cases) {
    if (c.content?.type !== 'feed_post') continue
    post(c.content.id, reportedIn(c), c.content.text ?? titleFrom(c.summary), caseMinutes(c) + 60, {
      redaction: c.content.redaction,
      status: c.content.redaction ? 'hidden' : 'visible',
    })
  }
  const hosts = [
    post('F-902', 'u-zainab', 'ThinkPad in great shape, swap welcome', 3000),
    post('F-903', 'u-halima', 'Comfy gaming chair, barely used', 2500),
    post('F-904', 'u-chidi', 'iPhone 13 Pro for a quick sale', 900),
    post('F-905', 'u-ada', 'Kindle with case, perfect for long trips', 400),
    post('F-906', 'u-ifeoma', 'Galaxy S21, open to swaps', 5000),
    post('F-907', 'u-bisi', 'Switch plus Mario Kart', 1200),
    post('F-908', 'u-segun', 'Microwave, moving out sale', 200),
    post('F-909', 'u-kunle', 'Polo shirts, all size L', 100),
  ]
  post(REC.redactedFeedPost, 'u-emeka', 'iPad Air going cheap', 7000, {
    listingId: REC.removedListing,
    redaction: 'removed_by_author',
    status: 'removed',
  })
  // Comments the cases are about, each under a post; then a removed one
  let host = 0
  for (const c of base.cases) {
    if (c.content?.type !== 'comment') continue
    const under = c.id === SCENARIO.abusiveComment ? hosts[1]! : hosts[host++ % hosts.length]!
    under.comments.push({
      id: c.content.id,
      authorId: reportedIn(c),
      text: c.content.text ?? c.summary,
      redaction: c.content.redaction,
      at: ago(caseMinutes(c) + 30),
    })
  }
  hosts[2]!.comments.push(
    { id: 'C-5600', authorId: 'u-tobi', text: 'Is it still available?', redaction: null, at: ago(800) },
    {
      id: 'C-5601',
      authorId: 'u-musa',
      text: 'Old comment the author deleted',
      redaction: 'removed_by_author',
      at: ago(700),
    },
  )

  // One report record per report each case counts
  const reports: ReportRec[] = []
  for (const c of base.cases) {
    const reportedId = reportedIn(c)
    const reportedName = members.find((m) => m.id === reportedId)?.displayName ?? 'member'
    const target = ((): ReportRec['target'] => {
      const content = c.content
      if (content?.type === 'listing') return { kind: 'listings', id: content.id, label: listingLabel(content.id) }
      if (content?.type === 'feed_post') return { kind: 'feed', id: content.id, label: `Feed post ${content.id}` }
      if (content?.type === 'comment') {
        const parent = feed.find((f) => f.comments.some((m) => m.id === content.id))!
        return { kind: 'feed', id: parent.id, label: `Comment ${content.id}` }
      }
      if (c.transactionId) return { kind: 'transactions', id: c.transactionId, label: `Transaction ${c.transactionId}` }
      if (c.type === 'message') return { kind: 'users', id: reportedId, label: `${reportedName}: private message` }
      return { kind: 'users', id: reportedId, label: reportedName }
    })()
    c.reports.forEach((r, i) => {
      reports.push({
        id: `R-${String(100_001 + reports.length).padStart(6, '0')}`,
        targetType: c.type,
        target,
        reporterId: byName.get(r.reporterName) ?? c.parties[0]!.userId,
        reasonCode: r.reasonCode,
        caseId: c.id,
        receivedAt: r.at,
        description: i === 0 ? c.description : c.summary,
        evidenceCount: i === 0 ? c.evidence.length : 0,
      })
    })
  }

  function listingLabel(id: string) {
    return listings.find((l) => l.id === id)?.title ?? `Listing ${id}`
  }

  return { members, items, listings, offers, feed, reports } satisfies RecordsState
}
