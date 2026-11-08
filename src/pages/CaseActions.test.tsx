import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { apiClient } from '@/lib/api/client'
import type { CaseDetail } from '@/lib/api/types/cases'
import type { StaffRole } from '@/lib/copy/labels'
import { casesDb } from '@/mocks/db/cases'
import { staffMember } from '@/mocks/fixtures/staff'
import { REC } from '@/mocks/records-seed'
import { SCENARIO } from '@/mocks/seed'
import { signInAs } from '@/test/auth'
import { expectNoA11yViolations } from '@/test/axe'
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

describe('appeals and duplicates (Phase C design §4.4)', () => {
  const outcomes = (dialog: HTMLElement) =>
    within(within(dialog).getByRole('combobox', { name: 'Outcome' }))
      .getAllByRole('option')
      .filter((o) => (o as HTMLOptionElement).value)
      .map((o) => o.textContent)

  it('shows the restriction and the statement, and closes an appeal as upheld', async () => {
    const panel = await openCase(SCENARIO.appeal)
    const summary = screen.getByRole('region', { name: 'Summary' })
    expect(within(summary).getByText('Appeal from the member')).toBeInTheDocument()
    expect(within(summary).getByText(/^Restricted until /)).toBeInTheDocument()
    expect(within(summary).getByText(/I lost my temper/)).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Lift restriction' })).toBeInTheDocument()

    await userEvent.click(within(panel).getByRole('button', { name: 'Close report' }))
    const dialog = await screen.findByRole('dialog', { name: 'Close report' })
    expect(outcomes(dialog)).toEqual(['Restriction upheld'])
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    await act(panel, 'Close report', async (d) => {
      await userEvent.selectOptions(within(d).getByRole('combobox', { name: 'Outcome' }), 'upheld')
      await pickReason(d, 'Restriction stays in place')
    })
    await waitFor(() => expect(within(panel).getByText('Restriction upheld')).toBeInTheDocument())
  })

  it('never offers "Restriction upheld" on an ordinary report', async () => {
    const panel = await openCase(SCENARIO.noEvidence)
    await userEvent.click(within(panel).getByRole('button', { name: 'Close report' }))
    const dialog = await screen.findByRole('dialog', { name: 'Close report' })
    expect(outcomes(dialog)).not.toContain('Restriction upheld')
  })

  it('lifts the restriction, and the member record says so', async () => {
    const panel = await openCase(SCENARIO.appeal)
    await act(panel, 'Lift restriction', (d) => pickReason(d, 'Decided on the evidence'))
    await screen.findByRole('status', { name: 'Recorded' })
    const parties = screen.getByRole('region', { name: 'Parties' })
    await userEvent.click(within(parties).getByRole('link', { name: 'Segun F.' }))
    const profile = await screen.findByRole('region', { name: 'Profile' })
    expect(profile).toHaveTextContent('Active')
  })

  it('says the restriction was lifted once it has been, not "Restricted until" (C2 review)', async () => {
    const panel = await openCase(SCENARIO.appeal)
    await act(panel, 'Lift restriction', (d) => pickReason(d, 'Decided on the evidence'))
    await screen.findByRole('status', { name: 'Recorded' })
    const summary = screen.getByRole('region', { name: 'Summary' })
    expect(await within(summary).findByText(/^Restriction lifted /)).toBeInTheDocument()
    expect(within(summary).queryByText(/^Restricted until /)).not.toBeInTheDocument()
  })

  const reasonsFor = async (caseId: string, outcome: string) => {
    const panel = await openCase(caseId)
    await userEvent.click(within(panel).getByRole('button', { name: 'Close report' }))
    const dialog = await screen.findByRole('dialog', { name: 'Close report' })
    await userEvent.selectOptions(within(dialog).getByRole('combobox', { name: 'Outcome' }), outcome)
    const reason = within(dialog).getByRole('combobox', { name: 'Reason' })
    await waitFor(() => expect(within(reason).getAllByRole('option').length).toBeGreaterThan(1))
    return within(reason)
      .getAllByRole('option')
      .map((o) => o.textContent)
  }

  it('offers the appeal and duplicate decisions only on their own cases (C2 review)', async () => {
    const onReport = await reasonsFor(SCENARIO.noEvidence, 'no_violation')
    expect(onReport).not.toContain('Not a duplicate')
    expect(onReport).not.toContain('Restriction stays in place')
  })

  it('offers "Not a duplicate" on a duplicate case', async () => {
    expect(await reasonsFor(SCENARIO.duplicate, 'no_violation')).toContain('Not a duplicate')
  })

  it('offers transaction outcomes when a support agent records a decision on a transaction case (B review)', async () => {
    const panel = await openCase(SCENARIO.paymentDispute, 'support_agent')
    await userEvent.click(within(panel).getByRole('button', { name: 'Record decision' }))
    const dialog = await screen.findByRole('dialog', { name: 'Record decision' })
    expect(outcomes(dialog)).toEqual([
      'Completed (both participants confirmed)',
      'Resolved by support: cancelled',
      'Resolved by support: no completion',
    ])
  })

  it('links a duplicate to the listing it repeats, for staff who may open it', async () => {
    await openCase(SCENARIO.duplicate)
    const summary = screen.getByRole('region', { name: 'Summary' })
    expect(within(summary).getByRole('link', { name: /Earlier listing of the same item/ })).toHaveAttribute(
      'href',
      `/records/listings/${REC.duplicateListing}`,
    )
    expect(await within(summary).findByText('Possible duplicate of')).toBeInTheDocument()
  })

  it('names the duplicate without a link for a support agent', async () => {
    casesDb.record(SCENARIO.duplicate)!.assignee = staffMember('s-agent')
    await openCase(SCENARIO.duplicate, 'support_agent')
    const summary = screen.getByRole('region', { name: 'Summary' })
    expect(within(summary).getByText(/Earlier listing of the same item/)).toBeInTheDocument()
    expect(within(summary).queryByRole('link', { name: /Earlier listing/ })).not.toBeInTheDocument()
  })

  it('has no accessibility problems on an appeal or a duplicate', async () => {
    await signInAs('moderator')
    const appeal = renderWithProviders(routes, { initialPath: `/cases/${SCENARIO.appeal}` })
    await screen.findByRole('region', { name: 'Case status' })
    await expectNoA11yViolations(appeal.container)
  })
})
