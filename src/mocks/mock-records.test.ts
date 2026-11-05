import { describe, expect, it } from 'vitest'
import type { ApiError } from '@/lib/api/api-error'
import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders, newIdempotencyKey } from '@/lib/api/idempotency'
import type { CaseDetail, CasePage } from '@/lib/api/types/cases'
import type {
  FeedDetail,
  ItemDetail,
  ListingDetail,
  ListingRow,
  ListingStatus,
  MemberDetail,
  OfferDetail,
  RecordKind,
  RecordPage,
} from '@/lib/api/types/records'
import type { SearchResponse } from '@/lib/api/types/search'
import type { TransactionDetail } from '@/lib/api/types/transactions'
import { REC } from '@/mocks/records-seed'
import { SCENARIO, TX } from '@/mocks/seed'
import { signInAs } from '@/test/auth'

const status = (request: Promise<unknown>) =>
  request.then(
    () => 200,
    (e: ApiError) => e.status,
  )
const list = async <T>(kind: RecordKind, query = '') =>
  (await apiClient.get<RecordPage<T>>(`/admin/records/${kind}${query}`)).data
const detail = async <T>(kind: RecordKind, id: string) => (await apiClient.get<T>(`/admin/records/${kind}/${id}`)).data
/** Every page of a browser */
async function all<T>(kind: RecordKind): Promise<T[]> {
  const rows: T[] = []
  let cursor: string | null = ''
  while (cursor !== null) {
    const page: RecordPage<T> = await list<T>(kind, cursor ? `?cursor=${cursor}` : '')
    rows.push(...page.items)
    cursor = page.nextCursor
  }
  return rows
}
async function allCases() {
  const ids: string[] = []
  let cursor: string | null = ''
  const statuses = 'open,assigned,awaiting_info,escalated,resolved,closed'
  while (cursor !== null) {
    const page: CasePage = (
      await apiClient.get<CasePage>(`/admin/cases?status=${statuses}${cursor ? `&cursor=${cursor}` : ''}`)
    ).data
    ids.push(...page.items.map((c) => c.id))
    cursor = page.nextCursor
  }
  return Promise.all(ids.map(async (id) => (await apiClient.get<CaseDetail>(`/admin/cases/${id}`)).data))
}
const linked = (d: { links: { records: { id: string }[] }[] }) => d.links.flatMap((g) => g.records.map((r) => r.id))

const PHONE = /\+234\d{10}/

describe('mock record seed (Phase C design §5)', () => {
  it('puts every case party, case content and reservation on a record', async () => {
    await signInAs('administrator')
    const cases = await allCases()
    const resolves = (kind: RecordKind, id: string) => status(apiClient.get(`/admin/records/${kind}/${id}`))
    for (const c of cases) {
      for (const p of c.parties) expect(await resolves('users', p.userId), `${c.id} party ${p.userId}`).toBe(200)
      if (c.content) {
        const kind: RecordKind | null =
          c.content.type === 'account'
            ? 'users'
            : c.content.type === 'listing'
              ? 'listings'
              : c.content.type === 'feed_post'
                ? 'feed'
                : null
        if (kind) expect(await resolves(kind, c.content.id), `${c.id} content ${c.content.id}`).toBe(200)
        if (c.content.type === 'comment') {
          const feed = await all<{ id: string }>('feed')
          const details = await Promise.all(feed.map((f) => detail<FeedDetail>('feed', f.id)))
          expect(
            details.some((f) => f.comments.some((m) => m.id === c.content!.id)),
            `${c.id} comment ${c.content.id}`,
          ).toBe(true)
        }
      }
    }
    for (const id of Object.values(TX)) {
      const tx = (await apiClient.get<TransactionDetail>(`/admin/transactions/${id}`)).data
      for (const r of tx.reservations) expect(await resolves('items', r.itemId), `${id} item ${r.itemId}`).toBe(200)
    }
  })

  it('gives every transaction the offer it came from, with the same versions', async () => {
    await signInAs('administrator')
    const offers = await Promise.all(
      (await all<{ id: string }>('offers')).map((o) => detail<OfferDetail>('offers', o.id)),
    )
    for (const id of Object.values(TX)) {
      const tx = (await apiClient.get<TransactionDetail>(`/admin/transactions/${id}`)).data
      const offer = offers.find((o) => o.transaction?.id === id)
      expect(offer, id).toBeDefined()
      expect(offer!.versions).toHaveLength(tx.versions.length)
    }
  })

  it('files one report for each report a case counts, pointing back to it', async () => {
    await signInAs('administrator')
    const reports = await all<{ case: { id: string } }>('reports')
    for (const c of await allCases()) {
      expect(
        reports.filter((r) => r.case.id === c.id),
        c.id,
      ).toHaveLength(c.reportCount)
    }
  })

  it('covers every listing state', async () => {
    await signInAs('administrator')
    const states = new Set((await all<ListingRow>('listings')).map((l) => l.status))
    const every: ListingStatus[] = [
      'DRAFT',
      'PENDING_REVIEW',
      'ACTIVE',
      'RESERVED',
      'EXPIRED',
      'COMPLETED',
      'CLOSED',
      'REMOVED',
    ]
    for (const s of every) expect(states, s).toContain(s)
  })

  it('links the chain both ways: member, item, listing, offer, transaction, case', async () => {
    await signInAs('administrator')
    const { chain } = REC
    const member = await detail<MemberDetail>('users', chain.member)
    expect(member.items.map((i) => i.id)).toContain(chain.item)
    const item = await detail<ItemDetail>('items', chain.item)
    expect(item.owner.id).toBe(chain.member)
    expect(item.listings.map((l) => l.id)).toContain(chain.listing)
    const listing = await detail<ListingDetail>('listings', chain.listing)
    expect(listing.item.id).toBe(chain.item)
    expect(listing.offers.map((o) => o.id)).toContain(chain.offer)
    const offer = await detail<OfferDetail>('offers', chain.offer)
    expect(offer.listing.id).toBe(chain.listing)
    expect(offer.transaction?.id).toBe(chain.transaction)
    expect(linked(offer)).toContain(chain.transaction)
    const tx = (await apiClient.get<TransactionDetail>(`/admin/transactions/${chain.transaction}`)).data
    expect(tx.caseIds).toContain(chain.case)
    expect(chain.transaction).toBe(TX.paymentDispute)
    expect(chain.case).toBe(SCENARIO.paymentDispute)
  })
})

describe('mock record endpoints (Phase C design §5)', () => {
  it('refuses support agents', async () => {
    await signInAs('support_agent')
    expect(await status(apiClient.get('/admin/records/users'))).toBe(403)
    expect(await status(apiClient.get(`/admin/records/users/${REC.chain.member}`))).toBe(403)
  })

  it('answers not found for an unknown kind or record', async () => {
    await signInAs('moderator')
    expect(await status(apiClient.get('/admin/records/messages'))).toBe(404)
    expect(await status(apiClient.get('/admin/records/users/u-nobody'))).toBe(404)
    expect(await status(apiClient.get(`/admin/records/transactions/${TX.paymentDispute}`))).toBe(404)
  })

  it('searches by name and by ID prefix', async () => {
    await signInAs('moderator')
    expect((await list<{ id: string }>('users', '?q=segun')).items.map((m) => m.id)).toContain('u-segun')
    const listings = await list<{ id: string }>('listings', '?q=l-')
    expect(listings.total).toBeGreaterThan(0)
    expect(listings.items.every((l) => l.id.startsWith('L-'))).toBe(true)
  })

  it('pages 25 at a time', async () => {
    await signInAs('moderator')
    const first = await list<{ id: string }>('listings')
    expect(first.items).toHaveLength(25)
    expect(first.total).toBeGreaterThan(25)
    const second = await list<{ id: string }>('listings', `?cursor=${first.nextCursor}`)
    expect(second.items[0]!.id).not.toBe(first.items[0]!.id)
  })

  it('filters a browser by its own filters', async () => {
    await signInAs('moderator')
    const removed = await list<ListingRow>('listings', '?status=REMOVED')
    expect(removed.items.length).toBeGreaterThan(0)
    expect(removed.items.every((l) => l.status === 'REMOVED')).toBe(true)
    const restricted = await list<{ status: string }>('users', '?status=restricted')
    expect(restricted.items.map((m) => m.status)).toEqual(restricted.items.map(() => 'restricted'))
  })

  it('never sends a phone number in a list (PRD §7)', async () => {
    await signInAs('administrator')
    const kinds: RecordKind[] = ['users', 'items', 'listings', 'offers', 'transactions', 'feed', 'reports']
    for (const kind of kinds) expect(JSON.stringify(await all(kind)), kind).not.toMatch(PHONE)
    expect(JSON.stringify(await detail('users', REC.chain.member))).not.toMatch(PHONE)
  })

  it('says a hidden listing is hidden, without its description', async () => {
    await signInAs('moderator')
    const row = (await all<ListingRow>('listings')).find((l) => l.id === REC.hiddenListing)!
    expect(row.moderation).toBe('hidden')
    const hidden = await detail<ListingDetail>('listings', REC.hiddenListing)
    expect(hidden.description).toBeNull()
    expect(hidden.redaction).toBe('hidden_by_moderation')
  })

  it('reveals a phone only with a reason, and logs it', async () => {
    await signInAs('moderator')
    const reveal = (reason: string) =>
      apiClient.post<{ value: string }>(
        `/admin/records/users/${REC.chain.member}/reveal`,
        { field: 'phone', reason },
        { headers: idempotencyHeaders(newIdempotencyKey()) },
      )
    expect(await status(reveal('too short'))).toBe(422)
    const { data } = await reveal('Checking the handover dispute')
    expect(data.value).toMatch(PHONE)
    const member = await detail<MemberDetail>('users', REC.chain.member)
    expect(member.history[0]!.action).toBe('view_phone')
  })

  it('lets moderators open a transaction directly, but not support agents (design §9 call 11)', async () => {
    await signInAs('moderator')
    expect(await status(apiClient.get(`/admin/transactions/${TX.paymentDispute}`))).toBe(200)
    await signInAs('support_agent')
    expect(await status(apiClient.get(`/admin/transactions/${TX.partialTimeout}`))).toBe(403)
  })
})

describe('record labels', () => {
  it('sends cases and transactions to their own pages', async () => {
    const { recordHref } = await import('@/lib/copy/records')
    expect(recordHref({ kind: 'cases', id: 'NX-000202' })).toBe('/cases/NX-000202')
    expect(recordHref({ kind: 'transactions', id: 'T-000301' })).toBe('/transactions/T-000301')
    expect(recordHref({ kind: 'users', id: 'u-ada' })).toBe('/records/users/u-ada')
  })
})

describe('mock search (Phase C design §4.3)', () => {
  const search = async (q: string) => (await apiClient.get<SearchResponse>('/admin/search', { params: { q } })).data
  const ids = (r: SearchResponse) => r.groups.flatMap((g) => g.results.map((x) => x.id))

  it('refuses a query under 2 characters', async () => {
    await signInAs('moderator')
    expect(await status(apiClient.get('/admin/search', { params: { q: 's' } }))).toBe(422)
    expect(await status(apiClient.get('/admin/search', { params: { q: '   ' } }))).toBe(422)
  })

  it('finds an exact ID first', async () => {
    await signInAs('moderator')
    const result = await search(SCENARIO.paymentDispute.toLowerCase())
    expect(result.exact?.href).toBe(`/cases/${SCENARIO.paymentDispute}`)
  })

  it("gives support agents only their own cases and those cases' transactions", async () => {
    await signInAs('support_agent')
    expect(ids(await search(SCENARIO.s1Unassigned))).toEqual([])
    expect((await search(SCENARIO.s1Unassigned)).exact).toBeNull()
    expect(ids(await search(SCENARIO.paymentDispute))).toContain(SCENARIO.paymentDispute)
    const tx = await search(TX.paymentDispute)
    expect(tx.exact?.href).toBe(`/transactions/${TX.paymentDispute}?case=${SCENARIO.paymentDispute}`)
    expect(tx.groups.map((g) => g.kind)).toEqual(['transactions'])
    expect(ids(await search('segun'))).toEqual([])
  })

  it('finds members, listings and comments for a moderator, at most 5 per group', async () => {
    await signInAs('moderator')
    expect(ids(await search('segun'))).toContain('u-segun')
    expect((await search('C-5501')).exact?.href).toMatch(/^\/records\/feed\/F-/)
    for (const g of (await search('L-')).groups) expect(g.results.length).toBeLessThanOrEqual(5)
  })

  it('never answers with a phone number or a hidden description', async () => {
    await signInAs('administrator')
    for (const q of ['Ada', 'Kunle', 'Segun', 'Zainab', 'u-', 'AirPods']) {
      const body = JSON.stringify(await search(q))
      expect(body, q).not.toMatch(PHONE)
      expect(body, q).not.toContain('Works well')
    }
  })
})
