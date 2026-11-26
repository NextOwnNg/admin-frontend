import { z } from 'zod'
import { REVIEW_COPY, SELLER_MESSAGE_MAX } from '@/lib/copy/review'

/** "Something else" needs words for the seller: the label alone says nothing */
export const OTHER_REASON = 'REJECT_OTHER'

const fields = {
  reasonCode: z.string().min(1, REVIEW_COPY.reasonRequired),
  sellerMessage: z.string().trim().max(SELLER_MESSAGE_MAX, REVIEW_COPY.messageTooLong),
  note: z.string().trim(),
}

/** Rejecting, or overturning an approval */
export const rejectFormSchema = z
  .object(fields)
  .refine((v) => v.reasonCode !== OTHER_REASON || v.sellerMessage.length > 0, {
    path: ['sellerMessage'],
    message: REVIEW_COPY.messageRequired,
  })

/** Overturning a rejection: a decision code, and an optional word to the seller */
export const overturnFormSchema = z.object(fields)

export type RejectFormValues = z.input<typeof rejectFormSchema>
export type OverturnFormValues = z.input<typeof overturnFormSchema>
