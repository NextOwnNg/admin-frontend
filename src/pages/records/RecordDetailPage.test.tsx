import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { apiClient } from '@/lib/api/client'
import type { FeedDetail, ListingDetail, RecordPage, ReportRow } from '@/lib/api/types/records'
import { LISTING_STATUS } from '@/lib/copy/records'
import { apiBaseUrl } from '@/lib/env'
import { formatNaira } from '@/lib/money/money'
import { REC } from '@/mocks/records-seed'
import { SCENARIO } from '@/mocks/seed'
import { signInAs } from '@/test/auth'
import { expectNoA11yViolations } from '@/test/axe'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'

const KUNLE_PHONE = '+2348000001202'
const REASON = 'Checking the handover dispute'

const heading = (name: string | RegExp) => screen.findByRole('heading', { level: 1, name })
const linked = async () => screen.findByRole('region', { name: 'Linked records' })

async function revealPhone(name: string, reason = REASON) {
  await userEvent.click(await screen.findByRole('button', { name: `Reveal phone number of ${name}` }))
  const dialog = await screen.findByRole('dialog')
  const submit = within(dialog).getByRole('button', { name: 'Reveal' })
  await userEvent.type(within(dialog).getByRole('textbox', { name: 'Why do you need to see this?' }), reason)
  return { dialog, submit }
}

describe('member record (ADM-FE-07, Phase C design §4.2)', () => {
  it('shows the profile and links up and down the chain', async () => {
    await signInAs('moderator')
    const { container } = renderWithProviders(routes, { initialPath: `/records/users/${REC.chain.member}` })
    await heading('Kunle A.')
    expect(within(await linked()).getByRole('link', { name: `MacBook Air 2020 ${REC.chain.item}` })).toHaveAttribute(
      'href',
      `/records/items/${REC.chain.item}`,
    )
    const order = ['Profile', 'Items', 'Listings', 'Offers', 'Transactions', 'Reports filed', 'Reports received']
    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(titles.filter((t) => order.includes(t ?? ''))).toEqual(order)
    expect(container.textContent).not.toContain(KUNLE_PHONE)
    await expectNoA11yViolations(container)
  })

  it('reveals the phone only after a reason, and logs the view (ADM-T-02)', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: `/records/users/${REC.chain.member}` })
    const { submit } = await revealPhone('Kunle A.', 'too short')
    expect(submit).toBeDisabled()
    await userEvent.type(within(await screen.findByRole('dialog')).getByRole('textbox'), ' for the dispute')
    await userEvent.click(submit)

    expect(await screen.findByText(KUNLE_PHONE)).toBeInTheDocument()
    const history = await screen.findByRole('region', { name: 'Moderation history' })
    await waitFor(() => expect(history).toHaveTextContent('viewed a phone number in Kunle A.'))
  })

  it('masks the phone again on another member, and on coming back (Review Focus 1)', async () => {
    await signInAs('moderator')
    // Ada's record is cached first, so moving back to it shows it at once, with no loading in between
    const { router } = renderWithProviders(routes, { initialPath: '/records/users/u-ada' })
    await heading('Ada O.')
    await router.navigate(`/records/users/${REC.chain.member}`)
    const { submit } = await revealPhone('Kunle A.')
    await userEvent.click(submit)
    await screen.findByText(KUNLE_PHONE)

    await router.navigate('/records/users/u-ada')
    await heading('Ada O.')
    expect(await screen.findByRole('button', { name: 'Reveal phone number of Ada O.' })).toBeInTheDocument()
    expect(screen.queryByText(KUNLE_PHONE)).not.toBeInTheDocument()

    await router.navigate(`/records/users/${REC.chain.member}`)
    await heading('Kunle A.')
    expect(await screen.findByRole('button', { name: 'Reveal phone number of Kunle A.' })).toBeInTheDocument()
    expect(screen.queryByText(KUNLE_PHONE)).not.toBeInTheDocument()
  })

  it('says what a new member has none of', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: `/records/users/${REC.emptyMember}` })
    await heading('Yemi K.')
    expect(screen.getByText('No phone on record')).toBeInTheDocument()
    expect(screen.getByText('No items yet')).toBeInTheDocument()
    expect(screen.getByText('Nothing linked yet')).toBeInTheDocument()
    expect(screen.getByText('No cases about this record')).toBeInTheDocument()
  })

  it('shows not found for an unknown member', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/records/users/u-nobody' })
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('shows nothing about the member when the API refuses', async () => {
    await signInAs('moderator')
    server.use(
      http.get(`${apiBaseUrl}/admin/records/:kind/:id`, () =>
        HttpResponse.json({ code: 'FORBIDDEN', message: 'No' }, { status: 403 }),
      ),
    )
    renderWithProviders(routes, { initialPath: `/records/users/${REC.chain.member}` })
    expect(await screen.findByText("You don't have permission to view this page")).toBeInTheDocument()
    expect(screen.queryByText(/Kunle/)).not.toBeInTheDocument()
  })

  it('offers a retry when the record fails to load', async () => {
    await signInAs('moderator')
    server.use(
      http.get(`${apiBaseUrl}/admin/records/:kind/:id`, () =>
        HttpResponse.json({ code: 'INTERNAL', message: 'Broken' }, { status: 500 }),
      ),
    )
    renderWithProviders(routes, { initialPath: `/records/users/${REC.chain.member}` })
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})

describe('item record (Phase C design §4.2)', () => {
  it('lists its listing and reservations', async () => {
    await signInAs('moderator')
    const { container } = renderWithProviders(routes, { initialPath: `/records/items/${REC.chain.item}` })
    await heading('MacBook Air 2020')
    expect(within(await linked()).getByRole('link', { name: `MacBook Air 2020 ${REC.chain.listing}` })).toHaveAttribute(
      'href',
      `/records/listings/${REC.chain.listing}`,
    )
    expect(within(screen.getByRole('region', { name: 'Reservations' })).getByText(/Reserved/)).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })
})

describe('case parties link to member records (Phase C design §4.2)', () => {
  it('links a party for a moderator', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: `/cases/${SCENARIO.paymentDispute}` })
    const parties = await screen.findByRole('region', { name: 'Parties' })
    expect(within(parties).getByRole('link', { name: 'Ada O.' })).toHaveAttribute('href', '/records/users/u-ada')
  })

  it("names a party without a link for a support agent, who can't open member records", async () => {
    await signInAs('support_agent')
    renderWithProviders(routes, { initialPath: `/cases/${SCENARIO.paymentDispute}` })
    const parties = await screen.findByRole('region', { name: 'Parties' })
    expect(within(parties).getByText('Ada O.')).toBeInTheDocument()
    expect(within(parties).queryByRole('link', { name: 'Ada O.' })).not.toBeInTheDocument()
  })
})

describe('listing, offer, feed and report records (Phase C design §4.2)', () => {
  it('says a hidden listing is hidden, not what it said (Review Focus 3)', async () => {
    await signInAs('moderator')
    const { container } = renderWithProviders(routes, { initialPath: `/records/listings/${REC.hiddenListing}` })
    await heading('AirPods Pro')
    expect(screen.getAllByText('Content hidden by moderation').length).toBeGreaterThan(0)
    expect(container.textContent).not.toContain('AirPods Pro. Works well')
    await expectNoA11yViolations(container)
  })

  it('marks a removed listing', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: `/records/listings/${REC.removedListing}` })
    await heading('iPad Air, 4th generation')
    expect(screen.getAllByText('Removed').length).toBeGreaterThan(0)
    // Removal is stronger than hiding: the label, never the text (Phase C1 review)
    expect(screen.getByText('Content removed by moderation')).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('iPad Air, 4th generation. Works well')
  })

  it('shows every offer version, read-only, with nothing to press', async () => {
    await signInAs('moderator')
    const { container } = renderWithProviders(routes, { initialPath: `/records/offers/${REC.multiVersionOffer}` })
    await heading(/^Offer on iPhone 13 Pro/)
    const versions = screen.getByRole('region', { name: 'Versions' })
    expect(within(versions).getAllByRole('listitem', { name: /^Version \d$/ })).toHaveLength(3)
    expect(within(versions).getByText('Awaiting reply')).toBeInTheDocument()
    // Back is navigation; nothing on the page acts on the offer
    const buttons = within(screen.getByRole('main')).queryAllByRole('button')
    expect(buttons.map((b) => b.textContent)).toEqual(['Back'])
    await expectNoA11yViolations(container)
  })

  it("shows the listing's live price and status, and counts the comments (C1 review)", async () => {
    await signInAs('moderator')
    const post = (await apiClient.get<FeedDetail>('/admin/records/feed/F-904')).data
    const listing = (await apiClient.get<ListingDetail>(`/admin/records/listings/${post.listing.id}`)).data
    renderWithProviders(routes, { initialPath: '/records/feed/F-904' })
    const section = await screen.findByRole('region', { name: 'Post' })
    const price = listing.askingKobo === null ? 'No asking price' : formatNaira(listing.askingKobo)
    await waitFor(() => expect(section).toHaveTextContent(price))
    expect(section).toHaveTextContent(LISTING_STATUS[listing.status].label)
    expect(await screen.findByRole('region', { name: `Comments (${post.comments.length})` })).toBeInTheDocument()
  })

  it('shows a removed comment as removed, not what it said', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/records/feed/F-904' })
    const comments = await screen.findByRole('region', { name: /^Comments/ })
    expect(comments).toHaveTextContent('Content removed by its author')
    expect(comments).not.toHaveTextContent('Old comment the author deleted')
    expect(comments).toHaveTextContent('Is it still available?')
  })

  it("counts a report's evidence without showing it outside the case", async () => {
    await signInAs('moderator')
    const { data } = await apiClient.get<RecordPage<ReportRow>>('/admin/records/reports', {
      params: { q: '' },
    })
    const all = [...data.items]
    let cursor = data.nextCursor
    while (cursor) {
      const next = (await apiClient.get<RecordPage<ReportRow>>('/admin/records/reports', { params: { cursor } })).data
      all.push(...next.items)
      cursor = next.nextCursor
    }
    const report = all.find((r) => r.case.id === SCENARIO.paymentDispute)!
    const { container } = renderWithProviders(routes, { initialPath: `/records/reports/${report.id}` })
    await heading(`Report ${report.id}`)
    expect(screen.getByText(/evidence files?: open the case to view them/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /evidence/i })).not.toBeInTheDocument()
    await expectNoA11yViolations(container)
  })

  it('links reported listings from the case to their records', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: `/cases/${SCENARIO.overdue}` })
    const content = await screen.findByRole('region', { name: 'Reported content' })
    expect(within(content).getByRole('link', { name: /L-4388/ })).toHaveAttribute('href', '/records/listings/L-4388')
  })
})
