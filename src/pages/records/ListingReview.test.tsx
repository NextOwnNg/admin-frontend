import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { apiClient } from '@/lib/api/client'
import { idempotencyHeaders, newIdempotencyKey } from '@/lib/api/idempotency'
import type { ListingDetail } from '@/lib/api/types/records'
import type { ReviewBody } from '@/lib/api/types/reviews'
import { auditDb } from '@/mocks/db/audit'
import { droppedAnswers } from '@/mocks/db/store'
import { signInAs } from '@/test/auth'
import { expectNoA11yViolations } from '@/test/axe'
import { apiBaseUrl } from '@/lib/env'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'

const open = async (id: string, title: string) => {
  const view = renderWithProviders(routes, { initialPath: `/records/listings/${id}` })
  await screen.findByRole('heading', { level: 1, name: title })
  return { ...view, panel: () => within(screen.getByRole('region', { name: 'Review' })) }
}

/** Another reviewer's decision, sent straight to the API */
async function decideElsewhere(id: string, body: Omit<ReviewBody, 'expectedVersion'>) {
  const { data } = await apiClient.get<ListingDetail>(`/admin/records/listings/${id}`)
  await apiClient.post(
    `/admin/listings/${id}/review`,
    { ...body, expectedVersion: data.version },
    { headers: idempotencyHeaders(newIdempotencyKey()) },
  )
}

async function confirm(title: string, label: string) {
  const modal = await screen.findByRole('dialog', { name: title })
  await userEvent.click(within(modal).getByRole('button', { name: label }))
}

async function fillReject(reason: string, message = '') {
  const dialog = await screen.findByRole('dialog', { name: /^Reject|^Overturn/ })
  await userEvent.selectOptions(within(dialog).getByRole('combobox', { name: 'Reason' }), reason)
  if (message) await userEvent.type(within(dialog).getByRole('textbox', { name: 'Message to the seller' }), message)
  return dialog
}

describe('reviewing a listing (design 2026-11-24 §5.2)', () => {
  it('approves a pending listing after confirming', async () => {
    await signInAs('moderator')
    const { panel, container } = await open('L-5205', 'Xbox Series S')
    expect(panel().getByText(/^Waiting for review since .+ \(2 d\)$/)).toBeInTheDocument()
    await expectNoA11yViolations(container)

    await userEvent.click(panel().getByRole('button', { name: 'Approve' }))
    const modal = await screen.findByRole('dialog', { name: 'Approve L-5205?' })
    expect(modal).toHaveTextContent('It goes live for members now. The seller is told it was approved.')
    await expectNoA11yViolations(modal)
    await userEvent.click(within(modal).getByRole('button', { name: 'Approve' }))

    expect(await screen.findByText('Approved. L-5205 is live.')).toBeInTheDocument()
    expect(panel().getByText(/Approved by Tunde Bakare/)).toBeInTheDocument()
    expect(panel().queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  })

  it('rejects with a reason and message, and shows the seller preview', async () => {
    await signInAs('moderator')
    const { panel } = await open('L-5205', 'Xbox Series S')
    await userEvent.click(panel().getByRole('button', { name: 'Reject' }))
    const dialog = await fillReject('Photos missing or unclear', 'Add a photo of the back.')
    expect(within(dialog).getByText('Photos missing or unclear. Add a photo of the back.')).toBeInTheDocument()
    await expectNoA11yViolations(dialog)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Continue' }))
    const modal = await screen.findByRole('dialog', { name: 'Reject L-5205?' })
    expect(modal).toHaveTextContent('Photos missing or unclear')
    await userEvent.click(within(modal).getByRole('button', { name: 'Reject' }))

    expect(await screen.findByText('Rejected. L-5205 is back with the seller as a draft.')).toBeInTheDocument()
    expect(panel().getByText(/Rejected by Tunde Bakare/)).toBeInTheDocument()
    expect(panel().getByText(/Add a photo of the back\./)).toBeInTheDocument()
    expect(screen.getAllByText('Draft').length).toBeGreaterThan(0)
  })

  it('blocks Something else without a message', async () => {
    await signInAs('moderator')
    const { panel } = await open('L-5205', 'Xbox Series S')
    await userEvent.click(panel().getByRole('button', { name: 'Reject' }))
    const dialog = await fillReject('Something else')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Continue' }))
    expect(await within(dialog).findByText('Write a message for the seller.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Reject L-5205?' })).not.toBeInTheDocument()
  })

  it('offers Review next listing', async () => {
    await signInAs('moderator')
    const { panel } = await open('L-5205', 'Xbox Series S')
    await userEvent.click(panel().getByRole('button', { name: 'Approve' }))
    await confirm('Approve L-5205?', 'Approve')
    await userEvent.click(await screen.findByRole('link', { name: 'Review next listing' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Electric kettle' })).toBeInTheDocument()
  })

  it('says when it was the last one', async () => {
    await signInAs('moderator')
    for (const id of ['L-5234', 'L-5230', 'L-5231', 'L-5232', 'L-5233'])
      await decideElsewhere(id, { decision: 'approve' })
    const { panel } = await open('L-5205', 'Xbox Series S')
    await userEvent.click(panel().getByRole('button', { name: 'Approve' }))
    await confirm('Approve L-5205?', 'Approve')
    expect(await screen.findByText('That was the last one')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Review next listing' })).not.toBeInTheDocument()
  })

  it('shows the resubmission note', async () => {
    await signInAs('moderator')
    const { panel } = await open('L-5232', 'Blender, 1.5 litre')
    expect(
      panel().getByText(
        /^Resubmitted\. Rejected before on .+ for: Photos missing or unclear\. Message to seller: "Please add a photo of the base\."$/,
      ),
    ).toBeInTheDocument()
  })

  it('shows the conflict and the other decision when someone got there first', async () => {
    await signInAs('moderator')
    const { panel } = await open('L-5205', 'Xbox Series S')
    await decideElsewhere('L-5205', { decision: 'reject', reasonCode: 'REJECT_PHOTOS' })
    await userEvent.click(panel().getByRole('button', { name: 'Approve' }))
    await confirm('Approve L-5205?', 'Approve')
    expect(
      await screen.findByText("Someone else has already reviewed this listing, or it changed. Here's the latest."),
    ).toBeInTheDocument()
    await waitFor(() => expect(panel().getByText(/Rejected by Tunde Bakare/)).toBeInTheDocument())
    expect(panel().queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  })

  it('shows the decision, not the buttons, once a listing is decided', async () => {
    await signInAs('moderator')
    const { panel } = await open('L-5235', 'Standing fan')
    expect(panel().getByText(/Approved by Tunde Bakare/)).toBeInTheDocument()
    expect(panel().queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(panel().queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
  })

  it('reads back a lost answer instead of deciding twice', async () => {
    await signInAs('moderator')
    const { panel } = await open('L-5205', 'Xbox Series S')
    droppedAnswers().add('L-5205')
    await userEvent.click(panel().getByRole('button', { name: 'Approve' }))
    await confirm('Approve L-5205?', 'Approve')
    expect(await screen.findByText('Approved. L-5205 is live.')).toBeInTheDocument()
    expect(auditDb.forTarget('L-5205')).toHaveLength(1)
  })
})

describe('overturning a decision (design 2026-11-24 §5.2, §6)', () => {
  it('lets an administrator overturn an approval with a reason', async () => {
    await signInAs('administrator')
    const { panel } = await open('L-5235', 'Standing fan')
    await userEvent.click(panel().getByRole('button', { name: 'Overturn approval' }))
    const dialog = await fillReject('Price or description is misleading', 'The fan is not new.')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Continue' }))
    const modal = await screen.findByRole('dialog', { name: 'Overturn the approval of L-5235?' })
    expect(modal).toHaveTextContent("It's taken down and goes back to the seller as a draft.")
    await expectNoA11yViolations(modal)
    await userEvent.click(within(modal).getByRole('button', { name: 'Overturn' }))

    expect(await screen.findByText('Decision overturned.')).toBeInTheDocument()
    expect(panel().getByText(/Overturned by Ngozi Adeyemi/)).toBeInTheDocument()
    expect(panel().getByText('Already overturned once.')).toBeInTheDocument()
  })

  it('hides Overturn from moderators', async () => {
    await signInAs('moderator')
    const { panel } = await open('L-5235', 'Standing fan')
    expect(panel().queryByRole('button', { name: 'Overturn approval' })).not.toBeInTheDocument()
  })

  it("explains why an approval can't be overturned", async () => {
    await signInAs('administrator')
    const { panel } = await open('L-5236', 'Office chair')
    expect(panel().getByText("Can't be overturned: an offer on it was accepted.")).toBeInTheDocument()
    expect(panel().queryByRole('button', { name: 'Overturn approval' })).not.toBeInTheDocument()
  })

  it('overturns a rejection with a decision code', async () => {
    await signInAs('administrator')
    const { panel } = await open('L-5237', 'Toaster')
    expect(panel().getByText(/Rejected by Tunde Bakare .+ for: Condition or defects not described/)).toBeInTheDocument()
    await userEvent.click(panel().getByRole('button', { name: 'Overturn rejection' }))
    const dialog = await fillReject('Rejected in error')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Continue' }))
    await confirm('Overturn the rejection of L-5237?', 'Overturn')
    expect(await screen.findByText('Decision overturned.')).toBeInTheDocument()
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0)
  })
})

describe('final review fixes', () => {
  it('offers Try again on Approve when a lost answer cannot be read back, with the same key', async () => {
    await signInAs('moderator')
    // While "offline", every read of the listing fails, so the outcome can't be read back
    let offline = false
    server.use(
      http.get(`${apiBaseUrl}/admin/records/listings/L-5205`, () => (offline ? HttpResponse.error() : undefined)),
    )
    const { panel } = await open('L-5205', 'Xbox Series S')
    droppedAnswers().add('L-5205')
    await userEvent.click(panel().getByRole('button', { name: 'Approve' }))
    offline = true
    await confirm('Approve L-5205?', 'Approve')
    expect(
      await screen.findByText("We couldn't confirm this was recorded. Try again: it can't be recorded twice."),
    ).toBeInTheDocument()
    offline = false
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Approved. L-5205 is live.')).toBeInTheDocument()
    expect(auditDb.forTarget('L-5205')).toHaveLength(1)
  })

  it('shows no seller preview when overturning a rejection', async () => {
    await signInAs('administrator')
    const { panel } = await open('L-5237', 'Toaster')
    await userEvent.click(panel().getByRole('button', { name: 'Overturn rejection' }))
    const dialog = await fillReject('Rejected in error')
    expect(within(dialog).queryByText('The seller will see')).not.toBeInTheDocument()
  })

  it('does not claim the queue is empty when it cannot be read', async () => {
    await signInAs('moderator')
    server.use(
      http.get(`${apiBaseUrl}/admin/listing-reviews`, () =>
        HttpResponse.json({ code: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    const { panel } = await open('L-5205', 'Xbox Series S')
    await userEvent.click(panel().getByRole('button', { name: 'Approve' }))
    await confirm('Approve L-5205?', 'Approve')
    expect(await screen.findByText('Approved. L-5205 is live.')).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(screen.queryByText('That was the last one')).not.toBeInTheDocument()
  })
})
