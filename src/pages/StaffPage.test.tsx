import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { MockInviteLink } from '@/features/staff/components/MockInviteLink'
import { apiClient } from '@/lib/api/client'
import { StaffPage } from '@/pages/StaffPage'
import { signInAs, signInWithSession } from '@/test/auth'
import { expectNoA11yViolations } from '@/test/axe'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'

const REASON = 'Joining the weekend moderation shift'

async function open() {
  await signInAs('administrator')
  const view = renderWithProviders(routes, { initialPath: '/staff' })
  const table = await screen.findByRole('grid', { name: 'Staff' })
  return { ...view, table }
}

async function fillInvite(email = 'ada@nextown.test', reason = REASON) {
  await userEvent.click(screen.getByRole('button', { name: 'Invite staff' }))
  const dialog = await screen.findByRole('dialog', { name: 'Invite staff' })
  await userEvent.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Ada Obi')
  await userEvent.type(within(dialog).getByRole('textbox', { name: 'Email' }), email)
  await userEvent.selectOptions(within(dialog).getByRole('combobox', { name: 'Role' }), 'moderator')
  if (reason) await userEvent.type(within(dialog).getByRole('textbox', { name: 'Why are you adding them?' }), reason)
  await userEvent.click(within(dialog).getByRole('button', { name: 'Continue' }))
  return dialog
}

const rowFor = (table: HTMLElement, name: string) => within(table).getByRole('row', { name: new RegExp(name) })

describe('Staff page (design 2026-11-21 §4.3)', () => {
  it('lists active staff and invites', async () => {
    const { table } = await open()
    expect(rowFor(table, 'Ngozi Adeyemi')).toHaveTextContent('ngozi@nextown.test')
    expect(rowFor(table, 'Ngozi Adeyemi')).toHaveTextContent('Active')
    expect(rowFor(table, 'Tunde Bakare')).toHaveTextContent('Moderator')
  })

  it('keeps moderators and support agents out', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/staff' })
    expect(
      await screen.findByRole('heading', { name: "You don't have permission to view this page" }),
    ).toBeInTheDocument()
  })

  it('invites with a reason, logs it, and shows the new row', async () => {
    const { table, router } = await open()
    const dialog = await fillInvite('ada@nextown.test', '')
    expect(await within(dialog).findByText('Say why you are adding them.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Invite Ada Obi?' })).not.toBeInTheDocument()

    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Why are you adding them?' }), REASON)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Continue' }))
    const confirm = await screen.findByRole('dialog', { name: 'Invite Ada Obi?' })
    expect(confirm).toHaveTextContent(REASON)
    await userEvent.click(within(confirm).getByRole('button', { name: 'Send invite' }))

    const sent = await screen.findByRole('status', { name: 'Invite sent to ada@nextown.test' })
    expect(sent).toBeInTheDocument()
    await waitFor(() => expect(rowFor(table, 'Ada Obi')).toHaveTextContent(/Invited · expires/))
    expect(screen.queryByText(/Mock only/)).not.toBeInTheDocument()

    await router.navigate('/audit')
    expect(await screen.findByText('Staff invited')).toBeInTheDocument()
  })

  it("shows why an email can't be invited, on the field", async () => {
    await open()
    const dialog = await fillInvite('tunde@nextown.test')
    await userEvent.click(
      within(await screen.findByRole('dialog', { name: 'Invite Ada Obi?' })).getByRole('button', {
        name: 'Send invite',
      }),
    )
    expect(await within(dialog).findByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
      expect.stringContaining('This email already has staff access.'),
    )
  })

  it('sends one invite when confirm is pressed twice (Review Focus 2)', async () => {
    const keys: string[] = []
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST' && request.url.endsWith('/admin/staff/invites')) {
        keys.push(request.headers.get('Idempotency-Key') ?? '')
      }
    })
    const { table } = await open()
    await fillInvite()
    const confirm = await screen.findByRole('dialog', { name: 'Invite Ada Obi?' })
    const send = within(confirm).getByRole('button', { name: 'Send invite' })
    await userEvent.dblClick(send)
    await screen.findByRole('status', { name: 'Invite sent to ada@nextown.test' })
    expect(new Set(keys).size).toBe(1)
    expect(within(table).getAllByRole('row', { name: /Ada Obi/ })).toHaveLength(1)
  })

  it('resends and revokes an invite', async () => {
    const { table } = await open()
    await fillInvite()
    await userEvent.click(
      within(await screen.findByRole('dialog', { name: 'Invite Ada Obi?' })).getByRole('button', {
        name: 'Send invite',
      }),
    )
    await waitFor(() => expect(rowFor(table, 'Ada Obi')).toBeInTheDocument())

    await userEvent.click(
      within(rowFor(table, 'Ada Obi')).getByRole('button', { name: 'Actions for ada@nextown.test' }),
    )
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Resend invite' }))
    const resend = await screen.findByRole('dialog', { name: 'Resend the invite to Ada Obi' })
    await userEvent.type(within(resend).getByRole('textbox', { name: 'Why are you resending it?' }), 'Went to spam')
    await userEvent.click(within(resend).getByRole('button', { name: 'Continue' }))
    await userEvent.click(
      within(await screen.findByRole('dialog', { name: 'Resend the invite to Ada Obi?' })).getByRole('button', {
        name: 'Resend invite',
      }),
    )
    expect(await screen.findByRole('status', { name: 'Invite resent to ada@nextown.test' })).toBeInTheDocument()

    await userEvent.click(
      within(rowFor(table, 'Ada Obi')).getByRole('button', { name: 'Actions for ada@nextown.test' }),
    )
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Revoke invite' }))
    const revoke = await screen.findByRole('dialog', { name: 'Revoke the invite for Ada Obi' })
    await userEvent.type(within(revoke).getByRole('textbox', { name: 'Why are you revoking it?' }), 'Changed plans')
    await userEvent.click(within(revoke).getByRole('button', { name: 'Continue' }))
    await userEvent.click(
      within(await screen.findByRole('dialog', { name: 'Revoke the invite for Ada Obi?' })).getByRole('button', {
        name: 'Revoke invite',
      }),
    )
    expect(await screen.findByRole('status', { name: 'Invite for ada@nextown.test revoked' })).toBeInTheDocument()
    await waitFor(() => expect(within(table).queryByRole('row', { name: /Ada Obi/ })).not.toBeInTheDocument())
  })

  it('offers the invite link on the mock only', async () => {
    await signInWithSession('administrator')
    renderWithProviders([{ path: '/staff', element: <StaffPage mockInviteLink={MockInviteLink} /> }], {
      initialPath: '/staff',
    })
    await screen.findByRole('grid', { name: 'Staff' })
    await fillInvite()
    await userEvent.click(
      within(await screen.findByRole('dialog', { name: 'Invite Ada Obi?' })).getByRole('button', {
        name: 'Send invite',
      }),
    )
    const link = await screen.findByRole('link', { name: 'Mock only: open the invite link' })
    expect(link.getAttribute('href')).toMatch(/^\/join\?token=\w{32}$/)
    const token = new URLSearchParams(link.getAttribute('href')!.split('?')[1]).get('token')
    expect((await apiClient.get(`/admin/invites/${token}`)).status).toBe(200)
  })

  it('has no accessibility violations, with the table and the open dialog', async () => {
    const { container } = await open()
    await expectNoA11yViolations(container)
    await userEvent.click(screen.getByRole('button', { name: 'Invite staff' }))
    await expectNoA11yViolations(await screen.findByRole('dialog', { name: 'Invite staff' }))
  })
})
