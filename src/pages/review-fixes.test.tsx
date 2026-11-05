import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders, newIdempotencyKey } from '@/lib/api/idempotency'
import type { CaseActionBody, CaseDetail } from '@/lib/api/types/cases'
import { apiBaseUrl } from '@/lib/env'
import { SCENARIO } from '@/mocks/seed'
import { signInAs } from '@/test/auth'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'

/** Another operator acts through the API while this page is open */
async function elsewhere(caseId: string, body: Omit<CaseActionBody, 'expectedVersion'>) {
  const { data } = await apiClient.get<CaseDetail>(`/admin/cases/${caseId}`)
  await apiClient.post(
    `/admin/cases/${caseId}/actions`,
    { ...body, expectedVersion: data.version },
    {
      headers: idempotencyHeaders(newIdempotencyKey()),
    },
  )
}

async function openAction(caseId: string, action: string) {
  renderWithProviders(routes, { initialPath: `/cases/${caseId}` })
  const panel = await screen.findByRole('region', { name: 'Case status' })
  await userEvent.click(within(panel).getByRole('button', { name: action }))
  return screen.findByRole('dialog', { name: action })
}

async function confirmFrom(dialog: HTMLElement, label: string) {
  await userEvent.click(within(dialog).getByRole('button', { name: 'Continue' }))
  const confirm = await screen.findByRole('dialog', { name: /\?$/ })
  await userEvent.click(within(confirm).getByRole('button', { name: label }))
}

describe('final review fixes', () => {
  it('keeps the dialog when someone else hid the content first, without crashing (ADM-T-05)', async () => {
    await signInAs('moderator')
    const dialog = await openAction(SCENARIO.abusiveComment, 'Hide content')
    const reason = within(dialog).getByRole('combobox', { name: 'Reason' })
    await within(reason).findByRole('option', { name: 'Abusive language (S3)' })
    await userEvent.selectOptions(reason, 'Abusive language (S3)')
    await elsewhere(SCENARIO.abusiveComment, {
      action: 'hide',
      target: { type: 'comment', id: 'C-5501' },
      reasonCode: 'ABUSE',
    })

    await confirmFrom(dialog, 'Hide content')

    const open = await screen.findByRole('dialog', { name: 'Hide content' })
    expect(await within(open).findByText('This case changed since you opened it.')).toBeInTheDocument()
    expect(within(open).getByText(/no longer available/)).toBeInTheDocument()
    expect(within(open).getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  it('keeps the note when the case was closed underneath (ADM-T-05)', async () => {
    await signInAs('moderator')
    const dialog = await openAction(SCENARIO.noEvidence, 'Escalate')
    await userEvent.type(within(dialog).getByRole('textbox', { name: /Note/ }), 'Needs an administrator.')
    await elsewhere(SCENARIO.noEvidence, {
      action: 'close',
      target: { type: 'case', id: SCENARIO.noEvidence },
      outcome: 'no_violation',
      reasonCode: 'NO_VIOLATION',
    })

    await confirmFrom(dialog, 'Escalate')

    const open = await screen.findByRole('dialog', { name: 'Escalate' })
    expect(await within(open).findByText('This case changed since you opened it.')).toBeInTheDocument()
    expect(within(open).getByRole('textbox', { name: /Note/ })).toHaveValue('Needs an administrator.')
  })

  it('says when a lost request was not recorded, and tries again with the same key (Review Focus 3)', async () => {
    await signInAs('moderator')
    const url = `${apiBaseUrl}/admin/cases/${SCENARIO.abusiveComment}/actions`
    const keys: (string | null)[] = []
    server.use(
      http.post(url, ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key'))
      }),
      http.post(url, () => HttpResponse.error(), { once: true }),
    )
    const dialog = await openAction(SCENARIO.abusiveComment, 'Hide content')
    const reason = within(dialog).getByRole('combobox', { name: 'Reason' })
    await within(reason).findByRole('option', { name: 'Abusive language (S3)' })
    await userEvent.selectOptions(reason, 'Abusive language (S3)')
    await confirmFrom(dialog, 'Hide content')

    const open = await screen.findByRole('dialog', { name: 'Hide content' })
    expect(await within(open).findByText("We couldn't confirm this was recorded.")).toBeInTheDocument()
    await userEvent.click(within(open).getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('status', { name: 'Recorded' })).toHaveTextContent('hid comment C-5501')
    expect(keys).toHaveLength(2)
    expect(keys[1]).toBe(keys[0])
    const { data } = await apiClient.get<CaseDetail>(`/admin/cases/${SCENARIO.abusiveComment}`)
    expect(data.history.filter((e) => e.action === 'hide')).toHaveLength(1)
  })

  it('starts paging again when the sort changes', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/reports' })
    await userEvent.click(await screen.findByRole('button', { name: 'Next page' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled())

    await userEvent.click(screen.getByRole('columnheader', { name: /Age/ }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled())
  })

  it('says hidden content was hidden in the queue and the overview, not what it said', async () => {
    await signInAs('moderator')
    await elsewhere(SCENARIO.overdue, {
      action: 'hide',
      target: { type: 'listing', id: 'L-4388' },
      reasonCode: 'MISREPRESENTED',
    })

    const { router } = renderWithProviders(routes, { initialPath: '/' })
    const overdue = await screen.findByRole('region', { name: 'Overdue' })
    const item = within(overdue)
      .getAllByRole('listitem')
      .find((li) => li.textContent?.includes(SCENARIO.overdue))!
    expect(item).toHaveTextContent('Content hidden by moderation')

    await router.navigate('/reports')
    const grid = await screen.findByRole('grid', { name: 'Reports' })
    const row = within(grid)
      .getAllByRole('row')
      .find((r) => r.textContent?.includes(SCENARIO.overdue))!
    expect(row).toHaveTextContent('Content hidden by moderation')
  })
})
