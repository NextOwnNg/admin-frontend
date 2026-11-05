import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders, newIdempotencyKey } from '@/lib/api/idempotency'
import type { PilotSettings } from '@/lib/api/types/settings'
import { apiBaseUrl } from '@/lib/env'
import { settingsDb } from '@/mocks/db/settings'
import { signInAs } from '@/test/auth'
import { expectNoA11yViolations } from '@/test/axe'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'

const NOTICE =
  'Changes apply to new listings, offers and reservations only. Existing agreements, offer versions and reservations keep the terms they were made with.'
const REASON = 'Pilot feedback says offers expire too soon'
const SECTIONS = [
  'Cities and areas',
  'Categories',
  'Offer lifetime',
  'Quick Sell options',
  'Reservation duration',
  'Photo limits',
  'Content rules',
  'Support contacts',
]

const section = (name: string) => screen.findByRole('region', { name })
async function open() {
  await signInAs('administrator')
  const view = renderWithProviders(routes, { initialPath: '/settings' })
  await section('Offer lifetime')
  return view
}
async function edit(name: string) {
  await userEvent.click(await screen.findByRole('button', { name: `Edit ${name}` }))
  return section(name)
}
async function saveWithReason(region: HTMLElement, reason = REASON) {
  await userEvent.click(within(region).getByRole('button', { name: 'Save' }))
  const dialog = await screen.findByRole('dialog', { name: /^Save .+\?$/ })
  const confirm = within(dialog).getByRole('button', { name: 'Save change' })
  expect(confirm).toBeDisabled()
  await userEvent.type(within(dialog).getByRole('textbox', { name: 'Why are you changing this?' }), reason)
  return { dialog, confirm }
}
/** Every key the console sends with a settings change */
function settingsKeys() {
  const keys: string[] = []
  server.events.on('request:start', ({ request }) => {
    if (request.method === 'PUT' && request.url.includes('/admin/settings/')) {
      keys.push(request.headers.get('Idempotency-Key') ?? '')
    }
  })
  return keys
}

describe('pilot settings (ADM-FE-09, Phase C design §4.5)', () => {
  it('shows every section read-only, with nothing editable until asked', async () => {
    const { container } = await open()
    for (const name of SECTIONS) expect(await section(name)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Offer lifetime' })).toHaveTextContent('72 hours')
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    await expectNoA11yViolations(container)
  })

  it('blocks an invalid value with a field error before any confirmation', async () => {
    await open()
    const region = await edit('Offer lifetime')
    const field = within(region).getByRole('spinbutton', { name: 'Offer lifetime (hours)' })
    await userEvent.clear(field)
    await userEvent.type(field, '200')
    await userEvent.click(within(region).getByRole('button', { name: 'Save' }))
    expect(await within(region).findByText('Enter a whole number of hours from 24 to 168.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('confirms old → new with the agreements notice, saves with a reason, and records it', async () => {
    const { container, router } = await open()
    const region = await edit('Offer lifetime')
    const field = within(region).getByRole('spinbutton', { name: 'Offer lifetime (hours)' })
    await userEvent.clear(field)
    await userEvent.type(field, '96')
    const { dialog, confirm } = await saveWithReason(region)
    expect(within(dialog).getByText('Offer lifetime: 72 hours → 96 hours')).toBeInTheDocument()
    expect(within(dialog).getByText(NOTICE)).toBeInTheDocument()
    await expectNoA11yViolations(container)
    await userEvent.click(confirm)

    const saved = await screen.findByRole('status', { name: 'Saved' })
    expect(saved).toHaveTextContent('changed Offer lifetime')
    expect(await section('Offer lifetime')).toHaveTextContent('96 hours')
    const history = await section('History')
    await waitFor(() =>
      expect(within(history).getAllByRole('listitem')[0]).toHaveTextContent(/^Version 2 · Offer lifetime/),
    )

    await router.navigate('/audit')
    expect(await screen.findByText('Settings changed')).toBeInTheDocument()
  })

  it("puts the server's field error under the field it names", async () => {
    server.use(
      http.put(`${apiBaseUrl}/admin/settings/:section`, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            message: 'Check',
            field_errors: { 'value.0.name': 'That city is not in Nigeria.' },
          },
          { status: 422 },
        ),
      ),
    )
    await open()
    const region = await edit('Cities and areas')
    await userEvent.type(within(region).getByRole('textbox', { name: 'City 1 name' }), 'x')
    const { confirm } = await saveWithReason(region)
    await userEvent.click(confirm)
    expect(await within(region).findByText('That city is not in Nigeria.')).toBeInTheDocument()
    expect(within(region).getByRole('textbox', { name: 'City 1 name' })).toHaveAccessibleDescription(
      /That city is not in Nigeria\./,
    )
  })

  it('keeps the input when another administrator saved first, then saves (Review Focus 1)', async () => {
    await open()
    const region = await edit('Support contacts')
    const email = within(region).getByRole('textbox', { name: 'Support email' })
    await userEvent.clear(email)
    await userEvent.type(email, 'help@nextown.ng')

    // Another administrator changes a different section meanwhile
    const current = (await apiClient.get<PilotSettings>('/admin/settings')).data
    await apiClient.put(
      '/admin/settings/categories',
      {
        value: current.categories.slice(1).concat(current.categories[0]!),
        reason: 'Reorder for the pilot',
        expectedVersion: current.version,
      },
      { headers: idempotencyHeaders(newIdempotencyKey()) },
    )

    const first = await saveWithReason(region)
    await userEvent.click(first.confirm)
    expect(await screen.findByText('Settings changed since you opened them.')).toBeInTheDocument()
    expect(within(region).getByRole('textbox', { name: 'Support email' })).toHaveValue('help@nextown.ng')

    const second = await saveWithReason(region)
    await userEvent.click(second.confirm)
    expect(await screen.findByRole('status', { name: 'Saved' })).toBeInTheDocument()
    expect(await section('Support contacts')).toHaveTextContent('help@nextown.ng')
  })

  it('still warns when the same section changed and the page refetched mid-edit (final review)', async () => {
    const { queryClient } = await open()
    const region = await edit('Support contacts')
    const email = within(region).getByRole('textbox', { name: 'Support email' })
    await userEvent.clear(email)
    await userEvent.type(email, 'help@nextown.ng')

    // Another administrator changes the same section, and this page refetches (e.g. on window focus)
    const current = (await apiClient.get<PilotSettings>('/admin/settings')).data
    await apiClient.put(
      '/admin/settings/supportContacts',
      {
        value: { ...current.supportContacts, hours: 'Every day, 7am–9pm WAT' },
        reason: 'Longer pilot hours',
        expectedVersion: current.version,
      },
      { headers: idempotencyHeaders(newIdempotencyKey()) },
    )
    await queryClient.refetchQueries({ queryKey: ['admin', 'settings'] })

    const { confirm } = await saveWithReason(region)
    await userEvent.click(confirm)
    expect(await screen.findByText('Settings changed since you opened them.')).toBeInTheDocument()
    const saved = (await apiClient.get<PilotSettings>('/admin/settings')).data
    expect(saved.supportContacts.hours).toBe('Every day, 7am–9pm WAT')
  })

  it('ends in success when the answer was lost but the change applied (Review Focus 2)', async () => {
    await open()
    settingsDb.failNextWithTimeoutAfterApply()
    const region = await edit('Reservation duration')
    const field = within(region).getByRole('spinbutton', { name: 'Reservation duration (days)' })
    await userEvent.clear(field)
    await userEvent.type(field, '5')
    const { confirm } = await saveWithReason(region)
    await userEvent.click(confirm)
    expect(await screen.findByRole('status', { name: 'Saved' })).toBeInTheDocument()
    expect(await section('Reservation duration')).toHaveTextContent('5 days')
  })

  it('offers to try again, with the same key, when the change did not apply (Review Focus 2)', async () => {
    await open()
    const keys = settingsKeys()
    server.use(http.put(`${apiBaseUrl}/admin/settings/:section`, () => HttpResponse.error(), { once: true }))
    const region = await edit('Reservation duration')
    const field = within(region).getByRole('spinbutton', { name: 'Reservation duration (days)' })
    await userEvent.clear(field)
    await userEvent.type(field, '5')
    const { dialog, confirm } = await saveWithReason(region)
    await userEvent.click(confirm)
    expect(await within(dialog).findByText("Your change wasn't saved.")).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('status', { name: 'Saved' })).toBeInTheDocument()
    expect(keys).toHaveLength(2)
    expect(keys[1]).toBe(keys[0])
  })

  it('treats names differing only in case or spaces as the same, and keeps places in use (Review Focus 5)', async () => {
    const { container } = await open()
    const region = await edit('Cities and areas')
    expect(within(region).queryByRole('button', { name: 'Remove Yaba' })).not.toBeInTheDocument()
    expect(within(region).getByRole('button', { name: 'Remove Ojota' })).toBeInTheDocument()
    await userEvent.click(within(region).getByRole('button', { name: 'Add area to Lagos' }))
    await userEvent.type(within(region).getByRole('textbox', { name: 'Area 7 in Lagos' }), ' yaba')
    await expectNoA11yViolations(container)
    await userEvent.click(within(region).getByRole('button', { name: 'Save' }))
    expect(await within(region).findByText('yaba is already in the list.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('throws away every edit on Cancel', async () => {
    await open()
    const region = await edit('Categories')
    const phones = within(region).getByRole('textbox', { name: 'Category 7' })
    await userEvent.clear(phones)
    await userEvent.type(phones, 'Mobiles')
    await userEvent.click(within(region).getByRole('button', { name: 'Cancel' }))
    const view = await section('Categories')
    expect(view).toHaveTextContent('Phones')
    expect(view).not.toHaveTextContent('Mobiles')
  })

  it('edits one section at a time', async () => {
    await open()
    await edit('Photo limits')
    expect(screen.getByRole('button', { name: 'Edit Content rules' })).toBeDisabled()
  })

  it('keeps moderators out', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/settings' })
    expect(await screen.findByText("You don't have permission to view this page")).toBeInTheDocument()
  })
})
