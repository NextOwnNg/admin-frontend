import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { apiClient } from '@/lib/api/client'
import { SAMPLE_CODE, SAMPLE_PASSWORD, STAFF_EMAILS } from '@/mocks/sample-accounts'
import { expectNoA11yViolations } from '@/test/axe'
import { renderWithProviders } from '@/test/utils'

const NEW_PASSWORD = 'Mangoes7 at Ikeja'

async function askForCode(email: string) {
  await userEvent.type(await screen.findByRole('textbox', { name: 'Email' }), email)
  await userEvent.click(screen.getByRole('button', { name: 'Send code' }))
  await screen.findByRole('heading', { name: 'Choose a new password' })
}

async function setPassword(code = SAMPLE_CODE, password = NEW_PASSWORD) {
  await userEvent.type(screen.getByRole('textbox', { name: '6-digit code' }), code)
  await userEvent.type(screen.getByLabelText('New password'), password)
  await userEvent.type(screen.getByLabelText('Confirm password'), password)
  await userEvent.click(screen.getByRole('button', { name: 'Reset password' }))
}

const loginStatus = (email: string, password: string) =>
  apiClient.post('/admin/auth/login', { email, password }).then(
    (r) => r.status,
    (e: { status?: number }) => e.status,
  )

describe('forgot password (design 2026-11-21 §4.2)', () => {
  it("resets a moderator's password and signs in", async () => {
    renderWithProviders(routes, { initialPath: '/forgot-password' })
    expect(await screen.findByRole('heading', { level: 1, name: 'Reset your password' })).toBeInTheDocument()
    await askForCode(STAFF_EMAILS.moderator)
    expect(screen.getByRole('status')).toHaveTextContent("If that email has a staff account, we've sent a code.")
    await setPassword()

    expect(await screen.findByRole('heading', { level: 1, name: /Overview/ }, { timeout: 4000 })).toBeInTheDocument()
    await apiClient.post('/admin/auth/sign-out')
    expect(await loginStatus(STAFF_EMAILS.moderator, SAMPLE_PASSWORD)).toBe(401)
  })

  it('says the same for an unknown email', async () => {
    renderWithProviders(routes, { initialPath: '/forgot-password' })
    await askForCode('nobody@nextown.test')
    expect(screen.getByRole('status')).toHaveTextContent("If that email has a staff account, we've sent a code.")
  })

  it('asks an administrator for the code after the reset', async () => {
    renderWithProviders(routes, { initialPath: '/forgot-password' })
    await askForCode(STAFF_EMAILS.administrator)
    await setPassword()
    expect(await screen.findByRole('heading', { name: 'Enter the code we emailed you' })).toBeInTheDocument()
    await userEvent.type(screen.getByRole('textbox', { name: '6-digit code' }), SAMPLE_CODE)
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('heading', { level: 1, name: /Overview/ }, { timeout: 4000 })).toBeInTheDocument()
  })

  it('keeps the form with a wrong code and shows it on the code field', async () => {
    renderWithProviders(routes, { initialPath: '/forgot-password' })
    await askForCode(STAFF_EMAILS.moderator)
    await setPassword('000000')
    expect(await screen.findByRole('textbox', { name: '6-digit code' })).toHaveAccessibleDescription(
      "That code doesn't match. Check the email and try again.",
    )
    expect(screen.getByLabelText('New password')).toHaveValue(NEW_PASSWORD)
  })

  it('blocks a short or mismatched new password before sending', async () => {
    renderWithProviders(routes, { initialPath: '/forgot-password' })
    await askForCode(STAFF_EMAILS.moderator)
    await userEvent.type(screen.getByRole('textbox', { name: '6-digit code' }), SAMPLE_CODE)
    await userEvent.type(screen.getByLabelText('New password'), 'short')
    await userEvent.type(screen.getByLabelText('Confirm password'), 'shorter')
    await userEvent.click(screen.getByRole('button', { name: 'Reset password' }))
    expect(await screen.findByText('Use at least 8 characters.')).toBeInTheDocument()
  })

  it('shows the strength of the new password', async () => {
    renderWithProviders(routes, { initialPath: '/forgot-password' })
    await askForCode(STAFF_EMAILS.moderator)
    await userEvent.type(screen.getByLabelText('New password'), NEW_PASSWORD)
    expect(screen.getByText('Strength: Strong')).toBeInTheDocument()
  })

  it('goes back to change the email, and back to sign in', async () => {
    renderWithProviders(routes, { initialPath: '/forgot-password' })
    expect(await screen.findByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/sign-in')
    await askForCode(STAFF_EMAILS.moderator)
    await userEvent.click(screen.getByRole('button', { name: 'Use a different email' }))
    expect(await screen.findByRole('textbox', { name: 'Email' })).toBeInTheDocument()
  })

  it('has no accessibility violations on either step', async () => {
    const { container } = renderWithProviders(routes, { initialPath: '/forgot-password' })
    await screen.findByRole('textbox', { name: 'Email' })
    await expectNoA11yViolations(container)
    await askForCode(STAFF_EMAILS.moderator)
    await expectNoA11yViolations(container)
  })
})
