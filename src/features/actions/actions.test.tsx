import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ActionDialog } from '@/features/actions/components/ActionDialog'
import { ACTIONS, actionsFor, type ActionContext, type ActionDefinition } from '@/features/actions/definitions'
import { apiClient } from '@/lib/api/client'
import type { AuditEntry } from '@/lib/api/types/audit'
import type { CaseDetail } from '@/lib/api/types/cases'
import type { TransactionDetail } from '@/lib/api/types/transactions'
import type { StaffRole } from '@/lib/copy/labels'
import { casesDb } from '@/mocks/db/cases'
import { SCENARIO, TX } from '@/mocks/seed'
import { signInWithSession } from '@/test/auth'
import { expectNoA11yViolations } from '@/test/axe'
import { renderWithQuery } from '@/test/utils'

const caseContext = async (id: string): Promise<ActionContext> => ({
  kind: 'case',
  caseDetail: (await apiClient.get<CaseDetail>(`/admin/cases/${id}`)).data,
})
const txContext = async (id: string): Promise<ActionContext> => ({
  kind: 'transaction',
  tx: (await apiClient.get<TransactionDetail>(`/admin/transactions/${id}`)).data,
})
const definition = (id: ActionDefinition['id']) => ACTIONS.find((a) => a.id === id)!

async function openDialog(def: ActionDefinition, context: ActionContext) {
  const onDone = vi.fn<(entry: AuditEntry) => void>()
  const view = renderWithQuery(
    <ActionDialog definition={def} context={context} open onOpenChange={() => {}} onDone={onDone} />,
  )
  const dialog = await screen.findByRole('dialog', { name: def.label })
  return { ...view, dialog, onDone }
}

/** Fills every required field except the reason */
async function fillAllButReason(dialog: HTMLElement, def: ActionDefinition) {
  const d = within(dialog)
  if (def.fields.includes('message')) await userEvent.type(d.getByRole('textbox', { name: /Message/ }), 'Please reply.')
  if (def.fields.includes('note')) await userEvent.type(d.getByRole('textbox', { name: /Note/ }), 'Reviewed today.')
  if (def.fields.includes('durationDays'))
    await userEvent.selectOptions(d.getByRole('combobox', { name: 'Duration' }), '7')
  if (def.fields.includes('outcome')) {
    const outcome = d.getByRole('combobox', { name: 'Outcome' })
    const values = within(outcome)
      .getAllByRole('option')
      .map((o) => (o as HTMLOptionElement).value)
    await userEvent.selectOptions(outcome, values.find((v) => v === 'no_violation' || v === 'cancelled') ?? values[1]!)
  }
  if (def.fields.includes('item')) {
    const item = d.getByRole('combobox', { name: 'Item' })
    await userEvent.selectOptions(item, (within(item).getAllByRole('option')[1] as HTMLOptionElement).value)
  }
}

const chooseReason = async (dialog: HTMLElement) => {
  const reason = within(dialog).getByRole('combobox', { name: 'Reason' })
  // Reason codes load from the API
  await waitFor(() => expect(within(reason).getAllByRole('option').length).toBeGreaterThan(1))
  await userEvent.selectOptions(reason, (within(reason).getAllByRole('option')[1] as HTMLOptionElement).value)
}

const contextFor: Record<string, [StaffRole, () => Promise<ActionContext>]> = {
  hide: ['moderator', () => caseContext(SCENARIO.abusiveComment)],
  remove: ['moderator', () => caseContext(SCENARIO.abusiveComment)],
  warn: ['moderator', () => caseContext(SCENARIO.abusiveComment)],
  restrict: ['moderator', () => caseContext(SCENARIO.abusiveComment)],
  lift_restriction: ['moderator', () => caseContext(SCENARIO.abusiveComment)],
  close: ['moderator', () => caseContext(SCENARIO.abusiveComment)],
  resolve: ['administrator', () => txContext(TX.bothConfirmed)],
  release: ['administrator', () => txContext(TX.disputedCancellation)],
}

describe('action definitions (design §4.5)', () => {
  it('gives support agents no sanctions or resolutions', async () => {
    await signInWithSession('support_agent')
    const ids = actionsFor(['support_agent'], await caseContext(SCENARIO.paymentDispute)).map((a) => a.id)
    expect(ids).toEqual(['request_info', 'escalate', 'propose'])
  })

  it('offers a moderator content and account actions on an open case', async () => {
    await signInWithSession('moderator')
    const ids = actionsFor(['moderator'], await caseContext(SCENARIO.abusiveComment)).map((a) => a.id)
    expect(ids).toEqual(expect.arrayContaining(['hide', 'remove', 'warn', 'restrict', 'close', 'escalate']))
    expect(ids).not.toContain('propose')
  })

  it('offers nothing on a closed case', async () => {
    await signInWithSession('moderator')
    expect(actionsFor(['moderator'], await caseContext(SCENARIO.closed))).toEqual([])
  })

  it('names the transaction resolution for a dispute', async () => {
    await signInWithSession('administrator')
    expect(actionsFor(['administrator'], await txContext(TX.disputedCancellation)).map((a) => a.label)).toEqual([
      'Resolve dispute',
      'Release item',
    ])
    expect(actionsFor(['administrator'], await txContext(TX.partialTimeout)).map((a) => a.label)).toEqual([
      'Resolve transaction',
    ])
  })
})

describe('Phase B carry-overs for actions (Phase C design §8)', () => {
  const withStatus = (context: ActionContext, status: CaseDetail['status']): ActionContext =>
    context.kind === 'case' ? { ...context, caseDetail: { ...context.caseDetail, status } } : context

  it('does not offer Escalate on an escalated case or Request information while awaiting it', async () => {
    await signInWithSession('moderator')
    const context = await caseContext(SCENARIO.abusiveComment)
    expect(actionsFor(['moderator'], withStatus(context, 'escalated')).map((a) => a.id)).not.toContain('escalate')
    expect(actionsFor(['moderator'], withStatus(context, 'awaiting_info')).map((a) => a.id)).not.toContain(
      'request_info',
    )
    expect(actionsFor(['moderator'], withStatus(context, 'assigned')).map((a) => a.id)).toEqual(
      expect.arrayContaining(['escalate', 'request_info']),
    )
  })

  it('never hides or removes private messages', () => {
    expect(definition('hide').targetTypes).not.toContain('message')
    expect(definition('remove').targetTypes).not.toContain('message')
  })

  it("doesn't promise a restore when hiding", async () => {
    await signInWithSession('moderator')
    const context = await caseContext(SCENARIO.abusiveComment)
    const text = definition('hide').consequence({
      target: { type: 'comment', id: 'C-5501', label: 'comment C-5501' },
      values: { targetId: 'C-5501' },
      context,
    })
    expect(text).not.toMatch(/restore/i)
  })

  it('records a proposed decision with the outcome in words', async () => {
    await signInWithSession('support_agent')
    const { data } = await apiClient.get<CaseDetail>(`/admin/cases/${SCENARIO.paymentDispute}`)
    const { data: result } = await apiClient.post<{ case: CaseDetail }>(
      `/admin/cases/${SCENARIO.paymentDispute}/actions`,
      {
        action: 'propose',
        target: { type: 'case', id: SCENARIO.paymentDispute },
        outcome: 'no_violation',
        note: 'Both sides agree it was a misunderstanding.',
        expectedVersion: data.version,
      },
      { headers: { 'Idempotency-Key': crypto.randomUUID() } },
    )
    const note = result.case.notes.at(-1)!.body
    expect(note).toContain('No violation')
    expect(note).not.toContain('no_violation')
  })
})

describe('ActionDialog (ADM-FE-05)', () => {
  it.each(ACTIONS.filter((a) => a.reasonKind !== null).map((a) => [a.id, a] as const))(
    'blocks %s until a reason code is chosen (ADM-T-03)',
    async (id, def) => {
      const [role, context] = contextFor[id]!
      await signInWithSession(role)
      const { dialog } = await openDialog(def, await context())
      await fillAllButReason(dialog, def)

      const next = within(dialog).getByRole('button', { name: 'Continue' })
      expect(next).toBeDisabled()
      await chooseReason(dialog)
      await waitFor(() => expect(next).toBeEnabled())
    },
  )

  it('confirms a restriction naming the member, the consequence and the reason', async () => {
    await signInWithSession('moderator')
    const { dialog } = await openDialog(definition('restrict'), await caseContext(SCENARIO.repeatOffender))
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Ada O.' }))
    await userEvent.selectOptions(within(dialog).getByRole('combobox', { name: 'Duration' }), '7')
    await within(dialog).findByRole('option', { name: 'Spam (S3)' })
    await userEvent.selectOptions(within(dialog).getByRole('combobox', { name: 'Reason' }), 'Spam (S3)')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Continue' }))

    const confirm = await screen.findByRole('dialog', { name: 'Restrict Ada O. for 7 days?' })
    expect(confirm).toHaveTextContent("They won't be able to list, offer or comment.")
    expect(confirm).toHaveTextContent('Spam (S3)')
    expect(confirm).toHaveTextContent('Tunde Bakare (Moderator)')
    expect(within(confirm).getByRole('button', { name: 'Restrict account' })).toHaveClass('button--danger')
  })

  it('keeps the input after a conflict and records on a deliberate second submit (Review Focus 2, ADM-T-05)', async () => {
    await signInWithSession('moderator')
    const { dialog, onDone } = await openDialog(definition('hide'), await caseContext(SCENARIO.abusiveComment))
    await userEvent.type(within(dialog).getByRole('textbox', { name: /Note/ }), 'Second look requested')
    await chooseReason(dialog)
    casesDb.bumpVersion(SCENARIO.abusiveComment)

    await userEvent.click(within(dialog).getByRole('button', { name: 'Continue' }))
    await userEvent.click(
      within(await screen.findByRole('dialog', { name: /^Hide/ })).getByRole('button', { name: 'Hide content' }),
    )

    expect(await within(dialog).findByText('This case changed since you opened it.')).toBeInTheDocument()
    expect(within(dialog).getByRole('textbox', { name: /Note/ })).toHaveValue('Second look requested')
    expect(onDone).not.toHaveBeenCalled()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Continue' }))
    await userEvent.click(
      within(await screen.findByRole('dialog', { name: /^Hide/ })).getByRole('button', { name: 'Hide content' }),
    )
    await waitFor(() => expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ action: 'hide' })))
  })

  it('ends in success when the answer was lost but the action applied (Review Focus 3)', async () => {
    await signInWithSession('moderator')
    const { dialog, onDone } = await openDialog(definition('hide'), await caseContext(SCENARIO.abusiveComment))
    await chooseReason(dialog)
    casesDb.failNextWithTimeoutAfterApply(SCENARIO.abusiveComment)

    await userEvent.click(within(dialog).getByRole('button', { name: 'Continue' }))
    await userEvent.click(
      within(await screen.findByRole('dialog', { name: /^Hide/ })).getByRole('button', { name: 'Hide content' }),
    )

    await waitFor(() => expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ action: 'hide' })))
    const { history } = (await apiClient.get<CaseDetail>(`/admin/cases/${SCENARIO.abusiveComment}`)).data
    expect(history.filter((e) => e.action === 'hide')).toHaveLength(1)
  })

  it('never offers completion when the API withholds it (QA-13)', async () => {
    await signInWithSession('administrator')
    const { dialog } = await openDialog(definition('resolve'), await txContext(TX.disputedCancellation))
    const outcome = within(dialog).getByRole('combobox', { name: 'Outcome' })
    expect(within(outcome).queryByRole('option', { name: /Completed/ })).not.toBeInTheDocument()
    expect(dialog).toHaveTextContent("Completed isn't available")
  })

  it('has no accessibility problems', async () => {
    await signInWithSession('moderator')
    const { dialog } = await openDialog(definition('warn'), await caseContext(SCENARIO.abusiveComment))
    await expectNoA11yViolations(dialog)
  })
})
