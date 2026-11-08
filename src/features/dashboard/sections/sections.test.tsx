import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { FunnelSection } from '@/features/dashboard/sections/FunnelSection'
import { LiquiditySection } from '@/features/dashboard/sections/LiquiditySection'
import { ModeRatesSection } from '@/features/dashboard/sections/ModeRatesSection'
import { SupportSection } from '@/features/dashboard/sections/SupportSection'
import { TrustSection } from '@/features/dashboard/sections/TrustSection'
import { percentOf } from '@/features/dashboard/format'
import type { DashboardData } from '@/lib/api/types/dashboard'
import { expectNoA11yViolations } from '@/test/axe'
import { sampleDashboard } from '@/test/fixtures/dashboard'

const show = (ui: ReactElement) => render(ui)
const rowNamed = (table: HTMLElement, name: string) =>
  within(table)
    .getAllByRole('row')
    .find((row) =>
      within(row)
        .queryAllByRole('rowheader')
        .some((h) => h.textContent === name),
    )!

describe('funnel (Phase D design §4.2)', () => {
  it('counts every stage with its step conversion, and never says credible', () => {
    const data = sampleDashboard()
    const { container } = show(<FunnelSection data={data} />)
    const table = screen.getByRole('table', { name: 'Listing to completion' })
    const offered = rowNamed(table, 'Received an offer')
    expect(offered).toHaveTextContent('38')
    expect(offered).toHaveTextContent(percentOf(38, 50)!)
    expect(rowNamed(table, 'Completed')).toHaveTextContent(percentOf(12, 19)!)
    expect(container.textContent).not.toMatch(/credible offer rate|credible offers:/i)
    expect(container.textContent).not.toMatch(/target|goal/i)
  })

  it('keeps the table for screen readers in chart view, and switches to it on request', async () => {
    const { unmount } = show(<FunnelSection data={sampleDashboard()} />)
    expect(screen.getByRole('table', { name: 'Listing to completion' })).toBeInTheDocument()
    expect(screen.getByText('The same figures are in the table view.')).toBeInTheDocument()
    const tableButton = screen.getByRole('button', { name: 'Table' })
    expect(tableButton).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(tableButton)
    expect(tableButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('The same figures are in the table view.')).not.toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Listing to completion' })).toBeVisible()
    unmount()
    show(<FunnelSection data={sampleDashboard()} />)
    expect(screen.getByRole('button', { name: 'Table' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('figure tables and the keyboard (D3 accessibility sweep)', () => {
  it('lets the keyboard scroll a table on screen, named for the table', async () => {
    show(<FunnelSection data={sampleDashboard()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Table' }))
    expect(screen.getByRole('group', { name: 'Listing to completion' })).toHaveAttribute('tabindex', '0')
  })

  it('adds no hidden stop for the table kept for screen readers in chart view', () => {
    const { container } = show(<FunnelSection data={sampleDashboard()} />)
    expect(screen.getByRole('table', { name: 'Listing to completion' })).toBeInTheDocument()
    expect(container.querySelector('.sr-only [tabindex]')).toBeNull()
    expect(container.querySelector('.sr-only .overflow-x-auto')).toBeNull()
  })
})

describe('rates by mode (Phase D design §4.2)', () => {
  it('shows acceptance, completion, time and the incomplete share per mode, all modes first', () => {
    const data = sampleDashboard()
    show(<ModeRatesSection data={data} />)
    const table = screen.getByRole('table', { name: 'Rates by mode' })
    const heads = within(table)
      .getAllByRole('rowheader')
      .map((h) => h.textContent)
    expect(heads).toEqual(['All modes', 'Cash', 'Swap', 'Swap plus cash'])
    const mixed = rowNamed(table, 'Swap plus cash')
    expect(mixed).toHaveTextContent(percentOf(4, 7)!)
    expect(mixed).toHaveTextContent(percentOf(2, 3)!)
    expect(mixed).toHaveTextContent('3.2 days')
    expect(mixed).toHaveTextContent(percentOf(1, 3)!)
    expect(screen.getByText(/accepted at least 7 days before the data-through time/)).toBeInTheDocument()
  })

  it('says when there is nothing to divide by, instead of 0%', () => {
    const base = sampleDashboard()
    const data: DashboardData = {
      ...base,
      completion: { ...base.completion, CASH: { completed: 0, matureAccepted: 0, medianHours: null } },
      acceptance: { ...base.acceptance, SWAP: { accepted: 0, decided: 0 } },
    }
    show(<ModeRatesSection data={data} />)
    const table = screen.getByRole('table', { name: 'Rates by mode' })
    expect(rowNamed(table, 'Cash')).toHaveTextContent('No mature accepted transactions in this range')
    expect(rowNamed(table, 'Cash')).toHaveTextContent('No completed deals in this range')
    expect(rowNamed(table, 'Swap')).toHaveTextContent('No decided negotiations in this range')
    expect(table.textContent).not.toMatch(/NaN|Infinity/)
  })

  it('is accessible in both views', async () => {
    const { container } = show(
      <>
        <FunnelSection data={sampleDashboard()} />
        <ModeRatesSection data={sampleDashboard()} />
      </>,
    )
    await expectNoA11yViolations(container)
    for (const button of screen.getAllByRole('button', { name: 'Table' })) await userEvent.click(button)
    await expectNoA11yViolations(container)
  })
})

const cells = (container: HTMLElement) =>
  [...container.querySelectorAll('td, dd')].map((cell) => cell.textContent?.trim() ?? '')

describe('liquidity, cancellations and support (Phase D design §4.2)', () => {
  it('reads a window as completed of eligible, and a window too recent as such (Review Focus 1)', () => {
    const { container } = show(<LiquiditySection data={sampleDashboard()} showAreas />)
    const table = screen.getByRole('table', { name: 'Liquidity by category' })
    const phones = rowNamed(table, 'Phones')
    expect(phones).toHaveTextContent('20')
    expect(phones).toHaveTextContent('25% (2 of 8)')
    expect(phones).toHaveTextContent('Too recent for 30-day')
    expect(screen.getByRole('table', { name: 'Liquidity by area' })).toBeInTheDocument()
    for (const cell of cells(container)) expect(cell).not.toMatch(/NaN|Infinity|^0%$|^$/)
  })

  it('leaves the area table out when one area is chosen', () => {
    show(<LiquiditySection data={sampleDashboard()} showAreas={false} />)
    expect(screen.queryByRole('table', { name: 'Liquidity by area' })).not.toBeInTheDocument()
  })

  it('gives per-100 figures their base, and says when a week had no accepted deals (Review Focus 1)', () => {
    const { container } = show(<TrustSection data={sampleDashboard()} />)
    expect(screen.getByText('Cancelled per 100 accepted').nextElementSibling).toHaveTextContent(
      '10.5 per 100 accepted (2 of 19)',
    )
    const weeks = screen.getByRole('table', { name: 'Cancellations and disputes by week' })
    const quiet = rowNamed(weeks, '2 Nov 2026')
    expect(quiet).toHaveTextContent('No accepted transactions in this range')
    expect(rowNamed(weeks, '26 Oct 2026')).toHaveTextContent('11.1 per 100 accepted (1 of 9)')
    for (const cell of cells(container)) expect(cell).not.toMatch(/NaN|Infinity|^0%$|^$/)
  })

  it('says support minutes and cost per deal are not measured yet, and why', () => {
    show(<SupportSection data={sampleDashboard()} />)
    const minutes = screen.getByText('Support minutes per completed deal').nextElementSibling
    expect(minutes).toHaveTextContent('Not measured yet')
    expect(minutes).toHaveTextContent('Needs time tracking from the operations team.')
    expect(screen.getByText('Variable operating cost per completed deal').nextElementSibling).toHaveTextContent(
      'Needs variable operating cost inputs from the operations team.',
    )
    expect(screen.getByText('Median time to resolve').nextElementSibling).toHaveTextContent('20 h')
    // Cases aren't a subset of accepted deals, so the count names both (final review)
    expect(screen.getByText('Cases per 100 accepted').nextElementSibling).toHaveTextContent(
      '31.6 per 100 accepted (6 cases, 19 accepted)',
    )
    expect(rowNamed(screen.getByRole('table', { name: 'Support cases by week' }), '2 Nov 2026')).toHaveTextContent('2')
  })

  it('reads a recent range honestly (Review Focus 4)', () => {
    const base = sampleDashboard()
    const recent: DashboardData = {
      ...base,
      liquidity: {
        byCategory: base.liquidity.byCategory.map((row) => ({ ...row, d14: null, d30: null })),
        byArea: base.liquidity.byArea.map((row) => ({ ...row, d14: null, d30: null })),
      },
      completion: { ...base.completion, ALL: { completed: 0, matureAccepted: 0, medianHours: null } },
    }
    show(
      <>
        <LiquiditySection data={recent} showAreas />
        <ModeRatesSection data={recent} />
      </>,
    )
    expect(screen.getAllByText('Too recent for 14-day').length).toBeGreaterThan(0)
    expect(rowNamed(screen.getByRole('table', { name: 'Rates by mode' }), 'All modes')).toHaveTextContent(
      'No mature accepted transactions in this range',
    )
  })

  it('is accessible in both views', async () => {
    const { container } = show(
      <>
        <LiquiditySection data={sampleDashboard()} showAreas />
        <TrustSection data={sampleDashboard()} />
        <SupportSection data={sampleDashboard()} />
      </>,
    )
    await expectNoA11yViolations(container)
    for (const button of screen.getAllByRole('button', { name: 'Table' })) await userEvent.click(button)
    await expectNoA11yViolations(container)
  })
})
