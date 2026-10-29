import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RedirectIfStaff } from '@/app/guards/RedirectIfStaff'
import { RequireStaff } from '@/app/guards/RequireStaff'
import { AdminLayout } from '@/app/layouts/AdminLayout'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { RootLayout } from '@/app/layouts/RootLayout'
import { EnvRibbon } from '@/components/layout/EnvRibbon'
import { apiClient } from '@/lib/api/client'
import { staffDb } from '@/mocks/db/staff'
import { SAMPLE_CODE } from '@/mocks/sample-code'
import { SignInPage } from '@/pages/SignInPage'
import { expectNoA11yViolations } from '@/test/axe'
import { signInAs } from '@/test/auth'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'

afterEach(() => vi.useRealTimers())

const routes = [
  {
    element: <RootLayout />,
    children: [
      {
        element: <RedirectIfStaff />,
        children: [
          {
            element: <AuthLayout />,
            children: [{ path: '/sign-in', element: <SignInPage showSampleAccounts={false} /> }],
          },
        ],
      },
      {
        element: <RequireStaff />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: '/', element: <h1>Overview page</h1>, handle: { crumb: 'Overview' } },
              { path: '/reports', element: <h1>Reports page</h1>, handle: { crumb: 'Reports' } },
            ],
          },
        ],
      },
    ],
  },
]

const navLabels = () =>
  within(screen.getByRole('navigation', { name: 'Main' }))
    .getAllByRole('link')
    .map((link) => link.textContent)

describe('AdminLayout', () => {
  it('shows a support agent only their sidebar items', async () => {
    await signInAs('support_agent')
    renderWithProviders(routes, { initialPath: '/reports' })

    await screen.findByRole('heading', { name: 'Reports page' })
    expect(navLabels()).toEqual(['Overview', 'Reports', 'Exceptions'])
    expect(screen.getByRole('link', { name: 'Reports' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('Chiamaka Eze')).toBeInTheDocument()
    expect(screen.getByText('Support agent')).toBeInTheDocument()
  })

  it('collapses the sidebar to icons but keeps every link named', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/' })
    await screen.findByRole('heading', { name: 'Overview page' })

    await userEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }))

    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Listings' })).toBeInTheDocument()
  })

  it('shows breadcrumbs and the environment ribbon', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/reports' })
    await screen.findByRole('heading', { name: 'Reports page' })

    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(crumbs).getByText('Reports')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('LOCAL')).toBeInTheDocument()
  })

  it('signs out from the top bar', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/reports' })
    await screen.findByRole('heading', { name: 'Reports page' })

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('heading', { name: 'Sign in to NextOwn Admin' })).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    await signInAs('administrator')
    const { container } = renderWithProviders(routes, { initialPath: '/' })
    await screen.findByRole('heading', { name: 'Overview page' })
    await expectNoA11yViolations(container)
  })
})

describe('EnvRibbon', () => {
  it('is absent in production', () => {
    const { container } = render(<EnvRibbon env="production" />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('idle timeout (ADM-T-06)', () => {
  it('warns, signs out, clears cached data and returns to the same page after sign-in', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    staffDb.setIdleTimeout(120)
    await signInAs('moderator')
    const { router, queryClient } = renderWithProviders(routes, { initialPath: '/reports' })
    await screen.findByRole('heading', { name: 'Reports page' })
    queryClient.setQueryData(['admin', 'cases'], [{ id: 'NX-1' }])

    await act(() => vi.advanceTimersByTimeAsync(61_000))
    expect(screen.getByRole('dialog', { name: "You'll be signed out soon" })).toHaveTextContent('Signing out in')

    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(await screen.findByRole('heading', { name: 'Sign in to NextOwn Admin' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('?next=%2Freports')
    expect(queryClient.getQueryData(['admin', 'cases'])).toBeUndefined()

    vi.useRealTimers()
    await userEvent.type(screen.getByRole('textbox', { name: 'Phone number' }), '0800 000 0102')
    await userEvent.click(screen.getByRole('button', { name: 'Send code' }))
    await userEvent.type(await screen.findByRole('textbox', { name: '6-digit code' }), SAMPLE_CODE)
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }))
    expect(await screen.findByRole('heading', { name: 'Reports page' })).toBeInTheDocument()
  })

  it('keeps the session when the operator chooses to stay', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    staffDb.setIdleTimeout(120)
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/reports' })
    await screen.findByRole('heading', { name: 'Reports page' })

    await act(() => vi.advanceTimersByTimeAsync(61_000))
    await userEvent.click(screen.getByRole('button', { name: 'Stay signed in' }))
    await act(() => vi.advanceTimersByTimeAsync(50_000))

    expect(await screen.findByRole('heading', { name: 'Reports page' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('expired session (Review Focus 4)', () => {
  it('goes to sign-in once, even with the warning open and several requests failing', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    staffDb.setIdleTimeout(120)
    await signInAs('moderator')
    const { router } = renderWithProviders(routes, { initialPath: '/reports' })
    await screen.findByRole('heading', { name: 'Reports page' })
    await act(() => vi.advanceTimersByTimeAsync(61_000))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    const signInVisits: string[] = []
    router.subscribe((state) => {
      if (state.location.pathname === '/sign-in') signInVisits.push(state.location.search)
    })
    staffDb.expireSession()
    server.use(http.get('/api/admin/cases', () => HttpResponse.json({ code: 'AUTH_REQUIRED' }, { status: 401 })))
    await act(() =>
      Promise.all([apiClient.get('/admin/cases').catch(() => {}), apiClient.get('/admin/cases').catch(() => {})]),
    )

    expect(await screen.findByRole('heading', { name: 'Sign in to NextOwn Admin' })).toBeInTheDocument()
    expect(signInVisits).toEqual(['?next=%2Freports'])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('final review fixes', () => {
  it('clears cached records when the session re-check finds the session has ended', async () => {
    await signInAs('moderator')
    const { queryClient } = renderWithProviders(routes, { initialPath: '/reports' })
    await screen.findByRole('heading', { name: 'Reports page' })
    queryClient.setQueryData(['admin', 'cases'], [{ id: 'NX-1' }])

    staffDb.expireSession()
    await act(() => queryClient.invalidateQueries({ queryKey: ['admin', 'session'] }))

    expect(await screen.findByRole('heading', { name: 'Sign in to NextOwn Admin' })).toBeInTheDocument()
    expect(queryClient.getQueryData(['admin', 'cases'])).toBeUndefined()
  })

  it('says so when signing out fails, and keeps the operator where they are', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/reports' })
    await screen.findByRole('heading', { name: 'Reports page' })
    server.use(http.post('/api/admin/auth/sign-out', () => HttpResponse.json({ code: 'X' }, { status: 503 })))

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('You weren’t signed out.')
    expect(screen.getByRole('heading', { name: 'Reports page' })).toBeInTheDocument()
  })

  it('keeps the console mounted behind the larger-screen notice', async () => {
    const wide = window.matchMedia
    window.matchMedia = (query: string) => ({ ...wide(query), matches: query.includes('max-width') })
    try {
      await signInAs('moderator')
      const { container } = renderWithProviders(routes, { initialPath: '/reports' })

      expect(await screen.findByRole('heading', { name: 'Use a larger screen' })).toBeInTheDocument()
      await vi.waitFor(() =>
        expect([...container.querySelectorAll('h1')].map((h) => h.textContent)).toContain('Reports page'),
      )
      expect(screen.queryByRole('heading', { name: 'Reports page' })).not.toBeInTheDocument()
    } finally {
      window.matchMedia = wide
    }
  })
})
