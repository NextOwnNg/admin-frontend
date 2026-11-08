import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { casesDb } from '@/mocks/db/cases'
import { SCENARIO } from '@/mocks/seed'
import { signInAs } from '@/test/auth'
import { expectNoA11yViolations } from '@/test/axe'
import { renderWithProviders } from '@/test/utils'

const grid = () => screen.findByRole('grid', { name: 'Reports' })
const bodyRows = async () =>
  within(await grid())
    .getAllByRole('row')
    .slice(1)
const rowFor = async (caseId: string) => {
  const rows = await bodyRows()
  const row = rows.find((r) => within(r).queryByRole('link', { name: caseId }))
  if (!row) throw new Error(`no row for ${caseId}`)
  return row
}

describe('Reports queue (UX-27, ADM-FE-02)', () => {
  it('pins the S1 case first, tinted, with its grouped reports', async () => {
    await signInAs('moderator')
    const { container } = renderWithProviders(routes, { initialPath: '/reports' })

    const [first] = await bodyRows()
    expect(within(first!).getByRole('link', { name: SCENARIO.s1Unassigned })).toHaveAttribute(
      'href',
      `/cases/${SCENARIO.s1Unassigned}`,
    )
    expect(first).toHaveTextContent('S1 Urgent safety')
    expect(first).toHaveTextContent('3 reports')
    expect(first).toHaveTextContent('Threats or harassment')
    expect(first).toHaveClass('bg-danger/5')
    expect(screen.getByText(/^Showing 25 of \d+$/)).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })

  it('names each row by its case, not its severity (accessibility sweep)', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/reports' })
    expect(await screen.findByRole('row', { name: new RegExp(SCENARIO.abusiveComment) })).toBeInTheDocument()
  })

  it('filters by severity through the address, and removes the filter', async () => {
    await signInAs('moderator')
    const { router } = renderWithProviders(routes, { initialPath: '/reports' })
    await grid()

    await userEvent.click(screen.getByRole('button', { name: 'Severity' }))
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'S3 Policy' }))
    await userEvent.keyboard('{Escape}')

    await waitFor(() => expect(new URLSearchParams(router.state.location.search).get('severity')).toBe('S3'))
    await waitFor(async () => {
      const rows = await bodyRows()
      expect(rows.every((r) => r.textContent?.includes('S3 Policy'))).toBe(true)
    })

    await userEvent.click(screen.getByRole('button', { name: 'Remove filter Severity: S3 Policy' }))
    await waitFor(() => expect(router.state.location.search).toBe(''))
  })

  it('ignores junk in the address (Review Focus 4)', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/reports?severity=S9&status=nope&cursor=abc' })

    const [first] = await bodyRows()
    expect(first).toHaveTextContent(SCENARIO.s1Unassigned)
    expect(screen.queryByRole('list', { name: 'Active filters' })).not.toBeInTheDocument()
  })

  it('assigns a case to me', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/reports' })

    await userEvent.click(await screen.findByRole('button', { name: `Actions for ${SCENARIO.s1Unassigned}` }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Assign to me' }))

    await waitFor(async () => expect(await rowFor(SCENARIO.s1Unassigned)).toHaveTextContent('Tunde Bakare'))
  })

  it('assigns a case to a colleague', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/reports' })

    await userEvent.click(await screen.findByRole('button', { name: `Actions for ${SCENARIO.s1Unassigned}` }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Assign to…' }))
    const dialog = await screen.findByRole('dialog', { name: `Assign case ${SCENARIO.s1Unassigned}` })
    await userEvent.selectOptions(within(dialog).getByRole('combobox', { name: 'Assign to' }), 'Bola Akinola')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Assign' }))

    await waitFor(async () => expect(await rowFor(SCENARIO.s1Unassigned)).toHaveTextContent('Bola Akinola'))
  })

  it('warns when someone else changed the case first (ADM-T-05)', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/reports' })
    await grid()
    casesDb.bumpVersion(SCENARIO.s1Unassigned)

    await userEvent.click(screen.getByRole('button', { name: `Actions for ${SCENARIO.s1Unassigned}` }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Assign to me' }))

    expect(await screen.findByText('This case changed since you opened it.')).toBeInTheDocument()
    expect(await rowFor(SCENARIO.s1Unassigned)).toHaveTextContent('Unassigned')
  })

  it('shows a support agent only their cases, with no assignment', async () => {
    await signInAs('support_agent')
    renderWithProviders(routes, { initialPath: '/reports' })

    const rows = await bodyRows()
    expect(rows.every((r) => r.textContent?.includes('Chiamaka Eze'))).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: `Actions for ${SCENARIO.paymentDispute}` }))
    expect(await screen.findByRole('menuitem', { name: 'Open case' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Assign to me' })).not.toBeInTheDocument()
  })

  it('says when reported content was removed instead of describing it', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/reports' })
    expect(await rowFor(SCENARIO.redacted)).toHaveTextContent('Content removed by its author')
  })

  it('offers to clear filters that match nothing', async () => {
    await signInAs('moderator')
    renderWithProviders(routes, { initialPath: '/reports?severity=S1&type=feed_post' })

    expect(await screen.findByRole('heading', { name: 'No reports match these filters' })).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: 'Clear filters' }).at(-1)!)
    expect(await grid()).toBeInTheDocument()
  })
})
