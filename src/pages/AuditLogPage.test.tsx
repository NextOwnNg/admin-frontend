import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders, newIdempotencyKey } from '@/lib/api/idempotency'
import type { CaseDetail } from '@/lib/api/types/cases'
import { SCENARIO } from '@/mocks/seed'
import { signInAs } from '@/test/auth'
import { expectNoA11yViolations } from '@/test/axe'
import { renderWithProviders } from '@/test/utils'

async function hideAbusiveComment() {
  const { data } = await apiClient.get<CaseDetail>(`/admin/cases/${SCENARIO.abusiveComment}`)
  await apiClient.post(
    `/admin/cases/${SCENARIO.abusiveComment}/actions`,
    { action: 'hide', target: { type: 'comment', id: 'C-5501' }, reasonCode: 'ABUSE', expectedVersion: data.version },
    { headers: idempotencyHeaders(newIdempotencyKey()) },
  )
}

const rows = async () =>
  within(await screen.findByRole('grid', { name: 'Moderation log' }))
    .getAllByRole('row')
    .slice(1)

describe('Moderation log (design §4.6)', () => {
  it('lists actions newest first and expands to before and after', async () => {
    await signInAs('administrator')
    await hideAbusiveComment()
    const { container } = renderWithProviders(routes, { initialPath: '/audit' })

    const [first] = await rows()
    expect(first).toHaveTextContent('Ngozi Adeyemi')
    expect(first).toHaveTextContent('Content hidden')
    await waitFor(() => expect(first).toHaveTextContent('Abusive language'))
    expect(within(first!).queryByText('visible')).not.toBeInTheDocument()
    expect(within(first!).getByRole('link', { name: `Case ${SCENARIO.abusiveComment}` })).toHaveAttribute(
      'href',
      `/cases/${SCENARIO.abusiveComment}`,
    )
    await userEvent.click(within(first!).getByRole('button', { name: 'Show details' }))
    expect(within(first!).getByText('visible')).toBeInTheDocument()
    expect(within(first!).getByText('hidden')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete|edit/i })).not.toBeInTheDocument()
    await expectNoA11yViolations(container)
  })

  it('filters by actor through the address', async () => {
    await signInAs('administrator')
    await hideAbusiveComment()
    const { router } = renderWithProviders(routes, { initialPath: '/audit' })
    await rows()

    const actor = screen.getByRole('combobox', { name: 'Actor' })
    await within(actor).findByRole('option', { name: 'Ngozi Adeyemi' })
    await userEvent.selectOptions(actor, 'Ngozi Adeyemi')

    await waitFor(() => expect(new URLSearchParams(router.state.location.search).get('actor')).toBe('s-admin'))
    await waitFor(async () => {
      const all = await rows()
      expect(all.every((r) => r.textContent?.includes('Ngozi Adeyemi'))).toBe(true)
    })
  })

  it('is for administrators only', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/audit' })
    expect(
      await screen.findByRole('heading', { name: "You don't have permission to view this page" }),
    ).toBeInTheDocument()
  })
})

describe('settings changes in the log (Phase C design §4.5)', () => {
  it('filters to settings and links each change to the settings page', async () => {
    await signInAs('administrator')
    const { data } = await apiClient.get<{ version: number }>('/admin/settings')
    await apiClient.put(
      '/admin/settings/offerLifetimeHours',
      { value: 96, reason: 'Pilot feedback on offer timing', expectedVersion: data.version },
      { headers: idempotencyHeaders(newIdempotencyKey()) },
    )
    renderWithProviders(routes, { initialPath: '/audit' })
    await rows()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Target type' }), 'Settings')
    await waitFor(async () => expect(await rows()).toHaveLength(1))
    const [row] = await rows()
    expect(row).toHaveTextContent('Settings changed')
    expect(within(row!).getByRole('link', { name: 'Offer lifetime' })).toHaveAttribute('href', '/settings')
  })
})
