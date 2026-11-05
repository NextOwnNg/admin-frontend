import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { REC } from '@/mocks/records-seed'
import { signInAs } from '@/test/auth'
import { expectNoA11yViolations } from '@/test/axe'
import { renderWithProviders } from '@/test/utils'

const { chain } = REC
const heading = (name: string | RegExp) => screen.findByRole('heading', { level: 1, name })
const follow = async (name: string | RegExp, region = 'Linked records') =>
  userEvent.click(within(await screen.findByRole('region', { name: region })).getByRole('link', { name }))

describe('the chain, through links only (ADM-FE-07)', () => {
  it('walks member → item → listing → offer → transaction → case and back to the member', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: `/records/users/${chain.member}` })
    await heading('Kunle A.')

    await follow(`MacBook Air 2020 ${chain.item}`)
    await heading('MacBook Air 2020')
    expect(screen.getByText(`Item · ${chain.item}`)).toBeInTheDocument()

    await follow(`MacBook Air 2020 ${chain.listing}`)
    expect(await screen.findByText(`Listing · ${chain.listing}`)).toBeInTheDocument()

    await follow(new RegExp(chain.offer))
    await heading(/^Offer on MacBook Air 2020/)

    await follow(new RegExp(chain.transaction))
    await heading(`Transaction ${chain.transaction}`)

    await follow(`Case ${chain.case}`, 'Transaction status')
    await heading(new RegExp(chain.case))

    await follow('Kunle A.', 'Parties')
    await heading('Kunle A.')
  })

  it("shows a moderator the transaction's linked records, with items linked", async () => {
    await signInAs('moderator')
    const { container } = renderWithProviders(routes, { initialPath: `/transactions/${chain.transaction}` })
    await heading(`Transaction ${chain.transaction}`)
    const linked = await screen.findByRole('region', { name: 'Linked records' })
    expect(within(linked).getByRole('link', { name: new RegExp(chain.offer) })).toHaveAttribute(
      'href',
      `/records/offers/${chain.offer}`,
    )
    const snapshot = screen.getByRole('region', { name: 'Agreement snapshot' })
    expect(within(snapshot).getByRole('link', { name: /MacBook Air 2020/ })).toHaveAttribute(
      'href',
      `/records/items/${chain.item}`,
    )
    await expectNoA11yViolations(container)
  })

  it('shows a support agent no record links on the transaction', async () => {
    await signInAs('support_agent')
    renderWithProviders(routes, { initialPath: `/transactions/${chain.transaction}?case=${chain.case}` })
    await heading(`Transaction ${chain.transaction}`)
    expect(screen.queryByRole('region', { name: 'Linked records' })).not.toBeInTheDocument()
    const snapshot = screen.getByRole('region', { name: 'Agreement snapshot' })
    expect(within(snapshot).queryByRole('link')).not.toBeInTheDocument()
  })
})
