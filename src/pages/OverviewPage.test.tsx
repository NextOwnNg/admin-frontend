import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { signInAs } from '@/test/auth'
import { expectNoA11yViolations } from '@/test/axe'
import { renderWithProviders } from '@/test/utils'

describe('Overview (design §4.1)', () => {
  it('links each severity count to the filtered queue', async () => {
    await signInAs('moderator')
    const { container } = renderWithProviders(routes, { initialPath: '/' })

    const s1 = await screen.findByRole('link', { name: /^S1 Urgent safety \d+ open$/ })
    expect(s1).toHaveAttribute('href', '/reports?severity=S1')
    expect(screen.getByRole('link', { name: /^S4 Help/ })).toHaveAttribute('href', '/reports?severity=S4')
    expect(await screen.findByRole('grid', { name: 'My cases' })).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })

  it('shows a support agent only their own figures', async () => {
    await signInAs('support_agent')
    renderWithProviders(routes, { initialPath: '/' })

    expect(await screen.findByRole('link', { name: 'S1 Urgent safety 0 open' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View all my cases' })).toHaveAttribute('href', '/reports?assignee=me')
    const rows = within(await screen.findByRole('grid', { name: 'My cases' }))
      .getAllByRole('row')
      .slice(1)
    expect(rows.length).toBeGreaterThan(0)
  })

  it('lists the oldest overdue cases', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/' })

    const overdue = await screen.findByRole('region', { name: 'Overdue' })
    expect(within(overdue).getAllByRole('listitem').length).toBeGreaterThan(0)
    expect(within(overdue).getAllByRole('listitem').length).toBeLessThanOrEqual(5)
  })
})
