import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AuditEntry } from '@/components/domain/AuditEntry'
import { CasePanel } from '@/components/domain/CasePanel'
import { EvidenceGate } from '@/components/domain/EvidenceGate'
import { MaskedValue } from '@/components/domain/MaskedValue'
import { ApiError } from '@/lib/api/api-error'
import type { AuditEntry as AuditEntryData } from '@/lib/api/types/audit'
import type { CaseDetail } from '@/lib/api/types/cases'
import { signInAs } from '@/test/auth'
import { expectNoA11yViolations } from '@/test/axe'
import { renderWithQuery } from '@/test/utils'

const REASON = 'Calling to confirm the handover time'

async function giveReason(reason = REASON) {
  const dialog = await screen.findByRole('dialog')
  const submit = within(dialog).getByRole('button', { name: 'Reveal' })
  expect(submit).toBeDisabled()
  await userEvent.type(within(dialog).getByRole('textbox', { name: 'Why do you need to see this?' }), reason)
  return { dialog, submit }
}

describe('MaskedValue (PRD §7, ADM-T-02)', () => {
  it('needs a reason of at least 10 characters before revealing', async () => {
    const reveal = vi.fn(() => Promise.resolve('+2348000001201'))
    render(<MaskedValue label="Phone number of Ada O." reveal={reveal} />)

    expect(screen.getByText('Hidden')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reveal phone number of Ada O.' }))
    const { dialog, submit } = await giveReason('too short')
    expect(submit).toBeDisabled()
    await userEvent.type(within(dialog).getByRole('textbox'), ' for sure')
    expect(submit).toBeEnabled()
    await userEvent.click(submit)

    expect(await screen.findByText('+2348000001201')).toBeInTheDocument()
    expect(screen.getByText('Phone number of Ada O. revealed')).toHaveAttribute('aria-live', 'polite')
    expect(reveal).toHaveBeenCalledWith('too short for sure')
  })

  it('masks the value again when the page is left and opened again (Review Focus 1)', async () => {
    const view = () => <MaskedValue label="Phone number" reveal={() => Promise.resolve('+2348000001201')} />
    const { unmount } = render(view())
    await userEvent.click(screen.getByRole('button', { name: 'Reveal phone number' }))
    const { submit } = await giveReason()
    await userEvent.click(submit)
    await screen.findByText('+2348000001201')

    unmount()
    render(view())
    expect(screen.getByText('Hidden')).toBeInTheDocument()
    expect(screen.queryByText('+2348000001201')).not.toBeInTheDocument()
  })

  it('says when this case does not allow it', async () => {
    const denied = new ApiError({ kind: 'http', status: 403, code: 'FORBIDDEN', message: 'no' })
    render(<MaskedValue label="Phone number" reveal={() => Promise.reject(denied)} />)
    await userEvent.click(screen.getByRole('button', { name: 'Reveal phone number' }))
    const { submit } = await giveReason()
    await userEvent.click(submit)

    expect(await screen.findByText("You can't view this in this case.")).toBeInTheDocument()
  })

  it('has no accessibility problems', async () => {
    const { container } = render(<MaskedValue label="Phone number" reveal={() => Promise.resolve('x')} />)
    await expectNoA11yViolations(container)
  })
})

describe('EvidenceGate (design §5.7)', () => {
  it('says when there is no evidence', () => {
    render(<EvidenceGate items={[]} reveal={() => Promise.reject(new Error('unused'))} />)
    expect(screen.getByText('No evidence attached')).toBeInTheDocument()
  })

  it('opens short-lived links after a reason, then offers a new link when they expire', async () => {
    const reveal = vi.fn((_reason: string, id: string) =>
      Promise.resolve({
        url: `https://evidence.example.com/${id}`,
        expiresAt: new Date(Date.now() + 300).toISOString(),
      }),
    )
    const { container } = render(
      <EvidenceGate items={[{ id: 'ev-1', label: 'Bank app screenshot' }]} reveal={reveal} />,
    )
    await expectNoA11yViolations(container)

    await userEvent.click(screen.getByRole('button', { name: 'View evidence' }))
    const { submit } = await giveReason()
    await userEvent.click(submit)

    const link = await screen.findByRole('link', { name: /Bank app screenshot/ })
    expect(link).toHaveAttribute('href', 'https://evidence.example.com/ev-1')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')

    expect(await screen.findByText('Link expired')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Get a new link' }))
    await waitFor(() => expect(reveal).toHaveBeenCalledTimes(2))
    expect(reveal).toHaveBeenLastCalledWith(REASON, 'ev-1')
  })
})

const entry: AuditEntryData = {
  id: 'A-1',
  at: '2026-10-24T17:05:00Z',
  actor: 'Tunde Bakare',
  action: 'hide',
  target: { type: 'comment', id: 'C-5501', label: 'comment C-5501' },
  reasonCode: 'ABUSE',
  note: null,
  before: { content: 'visible' },
  after: { content: 'hidden' },
}

describe('AuditEntry', () => {
  it('reads as a sentence with WAT and UTC times, and expands to before and after', async () => {
    await signInAs('moderator')
    const { container } = renderWithQuery(<AuditEntry entry={entry} />)

    expect(screen.getByText(/Tunde Bakare hid comment C-5501/)).toBeInTheDocument()
    expect(await screen.findByText(/Abusive language/)).toBeInTheDocument()
    expect(screen.getByText('24 Oct 2026, 18:05 WAT')).toBeInTheDocument()
    expect(screen.getByText('2026-10-24 17:05:00 UTC')).toBeInTheDocument()

    const toggle = screen.getByRole('button', { name: 'Show details' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Hide details' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('visible')).toBeInTheDocument()
    expect(screen.getByText('hidden')).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })
})

const panelCase = {
  id: 'NX-000212',
  status: 'assigned',
  overdue: true,
  dueAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  assignee: { staffId: 's-mod', displayName: 'Tunde Bakare', roles: ['moderator'] },
  nextAction: 'Review the report and decide what happens next',
  decision: null,
} as unknown as CaseDetail

describe('CasePanel (design §4.3)', () => {
  it('shows status, overdue, the next action and the actions', async () => {
    await signInAs('moderator')
    const { container } = renderWithQuery(
      <CasePanel caseDetail={panelCase}>
        <button type="button">Escalate</button>
      </CasePanel>,
    )
    expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0)
    expect(screen.getByText('Review the report and decide what happens next')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Escalate' })).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })

  it('shows the decision instead of the next action once closed', async () => {
    await signInAs('moderator')
    renderWithQuery(
      <CasePanel
        caseDetail={{
          ...panelCase,
          status: 'closed',
          overdue: false,
          nextAction: null,
          decision: {
            outcome: 'no_violation',
            reasonCode: 'NO_VIOLATION',
            by: 'Tunde Bakare',
            at: '2026-10-24T17:05:00Z',
          },
        }}
      >
        <button type="button">Escalate</button>
      </CasePanel>,
    )
    expect(screen.getByText('No violation')).toBeInTheDocument()
    expect(await screen.findByText(/No rule was broken/)).toBeInTheDocument()
    expect(screen.queryByText('Next action')).not.toBeInTheDocument()
  })
})
