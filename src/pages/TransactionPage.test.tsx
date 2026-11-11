import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import type { StaffRole } from '@/lib/copy/labels'
import { PRICE_EDITED_LISTING_NOW_KOBO, SCENARIO, TX } from '@/mocks/seed'
import { formatNaira } from '@/lib/money/money'
import { signInAs } from '@/test/auth'
import { expectNoA11yViolations } from '@/test/axe'
import { renderWithProviders } from '@/test/utils'

async function openTx(path: string, role: StaffRole = 'administrator') {
  await signInAs(role)
  const view = renderWithProviders(routes, { initialPath: path })
  await screen.findByRole('heading', { level: 1, name: /^Transaction/ })
  return view
}

const panel = () => screen.getByRole('region', { name: 'Transaction status' })

async function outcomesFor(label: string) {
  await userEvent.click(within(panel()).getByRole('button', { name: label }))
  const dialog = await screen.findByRole('dialog', { name: label })
  const outcome = within(dialog).getByRole('combobox', { name: 'Outcome' })
  return {
    dialog,
    labels: within(outcome)
      .getAllByRole('option')
      .map((o) => o.textContent),
  }
}

describe('Transaction detail (UX-28, ADM-FE-04)', () => {
  it('shows the agreement as accepted, not the listing as edited since (QA-08)', async () => {
    const { container } = await openTx(`/transactions/${TX.priceEditedAfterAcceptance}`)

    expect(screen.getByText('Agreement at acceptance · read-only')).toBeInTheDocument()
    const snapshot = screen.getByRole('region', { name: 'Agreement snapshot' })
    expect(snapshot).toHaveTextContent('Offerer pays owner ₦50,000')
    expect(document.body).not.toHaveTextContent(formatNaira(PRICE_EDITED_LISTING_NOW_KOBO))
    await expectNoA11yViolations(container)
  })

  it('never offers completion on a disputed cancellation (QA-13)', async () => {
    await openTx(`/transactions/${TX.disputedCancellation}`)
    const { labels } = await outcomesFor('Resolve dispute')
    expect(labels.join()).not.toMatch(/Completed/)
  })

  it('cancels a 0 of 2 expiry and releases its items (QA-14)', async () => {
    await openTx(`/transactions/${TX.expiredZeroOfTwo}`)
    const { dialog } = await outcomesFor('Resolve transaction')
    await userEvent.selectOptions(within(dialog).getByRole('combobox', { name: 'Outcome' }), 'cancelled')
    await within(dialog).findByRole('option', { name: 'No response from a participant' })
    await userEvent.selectOptions(within(dialog).getByRole('combobox', { name: 'Reason' }), 'NO_RESPONSE')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Continue' }))
    const confirm = await screen.findByRole('dialog', { name: /\?$/ })
    await userEvent.click(within(confirm).getByRole('button', { name: 'Resolve transaction' }))

    const recorded = await screen.findByRole('status', { name: 'Recorded' })
    expect(recorded).toHaveTextContent('resolved transaction')
    await waitFor(() => expect(recorded).toHaveFocus())
    const reservations = screen.getByRole('region', { name: 'Reservations' })
    await waitFor(() => expect(within(reservations).getAllByText(/^Released/)).toHaveLength(2))
    expect(within(panel()).getByText('Resolved by support: cancelled')).toBeInTheDocument()
  })

  it('keeps a 1 of 2 timeout for review, never releasing on its own (QA-15)', async () => {
    await openTx(`/transactions/${TX.partialTimeout}`)
    expect(screen.getByText('1 of 2 confirmed')).toBeInTheDocument()
    expect(within(panel()).getByText('Partial confirmation expired')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Release/ })).not.toBeInTheDocument()
    const { labels } = await outcomesFor('Resolve transaction')
    expect(labels.join()).not.toMatch(/Completed/)
  })

  it('offers completion when both confirmed and the API allows it', async () => {
    await openTx(`/transactions/${TX.bothConfirmed}`)
    const { labels } = await outcomesFor('Resolve dispute')
    expect(labels).toContain('Completed (both participants confirmed)')
  })

  it('withholds completion when the API does, even with both confirmations (Review Focus 5)', async () => {
    await openTx(`/transactions/${TX.bothConfirmedBlocked}`)
    expect(screen.getByText('2 of 2 confirmed')).toBeInTheDocument()
    const { labels } = await outcomesFor('Resolve dispute')
    expect(labels.join()).not.toMatch(/Completed/)
  })

  it('releases one item the API marks releasable', async () => {
    await openTx(`/transactions/${TX.disputedCancellation}`)
    expect(within(panel()).getAllByRole('button', { name: /^Release/ })).toHaveLength(1)
  })

  it('has no control that confirms for a participant (ADM-T-01)', async () => {
    await openTx(`/transactions/${TX.paymentDispute}`)
    const controls = [...screen.getAllByRole('button'), ...screen.getAllByRole('link')]
    expect(
      controls.filter(
        (c) => /confirm/i.test(c.textContent ?? '') || /confirm/i.test(c.getAttribute('aria-label') ?? ''),
      ),
    ).toEqual([])
  })

  it('opens for a support agent only through their case', async () => {
    await signInAs('support_agent')
    renderWithProviders(routes, { initialPath: `/transactions/${TX.paymentDispute}` })
    expect(
      await screen.findByRole('heading', { name: "You don't have permission to view this page" }),
    ).toBeInTheDocument()

    await openTx(`/transactions/${TX.paymentDispute}?case=${SCENARIO.paymentDispute}`, 'support_agent')
    expect(screen.queryByRole('button', { name: /^Resolve/ })).not.toBeInTheDocument()
    expect(within(panel()).getByRole('link', { name: `Case ${SCENARIO.paymentDispute}` })).toBeInTheDocument()
  })

  it('reveals the handover venue with a reason, through the case', async () => {
    await openTx(`/transactions/${TX.paymentDispute}?case=${SCENARIO.paymentDispute}`, 'support_agent')
    await userEvent.click(within(panel()).getByRole('button', { name: 'Reveal handover venue' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByRole('textbox'), 'Checking where they met')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reveal' }))
    expect(await within(panel()).findByText(/Lekki Phase 1/)).toBeInTheDocument()
  })
})
