import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Flag } from 'lucide-react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it, vi } from 'vitest'
import { Banner } from '@/components/ui/Banner'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { PlainButton } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PermissionDenied, TableSkeleton } from '@/components/ui/States'
import { TextField } from '@/components/ui/TextField'
import { expectNoA11yViolations } from '@/test/axe'

describe('ConfirmModal (PRD §4.7, §8)', () => {
  const props = {
    open: true,
    onOpenChange: () => {},
    title: 'Restrict Ada O. for 7 days?',
    actor: 'Tunde Bakare (moderator)',
    target: 'Ada O.',
    consequence: "They won't be able to list, offer or comment.",
    reason: 'Spam (S3)',
    confirmLabel: 'Restrict account',
  }

  it('names actor, target, consequence and reason', async () => {
    render(<ConfirmModal {...props} tone="destructive" onConfirm={() => {}} />)

    const dialog = await screen.findByRole('dialog', { name: props.title })
    for (const text of [props.actor, props.target, props.consequence, props.reason]) {
      expect(dialog).toHaveTextContent(text)
    }
    await expectNoA11yViolations(dialog)
  })

  it('never fires twice while the action is running', async () => {
    let finish = () => {}
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
    render(<ConfirmModal {...props} tone="destructive" onConfirm={onConfirm} />)

    const button = await screen.findByRole('button', { name: 'Restrict account' })
    await userEvent.click(button)
    await userEvent.click(button)
    await act(() => {
      finish()
      return Promise.resolve()
    })

    expect(onConfirm).toHaveBeenCalledOnce()
  })
})

describe('Banner', () => {
  it('announces errors and never dismisses itself', () => {
    vi.useFakeTimers()
    render(<Banner tone="error" title="The action failed" />)

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(screen.getByRole('alert')).toHaveTextContent('The action failed')
    vi.useRealTimers()
  })

  it('uses a polite status for information', () => {
    render(<Banner tone="info" title="Search arrives in Phase C" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})

describe('StatusBadge', () => {
  it('always shows a text label next to its icon', async () => {
    const { container } = render(<StatusBadge tone="warning" icon={Flag} label="Under review" />)

    expect(screen.getByText('Under review')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })
})

describe('PermissionDenied (PRD §2, QA-16)', () => {
  it('says so plainly and offers a way back', async () => {
    const router = createMemoryRouter([{ path: '/', element: <PermissionDenied /> }])
    const { container } = render(<RouterProvider router={router} />)

    expect(screen.getByRole('heading', { name: "You don't have permission to view this page" })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to overview' })).toHaveAttribute('href', '/')
    await expectNoA11yViolations(container)
  })
})

describe('TextField', () => {
  it('links its error to the input', async () => {
    const { container } = render(<TextField label="Phone number" error="Enter a Nigerian mobile number." />)

    expect(screen.getByRole('textbox', { name: 'Phone number' })).toHaveAccessibleDescription(
      'Enter a Nigerian mobile number.',
    )
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
    await expectNoA11yViolations(container)
  })
})

describe('buttons and loading', () => {
  it('renders a compact button for table rows', () => {
    render(<PlainButton size="compact">Assign</PlainButton>)
    expect(screen.getByRole('button', { name: 'Assign' })).toHaveClass('button--compact')
  })

  it('marks table skeletons as busy', () => {
    render(<TableSkeleton rows={3} columns={4} />)
    expect(screen.getByRole('status', { name: 'Loading' })).toHaveAttribute('aria-busy', 'true')
  })
})
