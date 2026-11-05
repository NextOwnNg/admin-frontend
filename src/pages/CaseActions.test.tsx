import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { apiClient } from '@/lib/api/client'
import type { CaseDetail } from '@/lib/api/types/cases'
import type { StaffRole } from '@/lib/copy/labels'
import { casesDb } from '@/mocks/db/cases'
import { SCENARIO } from '@/mocks/seed'
import { signInAs } from '@/test/auth'
import { renderWithProviders } from '@/test/utils'

async function openCase(id: string, role: StaffRole = 'moderator') {
  await signInAs(role)
  renderWithProviders(routes, { initialPath: `/cases/${id}` })
  return screen.findByRole('region', { name: 'Case status' })
}

async function act(
  panel: HTMLElement,
  action: string,
  fill: (dialog: HTMLElement) => Promise<void>,
  confirmLabel = action,
) {
  await userEvent.click(within(panel).getByRole('button', { name: action }))
  const dialog = await screen.findByRole('dialog', { name: action })
  await fill(dialog)
  await userEvent.click(within(dialog).getByRole('button', { name: 'Continue' }))
  const confirm = await screen.findByRole('dialog', { name: /\?$/ })
  await userEvent.click(within(confirm).getByRole('button', { name: confirmLabel }))
}

const pickReason = async (dialog: HTMLElement, label: string) => {
  await within(dialog).findByRole('option', { name: label })
  await userEvent.selectOptions(within(dialog).getByRole('combobox', { name: 'Reason' }), label)
}

describe('case actions (ADM-FE-05)', () => {
  it('hides an abusive comment with a reason and shows the audit entry (QA-19)', async () => {
    const panel = await openCase(SCENARIO.abusiveComment)
    await act(panel, 'Hide content', (d) => pickReason(d, 'Abusive language (S3)'))

    const recorded = await screen.findByRole('status', { name: 'Recorded' })
    expect(recorded).toHaveTextContent('Tunde Bakare hid comment C-5501')
    expect(recorded).toHaveTextContent('Abusive language')
    expect(await screen.findByText('Content hidden by moderation')).toBeInTheDocument()
    expect(screen.queryByText(/Useless seller/)).not.toBeInTheDocument()
  })

  it('stops a second moderator from overwriting (ADM-T-05)', async () => {
    const panel = await openCase(SCENARIO.abusiveComment)
    casesDb.bumpVersion(SCENARIO.abusiveComment)
    await act(panel, 'Hide content', (d) => pickReason(d, 'Abusive language (S3)'))

    const dialog = await screen.findByRole('dialog', { name: 'Hide content' })
    expect(await within(dialog).findByText('This case changed since you opened it.')).toBeInTheDocument()
    const { data } = await apiClient.get<CaseDetail>(`/admin/cases/${SCENARIO.abusiveComment}`)
    expect(data.history.some((e) => e.action === 'hide')).toBe(false)
    expect(data.content?.redaction).toBeNull()
  })

  it('closes a report and shows the decision instead of actions', async () => {
    const panel = await openCase(SCENARIO.noEvidence)
    await act(panel, 'Close report', async (d) => {
      await userEvent.selectOptions(within(d).getByRole('combobox', { name: 'Outcome' }), 'action_taken')
      await pickReason(d, 'Spam (S3)')
    })

    await waitFor(() => expect(within(panel).getByText('Closed')).toBeInTheDocument())
    expect(within(panel).getByText('Action taken')).toBeInTheDocument()
    expect(within(panel).queryByRole('button', { name: 'Close report' })).not.toBeInTheDocument()
  })

  it('gives a support agent only request, escalate and propose', async () => {
    const panel = await openCase(SCENARIO.paymentDispute, 'support_agent')
    const actions = within(within(panel).getByRole('group', { name: 'Actions' }))
      .getAllByRole('button')
      .map((b) => b.textContent)
    expect(actions).toEqual(['Request information', 'Escalate', 'Record decision'])
    expect(within(panel).queryByRole('button', { name: 'Assign to me' })).not.toBeInTheDocument()
  })

  it('escalates a case', async () => {
    const panel = await openCase(SCENARIO.paymentDispute, 'support_agent')
    await act(panel, 'Escalate', async (d) => {
      await userEvent.type(
        within(d).getByRole('textbox', { name: /Note/ }),
        'Both sides claim payment; needs an administrator.',
      )
    })

    await waitFor(() => expect(within(panel).getByText('Escalated')).toBeInTheDocument())
  })

  it('lets a moderator take the case from the panel', async () => {
    const panel = await openCase(SCENARIO.s1Unassigned)
    await userEvent.click(within(panel).getByRole('button', { name: 'Assign to me' }))
    await waitFor(() => expect(within(panel).getByText('Tunde Bakare')).toBeInTheDocument())
    expect(within(panel).getByText('Assigned')).toBeInTheDocument()
  })
})
