import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders, newIdempotencyKey } from '@/lib/api/idempotency'
import type { RecordKind } from '@/lib/api/types/records'
import type { PilotSettings } from '@/lib/api/types/settings'
import { apiBaseUrl } from '@/lib/env'
import { REC } from '@/mocks/records-seed'
import { TX } from '@/mocks/seed'
import { signInAs } from '@/test/auth'
import { expectNoA11yViolations } from '@/test/axe'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'

const HEADERS: Record<RecordKind, [string, string[]]> = {
  users: ['Members', ['Name', 'Member ID', 'Area', 'Joined', 'Status', 'Open cases']],
  items: ['Items', ['Item', 'Item ID', 'Owner', 'Category', 'Availability']],
  listings: [
    'Listings',
    ['Listing', 'Listing ID', 'Seller', 'Asking price', 'Modes', 'Status', 'Quick Sell', 'Moderation'],
  ],
  offers: ['Offers', ['Offer', 'Listing', 'From → to', 'Current version', 'Status', 'Expires']],
  transactions: ['Transactions', ['Transaction', 'Participants', 'Status', 'Exception', 'Created']],
  feed: ['Feed', ['Post', 'Author', 'Listing', 'Caption', 'Status', 'Created']],
  reports: ['Reports', ['Report', 'Reported', 'Reporter', 'Reason', 'Case', 'Received']],
}

const grid = (name: string) => screen.findByRole('grid', { name })
const rowWith = async (name: string, text: string) =>
  within(await grid(name))
    .getAllByRole('row')
    .find((r) => r.textContent?.includes(text))

describe('record browsers (ADM-FE-07, Phase C design §4.1)', () => {
  it.each(Object.entries(HEADERS))(
    'lists %s with the fields that identify each record',
    async (kind, [label, headers]) => {
      await signInAs('moderator')
      const { container } = renderWithProviders(routes, { initialPath: `/records/${kind}` })
      const table = await grid(label)
      expect(screen.getByRole('heading', { level: 1, name: label })).toBeInTheDocument()
      expect(
        within(table)
          .getAllByRole('columnheader')
          .map((h) => h.textContent),
      ).toEqual(headers)
      expect(table.textContent).not.toMatch(/\+234/)
      await expectNoA11yViolations(container)
    },
  )

  it('shows support agents the permission state', async () => {
    await signInAs('support_agent')
    renderWithProviders(routes, { initialPath: '/records/users' })
    expect(await screen.findByText("You don't have permission to view this page")).toBeInTheDocument()
  })

  it('shows the permission state when the API refuses the list', async () => {
    await signInAs('moderator')
    server.use(
      http.get(`${apiBaseUrl}/admin/records/:kind`, () =>
        HttpResponse.json({ code: 'FORBIDDEN', message: 'No' }, { status: 403 }),
      ),
    )
    renderWithProviders(routes, { initialPath: '/records/items' })
    expect(await screen.findByText("You don't have permission to view this page")).toBeInTheDocument()
  })

  it('offers a retry when the list fails to load', async () => {
    await signInAs('moderator')
    server.use(
      http.get(`${apiBaseUrl}/admin/records/:kind`, () =>
        HttpResponse.json({ code: 'INTERNAL', message: 'Broken' }, { status: 500 }),
      ),
    )
    renderWithProviders(routes, { initialPath: '/records/offers' })
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('searches by name and says when nothing matches', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/records/users' })
    await grid('Members')
    const search = screen.getByRole('searchbox', { name: 'Search members by ID or name' })
    await userEvent.type(search, 'segun{Enter}')
    await waitFor(async () => expect(within(await grid('Members')).getAllByRole('row')).toHaveLength(2))

    await userEvent.clear(search)
    await userEvent.type(search, 'zzzz{Enter}')
    expect(await screen.findByText('No members match these filters')).toBeInTheDocument()
    // The empty state offers its own Clear filters beside the chips' one
    await userEvent.click(screen.getAllByRole('button', { name: 'Clear filters' }).at(-1)!)
    expect(await grid('Members')).toBeInTheDocument()
  })

  it('ignores unknown filter values in the address', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/records/listings?status=REMOVED,nope&urgent=maybe' })
    await grid('Listings')
    const chips = screen.getByRole('list', { name: 'Active filters' })
    expect(
      within(chips)
        .getAllByRole('listitem')
        .map((c) => c.textContent),
    ).toEqual(['Status: Removed'])
  })

  it('pages forward and back', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/records/listings' })
    const firstRow = async () => within(await grid('Listings')).getAllByRole('row')[1]!.textContent
    const first = await firstRow()
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
    await waitFor(async () => expect(await firstRow()).not.toBe(first))
    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }))
    await waitFor(async () => expect(await firstRow()).toBe(first))
  })

  it('says who pays in each offer, never a bare amount (PRD §4.6, Phase C1 review)', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/records/offers' })
    const row = await rowWith('Offers', REC.multiVersionOffer)
    expect(row).toHaveTextContent('Offerer pays owner ₦400,000')
  })

  it('says a removed post was removed, never what it said (Review Focus 3)', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/records/feed' })
    const row = await rowWith('Feed', REC.redactedFeedPost)
    expect(row).toHaveTextContent('Content removed by its author')
    expect(row).not.toHaveTextContent('iPad Air going cheap')
  })

  it('links each record to its page, and transactions to the transaction page', async () => {
    await signInAs('moderator')
    const { router } = renderWithProviders(routes, { initialPath: '/records/users' })
    const member = await rowWith('Members', REC.chain.member)
    // The ID has its own column, so the name link doesn't repeat it
    expect(within(member!).getByRole('link', { name: 'Kunle A.' })).toHaveAttribute(
      'href',
      `/records/users/${REC.chain.member}`,
    )

    await router.navigate('/records/transactions')
    const tx = await rowWith('Transactions', TX.paymentDispute)
    expect(within(tx!).getByRole('link', { name: new RegExp(TX.paymentDispute) })).toHaveAttribute(
      'href',
      `/transactions/${TX.paymentDispute}`,
    )
  })
})

describe('record lists (C1 review)', () => {
  it('keeps the search box in step with the address on back and forward', async () => {
    await signInAs('moderator')
    const { router } = renderWithProviders(routes, { initialPath: '/records/users' })
    await grid('Members')
    const search = screen.getByRole('searchbox', { name: 'Search members by ID or name' })
    await userEvent.type(search, 'kunle{Enter}')
    await waitFor(() => expect(router.state.location.search).toContain('q=kunle'))
    await router.navigate('/records/users?q=segun')
    await waitFor(() => expect(search).toHaveValue('segun'))
    await router.navigate(-1)
    await waitFor(() => expect(search).toHaveValue('kunle'))
  })

  it.each([
    ['users', 'Members', REC.chain.member],
    ['items', 'Items', REC.chain.item],
    ['listings', 'Listings', REC.chain.listing],
  ] as const)('links the ID cell in %s', async (kind, name, id) => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: `/records/${kind}` })
    const row = await rowWith(name, id)
    expect(within(row!).getByRole('link', { name: id })).toHaveAttribute('href', `/records/${kind}/${id}`)
  })
})

describe('record filters follow the pilot settings (Phase C design §4.5)', () => {
  it('keeps an area whose name has punctuation in the address (final review)', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/records/listings?area=Victoria%20Island%20(VI)' })
    await screen.findByRole('heading', { level: 1, name: 'Listings' })
    const chips = await screen.findByRole('list', { name: 'Active filters' })
    expect(chips).toHaveTextContent('Area: Victoria Island (VI)')
  })

  it('offers a newly added area, and never an inactive one', async () => {
    await signInAs('administrator')
    const { data } = await apiClient.get<PilotSettings>('/admin/settings')
    const lagos = data.locations[0]!
    await apiClient.put(
      '/admin/settings/locations',
      {
        value: [{ ...lagos, areas: [...lagos.areas, { id: 'a-ojodu', name: 'Ojodu', active: true }] }],
        reason: 'Pilot grows to Ojodu',
        expectedVersion: data.version,
      },
      { headers: idempotencyHeaders(newIdempotencyKey()) },
    )
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/records/listings' })
    await grid('Listings')
    const area = screen.getByRole('combobox', { name: 'Area' })
    await waitFor(() => expect(within(area).getByRole('option', { name: 'Ojodu' })).toBeInTheDocument())
    expect(within(area).queryByRole('option', { name: 'Ojota' })).not.toBeInTheDocument()
  })
})
