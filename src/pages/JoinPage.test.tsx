import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { JoinPage } from '@/pages/JoinPage'
import { apiClient } from '@/lib/api/client'
import type { InviteResult } from '@/lib/api/types/staff'
import { signInAs, signInWithSession } from '@/test/auth'
import { expectNoA11yViolations } from '@/test/axe'
import { renderWithProviders } from '@/test/utils'

const PASSWORD = 'Mangoes7 at Ikeja'

/** An invite made through the API by the administrator, who is then signed out */
async function inviteAda(role = 'moderator') {
  await signInAs('administrator')
  const { data } = await apiClient.post<InviteResult>(
    '/admin/staff/invites',
    { email: 'ada@nextown.test', displayName: 'Ada Obi', role, reason: 'New moderator' },
    { headers: { 'Idempotency-Key': crypto.randomUUID() } },
  )
  await apiClient.post('/admin/auth/sign-out')
  return new URLSearchParams(data.mockInviteUrl!.split('?')[1]).get('token')!
}

/** The page reads the real address (the memory router doesn't set it), as it does after the email link */
function openJoin(path: string) {
  window.history.replaceState(null, '', path)
  return renderWithProviders(routes, { initialPath: path })
}

afterEach(() => window.history.replaceState(null, '', '/'))

describe('accept invite (design 2026-11-21 §4.4)', () => {
  it('creates the account and signs the invitee in', async () => {
    const token = await inviteAda()
    openJoin(`/join?token=${token}`)
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Join NextOwn Admin as Moderator' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Invited as ada@nextown.test')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Password'), PASSWORD)
    await userEvent.type(screen.getByLabelText('Confirm password'), PASSWORD)
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Overview' }, { timeout: 4000 })).toBeInTheDocument()
    expect(await screen.findByText('Ada Obi')).toBeInTheDocument()
  })

  it('never offers the new account a sign-out while the console loads (final review)', async () => {
    const token = await inviteAda()
    window.history.replaceState(null, '', `/join?token=${token}`)
    // The console's first page takes a moment to load, as a lazy route does on a slow connection
    const slowHome = () =>
      new Promise<{ Component: () => React.JSX.Element }>((resolve) =>
        setTimeout(() => resolve({ Component: () => <h1>Home</h1> }), 300),
      )
    renderWithProviders(
      [
        { path: '/join', element: <JoinPage /> },
        { path: '/', lazy: slowHome },
      ],
      { initialPath: `/join?token=${token}` },
    )
    let offered = false
    const watcher = new MutationObserver(() => {
      if (document.body.textContent?.includes('Sign out and continue')) offered = true
    })
    watcher.observe(document.body, { childList: true, subtree: true, characterData: true })

    await userEvent.type(await screen.findByLabelText('Password'), PASSWORD)
    await userEvent.type(screen.getByLabelText('Confirm password'), PASSWORD)
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('heading', { name: 'Home' }, { timeout: 4000 })).toBeInTheDocument()
    watcher.disconnect()
    expect(offered).toBe(false)
  })

  it('removes the token from the address', async () => {
    const token = await inviteAda()
    openJoin(`/join?token=${token}`)
    await screen.findByRole('heading', { level: 1, name: /Join NextOwn Admin/ })
    expect(window.location.search).not.toContain('token')
  })

  it('keeps the invite after the address is cleaned and the page reloads (Review Focus 3)', async () => {
    const token = await inviteAda()
    const first = openJoin(`/join?token=${token}`)
    await screen.findByRole('heading', { level: 1, name: /Join NextOwn Admin/ })
    first.unmount()

    openJoin('/join')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Join NextOwn Admin as Moderator' }),
    ).toBeInTheDocument()
  })

  it('says a revoked or unknown link no longer works', async () => {
    openJoin('/join?token=nope')
    expect(await screen.findByRole('heading', { level: 1, name: 'Invite link not working' })).toBeInTheDocument()
    expect(
      screen.getByText('This invite link no longer works. Ask an administrator for a new one.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to sign in' })).toHaveAttribute('href', '/sign-in')
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
  })

  it('says so when there is no link at all', async () => {
    openJoin('/join')
    expect(await screen.findByRole('heading', { level: 1, name: 'Invite link not working' })).toBeInTheDocument()
  })

  it('blocks mismatched passwords', async () => {
    const token = await inviteAda()
    openJoin(`/join?token=${token}`)
    await userEvent.type(await screen.findByLabelText('Password'), PASSWORD)
    await userEvent.type(screen.getByLabelText('Confirm password'), 'Mangoes7')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText("The passwords don't match.")).toBeInTheDocument()
  })

  it('offers to sign out first when someone is signed in', async () => {
    const token = await inviteAda()
    await signInWithSession('moderator')
    openJoin(`/join?token=${token}`)
    expect(await screen.findByText("You're signed in as Tunde Bakare.")).toBeInTheDocument()
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Sign out and continue' }))
    expect(await screen.findByLabelText('Password')).toBeInTheDocument()
  })

  it('has no accessibility violations in the valid and invalid states', async () => {
    const token = await inviteAda()
    const valid = openJoin(`/join?token=${token}`)
    await screen.findByRole('heading', { level: 1, name: /Join NextOwn Admin/ })
    await expectNoA11yViolations(valid.container)
    valid.unmount()
    sessionStorage.clear()

    const invalid = openJoin('/join?token=nope')
    await screen.findByRole('heading', { level: 1, name: 'Invite link not working' })
    await expectNoA11yViolations(invalid.container)
  })
})
