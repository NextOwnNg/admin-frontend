import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders, newIdempotencyKey } from '@/lib/api/idempotency'
import type { ListingDetail } from '@/lib/api/types/records'
import { apiBaseUrl } from '@/lib/env'
import { signInAs } from '@/test/auth'
import { expectNoA11yViolations } from '@/test/axe'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'

const WAITING = ['L-5205', 'L-5234', 'L-5230', 'L-5231', 'L-5232', 'L-5233']

async function approve(id: string) {
  const { data } = await apiClient.get<ListingDetail>(`/admin/records/listings/${id}`)
  await apiClient.post(
    `/admin/listings/${id}/review`,
    { decision: 'approve', expectedVersion: data.version },
    { headers: idempotencyHeaders(newIdempotencyKey()) },
  )
}

const table = () => screen.findByRole('grid', { name: 'Listings to review' })
const bodyRows = async () =>
  within(await table())
    .getAllByRole('row')
    .slice(1)

describe('the listing review queue (design 2026-11-24 §5.1)', () => {
  it('lists waiting listings oldest first with their wait and notes', async () => {
    await signInAs('moderator')
    const { container } = renderWithProviders(routes, { initialPath: '/reviews' })
    expect(await screen.findByRole('heading', { level: 1, name: 'Listings to review' })).toBeInTheDocument()
    const rows = await bodyRows()
    expect(rows).toHaveLength(6)
    expect(within(rows[0]!).getByRole('rowheader')).toHaveTextContent('Xbox Series S')
    expect(rows[0]).toHaveTextContent('2 d')
    expect(await screen.findByText('6 waiting · oldest waiting 2 d')).toBeInTheDocument()
    expect(rows[4]).toHaveTextContent('Resubmitted · rejected for: Photos missing or unclear')
    await expectNoA11yViolations(container)
  })

  it('opens a listing from its row menu', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/reviews' })
    await table()
    await userEvent.click(screen.getByRole('button', { name: 'Actions for L-5205' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Open listing' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Xbox Series S' })).toBeInTheDocument()
  })

  it('filters by category, and clears', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/reviews?category=Phones' })
    expect(await screen.findByText('No waiting listings match these filters')).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: 'Clear filters' }).at(-1)!)
    expect(await bodyRows()).toHaveLength(6)
  })

  it('shows the empty state', async () => {
    await signInAs('moderator')
    for (const id of WAITING) await approve(id)
    const { container } = renderWithProviders(routes, { initialPath: '/reviews' })
    expect(await screen.findByText('No listings are waiting for review.')).toBeInTheDocument()
    expect(screen.getByText('Nothing waiting')).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })

  it('shows an error with retry', async () => {
    await signInAs('moderator')
    server.use(
      http.get(
        `${apiBaseUrl}/admin/listing-reviews`,
        () => HttpResponse.json({ code: 'SERVER_ERROR' }, { status: 500 }),
        {
          once: true,
        },
      ),
    )
    renderWithProviders(routes, { initialPath: '/reviews' })
    await userEvent.click(await screen.findByRole('button', { name: /try again/i }, { timeout: 4000 }))
    expect(await bodyRows()).toHaveLength(6)
  })

  it('is forbidden to support agents', async () => {
    await signInAs('support_agent')
    renderWithProviders(routes, { initialPath: '/reviews' })
    expect(await screen.findByRole('heading', { name: /permission/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^Listing review/ })).not.toBeInTheDocument()
  })

  it('counts waiting listings in the sidebar', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/' })
    const link = await screen.findByRole('link', { name: 'Listing review, 6 waiting' })
    expect(link).toHaveAttribute('href', '/reviews')
  })
})

describe('the Overview tile (design 2026-11-24 §5.1)', () => {
  it('shows moderators how many listings wait', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/' })
    const tile = within(await screen.findByRole('region', { name: 'Listings waiting for review' }))
    expect(tile.getByText(/^6 waiting · oldest waiting 2 d$/)).toBeInTheDocument()
    expect(tile.getByRole('link', { name: 'Review listings' })).toHaveAttribute('href', '/reviews')
  })

  it('is not shown to support agents', async () => {
    await signInAs('support_agent')
    renderWithProviders(routes, { initialPath: '/' })
    await screen.findByRole('link', { name: 'S1 Urgent safety 0 open' })
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Listings waiting for review' })).not.toBeInTheDocument(),
    )
  })
})
