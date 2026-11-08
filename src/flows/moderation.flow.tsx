import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { arrowTo, expectFocusInPage, openConsole, switchTo, tabTo, VIEWPORTS } from '@/flows/console'
import { SCENARIO } from '@/mocks/seed'
import { signInAs } from '@/test/auth'

describe.each(VIEWPORTS)('moderation flow at $name', (vp) => {
  beforeEach(async () => {
    await page.viewport(vp.width, vp.height)
  })

  it('queue → case → action → audit, by keyboard', async () => {
    // Signed in first: the budget is for the queue itself, from the page opening to its first page of rows
    await signInAs('moderator')
    const started = performance.now()
    await openConsole('/reports')
    await screen.findByRole('link', { name: SCENARIO.abusiveComment }, { timeout: 5_000 })
    expect(performance.now() - started).toBeLessThan(1_500)

    await tabTo(/^NX-/)
    const row = new RegExp(`^${SCENARIO.abusiveComment}`)
    await arrowTo(row, 'ArrowDown')
    // From the row into its cells, then along to the case cell
    await userEvent.keyboard('{ArrowRight}')
    await arrowTo(row, 'ArrowRight')
    await tabTo(SCENARIO.abusiveComment)
    await userEvent.keyboard('{Enter}')
    const panel = await screen.findByRole('region', { name: 'Case status' }, { timeout: 5_000 })

    await tabTo('Hide content', { max: 150 })
    await userEvent.keyboard('{Enter}')
    const dialog = await screen.findByRole('dialog', { name: 'Hide content' })
    await within(dialog).findByRole('option', { name: 'Abusive language (S3)' }, { timeout: 5_000 })
    await tabTo('Reason')
    await userEvent.keyboard('Abusive')
    expect(within(dialog).getByRole('combobox', { name: 'Reason' })).toHaveDisplayValue('Abusive language (S3)')
    await tabTo('Continue')
    await userEvent.keyboard('{Enter}')
    const confirm = await screen.findByRole('dialog', { name: /\?$/ })
    await tabTo('Hide content')
    expect(confirm).toContainElement(document.activeElement as HTMLElement)
    await userEvent.keyboard('{Enter}')

    const recorded = await screen.findByRole('status', { name: 'Recorded' }, { timeout: 5_000 })
    expect(recorded.textContent).toContain('Tunde Bakare hid comment C-5501')
    expect(within(panel).queryByRole('button', { name: 'Hide content' })).not.toBeInTheDocument()
    expectFocusInPage()

    await switchTo('administrator', '/audit')
    expect(await screen.findAllByText(/C-5501/, {}, { timeout: 5_000 })).not.toHaveLength(0)
  })
})
