import type { AuditEntry } from '@/lib/api/types/audit'
import type { CaseDetail, ContentRef, PartyRef } from '@/lib/api/types/cases'
import type { TargetType } from '@/lib/api/types/reference'
import type { OfferTerms, Reservation, TransactionDetail } from '@/lib/api/types/transactions'
import type { CaseStatus, Severity } from '@/lib/copy/status'
import { staffMember } from '@/mocks/fixtures/staff'

/**
 * The mock admin API's cases, transactions and audit trail (design §6). FICTIONAL people, numbers and
 * places. Times are relative to `now` so the queue always has fresh, due and overdue work.
 */

export const SCENARIO = {
  s1Unassigned: 'NX-000201',
  paymentDispute: 'NX-000202',
  partialTimeout: 'NX-000203',
  expiredZeroOfTwo: 'NX-000204',
  disputedCancellation: 'NX-000205',
  bothConfirmed: 'NX-000206',
  bothConfirmedBlocked: 'NX-000207',
  redacted: 'NX-000208',
  noEvidence: 'NX-000209',
  expiringEvidence: 'NX-000210',
  repeatOffender: 'NX-000211',
  overdue: 'NX-000212',
  closed: 'NX-000213',
  resolved: 'NX-000214',
  priceEditedAfterAcceptance: 'NX-000215',
  abusiveComment: 'NX-000216',
  /** The open "Same listing posted three times" filler: a possible duplicate */
  duplicate: 'NX-000220',
  appeal: 'NX-000233',
  expiringReservation: 'NX-000234',
} as const

/** The earlier listing the duplicate case's listing repeats (built in records-seed) */
export const DUPLICATE_LISTING = 'L-5219'

export const TX = {
  paymentDispute: 'T-000301',
  partialTimeout: 'T-000302',
  expiredZeroOfTwo: 'T-000303',
  disputedCancellation: 'T-000304',
  bothConfirmed: 'T-000305',
  bothConfirmedBlocked: 'T-000306',
  priceEditedAfterAcceptance: 'T-000307',
  expiringReservation: 'T-000308',
} as const

/** The listing's price today, edited by the seller after acceptance (QA-08). Never part of the snapshot. */
export const PRICE_EDITED_LISTING_NOW_KOBO = 6_500_000

export type CaseRecord = Omit<CaseDetail, 'overdue' | 'history' | 'transactionSummary'> & {
  secrets: { phones: Record<string, string>; messages: string | null; evidenceTtlSeconds: number }
}
export type TransactionRecord = Omit<TransactionDetail, 'history'> & { secrets: { venue: string } }
export type AuditRecord = {
  entry: AuditEntry
  actorId: string | null
  caseId: string | null
  transactionId: string | null
  idempotencyKey: string | null
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
/** Draft due-time targets (design §5.1, pending AD-D-03) */
/** How long the seeded restriction (Segun's) still runs; the records seed uses the same */
export const RESTRICTED_FOR_MS = 5 * 24 * 60 * 60_000

export const DUE_HOURS: Record<Severity, number> = { S1: 1, S2: 4, S3: 24, S4: 72 }

export type Member = {
  userId: string
  displayName: string
  memberSince: string
  priorActions90d: number
  phone: string
}

export const MEMBERS = {
  ada: {
    userId: 'u-ada',
    displayName: 'Ada O.',
    memberSince: '2025-03-14T09:00:00Z',
    priorActions90d: 0,
    phone: '+2348000001201',
  },
  kunle: {
    userId: 'u-kunle',
    displayName: 'Kunle A.',
    memberSince: '2025-06-02T09:00:00Z',
    priorActions90d: 0,
    phone: '+2348000001202',
  },
  ifeoma: {
    userId: 'u-ifeoma',
    displayName: 'Ifeoma N.',
    memberSince: '2024-11-20T09:00:00Z',
    priorActions90d: 0,
    phone: '+2348000001203',
  },
  emeka: {
    userId: 'u-emeka',
    displayName: 'Emeka C.',
    memberSince: '2025-08-09T09:00:00Z',
    priorActions90d: 1,
    phone: '+2348000001204',
  },
  halima: {
    userId: 'u-halima',
    displayName: 'Halima B.',
    memberSince: '2025-01-30T09:00:00Z',
    priorActions90d: 0,
    phone: '+2348000001205',
  },
  segun: {
    userId: 'u-segun',
    displayName: 'Segun F.',
    memberSince: '2025-09-12T09:00:00Z',
    priorActions90d: 3,
    phone: '+2348000001206',
  },
  zainab: {
    userId: 'u-zainab',
    displayName: 'Zainab M.',
    memberSince: '2025-04-18T09:00:00Z',
    priorActions90d: 0,
    phone: '+2348000001207',
  },
  tobi: {
    userId: 'u-tobi',
    displayName: 'Tobi O.',
    memberSince: '2025-07-07T09:00:00Z',
    priorActions90d: 0,
    phone: '+2348000001208',
  },
} satisfies Record<string, Member>

const party = (m: Member, role: PartyRef['role']): PartyRef => ({
  userId: m.userId,
  displayName: m.displayName,
  role,
  memberSince: m.memberSince,
  priorActions90d: m.priorActions90d,
})

const NEXT_ACTION: Record<CaseStatus, string | null> = {
  open: 'Assign an operator, then review the report',
  assigned: 'Review the report and decide what happens next',
  awaiting_info: 'Waiting for the member to reply',
  escalated: 'An administrator reviews this case',
  resolved: null,
  closed: null,
}

type CaseSeed = {
  id: string
  severity: Severity
  status: CaseStatus
  type: TargetType
  summary: string
  reasonCode: string
  minutesAgo: number
  assigneeId?: string | null
  reportCount?: number
  description?: string
  parties: [Member, PartyRef['role']][]
  content?: ContentRef | null
  messages?: string | null
  evidence?: { id: string; label: string }[]
  evidenceTtlSeconds?: number
  transactionId?: string | null
  notes?: { author: string; body: string; minutesAgo: number }[]
  decision?: { outcome: string; reasonCode: string; byId: string; minutesAgo: number }
  kind?: CaseRecord['kind']
  appeal?: CaseRecord['appeal']
  duplicateOf?: CaseRecord['duplicateOf']
}

const CASE_SEEDS: CaseSeed[] = [
  {
    id: SCENARIO.s1Unassigned,
    severity: 'S1',
    status: 'open',
    type: 'account',
    summary: 'Threatening messages after a cancelled swap',
    reasonCode: 'THREAT',
    minutesAgo: 18,
    reportCount: 3,
    description: 'He keeps messaging me that he knows where I live because I cancelled the swap.',
    parties: [
      [MEMBERS.ifeoma, 'reporter'],
      [MEMBERS.emeka, 'reported'],
    ],
    content: { type: 'account', id: MEMBERS.emeka.userId, text: 'Emeka C. · Lagos · 14 listings', redaction: null },
    messages: 'I know where you stay. You will regret cancelling.',
    evidence: [{ id: 'ev-201-1', label: 'Screenshot of messages' }],
  },
  {
    id: SCENARIO.paymentDispute,
    severity: 'S2',
    status: 'assigned',
    type: 'transaction',
    summary: 'Payment disagreement at handover',
    reasonCode: 'PAYMENT_DISPUTE',
    minutesAgo: 120,
    assigneeId: 's-agent',
    description: 'We met and swapped, but the ₦50,000 cash was not paid. He says he sent a transfer.',
    parties: [
      [MEMBERS.ada, 'participant_a'],
      [MEMBERS.kunle, 'participant_b'],
    ],
    transactionId: TX.paymentDispute,
    evidence: [
      { id: 'ev-202-1', label: 'Bank app screenshot' },
      { id: 'ev-202-2', label: 'Photo at handover' },
    ],
    messages: 'Kunle: I sent it by transfer. Ada: Nothing has arrived.',
    notes: [{ author: 'Chiamaka Eze', body: 'Asked both participants for receipts.', minutesAgo: 60 }],
  },
  {
    id: SCENARIO.partialTimeout,
    severity: 'S2',
    status: 'open',
    type: 'transaction',
    summary: 'Only one participant confirmed before the deadline',
    reasonCode: 'PAYMENT_DISPUTE',
    minutesAgo: 150,
    // Unassigned, so the partial-confirmation queue has work nobody has picked up
    assigneeId: null,
    description: 'I confirmed the exchange but the other person never did. The trade is stuck.',
    parties: [
      [MEMBERS.halima, 'participant_a'],
      [MEMBERS.tobi, 'participant_b'],
    ],
    transactionId: TX.partialTimeout,
  },
  {
    id: SCENARIO.expiredZeroOfTwo,
    severity: 'S4',
    status: 'assigned',
    type: 'transaction',
    summary: 'Item still reserved after the handover window passed',
    reasonCode: 'HELP',
    minutesAgo: 300,
    assigneeId: 's-agent',
    description: 'We never met. My bicycle is still reserved and I can’t accept other offers.',
    parties: [
      [MEMBERS.zainab, 'participant_a'],
      [MEMBERS.kunle, 'participant_b'],
    ],
    transactionId: TX.expiredZeroOfTwo,
  },
  {
    id: SCENARIO.disputedCancellation,
    severity: 'S2',
    status: 'assigned',
    type: 'transaction',
    summary: 'One participant cancelled, the other disputes it',
    reasonCode: 'MISREPRESENTED',
    minutesAgo: 200,
    assigneeId: 's-mod',
    description: 'She cancelled at the venue saying the phone had a cracked screen. It was in the photos.',
    parties: [
      [MEMBERS.tobi, 'participant_a'],
      [MEMBERS.ada, 'participant_b'],
    ],
    transactionId: TX.disputedCancellation,
    evidence: [{ id: 'ev-205-1', label: 'Listing photos' }],
  },
  {
    id: SCENARIO.bothConfirmed,
    severity: 'S2',
    status: 'open',
    type: 'transaction',
    summary: 'Both confirmed, then one says the item was not as described',
    reasonCode: 'MISREPRESENTED',
    minutesAgo: 240,
    assigneeId: null,
    description: 'We both confirmed but the laptop battery dies in ten minutes. It said good condition.',
    parties: [
      [MEMBERS.ifeoma, 'participant_a'],
      [MEMBERS.halima, 'participant_b'],
    ],
    transactionId: TX.bothConfirmed,
  },
  {
    id: SCENARIO.bothConfirmedBlocked,
    severity: 'S2',
    status: 'escalated',
    type: 'transaction',
    summary: 'Both confirmed while one participant is restricted',
    reasonCode: 'REPEATED_FRAUD',
    minutesAgo: 220,
    assigneeId: 's-mod',
    description: 'Confirmed exchange with a member who was restricted the same day.',
    parties: [
      [MEMBERS.segun, 'participant_a'],
      [MEMBERS.zainab, 'participant_b'],
    ],
    transactionId: TX.bothConfirmedBlocked,
  },
  {
    id: SCENARIO.redacted,
    severity: 'S3',
    status: 'open',
    type: 'listing',
    summary: 'Listing reported as a prohibited item',
    reasonCode: 'PROHIBITED',
    minutesAgo: 320,
    reportCount: 2,
    description: 'This looks like a real air rifle.',
    parties: [
      [MEMBERS.halima, 'reporter'],
      [MEMBERS.emeka, 'reported'],
    ],
    content: { type: 'listing', id: 'L-4410', text: null, redaction: 'removed_by_author' },
  },
  {
    id: SCENARIO.noEvidence,
    severity: 'S3',
    status: 'assigned',
    type: 'comment',
    summary: 'Comment reported as spam',
    reasonCode: 'SPAM',
    minutesAgo: 400,
    assigneeId: 's-mod',
    description: 'Same comment on every listing.',
    parties: [
      [MEMBERS.zainab, 'reporter'],
      [MEMBERS.tobi, 'reported'],
    ],
    content: { type: 'comment', id: 'C-5420', text: 'Cheap phones here, check my page!!!', redaction: null },
  },
  {
    id: SCENARIO.expiringEvidence,
    severity: 'S3',
    status: 'assigned',
    type: 'listing',
    summary: 'Listing photos do not match the item',
    reasonCode: 'MISLEADING',
    minutesAgo: 500,
    assigneeId: 's-mod',
    description: 'The photos are from a shop website, not the real item.',
    parties: [
      [MEMBERS.kunle, 'reporter'],
      [MEMBERS.halima, 'reported'],
    ],
    content: { type: 'listing', id: 'L-4502', text: 'Samsung 55" TV, like new', redaction: null },
    evidence: [
      { id: 'ev-210-1', label: 'Shop website screenshot' },
      { id: 'ev-210-2', label: 'Reverse image search result' },
    ],
    evidenceTtlSeconds: 30,
  },
  {
    id: SCENARIO.repeatOffender,
    severity: 'S3',
    status: 'open',
    type: 'account',
    summary: 'Account posting the same listing many times',
    reasonCode: 'SPAM',
    minutesAgo: 90,
    description: 'He has posted the same generator six times today.',
    parties: [
      [MEMBERS.ada, 'reporter'],
      [MEMBERS.segun, 'reported'],
    ],
    content: { type: 'account', id: MEMBERS.segun.userId, text: 'Segun F. · Ibadan · 31 listings', redaction: null },
  },
  {
    id: SCENARIO.overdue,
    severity: 'S2',
    status: 'assigned',
    type: 'listing',
    summary: 'Item described as new but arrived used',
    reasonCode: 'MISREPRESENTED',
    minutesAgo: 360,
    assigneeId: 's-mod',
    description: 'Listing said brand new in box. The box was opened and the item scratched.',
    parties: [
      [MEMBERS.tobi, 'reporter'],
      [MEMBERS.ifeoma, 'reported'],
    ],
    content: { type: 'listing', id: 'L-4388', text: 'Brand new blender, sealed', redaction: null },
  },
  {
    id: SCENARIO.closed,
    severity: 'S3',
    status: 'closed',
    type: 'feed_post',
    summary: 'Feed post reported as misleading',
    reasonCode: 'MISLEADING',
    minutesAgo: 3 * 24 * 60,
    assigneeId: 's-mod',
    description: 'Says free delivery but charges for it.',
    parties: [
      [MEMBERS.zainab, 'reporter'],
      [MEMBERS.kunle, 'reported'],
    ],
    content: { type: 'feed_post', id: 'F-901', text: 'Weekend deals! Delivery within Lagos.', redaction: null },
    decision: { outcome: 'no_violation', reasonCode: 'NO_VIOLATION', byId: 's-mod', minutesAgo: 2 * 24 * 60 },
  },
  {
    id: SCENARIO.resolved,
    severity: 'S2',
    status: 'resolved',
    type: 'transaction',
    summary: 'Neither participant came to the handover',
    reasonCode: 'HELP',
    minutesAgo: 4 * 24 * 60,
    assigneeId: 's-mod-2',
    description: 'Neither of us could make it. Please cancel.',
    parties: [
      [MEMBERS.emeka, 'participant_a'],
      [MEMBERS.zainab, 'participant_b'],
    ],
    decision: { outcome: 'cancelled', reasonCode: 'MUTUAL_CANCEL', byId: 's-admin', minutesAgo: 3 * 24 * 60 },
  },
  {
    id: SCENARIO.priceEditedAfterAcceptance,
    severity: 'S2',
    status: 'assigned',
    type: 'transaction',
    summary: 'Seller raised the price after the offer was accepted',
    reasonCode: 'MISREPRESENTED',
    minutesAgo: 180,
    assigneeId: 's-mod',
    description: 'We agreed ₦50,000 on top of my phone. Now the listing says ₦65,000 and he wants more.',
    parties: [
      [MEMBERS.kunle, 'participant_a'],
      [MEMBERS.emeka, 'participant_b'],
    ],
    transactionId: TX.priceEditedAfterAcceptance,
  },
  {
    id: SCENARIO.abusiveComment,
    severity: 'S3',
    status: 'assigned',
    type: 'comment',
    summary: 'Abusive comment on a listing',
    reasonCode: 'ABUSE',
    minutesAgo: 260,
    assigneeId: 's-mod',
    description: 'Insulting comment under my listing after I declined his offer.',
    parties: [
      [MEMBERS.halima, 'reporter'],
      [MEMBERS.segun, 'reported'],
    ],
    content: {
      type: 'comment',
      id: 'C-5501',
      text: 'Only a fool would price it like this. Useless seller.',
      redaction: null,
    },
  },
  {
    id: SCENARIO.appeal,
    severity: 'S3',
    status: 'open',
    type: 'account',
    summary: 'Restricted member appeals the restriction',
    reasonCode: 'ABUSE',
    minutesAgo: 1500,
    assigneeId: null,
    reportCount: 0,
    kind: 'appeal',
    description: 'Segun F. asks for his restriction to be lifted before it ends.',
    parties: [[MEMBERS.segun, 'appellant']],
    // The restriction's end is set from `now` when the seed is built
    appeal: {
      restrictedUntil: '',
      reasonCode: 'ABUSE',
      statement:
        'I lost my temper after a buyer insulted my price, and I am sorry. I have deleted nothing and will keep it polite. Please let me sell again.',
    },
  },
  {
    id: SCENARIO.expiringReservation,
    severity: 'S3',
    status: 'open',
    type: 'transaction',
    summary: 'Reservation expires soon with no confirmations',
    reasonCode: 'HELP',
    minutesAgo: 30,
    assigneeId: null,
    reportCount: 0,
    description: 'Opened by the system: the reservation ends within 24 hours and neither member has confirmed.',
    parties: [
      [MEMBERS.ifeoma, 'participant_a'],
      [MEMBERS.tobi, 'participant_b'],
    ],
    transactionId: TX.expiringReservation,
  },
]

/** Ordinary work so the queue has a realistic backlog and pages past 25 */
const FILLERS: [Severity, CaseStatus, TargetType, string, string, string | null, number][] = [
  ['S1', 'escalated', 'message', 'Member shared another member’s home address', 'DOXXING', 's-mod-2', 9],
  [
    'S2',
    'awaiting_info',
    'transaction',
    'Swap partner did not bring the agreed cash',
    'PAYMENT_DISPUTE',
    's-agent',
    330,
  ],
  ['S2', 'open', 'listing', 'Phone listed as new appears refurbished', 'MISREPRESENTED', null, 45],
  ['S3', 'open', 'listing', 'Same listing posted three times', 'DUPLICATE_LISTING', null, 600],
  ['S3', 'assigned', 'listing', 'Listing for prescription medicine', 'PROHIBITED', 's-mod-2', 700],
  ['S3', 'open', 'feed_post', 'Feed post advertising an outside shop', 'SPAM', null, 1500],
  ['S3', 'assigned', 'comment', 'Rude comment on a feed post', 'ABUSE', 's-mod', 30],
  ['S3', 'open', 'comment', 'Comment with a phone number for outside deals', 'SPAM', null, 200],
  ['S3', 'open', 'listing', 'Photos taken from another listing', 'MISLEADING', null, 9000],
  ['S4', 'open', 'account', 'Can’t edit a listing after an offer', 'HELP', null, 2880],
  ['S4', 'assigned', 'account', 'Asks how to cancel an accepted offer', 'HELP', 's-agent', 240],
  ['S4', 'assigned', 'account', 'Wants to change their display name', 'HELP', 's-agent-2', 1200],
  ['S4', 'open', 'account', 'Didn’t receive a sign-in code', 'HELP', null, 15],
  ['S3', 'closed', 'listing', 'Listing reported as duplicate', 'DUPLICATE_LISTING', 's-mod-2', 6000],
  ['S4', 'closed', 'account', 'Asked how reservations work', 'HELP', 's-agent', 5000],
  ['S3', 'resolved', 'transaction', 'Swap item had an undisclosed crack', 'MISREPRESENTED', 's-mod', 7000],
]

const FILLER_MEMBERS: Member[] = [MEMBERS.ada, MEMBERS.kunle, MEMBERS.ifeoma, MEMBERS.zainab, MEMBERS.tobi]

const terms = (
  a: [Member, string, string, string | null],
  b: [Member, string, string, string | null],
  cashKobo: number,
  cashDirection: OfferTerms['cashDirection'],
  ids: [string, string],
): OfferTerms => ({
  gives: {
    participant: 'A',
    displayName: a[0].displayName,
    items: [{ id: ids[0], title: a[1], condition: a[2], defects: a[3] }],
  },
  receives: {
    participant: 'B',
    displayName: b[0].displayName,
    items: [{ id: ids[1], title: b[1], condition: b[2], defects: b[3] }],
  },
  cashKobo,
  cashDirection,
})

export function buildSeed(now: number) {
  const iso = (minutesAgo: number) => new Date(now - minutesAgo * MINUTE).toISOString()
  const audit: AuditRecord[] = []
  let auditSeq = 0
  const log = (
    minutesAgo: number,
    actorId: string | null,
    action: string,
    target: AuditEntry['target'],
    links: { caseId?: string; transactionId?: string },
    extra: Partial<Pick<AuditEntry, 'reasonCode' | 'note' | 'before' | 'after'>> = {},
  ) => {
    auditSeq += 1
    audit.push({
      entry: {
        id: `A-${String(auditSeq).padStart(6, '0')}`,
        at: iso(minutesAgo),
        actor: actorId ? staffMember(actorId).displayName : 'System',
        action,
        target,
        reasonCode: extra.reasonCode ?? null,
        note: extra.note ?? null,
        before: extra.before ?? null,
        after: extra.after ?? null,
        caseId: links.caseId ?? null,
        transactionId: links.transactionId ?? null,
      },
      actorId,
      caseId: links.caseId ?? null,
      transactionId: links.transactionId ?? null,
      idempotencyKey: null,
    })
  }

  const fillerSeeds: CaseSeed[] = FILLERS.map(
    ([severity, status, type, summary, reasonCode, assigneeId, minutesAgo], i) => {
      const reporter = FILLER_MEMBERS[i % FILLER_MEMBERS.length]!
      const reported = FILLER_MEMBERS[(i + 2) % FILLER_MEMBERS.length]!
      const id = `NX-${String(217 + i).padStart(6, '0')}`
      const terminal = status === 'closed' || status === 'resolved'
      return {
        id,
        severity,
        status,
        type,
        summary,
        reasonCode,
        minutesAgo,
        assigneeId,
        description: summary,
        ...(id === SCENARIO.duplicate && {
          kind: 'duplicate' as const,
          duplicateOf: { kind: 'listings' as const, id: DUPLICATE_LISTING, label: 'Earlier listing of the same item' },
        }),
        parties: [
          [reporter, 'reporter'],
          [reported, 'reported'],
        ],
        content:
          type === 'transaction' || type === 'message'
            ? null
            : {
                type,
                // An account report is about the reported member themselves
                id: type === 'account' ? reported.userId : `${type.slice(0, 1).toUpperCase()}-${7000 + i}`,
                text: summary,
                redaction: null,
              },
        messages: type === 'message' ? 'My address is in the photo you sent around. Delete it.' : null,
        decision: terminal
          ? {
              outcome: status === 'resolved' ? 'cancelled' : 'no_violation',
              reasonCode: status === 'resolved' ? 'EVIDENCE_REVIEWED' : 'NO_VIOLATION',
              byId: assigneeId ?? 's-mod',
              minutesAgo: minutesAgo - 60,
            }
          : undefined,
      }
    },
  )

  const cases: CaseRecord[] = [...CASE_SEEDS, ...fillerSeeds].map((s) => {
    const openedMinutesAgo = s.minutesAgo
    const assignee = s.assigneeId ? staffMember(s.assigneeId) : null
    const caseTarget = { type: 'case' as const, id: s.id, label: `case ${s.id}` }
    log(openedMinutesAgo, null, 'open_case', caseTarget, { caseId: s.id }, { reasonCode: s.reasonCode })
    if (assignee) {
      log(
        openedMinutesAgo - 5,
        's-mod',
        'assign',
        caseTarget,
        { caseId: s.id },
        {
          before: { assignee: null },
          after: { assignee: assignee.displayName },
        },
      )
    }
    if (s.decision) {
      log(
        s.decision.minutesAgo,
        s.decision.byId,
        s.status === 'resolved' ? 'resolve' : 'close',
        caseTarget,
        { caseId: s.id },
        {
          reasonCode: s.decision.reasonCode,
          before: { status: 'assigned' },
          after: { status: s.status, outcome: s.decision.outcome },
        },
      )
    }
    const notes = (s.notes ?? []).map((n, i) => ({
      id: `${s.id}-note-${i + 1}`,
      author: n.author,
      body: n.body,
      at: iso(n.minutesAgo),
    }))
    const reportCount = s.reportCount ?? 1
    return {
      id: s.id,
      severity: s.severity,
      status: s.status,
      type: s.type,
      summary: s.summary,
      reasonCode: s.reasonCode,
      reportCount,
      openedAt: iso(openedMinutesAgo),
      dueAt: new Date(now - openedMinutesAgo * MINUTE + DUE_HOURS[s.severity] * HOUR).toISOString(),
      assignee,
      redaction: s.content?.redaction ?? null,
      kind: s.kind ?? 'report',
      appeal: s.appeal ? { ...s.appeal, restrictedUntil: new Date(now + RESTRICTED_FOR_MS).toISOString() } : null,
      duplicateOf: s.duplicateOf ?? null,
      version: 1,
      description: s.description ?? s.summary,
      reports: Array.from({ length: reportCount }, (_, i) => ({
        reporterName:
          i === 0 ? s.parties[0]![0].displayName : FILLER_MEMBERS[(i + 3) % FILLER_MEMBERS.length]!.displayName,
        at: iso(openedMinutesAgo - i * 4),
        reasonCode: s.reasonCode,
      })),
      parties: s.parties.map(([m, role]) => party(m, role)),
      content: s.content ?? null,
      hasPrivateMessages: Boolean(s.messages),
      evidence: s.evidence ?? [],
      transactionId: s.transactionId ?? null,
      notes,
      nextAction: NEXT_ACTION[s.status],
      decision: s.decision
        ? {
            outcome: s.decision.outcome,
            reasonCode: s.decision.reasonCode,
            by: staffMember(s.decision.byId).displayName,
            at: iso(s.decision.minutesAgo),
          }
        : null,
      secrets: {
        phones: Object.fromEntries(s.parties.map(([m]) => [m.userId, m.phone])),
        messages: s.messages ?? null,
        evidenceTtlSeconds: s.evidenceTtlSeconds ?? 600,
      },
    }
  })

  const reservation = (
    itemId: string,
    itemTitle: string,
    reservedMinutesAgo: number,
    hoursValid: number,
    releasable: boolean,
  ): Reservation => ({
    itemId,
    itemTitle,
    reservedAt: iso(reservedMinutesAgo),
    expiresAt: new Date(now - reservedMinutesAgo * MINUTE + hoursValid * HOUR).toISOString(),
    releasedAt: null,
    releaseReason: null,
    releasable,
  })

  type TxSeed = Omit<TransactionRecord, 'snapshot' | 'acceptedAt' | 'version' | 'secrets'> & {
    acceptedMinutesAgo: number
  }
  const confirmation = (
    participant: 'A' | 'B',
    m: Member,
    minutesAgo: number | null,
    inspected: boolean | null,
    cash: boolean | null,
  ) => ({
    participant,
    displayName: m.displayName,
    confirmedAt: minutesAgo === null ? null : iso(minutesAgo),
    inspectedItems: inspected,
    cashHandled: cash,
  })

  const ps5ForMac = terms(
    [MEMBERS.ada, 'PlayStation 5 console', 'Used, good', 'Small scratch on the side'],
    [MEMBERS.kunle, 'MacBook Air 2020', 'Used, good', null],
    5_000_000,
    'OffererPays',
    ['I-1101', 'I-1102'],
  )

  const txSeeds: TxSeed[] = [
    {
      id: TX.paymentDispute,
      status: 'DISPUTED',
      flags: ['DISPUTED'],
      confirmations: 1,
      terms: ps5ForMac,
      acceptedMinutesAgo: 1500,
      versions: [
        { number: 2, proposedBy: MEMBERS.ada.displayName, at: iso(1500), terms: ps5ForMac, state: 'accepted' },
        {
          number: 1,
          proposedBy: MEMBERS.ada.displayName,
          at: iso(1700),
          terms: { ...ps5ForMac, cashKobo: 3_000_000 },
          state: 'superseded',
        },
      ],
      confirmationEvents: [
        confirmation('A', MEMBERS.ada, 200, true, false),
        confirmation('B', MEMBERS.kunle, null, null, null),
      ],
      reservations: [
        reservation('I-1101', 'PlayStation 5 console', 1500, 72, false),
        reservation('I-1102', 'MacBook Air 2020', 1500, 72, false),
      ],
      caseIds: [SCENARIO.paymentDispute],
      allowedOutcomes: ['cancelled', 'administratively_resolved'],
    },
    {
      id: TX.partialTimeout,
      status: 'AWAITING_HANDOVER',
      flags: ['PARTIAL_CONFIRMATION_TIMEOUT'],
      confirmations: 1,
      terms: terms(
        [MEMBERS.halima, 'Office chair', 'Used, fair', 'Armrest loose'],
        [MEMBERS.tobi, 'Standing fan', 'Used, good', null],
        0,
        'None',
        ['I-1201', 'I-1202'],
      ),
      acceptedMinutesAgo: 4000,
      versions: [],
      confirmationEvents: [
        confirmation('A', MEMBERS.halima, 2600, true, null),
        confirmation('B', MEMBERS.tobi, null, null, null),
      ],
      reservations: [
        reservation('I-1201', 'Office chair', 4000, 48, false),
        reservation('I-1202', 'Standing fan', 4000, 48, false),
      ],
      caseIds: [SCENARIO.partialTimeout],
      allowedOutcomes: ['cancelled', 'administratively_resolved'],
    },
    {
      id: TX.expiredZeroOfTwo,
      status: 'AWAITING_HANDOVER',
      flags: ['EXPIRED_HANDOVER'],
      confirmations: 0,
      terms: terms(
        [MEMBERS.zainab, 'Mountain bicycle', 'Used, good', null],
        [MEMBERS.kunle, 'Electric keyboard', 'Used, fair', 'Two keys stick'],
        1_500_000,
        'OwnerPays',
        ['I-1301', 'I-1302'],
      ),
      acceptedMinutesAgo: 5000,
      versions: [],
      confirmationEvents: [
        confirmation('A', MEMBERS.zainab, null, null, null),
        confirmation('B', MEMBERS.kunle, null, null, null),
      ],
      reservations: [
        reservation('I-1301', 'Mountain bicycle', 5000, 72, true),
        reservation('I-1302', 'Electric keyboard', 5000, 72, true),
      ],
      caseIds: [SCENARIO.expiredZeroOfTwo],
      allowedOutcomes: ['cancelled', 'administratively_resolved'],
    },
    {
      id: TX.disputedCancellation,
      status: 'DISPUTED',
      flags: ['DISPUTED'],
      confirmations: 0,
      terms: terms(
        [MEMBERS.tobi, 'iPhone 12', 'Used, fair', 'Cracked screen corner'],
        [MEMBERS.ada, 'Galaxy Tab S7', 'Used, good', null],
        2_000_000,
        'OffererPays',
        ['I-1401', 'I-1402'],
      ),
      acceptedMinutesAgo: 900,
      versions: [],
      confirmationEvents: [
        confirmation('A', MEMBERS.tobi, null, null, null),
        confirmation('B', MEMBERS.ada, null, null, null),
      ],
      reservations: [
        reservation('I-1401', 'iPhone 12', 900, 72, false),
        reservation('I-1402', 'Galaxy Tab S7', 900, 72, true),
      ],
      caseIds: [SCENARIO.disputedCancellation],
      allowedOutcomes: ['cancelled', 'administratively_resolved'],
    },
    {
      id: TX.bothConfirmed,
      status: 'DISPUTED',
      flags: ['DISPUTED'],
      confirmations: 2,
      terms: terms(
        [MEMBERS.ifeoma, 'HP laptop', 'Used, good', null],
        [MEMBERS.halima, 'Canon camera', 'Used, good', 'Lens cap missing'],
        0,
        'None',
        ['I-1501', 'I-1502'],
      ),
      acceptedMinutesAgo: 2000,
      versions: [],
      confirmationEvents: [
        confirmation('A', MEMBERS.ifeoma, 400, true, null),
        confirmation('B', MEMBERS.halima, 390, true, null),
      ],
      reservations: [
        reservation('I-1501', 'HP laptop', 2000, 72, false),
        reservation('I-1502', 'Canon camera', 2000, 72, false),
      ],
      caseIds: [SCENARIO.bothConfirmed],
      allowedOutcomes: ['completed', 'cancelled', 'administratively_resolved'],
    },
    {
      id: TX.bothConfirmedBlocked,
      status: 'DISPUTED',
      flags: ['DISPUTED'],
      confirmations: 2,
      terms: terms(
        [MEMBERS.segun, 'Generator 2.5kVA', 'Used, fair', 'Pull cord frayed'],
        [MEMBERS.zainab, 'Sewing machine', 'Used, good', null],
        4_500_000,
        'OwnerPays',
        ['I-1601', 'I-1602'],
      ),
      acceptedMinutesAgo: 1800,
      versions: [],
      confirmationEvents: [
        confirmation('A', MEMBERS.segun, 250, true, true),
        confirmation('B', MEMBERS.zainab, 240, true, true),
      ],
      reservations: [
        reservation('I-1601', 'Generator 2.5kVA', 1800, 72, false),
        reservation('I-1602', 'Sewing machine', 1800, 72, false),
      ],
      caseIds: [SCENARIO.bothConfirmedBlocked],
      // A participant is restricted: the API withholds completion even with both confirmations
      allowedOutcomes: ['cancelled', 'administratively_resolved'],
    },
    {
      id: TX.priceEditedAfterAcceptance,
      status: 'AWAITING_HANDOVER',
      flags: [],
      confirmations: 0,
      terms: terms(
        [MEMBERS.kunle, 'Pixel 7 phone', 'Used, good', null],
        [MEMBERS.emeka, 'Sony soundbar', 'New', null],
        5_000_000,
        'OffererPays',
        ['I-1701', 'I-1702'],
      ),
      acceptedMinutesAgo: 600,
      versions: [],
      confirmationEvents: [
        confirmation('A', MEMBERS.kunle, null, null, null),
        confirmation('B', MEMBERS.emeka, null, null, null),
      ],
      reservations: [
        reservation('I-1701', 'Pixel 7 phone', 600, 72, false),
        reservation('I-1702', 'Sony soundbar', 600, 72, false),
      ],
      caseIds: [SCENARIO.priceEditedAfterAcceptance],
      allowedOutcomes: [],
    },
    {
      id: TX.expiringReservation,
      status: 'AWAITING_HANDOVER',
      flags: [],
      confirmations: 0,
      terms: terms(
        [MEMBERS.ifeoma, 'Office desk', 'Used, good', 'Scuffed top'],
        [MEMBERS.tobi, 'Bookshelf', 'Used, good', null],
        1_500_000,
        'OffererPays',
        ['I-1801', 'I-1802'],
      ),
      // Reserved 6 days 18 hours ago for 7 days: about 6 hours left
      acceptedMinutesAgo: 9720,
      versions: [],
      confirmationEvents: [
        confirmation('A', MEMBERS.ifeoma, null, null, null),
        confirmation('B', MEMBERS.tobi, null, null, null),
      ],
      reservations: [
        reservation('I-1801', 'Office desk', 9720, 168, false),
        reservation('I-1802', 'Bookshelf', 9720, 168, false),
      ],
      caseIds: [SCENARIO.expiringReservation],
      allowedOutcomes: ['cancelled', 'administratively_resolved'],
    },
  ]

  const transactions: TransactionRecord[] = txSeeds.map(({ acceptedMinutesAgo, ...tx }) => {
    log(
      acceptedMinutesAgo,
      null,
      'offer_accepted',
      { type: 'transaction', id: tx.id, label: `transaction ${tx.id}` },
      { transactionId: tx.id },
      {
        note: 'Agreement snapshot recorded',
      },
    )
    return {
      ...tx,
      acceptedAt: iso(acceptedMinutesAgo),
      snapshot: tx.terms,
      versions:
        tx.versions.length > 0
          ? tx.versions
          : [
              {
                number: 1,
                proposedBy: tx.terms.gives.displayName,
                at: iso(acceptedMinutesAgo),
                terms: tx.terms,
                state: 'accepted',
              },
            ],
      version: 1,
      secrets: { venue: 'Shoprite car park, Lekki Phase 1, Lagos' },
    }
  })

  return { cases, transactions, audit }
}
