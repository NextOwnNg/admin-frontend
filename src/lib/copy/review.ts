import { formatWAT, formatWATDate } from '@/lib/time/time'

/** Listing review wording (design 2026-11-24 §5) */
export const SELLER_MESSAGE_MAX = 500

export const REVIEW_COPY = {
  nav: 'Listing review',
  heading: 'Listings to review',
  subtitle: (waiting: number, oldestWait: string | null) =>
    waiting === 0 || !oldestWait ? 'Nothing waiting' : `${waiting} waiting · oldest waiting ${oldestWait}`,
  empty: 'No listings are waiting for review.',
  waitingSince: (submittedAt: string, wait: string) => `Waiting for review since ${formatWAT(submittedAt)} (${wait})`,
  resubmitted: (at: string, reason: string, message: string | null) =>
    `Resubmitted. Rejected before on ${formatWATDate(at)} for: ${reason}.` +
    (message ? ` Message to seller: "${message}"` : ''),
  approveTitle: (id: string) => `Approve ${id}?`,
  approveConsequence: 'It goes live for members now. The seller is told it was approved.',
  rejectTitle: (id: string) => `Reject ${id}?`,
  rejectConsequence:
    "It goes back to the seller as a draft. They're told the reason and your message, and can edit and resubmit it.",
  overturnApprovalTitle: (id: string) => `Overturn the approval of ${id}?`,
  overturnApprovalConsequence:
    "It's taken down and goes back to the seller as a draft. Open offers on it end. They're told the reason and your message.",
  overturnRejectionTitle: (id: string) => `Overturn the rejection of ${id}?`,
  overturnRejectionConsequence: 'It goes live for members now. The seller is told it was approved.',
  approvedBanner: (id: string) => `Approved. ${id} is live.`,
  rejectedBanner: (id: string) => `Rejected. ${id} is back with the seller as a draft.`,
  overturnedBanner: 'Decision overturned.',
  unconfirmed: "We couldn't confirm this was recorded. Try again: it can't be recorded twice.",
  conflict: "Someone else has already reviewed this listing, or it changed. Here's the latest.",
  reviewNext: 'Review next listing',
  lastOne: 'That was the last one',
  queueNote: (reason: string) => `Resubmitted · rejected for: ${reason}`,
  reasonRequired: 'Choose a reason',
  messageRequired: 'Write a message for the seller.',
  messageTooLong: `Keep the message to ${SELLER_MESSAGE_MAX} characters.`,
  noPhotos: 'No photos',
  belowMinimum: (n: number) => `Below the minimum of ${n} photos`,
  photoAlt: (i: number, n: number, title: string) => `Photo ${i} of ${n} of ${title}`,
} as const
