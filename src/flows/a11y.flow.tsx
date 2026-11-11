import { screen, within } from '@testing-library/react'
import axe from 'axe-core'
import { describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { openConsole, tabTo, VIEWPORTS } from '@/flows/console'
import type { StaffRole } from '@/lib/copy/labels'
import { ROUTE_ROLES, type RouteId } from '@/lib/permissions/permissions'
import { SCENARIO } from '@/mocks/seed'

/** The flow sizes plus 768, the narrowest the console supports (design §5) */
const SWEEP_VIEWPORTS = [...VIEWPORTS, { name: '768', width: 768, height: 1024 }] as const

const PAGES: [RouteId, string][] = [
  ['overview', '/'],
  ['reports', '/reports'],
  // Assigned to the support agent in the seed, so every role can open it
  ['case', '/cases/NX-000202'],
  ['transaction', '/transactions/T-000301'],
  ['records', '/records/users'],
  ['records', '/records/users/u-kunle'],
  ['records', '/records/items/I-1102'],
  ['records', '/records/listings/L-5101'],
  ['records', '/records/offers/O-6101'],
  ['records', '/records/feed/F-904'],
  ['exceptions', '/exceptions'],
  ['audit', '/audit'],
  ['settings', '/settings'],
  ['dashboard', '/dashboard'],
]

const CASES: { label: string; path: string; role?: StaffRole }[] = [
  { label: '/sign-in signed out', path: '/sign-in' },
  ...PAGES.flatMap(([routeId, path]) =>
    ROUTE_ROLES[routeId].map((role) => {
      // Support agents open a transaction only through their case
      const reached = role === 'support_agent' && routeId === 'transaction' ? `${path}?case=NX-000202` : path
      return { label: `${reached} as ${role}`, path: reached, role }
    }),
  ),
  { label: '/nope as administrator', path: '/nope', role: 'administrator' },
]

/** Waits until the page has its heading and nothing is still loading, twice in a row */
async function settled() {
  const ready = () =>
    document.querySelector('h1') !== null &&
    document.querySelector('[aria-busy="true"], .animate-pulse') === null &&
    !document.body.textContent?.includes('Updating…')
  await expect.poll(ready, { timeout: 10_000 }).toBe(true)
  await new Promise((resolve) => setTimeout(resolve, 500))
  await expect.poll(ready, { timeout: 10_000 }).toBe(true)
}

async function expectNoViolations() {
  const { violations } = await axe.run(document, { resultTypes: ['violations'] })
  expect(
    violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.target.join(' ')} — ${n.failureSummary ?? ''}`)),
  ).toEqual([])
}

describe.each(SWEEP_VIEWPORTS)('accessibility at $name', (vp) => {
  it.each(CASES)('$label', async ({ path, role }) => {
    await page.viewport(vp.width, vp.height)
    await openConsole(path, role)
    await settled()
    await expectNoViolations()
  })
})

describe('accessibility of open dialogs at 1440', () => {
  it('the Hide content dialog', async () => {
    await page.viewport(1440, 900)
    await openConsole(`/cases/${SCENARIO.abusiveComment}`, 'moderator')
    const panel = await screen.findByRole('region', { name: 'Case status' }, { timeout: 10_000 })
    within(panel).getByRole('button', { name: 'Hide content' }).focus()
    await userEvent.keyboard('{Enter}')
    await screen.findByRole('dialog', { name: 'Hide content' })
    await settled()
    await expectNoViolations()
  })

  it('the settings confirm dialog', async () => {
    await page.viewport(1440, 900)
    await openConsole('/settings', 'administrator')
    await screen.findByRole('region', { name: 'Offer lifetime' }, { timeout: 10_000 })
    await tabTo('Edit Offer lifetime', { max: 120 })
    await userEvent.keyboard('{Enter}')
    await tabTo('Offer lifetime (hours)')
    await userEvent.keyboard('{Backspace}{Backspace}{Backspace}96')
    await tabTo('Save')
    await userEvent.keyboard('{Enter}')
    await screen.findByRole('dialog', { name: /^Save .+\?$/ })
    await settled()
    await expectNoViolations()
  })
})
