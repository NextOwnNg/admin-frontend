import type { ReasonCode, TargetType } from '@/lib/api/types/reference'

/** DRAFT reason codes (design §5.3, §9a.6) served by the mock API until the real list exists. */

const CONTENT: TargetType[] = ['listing', 'comment', 'feed_post', 'message']
const PEOPLE: TargetType[] = ['account', 'case']
const ANY: TargetType[] = ['account', 'listing', 'comment', 'feed_post', 'message', 'transaction', 'case']

export const REASON_CODES: ReasonCode[] = [
  {
    code: 'THREAT',
    label: 'Threats or harassment',
    severity: 'S1',
    kind: 'violation',
    appliesTo: [...CONTENT, ...PEOPLE],
  },
  {
    code: 'DOXXING',
    label: 'Sharing private information',
    severity: 'S1',
    kind: 'violation',
    appliesTo: [...CONTENT, ...PEOPLE],
  },
  {
    code: 'STOLEN_GOODS',
    label: 'Suspected stolen goods',
    severity: 'S1',
    kind: 'violation',
    appliesTo: ['listing', ...PEOPLE],
  },
  {
    code: 'PAYMENT_DISPUTE',
    label: 'Payment disagreement',
    severity: 'S2',
    kind: 'violation',
    appliesTo: ['transaction', ...PEOPLE],
  },
  {
    code: 'MISREPRESENTED',
    label: 'Misrepresented item',
    severity: 'S2',
    kind: 'violation',
    appliesTo: ['listing', 'transaction', ...PEOPLE],
  },
  { code: 'REPEATED_FRAUD', label: 'Repeated fraud reports', severity: 'S2', kind: 'violation', appliesTo: PEOPLE },
  {
    code: 'PROHIBITED',
    label: 'Prohibited item',
    severity: 'S3',
    kind: 'violation',
    appliesTo: ['listing', 'feed_post', ...PEOPLE],
  },
  { code: 'SPAM', label: 'Spam', severity: 'S3', kind: 'violation', appliesTo: [...CONTENT, ...PEOPLE] },
  {
    code: 'DUPLICATE_LISTING',
    label: 'Duplicate listing',
    severity: 'S3',
    kind: 'violation',
    appliesTo: ['listing', 'case'],
  },
  { code: 'ABUSE', label: 'Abusive language', severity: 'S3', kind: 'violation', appliesTo: [...CONTENT, ...PEOPLE] },
  {
    code: 'MISLEADING',
    label: 'Misleading listing',
    severity: 'S3',
    kind: 'violation',
    appliesTo: ['listing', 'feed_post', 'case'],
  },
  { code: 'HELP', label: 'General help', severity: 'S4', kind: 'violation', appliesTo: ANY },
  {
    code: 'RESTRICTION_UPHELD',
    label: 'Restriction stays in place',
    severity: null,
    kind: 'decision',
    appliesTo: ['case'],
    caseKinds: ['appeal'],
  },
  {
    code: 'NOT_A_DUPLICATE',
    label: 'Not a duplicate',
    severity: null,
    kind: 'decision',
    appliesTo: ['case'],
    caseKinds: ['duplicate'],
  },
  {
    code: 'BOTH_CONFIRMED',
    label: 'Both participants confirmed',
    severity: null,
    kind: 'decision',
    appliesTo: ['transaction'],
  },
  {
    code: 'MUTUAL_CANCEL',
    label: 'Both participants agreed to cancel',
    severity: null,
    kind: 'decision',
    appliesTo: ['transaction'],
  },
  {
    code: 'EVIDENCE_REVIEWED',
    label: 'Decided on the evidence',
    severity: null,
    kind: 'decision',
    appliesTo: ['transaction', 'account', 'case'],
  },
  {
    code: 'NO_RESPONSE',
    label: 'No response from a participant',
    severity: null,
    kind: 'decision',
    appliesTo: ['transaction'],
  },
  {
    code: 'NO_VIOLATION',
    label: 'No rule was broken',
    severity: null,
    kind: 'decision',
    appliesTo: ['case', 'account'],
  },
  {
    code: 'DUPLICATE_REPORT',
    label: 'Already handled in another case',
    severity: null,
    kind: 'decision',
    appliesTo: ['case'],
  },
]
