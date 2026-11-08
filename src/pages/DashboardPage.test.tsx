import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import type { DashboardData } from '@/lib/api/types/dashboard'
import { apiBaseUrl } from '@/lib/env'
import { serverNow } from '@/lib/time/server-clock'
import { addDays, watToday } from '@/lib/time/time'
import { signInAs } from '@/test/auth'
import { expectNoA11yViolations } from '@/test/axe'
import { sampleDashboard } from '@/test/fixtures/dashboard'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'

const URL_ = `${apiBaseUrl}/admin/dashboard`

/** Every dashboard request's query, in order */
function dashboardRequests() {
  const seen: URLSearchParams[] = []
  server.events.on('request:start', ({ request }) => {
    if (request.url.includes('/admin/dashboard')) seen.push(new URL(request.url).searchParams)
  })
  return seen
}

/** Serves fixed figures instead of the generated mock ones */
const serve = (data: DashboardData = sampleDashboard()) => server.use(http.get(URL_, () => HttpResponse.json(data)))

async function open(path = '/dashboard') {
  await signInAs('administrator')
  const view = renderWithProviders(routes, { initialPath: path })
  await screen.findByRole('heading', { level: 1, name: 'Dashboard' })
  return view
}

const figures = () => screen.findByRole('region', { name: 'Figures' })

describe('operations dashboard (ADM-FE-10, Phase D design §4)', () => {
  it('shows the range the figures cover and when the data runs to (Review Focus 3)', async () => {
    serve(sampleDashboard({ range: { from: '2026-10-01', to: '2026-11-08' } }))
    await open('/dashboard?from=2026-09-01&to=2026-12-01')
    expect(await screen.findByText(/Figures for 1 Oct 2026 – 8 Nov 2026/)).toHaveTextContent(
      'Data through 8 Nov 2026, 11:00 WAT',
    )
  })

  it('defaults to the last 30 days and sends WAT dates', async () => {
    serve()
    const requests = dashboardRequests()
    await open()
    await figures()
    await waitFor(() => expect(requests).toHaveLength(1))
    const to = watToday(serverNow())
    expect(requests[0]!.get('to')).toBe(to)
    expect(requests[0]!.get('from')).toBe(addDays(to, -29))
    expect(screen.getByRole('combobox', { name: 'Date range' })).toHaveValue('30d')
  })

  it('sends no start date for Pilot to date', async () => {
    serve()
    const requests = dashboardRequests()
    await open()
    await screen.findByText(/Figures for/)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Date range' }), 'pilot')
    await waitFor(() => expect(requests).toHaveLength(2))
    expect(requests[1]!.has('from')).toBe(false)
  })

  it('fills From and To with the range shown when Custom is chosen, in the address', async () => {
    serve()
    const { router } = await open()
    await screen.findByText(/Figures for 10 Oct 2026 – 8 Nov 2026/)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Date range' }), 'custom')
    expect(screen.getByLabelText('From')).toHaveValue('2026-10-10')
    expect(screen.getByLabelText('To')).toHaveValue('2026-11-08')
    expect(router.state.location.search).toContain('from=2026-10-10')
  })

  it('blocks a start after the end with a field error and no request', async () => {
    serve()
    const requests = dashboardRequests()
    await open('/dashboard?from=2026-10-10&to=2026-10-20')
    await screen.findByText(/Figures for/)
    const count = requests.length
    const from = screen.getByLabelText('From')
    // A date picker changes the value in one step
    fireEvent.change(from, { target: { value: '2026-10-25' } })
    expect(from).toHaveAccessibleDescription('The start date must be on or before the end date.')
    expect(from).toHaveAttribute('aria-invalid', 'true')
    expect(requests).toHaveLength(count)
    // Nothing is loading, and the old range is no longer claimed (final review)
    expect(screen.queryByText('Updating…')).not.toBeInTheDocument()
    expect(await figures()).toHaveAttribute('aria-busy', 'false')
    expect(screen.queryByText(/Figures for/)).not.toBeInTheDocument()
  })

  it('drops a date that does not exist instead of asking for it (final review)', async () => {
    serve()
    const requests = dashboardRequests()
    await open('/dashboard?from=2026-10-45&to=2026-11-08')
    await screen.findByText(/Figures for/)
    expect(requests.at(-1)!.has('from')).toBe(false)
    expect(requests.at(-1)!.get('to')).toBe('2026-11-08')
  })

  it('ignores an unknown category in the address (Review Focus 2)', async () => {
    serve()
    const requests = dashboardRequests()
    await open('/dashboard?category=k-gone')
    await figures()
    await waitFor(() => expect(requests.length).toBeGreaterThan(0))
    expect(requests.at(-1)!.has('category')).toBe(false)
    expect(screen.queryByRole('list', { name: 'Active filters' })).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('')
  })

  it('narrows to a category with a chip that removes it', async () => {
    serve()
    const requests = dashboardRequests()
    await open()
    await figures()
    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Category' }), 'k-phones')
    await waitFor(() => expect(requests.at(-1)!.get('category')).toBe('k-phones'))
    const chips = screen.getByRole('list', { name: 'Active filters' })
    await userEvent.click(within(chips).getByRole('button', { name: 'Remove filter Category: Phones' }))
    await waitFor(() => expect(requests.at(-1)!.has('category')).toBe(false))
  })

  it('marks old figures while new ones load (Review Focus 5)', async () => {
    let release!: () => void
    const held = new Promise<void>((resolve) => (release = resolve))
    let calls = 0
    server.use(
      http.get(URL_, async () => {
        calls += 1
        if (calls > 1) await held
        return HttpResponse.json(sampleDashboard())
      }),
    )
    await open()
    const region = await figures()
    expect(region).toHaveAttribute('aria-busy', 'false')
    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Category' }), 'k-phones')
    expect(await screen.findByText('Updating…')).toHaveAttribute('role', 'status')
    expect(region).toHaveAttribute('aria-busy', 'true')
    release()
    await waitFor(() => expect(region).toHaveAttribute('aria-busy', 'false'))
    expect(screen.queryByText('Updating…')).not.toBeInTheDocument()
  })

  it('shows one empty state when nothing happened', async () => {
    const empty = sampleDashboard()
    serve({
      ...empty,
      funnel: { published: 0, receivedOffer: 0, accepted: 0, completed: 0 },
      support: { ...empty.support, opened: 0, resolved: 0, weekly: [] },
    })
    await open()
    expect(await screen.findByRole('heading', { name: 'No activity in this range' })).toBeInTheDocument()
  })

  it('offers a retry when the figures fail to load', async () => {
    server.use(http.get(URL_, () => HttpResponse.json({ code: 'SERVER_ERROR', message: 'x' }, { status: 500 })))
    await open()
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('keeps moderators out', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/dashboard' })
    expect(await screen.findByText("You don't have permission to view this page")).toBeInTheDocument()
  })

  it('shows every section with its table, and areas only without an area filter', async () => {
    serve()
    await open()
    for (const name of [
      'Listing to completion',
      'Rates by mode',
      'Liquidity by category',
      'Liquidity by area',
      'Cancellations and disputes by week',
      'Support cases by week',
    ]) {
      expect(await screen.findByRole('table', { name })).toBeInTheDocument()
    }
  })

  it('leaves the area table out when an area is chosen', async () => {
    serve()
    await open('/dashboard?area=a-yaba')
    expect(await screen.findByRole('table', { name: 'Liquidity by category' })).toBeInTheDocument()
    expect(screen.queryByRole('table', { name: 'Liquidity by area' })).not.toBeInTheDocument()
  })

  it('asks for a long range that starts before the pilot instead of refusing it (D1 review)', async () => {
    serve()
    const requests = dashboardRequests()
    await open(`/dashboard?from=2025-01-01&to=${watToday(serverNow())}`)
    await screen.findByText(/Figures for/)
    expect(requests.at(-1)!.get('from')).toBe('2025-01-01')
    expect(screen.queryByText(/366 days or fewer/)).not.toBeInTheDocument()
  })

  it('starts Custom from the range asked for, not the old figures still on screen (D1 review)', async () => {
    let release!: () => void
    const held = new Promise<void>((resolve) => (release = resolve))
    let calls = 0
    server.use(
      http.get(URL_, async () => {
        calls += 1
        if (calls > 1) await held
        return HttpResponse.json(sampleDashboard())
      }),
    )
    await open('/dashboard?range=7d')
    await screen.findByText(/Figures for/)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Date range' }), 'pilot')
    await screen.findByText('Updating…')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Date range' }), 'custom')
    expect(screen.getByLabelText('From')).toHaveValue('2026-10-01')
    release()
  })

  it('offers Pilot to date, not a Clear filters that does nothing, when the default view is empty (D1 review)', async () => {
    const empty = sampleDashboard()
    serve({
      ...empty,
      funnel: { published: 0, receivedOffer: 0, accepted: 0, completed: 0 },
      support: { ...empty.support, opened: 0, resolved: 0, weekly: [] },
    })
    const { router } = await open()
    await screen.findByRole('heading', { name: 'No activity in this range' })
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Pilot to date' }))
    await waitFor(() => expect(router.state.location.search).toContain('range=pilot'))
  })

  it('writes date chips as dates, and shows no preset chip under Custom (D1 review)', async () => {
    serve()
    await open('/dashboard?range=7d&from=2026-10-10&to=2026-11-08')
    const chips = await screen.findByRole('list', { name: 'Active filters' })
    expect(chips).toHaveTextContent('From 10 Oct 2026')
    expect(chips).toHaveTextContent('To 8 Nov 2026')
    expect(chips).not.toHaveTextContent('Last 7 days')
  })

  it('announces a date error (D1 review)', async () => {
    serve()
    await open('/dashboard?from=2026-10-20&to=2026-10-10')
    expect(await screen.findByRole('alert')).toHaveTextContent('The start date must be on or before the end date.')
  })

  it('is accessible', async () => {
    serve()
    const { container } = await open()
    await figures()
    await expectNoA11yViolations(container)
  })
})
