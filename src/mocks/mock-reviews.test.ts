import { describe, expect, it } from 'vitest'
import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders, newIdempotencyKey } from '@/lib/api/idempotency'
import type { RecordPage, ListingDetail, OfferDetail } from '@/lib/api/types/records'
import type { Overview } from '@/lib/api/types/reference'
import type { ListingReviewRow, OverturnBody, ReviewBody } from '@/lib/api/types/reviews'
import { auditDb } from '@/mocks/db/audit'
import { reviewsDb } from '@/mocks/db/reviews'
import { signInAs } from '@/test/auth'

type Answer = { status?: number; code?: string; fieldErrors?: Record<string, string> }
const failure = (promise: Promise<unknown>): Promise<Answer> =>
  promise.then(
    (): Answer => ({ status: 200 }),
    (e: Answer) => e,
  )

const queue = async () => (await apiClient.get<RecordPage<ListingReviewRow>>('/admin/listing-reviews')).data
const listing = async (id: string) => (await apiClient.get<ListingDetail>(`/admin/records/listings/${id}`)).data
const review = (id: string, body: Omit<ReviewBody, 'expectedVersion'> & { expectedVersion?: number }, key?: string) =>
  listing(id).then(({ version }) =>
    apiClient.post<ListingDetail>(
      `/admin/listings/${id}/review`,
      { expectedVersion: version, ...body },
      { headers: idempotencyHeaders(key ?? newIdempotencyKey()) },
    ),
  )
const overturn = (id: string, body: Omit<OverturnBody, 'expectedVersion'>) =>
  listing(id).then(({ version }) =>
    apiClient.post<ListingDetail>(
      `/admin/listings/${id}/review/overturn`,
      { expectedVersion: version, ...body },
      { headers: idempotencyHeaders(newIdempotencyKey()) },
    ),
  )
const actions = (id: string) => auditDb.forTarget(id).map((e) => e.action)

describe('mock listing review (design 2026-11-24 §7)', () => {
  it('lists waiting listings oldest first for moderators, refuses support agents', async () => {
    await signInAs('moderator')
    const page = await queue()
    expect(page.items.map((r) => r.id)).toEqual(['L-5205', 'L-5234', 'L-5230', 'L-5231', 'L-5232', 'L-5233'])
    expect(page.total).toBe(6)

    await apiClient.post('/admin/auth/sign-out')
    await signInAs('support_agent')
    expect((await failure(queue())).status).toBe(403)
  })

  it('filters the queue by category and area', async () => {
    await signInAs('moderator')
    const { data } = await apiClient.get<RecordPage<ListingReviewRow>>('/admin/listing-reviews', {
      params: { category: 'Home' },
    })
    expect(data.items.every((r) => r.category === 'Home')).toBe(true)
    expect(data.items.map((r) => r.id)).toEqual(['L-5232'])
  })

  it('marks a resubmission with its earlier rejection', async () => {
    await signInAs('moderator')
    const row = (await queue()).items.find((r) => r.id === 'L-5232')!
    expect(row.previousRejection).toMatchObject({
      reasonCode: 'REJECT_PHOTOS',
      reasonLabel: 'Photos missing or unclear',
      sellerMessage: 'Please add a photo of the base.',
    })
  })

  it('approves: live, published, in the history and the log', async () => {
    await signInAs('moderator')
    const { data } = await review('L-5205', { decision: 'approve' })
    expect(data.status).toBe('ACTIVE')
    expect(data.publishedAt).not.toBeNull()
    expect(data.statusHistory.at(-1)?.status).toBe('ACTIVE')
    expect(data.review?.decision).toMatchObject({ decision: 'approved', by: 'Tunde Bakare' })
    expect(actions('L-5205')).toEqual(['approve_listing'])
    expect((await queue()).total).toBe(5)
  })

  it('rejects to a draft with the reason and message', async () => {
    await signInAs('moderator')
    const { data } = await review('L-5205', {
      decision: 'reject',
      reasonCode: 'REJECT_PHOTOS',
      sellerMessage: 'Add a photo of the back.',
    })
    expect(data.status).toBe('DRAFT')
    expect(data.publishedAt).toBeNull()
    expect(data.review?.decision).toMatchObject({
      decision: 'rejected',
      reasonCode: 'REJECT_PHOTOS',
      reasonLabel: 'Photos missing or unclear',
      sellerMessage: 'Add a photo of the back.',
    })
    expect(auditDb.forTarget('L-5205')[0]).toMatchObject({ action: 'reject_listing', reasonCode: 'REJECT_PHOTOS' })
  })

  it('refuses a reject without a reason, or Something else without a message', async () => {
    await signInAs('moderator')
    expect(await failure(review('L-5205', { decision: 'reject' }))).toMatchObject({
      status: 422,
      fieldErrors: { reasonCode: 'Choose a reason' },
    })
    expect(
      await failure(review('L-5205', { decision: 'reject', reasonCode: 'REJECT_OTHER', sellerMessage: '  ' })),
    ).toMatchObject({ status: 422, fieldErrors: { sellerMessage: 'Write a message for the seller.' } })
    expect(
      await failure(
        review('L-5205', { decision: 'reject', reasonCode: 'REJECT_PHOTOS', sellerMessage: 'a'.repeat(501) }),
      ),
    ).toMatchObject({ status: 422, fieldErrors: { sellerMessage: 'Keep the message to 500 characters.' } })
    expect(await failure(review('L-5205', { decision: 'reject', reasonCode: 'SPAM' }))).toMatchObject({ status: 422 })
  })

  it('refuses a second decision with 409', async () => {
    await signInAs('moderator')
    const { version } = await listing('L-5205')
    await review('L-5205', { decision: 'approve', expectedVersion: version })
    expect(
      await failure(review('L-5205', { decision: 'reject', reasonCode: 'REJECT_PHOTOS', expectedVersion: version })),
    ).toMatchObject({
      status: 409,
      code: 'CONFLICT',
    })
    expect((await failure(review('L-5205', { decision: 'approve' }))).status).toBe(409)
  })

  it('replays a repeated review without a second audit entry', async () => {
    await signInAs('moderator')
    const { version } = await listing('L-5205')
    const send = () =>
      apiClient.post<ListingDetail>(
        '/admin/listings/L-5205/review',
        { decision: 'approve', expectedVersion: version },
        { headers: idempotencyHeaders('review-once') },
      )
    expect((await send()).status).toBe(200)
    expect((await send()).status).toBe(200)
    expect(actions('L-5205')).toEqual(['approve_listing'])
  })

  it('lets only administrators overturn, and only once', async () => {
    await signInAs('moderator')
    expect((await failure(overturn('L-5235', { reasonCode: 'REJECT_MISLEADING' }))).status).toBe(403)

    await apiClient.post('/admin/auth/sign-out')
    await signInAs('administrator')
    expect((await listing('L-5235')).review?.canOverturn).toBe(true)
    const { data } = await overturn('L-5235', { reasonCode: 'REJECT_MISLEADING', sellerMessage: 'The fan is not new.' })
    expect(data.status).toBe('DRAFT')
    expect(data.review?.overturn).toMatchObject({
      by: 'Ngozi Adeyemi',
      reasonLabel: 'Price or description is misleading',
    })
    expect(data.review).toMatchObject({ canOverturn: false, overturnBlockedReason: 'Already overturned once.' })
    expect(actions('L-5235')).toEqual(['overturn_review'])
    expect((await failure(overturn('L-5235', { reasonCode: 'REJECT_MISLEADING' }))).status).toBe(409)
  })

  it('overturning an approval needs a rejection reason', async () => {
    await signInAs('administrator')
    expect(await failure(overturn('L-5235', { reasonCode: 'REVIEW_ERROR' }))).toMatchObject({ status: 422 })
  })

  it('overturning an approval ends open offers', async () => {
    await signInAs('administrator')
    await overturn('L-5235', { reasonCode: 'REJECT_MISLEADING' })
    expect((await apiClient.get<OfferDetail>('/admin/records/offers/O-6151')).data.status).toBe('EXPIRED')
  })

  it('overturning a rejection makes it live', async () => {
    await signInAs('administrator')
    expect(await failure(overturn('L-5237', { reasonCode: 'REJECT_PHOTOS' }))).toMatchObject({ status: 422 })
    const { data } = await overturn('L-5237', { reasonCode: 'REVIEW_ERROR' })
    expect(data.status).toBe('ACTIVE')
    expect(data.publishedAt).not.toBeNull()
  })

  it('blocks overturning once an offer was accepted', async () => {
    await signInAs('administrator')
    expect((await listing('L-5236')).review).toMatchObject({
      canOverturn: false,
      overturnBlockedReason: "Can't be overturned: an offer on it was accepted.",
    })
    expect((await failure(overturn('L-5236', { reasonCode: 'REJECT_MISLEADING' }))).status).toBe(409)
  })

  it("a changed rejected draft can't be overturned", async () => {
    await signInAs('administrator')
    reviewsDb.resubmit('L-5237')
    const detail = await listing('L-5237')
    expect(detail.status).toBe('PENDING_REVIEW')
    expect(detail.review).toMatchObject({
      canOverturn: false,
      previousRejection: { reasonCode: 'REJECT_DEFECTS' },
      decision: null,
    })
    expect((await queue()).items.at(-1)?.id).toBe('L-5237')
  })

  it('detail carries photos, condition and version; hidden listings carry no photos', async () => {
    await signInAs('moderator')
    const desk = await listing('L-5231')
    expect(desk.photos).toHaveLength(4)
    for (const photo of desk.photos) {
      const minutes = (Date.parse(photo.expiresAt) - Date.now()) / 60_000
      expect(minutes).toBeGreaterThan(14)
      expect(minutes).toBeLessThanOrEqual(15)
    }
    expect(desk.itemCondition).toMatchObject({ condition: 'Used, good', ownershipDeclared: true })
    expect(desk.version).toBe(1)
    expect((await listing('L-5230')).photos).toEqual([])
    expect((await listing('L-5218')).photos).toEqual([])
    expect((await listing('L-5201')).review).toBeNull()
  })

  it('the overview counts waiting listings for moderators only', async () => {
    await signInAs('moderator')
    const { data } = await apiClient.get<Overview>('/admin/overview')
    expect(data.listingReviews).toMatchObject({ waiting: 6 })
    expect(data.listingReviews?.oldestSubmittedAt).toBe((await queue()).items[0]!.submittedAt)

    await apiClient.post('/admin/auth/sign-out')
    await signInAs('support_agent')
    expect((await apiClient.get<Overview>('/admin/overview')).data.listingReviews).toBeNull()
  })
})
