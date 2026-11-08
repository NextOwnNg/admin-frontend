import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders, newIdempotencyKey } from '@/lib/api/idempotency'
import type { CaseDetail } from '@/lib/api/types/cases'
import { apiBaseUrl } from '@/lib/env'
import { casesDb } from '@/mocks/db/cases'
import { staffMember } from '@/mocks/fixtures/staff'
import { SCENARIO } from '@/mocks/seed'
import { signInAs } from '@/test/auth'
import { expectNoA11yViolations } from '@/test/axe'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'

const TABS = ['Partial confirmations', 'Reservation expiries', 'Duplicate items', 'Open disputes', 'Account appeals']
const tabs = () => screen.findByRole('navigation', { name: 'Exception queues' })
const grid = (name: string) => screen.findByRole('grid', { name })
const rowOf = async (name: string, caseId: string) =>
  within(await grid(name))
    .getAllByRole('row')
    .find((r) => r.textContent?.includes(caseId))

describe('exceptions (ADM-FE-08, Phase C design §4.4)', () => {
  it('shows the five queues in order with their counts, starting at the first with work', async () => {
    await signInAs('administrator')
    const { container } = renderWithProviders(routes, { initialPath: '/exceptions' })
    await grid('Partial confirmations')
    const links = within(await tabs()).getAllByRole('link')
    expect(links.map((l) => l.textContent?.replace(/ \(\d+\)$/, ''))).toEqual(TABS)
    for (const l of links) expect(l.textContent).toMatch(/\(\d+\)$/)
    expect(links[0]).toHaveAttribute('aria-current', 'page')
    await grid('Partial confirmations')
    await expectNoA11yViolations(container)
  })

  it('gives every row a next action, and disputes lead to resolution without completion (QA-13)', async () => {
    await signInAs('administrator')
    renderWithProviders(routes, { initialPath: '/exceptions?queue=dispute' })
    const table = await grid('Open disputes')
    const rows = within(table).getAllByRole('row').slice(1)
    for (const r of rows) expect(within(r).getAllByRole('link').length).toBeGreaterThan(0)
    expect(await rowOf('Open disputes', SCENARIO.paymentDispute)).toBeDefined()

    const row = await rowOf('Open disputes', SCENARIO.disputedCancellation)
    await userEvent.click(
      within(row!).getByRole('link', { name: `Resolve dispute for ${SCENARIO.disputedCancellation}` }),
    )
    const panel = await screen.findByRole('region', { name: 'Transaction status' })
    await userEvent.click(within(panel).getByRole('button', { name: 'Resolve dispute' }))
    const dialog = await screen.findByRole('dialog', { name: 'Resolve dispute' })
    const outcomes = within(within(dialog).getByRole('combobox', { name: 'Outcome' }))
      .getAllByRole('option')
      .map((o) => o.textContent)
    expect(outcomes.join()).not.toMatch(/Completed/)
  })

  it('asks a support agent to take an unassigned row before acting on it', async () => {
    await signInAs('support_agent')
    renderWithProviders(routes, { initialPath: '/exceptions?queue=appeal' })
    const row = await rowOf('Account appeals', SCENARIO.appeal)
    expect(within(row!).queryByRole('link', { name: `Review appeal for ${SCENARIO.appeal}` })).not.toBeInTheDocument()
    await userEvent.click(within(row!).getByRole('button', { name: `Assign to me for ${SCENARIO.appeal}` }))
    await waitFor(async () =>
      expect(
        within((await rowOf('Account appeals', SCENARIO.appeal))!).getByRole('link', {
          name: `Review appeal for ${SCENARIO.appeal}`,
        }),
      ).toHaveAttribute('href', `/cases/${SCENARIO.appeal}`),
    )
  })

  it('gives a support agent no links they could not follow (screenshot finding)', async () => {
    await signInAs('support_agent')
    renderWithProviders(routes, { initialPath: '/exceptions?queue=appeal' })
    const row = (await rowOf('Account appeals', SCENARIO.appeal))!
    expect(within(row).getByText('Segun F.')).toBeInTheDocument()
    expect(within(row).queryByRole('link')).not.toBeInTheDocument()
  })

  it('shows the conflict when someone else took the row first, and no next action (Review Focus 3)', async () => {
    await signInAs('support_agent')
    renderWithProviders(routes, { initialPath: '/exceptions?queue=appeal' })
    const row = await rowOf('Account appeals', SCENARIO.appeal)
    // Another operator assigns it meanwhile
    casesDb.record(SCENARIO.appeal)!.assignee = staffMember('s-mod')
    casesDb.bumpVersion(SCENARIO.appeal)

    await userEvent.click(within(row!).getByRole('button', { name: `Assign to me for ${SCENARIO.appeal}` }))
    expect(await screen.findByText('This case changed since you opened it.')).toBeInTheDocument()
    await waitFor(async () =>
      expect((await rowOf('Account appeals', SCENARIO.appeal))!).toHaveTextContent('Tunde Bakare'),
    )
    const fresh = (await rowOf('Account appeals', SCENARIO.appeal))!
    expect(within(fresh).queryByRole('link', { name: `Review appeal for ${SCENARIO.appeal}` })).not.toBeInTheDocument()
    // Someone else has it: no second click can take it from them (final review)
    expect(within(fresh).queryByRole('button', { name: /Assign .*to me/ })).not.toBeInTheDocument()
    expect(fresh).toHaveTextContent('Tunde Bakare has this')
  })

  it('drops a row resolved elsewhere and lowers its count (Review Focus 4)', async () => {
    await signInAs('administrator')
    renderWithProviders(routes, { initialPath: '/exceptions?queue=appeal' })
    await rowOf('Account appeals', SCENARIO.appeal)
    const appealsTab = () =>
      within(screen.getByRole('navigation', { name: 'Exception queues' })).getAllByRole('link')[4]!
    const before = Number(/\((\d+)\)/.exec(appealsTab().textContent ?? '')![1])

    const { data } = await apiClient.get<CaseDetail>(`/admin/cases/${SCENARIO.appeal}`)
    await apiClient.post(
      `/admin/cases/${SCENARIO.appeal}/actions`,
      {
        action: 'close',
        target: { type: 'case', id: SCENARIO.appeal },
        outcome: 'upheld',
        reasonCode: 'RESTRICTION_UPHELD',
        expectedVersion: data.version,
      },
      { headers: idempotencyHeaders(newIdempotencyKey()) },
    )
    await userEvent.click(within(await tabs()).getByRole('link', { name: /^Open disputes/ }))
    await grid('Open disputes')
    await userEvent.click(appealsTab())

    await waitFor(() => expect(appealsTab()).toHaveTextContent(`(${before - 1})`))
    expect(await screen.findByText('Nothing waiting in Account appeals')).toBeInTheDocument()
  })

  it('says a row resolved moments ago was resolved, not that it is forbidden (C2 review)', async () => {
    await signInAs('support_agent')
    renderWithProviders(routes, { initialPath: '/exceptions?queue=appeal' })
    const row = await rowOf('Account appeals', SCENARIO.appeal)
    casesDb.record(SCENARIO.appeal)!.status = 'closed'
    await userEvent.click(within(row!).getByRole('button', { name: `Assign to me for ${SCENARIO.appeal}` }))
    expect(await screen.findByText('This case was already resolved.')).toBeInTheDocument()
    expect(screen.queryByText(/permission/i)).not.toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText(SCENARIO.appeal)).not.toBeInTheDocument())
  })

  it('starts a new tab at its first page with no banner from the last one (Review Focus 2)', async () => {
    await signInAs('support_agent')
    const { router } = renderWithProviders(routes, { initialPath: '/exceptions?queue=appeal&cursor=abc' })
    const row = await rowOf('Account appeals', SCENARIO.appeal)
    casesDb.record(SCENARIO.appeal)!.assignee = staffMember('s-mod')
    casesDb.bumpVersion(SCENARIO.appeal)
    await userEvent.click(within(row!).getByRole('button', { name: `Assign to me for ${SCENARIO.appeal}` }))
    await screen.findByText('This case changed since you opened it.')
    await userEvent.click(within(await tabs()).getByRole('link', { name: /^Open disputes/ }))
    await grid('Open disputes')
    expect(screen.queryByText('This case changed since you opened it.')).not.toBeInTheDocument()
    expect(router.state.location.search).not.toContain('cursor')
  })

  it('reads only the queue on screen, and ignores a page cursor without a queue (C2 review)', async () => {
    await signInAs('administrator')
    const seen: URLSearchParams[] = []
    server.events.on('request:start', ({ request }) => {
      if (request.url.includes('/admin/exceptions')) seen.push(new URL(request.url).searchParams)
    })
    const first = renderWithProviders(routes, { initialPath: '/exceptions?queue=dispute' })
    await grid('Open disputes')
    expect(seen.every((p) => p.get('queue') === 'dispute')).toBe(true)
    first.unmount()

    seen.length = 0
    renderWithProviders(routes, { initialPath: '/exceptions?cursor=abc' })
    await grid('Partial confirmations')
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every((p) => !p.has('cursor'))).toBe(true)
  })

  it('keeps the tab it opened on when that queue empties (C2 review)', async () => {
    await signInAs('administrator')
    const { queryClient } = renderWithProviders(routes, { initialPath: '/exceptions' })
    const table = await grid('Partial confirmations')
    const ids = within(table)
      .getAllByRole('row')
      .slice(1)
      .map((r) => /NX-\d{6}/.exec(r.textContent ?? '')?.[0])
    for (const id of ids) if (id) casesDb.record(id)!.status = 'closed'
    await queryClient.invalidateQueries({ queryKey: ['admin', 'exceptions'] })
    expect(await screen.findByText('Nothing waiting in Partial confirmations')).toBeInTheDocument()
    expect(within(await tabs()).getByRole('link', { name: /^Partial confirmations/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('gives administrators an Assign menu on each row (Phase C design §4.4)', async () => {
    await signInAs('administrator')
    renderWithProviders(routes, { initialPath: '/exceptions?queue=appeal' })
    const row = await rowOf('Account appeals', SCENARIO.appeal)
    await userEvent.click(within(row!).getByRole('button', { name: `Actions for ${SCENARIO.appeal}` }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Assign to me' }))
    await waitFor(async () =>
      expect((await rowOf('Account appeals', SCENARIO.appeal))!).toHaveTextContent('Ngozi Adeyemi'),
    )
  })

  it('says when an expiring reservation needs nothing yet', async () => {
    await signInAs('administrator')
    renderWithProviders(routes, { initialPath: '/exceptions?queue=reservation_expiry' })
    const row = await rowOf('Reservation expiries', SCENARIO.expiringReservation)
    expect(row).toHaveTextContent(/Due to expire\. No action needed before/)
    expect(
      within(row!).getByRole('link', { name: `Open transaction for ${SCENARIO.expiringReservation}` }),
    ).toBeInTheDocument()
  })

  it('keeps moderators out', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/exceptions' })
    expect(await screen.findByText("You don't have permission to view this page")).toBeInTheDocument()
  })

  it('says when a queue is empty', async () => {
    await signInAs('administrator')
    server.use(
      http.get(`${apiBaseUrl}/admin/exceptions`, () =>
        HttpResponse.json({
          items: [],
          nextCursor: null,
          total: 0,
          counts: { partial_confirmation: 0, reservation_expiry: 0, duplicate: 0, dispute: 0, appeal: 0 },
        }),
      ),
    )
    const { container } = renderWithProviders(routes, { initialPath: '/exceptions?queue=appeal' })
    expect(await screen.findByText('Nothing waiting in Account appeals')).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })
})
