import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { RedirectIfStaff } from '@/app/guards/RedirectIfStaff'
import { RequireStaff } from '@/app/guards/RequireStaff'
import { SampleSignIn } from '@/features/auth/components/SampleSignIn'
import { SAMPLE_CODE, SAMPLE_PASSWORD, STAFF_EMAILS } from '@/mocks/sample-accounts'
import { SignInPage } from '@/pages/SignInPage'
import { expectNoA11yViolations } from '@/test/axe'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'

function renderSignIn({ sampleAccounts = false }: { sampleAccounts?: boolean | 'default' } = {}) {
  const page =
    sampleAccounts === 'default' ? <SignInPage /> : <SignInPage sampleSignIn={sampleAccounts ? SampleSignIn : null} />
  return renderWithProviders(
    [
      {
        element: <RedirectIfStaff />,
        children: [{ path: '/sign-in', element: page }],
      },
      { element: <RequireStaff />, children: [{ path: '/reports', element: <h1>Reports queue</h1> }] },
    ],
    { initialPath: '/sign-in?next=%2Freports' },
  )
}

async function signIn(email: string, password = SAMPLE_PASSWORD) {
  await userEvent.type(await screen.findByRole('textbox', { name: 'Email' }), email)
  await userEvent.type(screen.getByLabelText('Password'), password)
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
}

async function enterCode(code: string) {
  await userEvent.type(await screen.findByRole('textbox', { name: '6-digit code' }), code)
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
}

const staffSession = (roles: string[]) =>
  http.get('/api/admin/session', () =>
    HttpResponse.json({ staffId: 's-x', displayName: 'Ade Test', roles, idleTimeoutSeconds: 900 }),
  )

describe('SignInPage (email and password, design 2026-11-21 §4.1)', () => {
  it('signs a moderator in and returns to next', async () => {
    renderSignIn()
    expect(await screen.findByRole('heading', { name: 'Sign in to NextOwn Admin' })).toBeInTheDocument()
    await signIn(STAFF_EMAILS.moderator)
    expect(await screen.findByRole('heading', { name: 'Reports queue' })).toBeInTheDocument()
  })

  it('asks an administrator for the emailed code', async () => {
    renderSignIn()
    await signIn(STAFF_EMAILS.administrator)
    expect(await screen.findByRole('heading', { name: 'Enter the code we emailed you' })).toBeInTheDocument()
    expect(screen.getByText('We sent a 6-digit code to n•••@nextown.test.')).toBeInTheDocument()
    await enterCode(SAMPLE_CODE)
    expect(await screen.findByRole('heading', { name: 'Reports queue' })).toBeInTheDocument()
  })

  it('accepts an email typed with capitals and spaces (Review Focus 1)', async () => {
    renderSignIn()
    await signIn('  Ngozi@NextOwn.TEST ')
    expect(await screen.findByRole('heading', { name: 'Enter the code we emailed you' })).toBeInTheDocument()
  })

  it('explains a wrong code next to the field', async () => {
    renderSignIn()
    await signIn(STAFF_EMAILS.administrator)
    await enterCode('000000')
    expect(await screen.findByRole('textbox', { name: '6-digit code' })).toHaveAccessibleDescription(
      "That code doesn't match. Check the email and try again.",
    )
  })

  it('says the same for a wrong password and an unknown email', async () => {
    renderSignIn()
    await signIn(STAFF_EMAILS.moderator, 'Wrong-password-1')
    expect(await screen.findByRole('alert')).toHaveTextContent("That email and password don't match.")

    await userEvent.clear(screen.getByRole('textbox', { name: 'Email' }))
    await signIn('nobody@nextown.test')
    expect(await screen.findByRole('alert')).toHaveTextContent("That email and password don't match.")
  })

  it('refuses a member account without describing the console', async () => {
    renderSignIn()
    await signIn(STAFF_EMAILS.nonStaff)
    expect(await screen.findByRole('alert')).toHaveTextContent("This account can't sign in here.")
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument()
  })

  it('shows the wait after too many tries', async () => {
    renderSignIn()
    server.use(
      http.post('/api/admin/auth/login', () =>
        HttpResponse.json({ code: 'RATE_LIMITED', message: 'x' }, { status: 429, headers: { 'Retry-After': '600' } }),
      ),
    )
    await signIn(STAFF_EMAILS.moderator)
    expect(await screen.findByRole('alert')).toHaveTextContent('Wait 10 minutes, then try again.')
  })

  it('checks the email before sending', async () => {
    renderSignIn()
    await signIn('ngozi')
    expect(await screen.findByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
      expect.stringContaining('Enter an email address, like name@nextown.ng.'),
    )
  })

  it('starts again cleanly from the code step (Review Focus 5)', async () => {
    renderSignIn()
    await signIn(STAFF_EMAILS.administrator)
    await userEvent.click(await screen.findByRole('button', { name: 'Use a different account' }))
    expect(await screen.findByRole('textbox', { name: 'Email' })).toHaveValue('')
    await signIn(STAFF_EMAILS.moderator)
    expect(await screen.findByRole('heading', { name: 'Reports queue' })).toBeInTheDocument()
  })

  it('waits before offering to resend (Review Focus 5)', async () => {
    renderSignIn()
    await signIn(STAFF_EMAILS.administrator)
    const resend = await screen.findByRole('button', { name: 'Resend code' })
    expect(resend).toBeDisabled()
    expect(screen.getByText(/You can resend in \d+ s/)).toBeInTheDocument()
  })

  it('shows and hides the password', async () => {
    renderSignIn()
    const password = await screen.findByLabelText('Password')
    expect(password).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
  })

  it('links to forgot password, keeping where they were going', async () => {
    renderSignIn()
    expect(await screen.findByRole('link', { name: 'Forgot password?' })).toHaveAttribute(
      'href',
      '/forgot-password?next=%2Freports',
    )
  })

  it('asks for no phone number', async () => {
    renderSignIn()
    await screen.findByRole('heading', { name: 'Sign in to NextOwn Admin' })
    expect(screen.queryByRole('textbox', { name: /phone/i })).not.toBeInTheDocument()
  })

  it('turns away a session with no role it knows, back to the first step (Phase A review)', async () => {
    renderSignIn()
    server.use(staffSession(['auditor']))
    await signIn(STAFF_EMAILS.moderator)
    expect(await screen.findByText("This account can't sign in here.")).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument()
  })

  it('keeps a real session when reading it fails right after sign-in, and says so (D2 review)', async () => {
    renderSignIn()
    let signOuts = 0
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST' && request.url.includes('/admin/auth/sign-out')) signOuts += 1
    })
    server.use(
      http.get('/api/admin/session', () => HttpResponse.json({ code: 'SERVER_ERROR', message: 'x' }, { status: 503 })),
    )
    await signIn(STAFF_EMAILS.moderator)
    expect(await screen.findByRole('alert', {}, { timeout: 4000 })).toBeInTheDocument()
    expect(screen.queryByText("This account can't sign in here.")).not.toBeInTheDocument()
    expect(signOuts).toBe(0)
  })

  it('signs in with the roles it knows when others are unknown', async () => {
    renderSignIn()
    await userEvent.type(await screen.findByRole('textbox', { name: 'Email' }), STAFF_EMAILS.moderator)
    await userEvent.type(screen.getByLabelText('Password'), SAMPLE_PASSWORD)
    server.use(staffSession(['moderator', 'auditor']))
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('heading', { name: 'Reports queue' })).toBeInTheDocument()
  })

  it('offers sample accounts only when asked to', async () => {
    renderSignIn()
    await screen.findByRole('heading', { name: 'Sign in to NextOwn Admin' })
    expect(screen.queryByRole('button', { name: 'Sign in as moderator' })).not.toBeInTheDocument()
  })

  it('shows no sample accounts by default outside the mock', async () => {
    renderSignIn({ sampleAccounts: 'default' })
    await screen.findByRole('heading', { name: 'Sign in to NextOwn Admin' })
    expect(screen.queryByRole('heading', { name: 'Sample staff accounts' })).not.toBeInTheDocument()
  })

  it('signs in with one click as a sample account on the mock API', async () => {
    renderSignIn({ sampleAccounts: true })
    await userEvent.click(await screen.findByRole('button', { name: 'Sign in as administrator' }))
    expect(await screen.findByRole('heading', { name: 'Reports queue' })).toBeInTheDocument()
  })

  it('has no accessibility violations on either step', async () => {
    const { container } = renderSignIn({ sampleAccounts: true })
    await screen.findByRole('heading', { name: 'Sign in to NextOwn Admin' })
    await expectNoA11yViolations(container)
    await signIn(STAFF_EMAILS.administrator)
    await screen.findByRole('heading', { name: 'Enter the code we emailed you' })
    await expectNoA11yViolations(container)
  })
})
