import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { NAV_ITEMS } from '@/lib/permissions/permissions'
import { signInAs } from '@/test/auth'
import { renderWithProviders } from '@/test/utils'

const signInHeading = () => screen.findByRole('heading', { name: 'Sign in to NextOwn Admin' })

describe('route tree', () => {
  it.each(['/', '/reports', '/cases/NX-1', '/records/items', '/settings'])(
    'sends a signed-out visitor at %s to sign in, revealing nothing (ADM-T-04)',
    async (path) => {
      renderWithProviders(routes, { initialPath: path })

      expect(await signInHeading()).toBeInTheDocument()
      expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument()
    },
  )

  it.each(NAV_ITEMS.map((item) => [item.label, item.to]))(
    'gives the administrator a titled, unindexed %s page',
    async (_label, to) => {
      await signInAs('administrator')
      renderWithProviders(routes, { initialPath: to })

      await screen.findByRole('navigation', { name: 'Main' })
      await waitFor(() => expect(document.title).toMatch(/ · NextOwn Admin$/))
      expect(document.head.querySelector('meta[name="robots"][content="noindex, nofollow"]')).not.toBeNull()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    },
  )

  it('shows a support agent the permission state on record pages, without the record tabs (QA-16)', async () => {
    await signInAs('support_agent')
    renderWithProviders(routes, { initialPath: '/records/users' })

    expect(
      await screen.findByRole('heading', { name: "You don't have permission to view this page" }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Records' })).not.toBeInTheDocument()
  })

  it('shows the record tabs on every records page', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/records/offers' })

    const tabs = await screen.findByRole('navigation', { name: 'Records' })
    expect(within(tabs).getAllByRole('link')).toHaveLength(7)
    expect(within(tabs).getByRole('link', { name: 'Offers' })).toHaveAttribute('aria-current', 'page')
  })

  it('treats an unknown record kind as not found', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/records/bogus' })

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('redirects record shortcuts', async () => {
    await signInAs('administrator')
    const { router } = renderWithProviders(routes, { initialPath: '/records/transactions/T-9' })
    await waitFor(() => expect(router.state.location.pathname).toBe('/transactions/T-9'))

    await router.navigate('/records')
    await waitFor(() => expect(router.state.location.pathname).toBe('/records/users'))
  })

  it('names record detail pages in the breadcrumbs', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/records/listings/L-1' })

    const crumbs = await screen.findByRole('navigation', { name: 'Breadcrumb' })
    await waitFor(() =>
      expect(
        within(crumbs)
          .getAllByRole('listitem')
          .map((li) => li.textContent),
      ).toEqual(['Records', 'Listings', 'L-1']),
    )
  })

  it('shows a generic not-found page for unknown addresses', async () => {
    renderWithProviders(routes, { initialPath: '/nope' })

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})
