import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { RequireRole } from '@/app/guards/RequireRole'
import { RequireStaff } from '@/app/guards/RequireStaff'
import { apiClient } from '@/lib/api/client'
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
    // The check retries once, so it fails twice before the guard gives up
    let failures = 2
    server.use(
      http.get('/api/admin/session', () => {
        if (failures-- > 0) return HttpResponse.json({ code: 'SERVER_ERROR' }, { status: 503 })
        return undefined
      }),
    )
    renderWithProviders(routes, { initialPath: '/settings' })

    expect(await screen.findByText("We couldn't load this", {}, { timeout: 4000 })).toBeInTheDocument()
    expect(screen.queryByText('Sign-in page')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })

  it('gives up on a dead network after one retry, with a short timeout (Phase A review)', async () => {
    let calls = 0
    server.use(
      http.get('/api/admin/session', () => {
        calls += 1
        return HttpResponse.error()
      }),
    )
    const get = vi.spyOn(apiClient, 'get')
    renderWithProviders(routes, { initialPath: '/settings' })

    expect(await screen.findByText("We couldn't load this", {}, { timeout: 4000 })).toBeInTheDocument()
    expect(calls).toBe(2)
    expect(get).toHaveBeenCalledWith('/admin/session', expect.objectContaining({ timeout: 4_000 }))
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
