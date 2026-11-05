import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders, newIdempotencyKey } from '@/lib/api/idempotency'
import type { CaseActionBody, CaseDetail } from '@/lib/api/types/cases'
import { apiBaseUrl } from '@/lib/env'
import { SCENARIO, TX } from '@/mocks/seed'
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

/** Every request the console sends to the mock API during a test */
function recordRequests() {
  const requests: Request[] = []
  const listener = ({ request }: { request: Request }) => void requests.push(request.clone())
  server.events.on('request:start', listener)
  return requests
}

describe('Phase B carry-overs (Phase C design §8)', () => {
  it('resets the case page when only the id changes', async () => {
    await signInAs('moderator')
    // The second case is already cached, so nothing unmounts while it loads
    const { router } = renderWithProviders(routes, { initialPath: `/cases/${SCENARIO.partialTimeout}` })
    await screen.findByRole('heading', { level: 1, name: new RegExp(SCENARIO.partialTimeout) })
    await router.navigate(`/cases/${SCENARIO.paymentDispute}`)
    await screen.findByRole('heading', { level: 1, name: new RegExp(SCENARIO.paymentDispute) })
    await userEvent.type(screen.getByRole('textbox', { name: /Add a note/ }), 'Half-written thought')

    await router.navigate(`/cases/${SCENARIO.partialTimeout}`)

    await screen.findByRole('heading', { level: 1, name: new RegExp(SCENARIO.partialTimeout) })
    expect(screen.getByRole('textbox', { name: /Add a note/ })).toHaveValue('')
  })

  it('keys the transaction cache by the case it was opened through', async () => {
    await signInAs('support_agent')
    const { router } = renderWithProviders(routes, {
      initialPath: `/transactions/${TX.paymentDispute}?case=${SCENARIO.paymentDispute}`,
    })
    await screen.findByRole('heading', { level: 1, name: new RegExp(TX.paymentDispute) })

    await router.navigate(`/transactions/${TX.paymentDispute}`)

    expect(await screen.findByText("You don't have permission to view this page")).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: new RegExp(TX.paymentDispute) })).not.toBeInTheDocument()
  })

  it('drops an unknown assignee and a malformed cursor from the queue address', async () => {
    await signInAs('moderator')
    const requests = recordRequests()
    renderWithProviders(routes, { initialPath: '/reports?assignee=s-ghost&cursor=%3Cx%3E' })

    await waitFor(() => {
      const last = new URL(
        requests.filter((r) => r.url.includes('/admin/cases?') || r.url.endsWith('/admin/cases')).at(-1)!.url,
      )
      expect(last.searchParams.has('assignee')).toBe(false)
      expect(last.searchParams.has('cursor')).toBe(false)
    })
    expect(screen.queryByRole('list', { name: 'Active filters' })).not.toBeInTheDocument()
  })

  it('filters the log by WAT calendar days', async () => {
    await signInAs('administrator')
    const requests = recordRequests()
    renderWithProviders(routes, { initialPath: '/audit?from=2026-11-05&to=2026-11-05' })
    await waitFor(() => {
      const audit = requests.find((r) => r.url.includes('/admin/audit'))
      expect(audit).toBeDefined()
      const params = new URL(audit!.url).searchParams
      expect(params.get('from')).toBe('2026-11-04T23:00:00.000Z')
      expect(params.get('to')).toBe('2026-11-05T22:59:59.999Z')
    })
  })

  it('retries an unchanged note with the same key and an edited one with a new key', async () => {
    await signInAs('moderator')
    const keys: string[] = []
    let failed = false
    server.use(
      http.post(`${apiBaseUrl}/admin/cases/:id/notes`, ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key') ?? '')
        if (!failed) {
          failed = true
          return HttpResponse.json({ code: 'INTERNAL', message: 'Something went wrong' }, { status: 500 })
        }
        return undefined
      }),
    )
    renderWithProviders(routes, { initialPath: `/cases/${SCENARIO.paymentDispute}` })
    const note = await screen.findByRole('textbox', { name: /Add a note/ })
    await userEvent.type(note, 'Called both members')
    await userEvent.click(screen.getByRole('button', { name: 'Save note' }))
    await waitFor(() => expect(keys).toHaveLength(1))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save note' })).toBeEnabled())

    // A second failure keeps the same intent and key
    failed = false
    await userEvent.click(screen.getByRole('button', { name: 'Save note' }))
    await waitFor(() => expect(keys).toHaveLength(2))
    expect(keys[1]).toBe(keys[0])

    await waitFor(() => expect(screen.getByRole('button', { name: 'Save note' })).toBeEnabled())
    await userEvent.type(note, ' twice')
    await userEvent.click(screen.getByRole('button', { name: 'Save note' }))
    await waitFor(() => expect(keys).toHaveLength(3))
    expect(keys[2]).not.toBe(keys[0])
  })
})
