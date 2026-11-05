import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ConfirmationEvents } from '@/components/domain/ConfirmationEvents'
import { OfferSummary } from '@/components/domain/OfferSummary'
import { VersionTimeline } from '@/components/domain/VersionTimeline'
import type { Confirmation, OfferTerms } from '@/lib/api/types/transactions'
import { expectNoA11yViolations } from '@/test/axe'

const terms = (cashDirection: OfferTerms['cashDirection'], cashKobo: number): OfferTerms => ({
  gives: {
    participant: 'A',
    displayName: 'Ada O.',
    items: [{ id: 'I-1', title: 'PlayStation 5 console', condition: 'Used, good', defects: 'Small scratch' }],
  },
  receives: {
    participant: 'B',
    displayName: 'Kunle A.',
    items: [{ id: 'I-2', title: 'MacBook Air 2020', condition: 'Used, good', defects: null }],
  },
  cashKobo,
  cashDirection,
})

describe('OfferSummary (design §4.4)', () => {
  it.each([
    ['OffererPays', 5_000_000, 'Offerer pays owner ₦50,000'],
    ['OwnerPays', 1_500_000, 'Owner pays offerer ₦15,000'],
    ['None', 0, 'No cash'],
  ] as const)('states %s as a sentence', (direction, kobo, sentence) => {
    render(<OfferSummary terms={terms(direction, kobo)} />)
    expect(screen.getByText(sentence)).toBeInTheDocument()
  })

  it('shows what each participant gives, with condition and defects', async () => {
    const { container } = render(<OfferSummary terms={terms('None', 0)} />)
    expect(screen.getByRole('heading', { name: 'Ada O. gives' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Kunle A. gives' })).toBeInTheDocument()
    expect(screen.getByText('Small scratch')).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })
})

describe('VersionTimeline', () => {
  it('lists versions newest first with their state', () => {
    render(
      <VersionTimeline
        versions={[
          {
            number: 1,
            proposedBy: 'Ada O.',
            at: '2026-10-23T10:00:00Z',
            terms: terms('OffererPays', 3_000_000),
            state: 'superseded',
          },
          {
            number: 2,
            proposedBy: 'Ada O.',
            at: '2026-10-24T10:00:00Z',
            terms: terms('OffererPays', 5_000_000),
            state: 'accepted',
          },
        ]}
      />,
    )
    const items = within(screen.getByRole('list', { name: 'Offer versions' })).getAllByRole('listitem', {
      name: /^Version/,
    })
    expect(items.map((i) => i.getAttribute('aria-label'))).toEqual(['Version 2', 'Version 1'])
    expect(items[0]).toHaveTextContent('Accepted')
    expect(items[1]).toHaveTextContent('Superseded')
  })
})

const events: Confirmation[] = [
  {
    participant: 'A',
    displayName: 'Ada O.',
    confirmedAt: '2026-10-24T15:00:00Z',
    inspectedItems: true,
    cashHandled: false,
  },
  { participant: 'B', displayName: 'Kunle A.', confirmedAt: null, inspectedItems: null, cashHandled: null },
]

describe('ConfirmationEvents (ADM-FE-04, ADM-T-01)', () => {
  it('shows each participant’s own report, read-only', async () => {
    const { container } = render(<ConfirmationEvents events={events} flags={['DISPUTED']} />)
    expect(screen.getByText('1 of 2 confirmed')).toBeInTheDocument()
    expect(screen.getByText('Confirmed exchange (self-reported)')).toBeInTheDocument()
    expect(screen.getByText('Not confirmed')).toBeInTheDocument()
    expect(screen.getByText('Disputed')).toBeInTheDocument()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    await expectNoA11yViolations(container)
  })
})

describe('VersionTimeline for an open offer (Phase C)', () => {
  it('says the latest version of a pending offer is awaiting a reply', () => {
    render(
      <VersionTimeline
        versions={[
          { number: 2, proposedBy: 'Kunle A.', at: '2026-11-05T10:00:00Z', terms: terms('None', 0), state: 'pending' },
          { number: 1, proposedBy: 'Ada O.', at: '2026-11-05T09:00:00Z', terms: terms('None', 0), state: 'superseded' },
        ]}
      />,
    )
    expect(screen.getByText('Awaiting reply')).toBeInTheDocument()
  })
})

describe('OfferSummary with a cash-only side (Phase C)', () => {
  it('says a side gives no items instead of an empty box', () => {
    const cashOnly = {
      ...terms('OffererPays', 40_000_000),
      gives: { participant: 'A' as const, displayName: 'Ada O.', items: [] },
    }
    render(<OfferSummary terms={cashOnly} />)
    expect(screen.getByText('No items, cash only')).toBeInTheDocument()
  })
})
