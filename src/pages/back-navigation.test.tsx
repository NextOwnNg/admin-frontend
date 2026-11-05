import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import type { StaffRole } from '@/lib/copy/labels'
import { REC } from '@/mocks/records-seed'
import { SCENARIO, TX } from '@/mocks/seed'
import { signInAs } from '@/test/auth'
import { renderWithProviders } from '@/test/utils'

async function start(path: string, role: StaffRole = 'moderator') {
  await signInAs(role)
  return renderWithProviders(routes, { initialPath: path })
}
const back = async () => userEvent.click(await screen.findByRole('button', { name: 'Back' }))

describe('Back on detail pages', () => {
  it('returns to the page the operator came from', async () => {
    const { router } = await start('/reports')
    await screen.findByRole('grid', { name: 'Reports' })
    await router.navigate(`/cases/${SCENARIO.paymentDispute}`)
    await screen.findByRole('heading', { level: 1, name: new RegExp(SCENARIO.paymentDispute) })
    await back()
    await waitFor(() => expect(router.state.location.pathname).toBe('/reports'))
  })

  it('goes back along the record chain one step at a time', async () => {
    const { router } = await start(`/records/listings/${REC.chain.listing}`)
    await screen.findByText(`Listing · ${REC.chain.listing}`)
    await router.navigate(`/records/items/${REC.chain.item}`)
    await screen.findByText(`Item · ${REC.chain.item}`)
    await back()
    await waitFor(() => expect(router.state.location.pathname).toBe(`/records/listings/${REC.chain.listing}`))
  })

  it.each([
    [`/cases/${SCENARIO.paymentDispute}`, 'moderator', '/reports'],
    [`/records/users/${REC.chain.member}`, 'moderator', '/records/users'],
    [`/records/offers/${REC.multiVersionOffer}`, 'moderator', '/records/offers'],
    [`/transactions/${TX.paymentDispute}`, 'moderator', '/records/transactions'],
    [
      `/transactions/${TX.paymentDispute}?case=${SCENARIO.paymentDispute}`,
      'support_agent',
      `/cases/${SCENARIO.paymentDispute}`,
    ],
  ] as const)('opened directly at %s (%s), goes to %s', async (path, role, parent) => {
    const { router } = await start(path, role)
    await back()
    await waitFor(() => expect(router.state.location.pathname).toBe(parent))
  })
})
