import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { SCENARIO, TX } from '@/mocks/seed'
import { signInAs } from '@/test/auth'
import { expectNoA11yViolations } from '@/test/axe'
import { renderWithProviders } from '@/test/utils'

const openCase = async (id: string, role: Parameters<typeof signInAs>[0] = 'moderator') => {
  await signInAs(role)
  const view = renderWithProviders(routes, { initialPath: `/cases/${id}` })
  return view
}
const sectionHeadings = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)

describe('Case detail (UX-28, ADM-FE-03)', () => {
  it('lays out a payment dispute in order, linking the transaction through the case', async () => {
    const { container } = await openCase(SCENARIO.paymentDispute)

    expect(
      await screen.findByRole('heading', { level: 1, name: `Case ${SCENARIO.paymentDispute}` }),
    ).toBeInTheDocument()
    const order = ['Summary', 'Parties', 'Evidence', 'Linked transaction', 'Staff notes', 'History']
    expect(sectionHeadings().filter((h) => order.includes(h ?? ''))).toEqual(order)
    expect(screen.getByRole('link', { name: `Transaction ${TX.paymentDispute}` })).toHaveAttribute(
      'href',
      `/transactions/${TX.paymentDispute}?case=${SCENARIO.paymentDispute}`,
    )
    expect(screen.getByText('1 of 2 confirmed')).toBeInTheDocument()
    expect(screen.getByText('Asked both participants for receipts.')).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })

  it('reveals a phone number only after a reason (ADM-T-02)', async () => {
    await openCase(SCENARIO.paymentDispute)

    await userEvent.click(await screen.findByRole('button', { name: 'Reveal phone number of Ada O.' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Reveal' })).toBeDisabled()
    await userEvent.type(within(dialog).getByRole('textbox'), 'Calling to confirm the handover time')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reveal' }))

    expect(await screen.findByText('+2348000001201')).toBeInTheDocument()
    expect(await screen.findByText(/viewed a phone number in case/)).toBeInTheDocument()
  })

  it('masks a revealed value again after leaving the case (Review Focus 1)', async () => {
    const { router } = await openCase(SCENARIO.paymentDispute)
    await userEvent.click(await screen.findByRole('button', { name: 'Reveal phone number of Ada O.' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByRole('textbox'), 'Calling to confirm the handover time')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reveal' }))
    await screen.findByText('+2348000001201')

    await router.navigate('/reports')
    await screen.findByRole('heading', { level: 1, name: 'Reports' })
    await router.navigate(`/cases/${SCENARIO.paymentDispute}`)

    expect(await screen.findByRole('button', { name: 'Reveal phone number of Ada O.' })).toBeInTheDocument()
    expect(screen.queryByText('+2348000001201')).not.toBeInTheDocument()
  })

  it('says when the author removed the reported content, without the text', async () => {
    await openCase(SCENARIO.redacted)
    expect(await screen.findByText('Content removed by its author')).toBeInTheDocument()
  })

  it('says when there is no evidence', async () => {
    await openCase(SCENARIO.noEvidence)
    expect(await screen.findByText('No evidence attached')).toBeInTheDocument()
    expect(screen.getByText('Cheap phones here, check my page!!!')).toBeInTheDocument()
  })

  it('states prior moderation actions as a fact', async () => {
    await openCase(SCENARIO.repeatOffender)
    expect(await screen.findByText('3 previous moderation actions in 90 days')).toBeInTheDocument()
  })

  it('adds a staff note', async () => {
    await openCase(SCENARIO.noEvidence)
    const box = await screen.findByRole('textbox', { name: 'Add a note' })
    await userEvent.type(box, 'Checked the other listings: same comment on six.')
    await userEvent.click(screen.getByRole('button', { name: 'Save note' }))

    expect(await screen.findByText('Checked the other listings: same comment on six.')).toBeInTheDocument()
    expect(screen.getByText('Note saved')).toBeInTheDocument()
    expect(box).toHaveValue('')
  })

  it('shows a support agent nothing of an unassigned case (QA-16)', async () => {
    await openCase(SCENARIO.s1Unassigned, 'support_agent')

    expect(
      await screen.findByRole('heading', { name: "You don't have permission to view this page" }),
    ).toBeInTheDocument()
    const main = screen.getByRole('main')
    expect(main).not.toHaveTextContent(SCENARIO.s1Unassigned)
    expect(main).not.toHaveTextContent('Threatening messages')
  })

  it('treats an unknown case as not found', async () => {
    await openCase('NX-999999')
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})
