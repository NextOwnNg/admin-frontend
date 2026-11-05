import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CaseStatusBadge } from '@/components/domain/CaseStatusBadge'
import { MoneyText } from '@/components/domain/MoneyText'
import { SeverityBadge } from '@/components/domain/SeverityBadge'
import { TransactionStatusBadge } from '@/components/domain/TransactionStatusBadge'
import { expectNoA11yViolations } from '@/test/axe'

describe('domain badges', () => {
  it('shows severity as icon and text', async () => {
    const { container } = render(<SeverityBadge severity="S1" />)
    expect(screen.getByText('S1 Urgent safety')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })

  it('adds an overdue badge to a case status', async () => {
    const { container } = render(<CaseStatusBadge status="assigned" overdue />)
    expect(screen.getByText('Assigned')).toBeInTheDocument()
    expect(screen.getByText('Overdue')).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })

  it('leaves the overdue badge off when on time', () => {
    render(<CaseStatusBadge status="open" />)
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument()
  })

  it('labels administrative transaction outcomes as support resolutions', () => {
    render(<TransactionStatusBadge status="RESOLVED_BY_SUPPORT_CANCELLED" />)
    expect(screen.getByText('Resolved by support: cancelled')).toBeInTheDocument()
  })

  it('shows kobo as whole naira', () => {
    render(<MoneyText kobo={35_000_000} size="large" />)
    expect(screen.getByText('₦350,000')).toHaveClass('text-price', 'tabular-nums')
  })
})
