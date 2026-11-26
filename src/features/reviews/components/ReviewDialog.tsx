import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Modal } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Banner } from '@/components/ui/Banner'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Field } from '@/components/ui/Field'
import { ReasonCodeField } from '@/features/actions/components/ReasonCodeField'
import { useOverturnReview, useReviewListing, readBackListing } from '@/features/reviews/api/useReviews'
import { rejectFormSchema, type RejectFormValues } from '@/features/reviews/schemas'
import { toApiError } from '@/lib/api/api-error'
import { errorMessage, fieldErrorsOf, isConflict } from '@/lib/api/error-message'
import { newIdempotencyKey } from '@/lib/api/idempotency'
import { useReasonCodes } from '@/lib/api/reference'
import type { ListingDetail } from '@/lib/api/types/records'
import { ROLE_LABELS } from '@/lib/copy/labels'
import { REVIEW_COPY, SELLER_MESSAGE_MAX } from '@/lib/copy/review'
import { useSessionStore } from '@/stores/session'

export type ReviewDialogMode = 'reject' | 'overturn_approval' | 'overturn_rejection'

const MODES: Record<
  ReviewDialogMode,
  {
    heading: string
    title: (id: string) => string
    consequence: string
    confirm: string
    kind: 'rejection' | 'decision'
  }
> = {
  reject: {
    heading: 'Reject listing',
    title: REVIEW_COPY.rejectTitle,
    consequence: REVIEW_COPY.rejectConsequence,
    confirm: 'Reject',
    kind: 'rejection',
  },
  overturn_approval: {
    heading: 'Overturn approval',
    title: REVIEW_COPY.overturnApprovalTitle,
    consequence: REVIEW_COPY.overturnApprovalConsequence,
    confirm: 'Overturn',
    kind: 'rejection',
  },
  overturn_rejection: {
    heading: 'Overturn rejection',
    title: REVIEW_COPY.overturnRejectionTitle,
    consequence: REVIEW_COPY.overturnRejectionConsequence,
    confirm: 'Overturn',
    kind: 'decision',
  },
}

/** Whether the server applied this, judged from a fresh read after a lost answer */
function applied(mode: ReviewDialogMode, fresh: ListingDetail, me: string | null) {
  const review = fresh.review
  if (mode === 'reject') return review?.decision?.decision === 'rejected' && review.decision.by === me
  return review?.overturn?.by === me
}

type Props = {
  mode: ReviewDialogMode
  listing: ListingDetail
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
  onConflict: () => void
}

/**
 * Reject, or overturn a decision (design 2026-11-24 §5.2): a reason, a message the seller sees with a preview,
 * an internal note, then the confirmation. One Idempotency-Key per opening, reused by Try again.
 */
export function ReviewDialog({ open, onOpenChange, ...props }: Props) {
  return (
    <Modal isOpen={open} onOpenChange={onOpenChange}>
      <Modal.Backdrop isDismissable={false}>
        <Modal.Container size="md" className="max-w-160">
          <Modal.Dialog className="rounded-card">
            <ReviewForm {...props} close={() => onOpenChange(false)} />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}

function ReviewForm({
  mode,
  listing,
  onDone,
  onConflict,
  close,
}: Omit<Props, 'open' | 'onOpenChange'> & { close: () => void }) {
  const config = MODES[mode]
  const queryClient = useQueryClient()
  const { displayName, roles } = useSessionStore()
  const reasons = useReasonCodes()
  const review = useReviewListing(listing.id)
  const overturn = useOverturnReview(listing.id)
  const [idempotencyKey] = useState(newIdempotencyKey)
  const [confirming, setConfirming] = useState(false)
  const [checking, setChecking] = useState(false)
  const [notice, setNotice] = useState<{ title: string; retry?: boolean } | null>(null)

  const form = useForm<RejectFormValues>({
    resolver: zodResolver(rejectFormSchema),
    defaultValues: { reasonCode: '', sellerMessage: '', note: '' },
  })
  const { register, control, formState, getValues, setError } = form
  const values = useWatch({ control })
  const reason = reasons.data?.find((r) => r.code === values.reasonCode && r.kind === config.kind)
  const message = (values.sellerMessage ?? '').trim()
  // A decision code is staff wording: the seller of an overturned rejection is told it was approved
  const preview =
    reason && config.kind === 'rejection' ? (message ? `${reason.label}. ${message}` : reason.label) : null
  const actor = `${displayName ?? 'You'} (${roles.map((r) => ROLE_LABELS[r]).join(', ')})`

  async function send() {
    const v = rejectFormSchema.parse(getValues())
    const common = {
      expectedVersion: listing.version,
      sellerMessage: v.sellerMessage || undefined,
      note: v.note || undefined,
    }
    if (mode === 'reject') {
      await review.mutateAsync({ body: { decision: 'reject', reasonCode: v.reasonCode, ...common }, idempotencyKey })
    } else {
      await overturn.mutateAsync({ body: { reasonCode: v.reasonCode, ...common }, idempotencyKey })
    }
  }

  async function confirm() {
    setNotice(null)
    try {
      await send()
      onDone()
      close()
    } catch (error) {
      if (isConflict(error)) {
        onConflict()
        close()
        return
      }
      if (toApiError(error).isOutcomeUnknown) {
        setChecking(true)
        const fresh = await readBackListing(queryClient, listing.id)
        setChecking(false)
        if (fresh && applied(mode, fresh, displayName)) {
          onDone()
          close()
          return
        }
        setNotice({
          title: REVIEW_COPY.unconfirmed,
          retry: true,
        })
        return
      }
      const fields = fieldErrorsOf(error)
      if (fields) {
        for (const [field, text] of Object.entries(fields)) setError(field as keyof RejectFormValues, { message: text })
      }
      setNotice({ title: errorMessage(error, "The decision wasn't recorded.") })
    }
  }

  const errors = formState.errors
  return (
    <>
      <Modal.Header>
        <Modal.Heading className="text-h3 text-ink">
          {config.heading} {listing.id}
        </Modal.Heading>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-4">
        {checking && <Banner tone="info" title="Checking the latest status…" />}
        {notice && (
          <Banner
            tone="error"
            title={notice.title}
            action={
              notice.retry ? (
                <Button size="sm" variant="secondary" onPress={() => void confirm()}>
                  Try again
                </Button>
              ) : undefined
            }
          />
        )}
        <ReasonCodeField
          kind={config.kind}
          targetType="listing"
          error={errors.reasonCode?.message}
          {...register('reasonCode')}
        />
        <Field
          label="Message to the seller"
          hint={`Optional, unless the reason is "Something else". Up to ${SELLER_MESSAGE_MAX} characters. ${message.length}/${SELLER_MESSAGE_MAX}`}
          error={errors.sellerMessage?.message}
        >
          {({ inputId, describedBy, invalid }) => (
            <textarea
              id={inputId}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              rows={3}
              className="field-input min-h-20 py-3"
              {...register('sellerMessage')}
            />
          )}
        </Field>
        {preview && (
          <div className="rounded-small bg-cloud p-3 text-compact">
            <p className="text-muted">The seller will see</p>
            <p className="text-ink">{preview}</p>
          </div>
        )}
        <Field label="Internal note" hint="Optional. Only staff see it." error={errors.note?.message}>
          {({ inputId, describedBy, invalid }) => (
            <textarea
              id={inputId}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              rows={2}
              maxLength={1000}
              className="field-input min-h-16 py-3"
              {...register('note')}
            />
          )}
        </Field>
      </Modal.Body>
      <Modal.Footer className="flex justify-end gap-2">
        <Button variant="tertiary" onPress={close} isDisabled={checking}>
          Cancel
        </Button>
        <Button isDisabled={checking} onPress={() => void form.handleSubmit(() => setConfirming(true))()}>
          Continue
        </Button>
      </Modal.Footer>

      <ConfirmModal
        open={confirming}
        onOpenChange={setConfirming}
        title={config.title(listing.id)}
        actor={actor}
        target={`${listing.title} (${listing.id})`}
        consequence={config.consequence}
        reason={reason?.label}
        confirmLabel={config.confirm}
        tone={mode === 'overturn_rejection' ? 'standard' : 'destructive'}
        onConfirm={confirm}
      />
    </>
  )
}
