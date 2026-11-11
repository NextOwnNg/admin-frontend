import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { arrowTo, expectFocusInPage, openConsole, tabTo, VIEWPORTS } from '@/flows/console'
import { SCENARIO, TX } from '@/mocks/seed'

describe.each(VIEWPORTS)('dispute flow at $name', (vp) => {
  beforeEach(async () => {
    await page.viewport(vp.width, vp.height)
  })

  it('resolves a contested handover from the exception queue, by keyboard', async () => {
    const { router } = await openConsole('/exceptions', 'administrator')
    await screen.findByRole('navigation', { name: 'Exception queues' }, { timeout: 5_000 })

    await tabTo(/^Open disputes/, { max: 120 })
    await userEvent.keyboard('{Enter}')
    await screen.findByRole('grid', { name: 'Open disputes' }, { timeout: 5_000 })

    const row = new RegExp(SCENARIO.disputedCancellation)
    await tabTo(/^NX-/)
    await arrowTo(row, 'ArrowDown')
    await userEvent.keyboard('{ArrowRight}')
    await arrowTo(/^Resolve dispute for/, 'ArrowRight')
    await tabTo(`Resolve dispute for ${SCENARIO.disputedCancellation}`)
    await userEvent.keyboard('{Enter}')

    const panel = await screen.findByRole('region', { name: 'Transaction status' }, { timeout: 5_000 })
    expect(router.state.location.pathname).toBe(`/transactions/${TX.disputedCancellation}`)
    await tabTo('Resolve dispute', { max: 120 })
    await userEvent.keyboard('{Enter}')
    const dialog = await screen.findByRole('dialog', { name: 'Resolve dispute' })

    await tabTo('Outcome')
    await userEvent.keyboard('Resolved by support: c')
    expect(within(dialog).getByRole('combobox', { name: 'Outcome' })).toHaveDisplayValue(
      'Resolved by support: cancelled',
    )
    await within(dialog).findByRole('option', { name: 'No response from a participant' }, { timeout: 5_000 })
    await tabTo('Reason')
    await userEvent.keyboard('No response')
    expect(within(dialog).getByRole('combobox', { name: 'Reason' })).toHaveDisplayValue(
      'No response from a participant',
    )
    await tabTo('Continue')
    await userEvent.keyboard('{Enter}')
    const confirm = await screen.findByRole('dialog', { name: /\?$/ })
    await tabTo('Resolve dispute')
    expect(confirm).toContainElement(document.activeElement as HTMLElement)
    await userEvent.keyboard('{Enter}')

    await screen.findByRole('status', { name: 'Recorded' }, { timeout: 5_000 })
    expect(await within(panel).findByText('Resolved by support: cancelled')).toBeInTheDocument()
    expectFocusInPage()
    // ADM-T-01: nothing lets staff confirm a handover for a participant
    expect(screen.queryByRole('button', { name: /confirm.*(handover|for)/i })).not.toBeInTheDocument()
  })
})
