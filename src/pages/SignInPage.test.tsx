import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { RedirectIfStaff } from '@/app/guards/RedirectIfStaff'
import { RequireStaff } from '@/app/guards/RequireStaff'
import { SampleSignIn } from '@/features/auth/components/SampleSignIn'
import { SAMPLE_CODE, SAMPLE_SECOND_FACTOR } from '@/mocks/sample-code'
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

async function enterPhone(phone: string) {
  await userEvent.type(await screen.findByRole('textbox', { name: 'Phone number' }), phone)
  await userEvent.click(screen.getByRole('button', { name: 'Send code' }))
}

async function enterCode(name: string, code: string, button: string) {
  await userEvent.type(await screen.findByRole('textbox', { name }), code)
  await userEvent.click(screen.getByRole('button', { name: button }))
}

const staffSession = (roles: string[]) =>
  http.get('/api/admin/session', () =>
    HttpResponse.json({ staffId: 's-x', displayName: 'Ade Test', roles, idleTimeoutSeconds: 900 }),
  )

describe('SignInPage', () => {
  it('turns away a session with no role it knows, back to the phone step (Phase A review)', async () => {
    renderSignIn()
    await enterPhone('0800 000 0102')
    server.use(staffSession(['auditor']))
    await enterCode('6-digit code', SAMPLE_CODE, 'Verify')
    expect(await screen.findByText("This number can't sign in here.")).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Phone number' })).toBeInTheDocument()
  })

  it('keeps a real session when reading it fails right after the code, and says so (D2 review)', async () => {
    renderSignIn()
    await enterPhone('0800 000 0102')
    let signOuts = 0
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST' && request.url.includes('/admin/auth/sign-out')) signOuts += 1
    })
    server.use(
      http.get('/api/admin/session', () => HttpResponse.json({ code: 'SERVER_ERROR', message: 'x' }, { status: 503 })),
    )
    await enterCode('6-digit code', SAMPLE_CODE, 'Verify')
    expect(await screen.findByRole('alert', {}, { timeout: 4000 })).toBeInTheDocument()
    expect(screen.queryByText("This number can't sign in here.")).not.toBeInTheDocument()
    expect(signOuts).toBe(0)
  })

  it('signs in with the roles it knows when others are unknown', async () => {
    renderSignIn()
    await enterPhone('0800 000 0102')
    server.use(staffSession(['moderator', 'auditor']))
    await enterCode('6-digit code', SAMPLE_CODE, 'Verify')
    expect(await screen.findByRole('heading', { name: 'Reports queue' })).toBeInTheDocument()
  })

  it('signs a moderator in and returns to where they were going', async () => {
    renderSignIn()

    expect(await screen.findByRole('heading', { name: 'Sign in to NextOwn Admin' })).toBeInTheDocument()
    await enterPhone('0800 000 0102')
    await enterCode('6-digit code', SAMPLE_CODE, 'Verify')

    expect(await screen.findByRole('heading', { name: 'Reports queue' })).toBeInTheDocument()
  })

  it('asks the administrator for a second code', async () => {
    renderSignIn()

    await enterPhone('0800 000 0103')
    await enterCode('6-digit code', SAMPLE_CODE, 'Verify')
    expect(await screen.findByRole('heading', { name: 'Enter your second code' })).toBeInTheDocument()
    await enterCode('Second code', SAMPLE_SECOND_FACTOR, 'Continue')

    expect(await screen.findByRole('heading', { name: 'Reports queue' })).toBeInTheDocument()
  })

  it('explains a wrong code next to the field', async () => {
    renderSignIn()

    await enterPhone('0800 000 0102')
    await enterCode('6-digit code', '000000', 'Verify')

    expect(await screen.findByRole('textbox', { name: '6-digit code' })).toHaveAccessibleDescription(
      "That code doesn't match. Check the text message and try again.",
    )
  })

  it('refuses a number that is not staff without describing the console', async () => {
    renderSignIn()

    await enterPhone('0800 000 0199')
    await enterCode('6-digit code', SAMPLE_CODE, 'Verify')

    expect(await screen.findByRole('alert')).toHaveTextContent("This number can't sign in here.")
  })

  it('rejects a number that is not a Nigerian mobile before sending', async () => {
    renderSignIn()

    await enterPhone('12345')

    expect(await screen.findByRole('textbox', { name: 'Phone number' })).toHaveAccessibleDescription(
      expect.stringContaining('Enter a Nigerian mobile number, like 0800 000 0101.'),
    )
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

  it('has no accessibility violations on the phone step', async () => {
    const { container } = renderSignIn({ sampleAccounts: true })
    await screen.findByRole('heading', { name: 'Sign in to NextOwn Admin' })
    await expectNoA11yViolations(container)
  })
})
