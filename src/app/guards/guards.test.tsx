import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { RequireRole } from '@/app/guards/RequireRole'
import { RequireStaff } from '@/app/guards/RequireStaff'
import { signInAs } from '@/test/auth'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'

const routes = [
  { path: '/sign-in', element: <p>Sign-in page</p> },
  {
    element: <RequireStaff />,
    children: [
      { path: '/', element: <h1>Overview</h1> },
      { element: <RequireRole routeId="settings" />, children: [{ path: '/settings', element: <h1>Settings</h1> }] },
    ],
  },
]

describe('RequireStaff', () => {
  it('sends a signed-out visitor to sign in, remembering where they were going', async () => {
    const { router } = renderWithProviders(routes, { initialPath: '/settings' })

    expect(await screen.findByText('Sign-in page')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?next=%2Fsettings')
  })

  it('shows a retryable error when the session check fails, instead of signing out', async () => {
    await signInAs('administrator')
    server.use(
      http.get('/api/admin/session', () => HttpResponse.json({ code: 'SERVER_ERROR' }, { status: 503 }), {
        once: true,
      }),
    )
    renderWithProviders(routes, { initialPath: '/settings' })

    expect(await screen.findByText("We couldn't load this")).toBeInTheDocument()
    expect(screen.queryByText('Sign-in page')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })
})

describe('RequireRole (QA-16)', () => {
  it('shows a moderator the permission state on an administrator page, and nothing else', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/settings' })

    expect(
      await screen.findByRole('heading', { name: "You don't have permission to view this page" }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('heading')).toHaveLength(1)
  })

  it('lets an administrator through', async () => {
    await signInAs('administrator')
    renderWithProviders(routes, { initialPath: '/settings' })

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })
})
