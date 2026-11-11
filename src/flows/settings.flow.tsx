import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { expectFocusInPage, openConsole, tabTo, VIEWPORTS, waitForElement } from '@/flows/console'

describe.each(VIEWPORTS)('settings flow at $name', (vp) => {
  beforeEach(async () => {
    await page.viewport(vp.width, vp.height)
  })

  it('changes a setting with a reason and finds it in the log, by keyboard', async () => {
    const { router } = await openConsole('/settings', 'administrator')
    await screen.findByRole('region', { name: 'Offer lifetime' }, { timeout: 5_000 })

    await tabTo('Edit Offer lifetime', { max: 120 })
    await userEvent.keyboard('{Enter}')
    const field = await tabTo('Offer lifetime (hours)')
    await userEvent.keyboard('{Backspace}{Backspace}{Backspace}96')
    expect(field).toHaveValue(96)
    await tabTo('Save')
    await userEvent.keyboard('{Enter}')

    const dialog = await screen.findByRole('dialog', { name: /^Save .+\?$/ })
    expect(within(dialog).getByText('Offer lifetime: 72 hours → 96 hours')).toBeInTheDocument()
    await tabTo('Why are you changing this?')
    await userEvent.keyboard('Pilot feedback: offers expire too soon')
    await tabTo('Save change')
    await userEvent.keyboard('{Enter}')

    await screen.findByRole('status', { name: 'Saved' }, { timeout: 5_000 })
    const heading = screen.getByRole('heading', { name: 'Offer lifetime' })
    await waitForElement(() => (document.activeElement === heading ? heading : null))
    expectFocusInPage()
    const history = screen.getByRole('region', { name: 'History' })
    await waitForElement(() =>
      within(history).queryAllByRole('listitem')[0]?.textContent?.startsWith('Version 2 · Offer lifetime')
        ? history
        : null,
    )

    await router.navigate('/audit')
    expect(await screen.findByText('Settings changed', {}, { timeout: 5_000 })).toBeInTheDocument()
  })
})
