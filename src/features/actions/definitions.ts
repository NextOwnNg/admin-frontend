import type { CaseActionId, CaseDetail, CloseOutcome } from '@/lib/api/types/cases'
import type { TargetType } from '@/lib/api/types/reference'
import type { TransactionDetail, TransactionOutcome } from '@/lib/api/types/transactions'
import type { StaffRole } from '@/lib/copy/labels'
import { TARGET_TYPE_LABELS } from '@/lib/copy/labels'

/**
 * Every privileged action, in one place so Phase C reuses them (design §4.5, §9a). Which roles may take
 * an action here is for display only: the API refuses the rest either way.
 */

export type ActionId = CaseActionId | 'resolve' | 'release'
export type ActionField = 'note' | 'message' | 'durationDays' | 'outcome' | 'item'

export type ActionContext =
  { kind: 'case'; caseDetail: CaseDetail } | { kind: 'transaction'; tx: TransactionDetail; caseId?: string }

export type ActionTarget = { type: TargetType; id: string; label: string }

/** What the form holds when the operator continues */
export type ActionValues = {
  targetId: string
  reasonCode?: string
  note?: string
  message?: string
  durationDays?: '1' | '3' | '7' | '30'
  outcome?: string
  itemId?: string
}

export type CopyContext = { target: ActionTarget; values: ActionValues; context: ActionContext }

export type ActionDefinition = {
  id: ActionId
  label: string
  roles: StaffRole[]
  targetTypes: TargetType[]
  /** `by_outcome`: a violation code when action was taken, a decision code otherwise */
  reasonKind: 'violation' | 'decision' | 'by_outcome' | null
  destructive: boolean
  fields: ActionField[]
  /** Fields the operator must fill (the reason is required whenever `reasonKind` is set) */
  required: ActionField[]
  confirmTitle: (ctx: CopyContext) => string
  consequence: (ctx: CopyContext) => string
}

const MODERATORS: StaffRole[] = ['moderator', 'administrator']
/** Public content: private messages are never hidden or removed from the console */
const CONTENT: TargetType[] = ['listing', 'comment', 'feed_post']

export const CLOSE_OUTCOMES: Record<CloseOutcome, string> = {
  no_violation: 'No violation',
  action_taken: 'Action taken',
  duplicate: 'Duplicate report',
}

const days = (values: ActionValues) => (values.durationDays === '1' ? '1 day' : `${values.durationDays ?? ''} days`)
const reservationTitle = ({ context, values }: CopyContext) =>
  context.kind === 'transaction'
    ? (context.tx.reservations.find((r) => r.itemId === values.itemId)?.itemTitle ?? 'this item')
    : 'this item'

const RESOLVE_CONSEQUENCE: Record<TransactionOutcome, string> = {
  completed: 'The transaction is marked completed: both participants confirmed it.',
  cancelled: 'The transaction is cancelled and its items become available to new offers.',
  administratively_resolved: 'The transaction closes without completion and its items become available again.',
}

export const ACTIONS: ActionDefinition[] = [
  {
    id: 'hide',
    label: 'Hide content',
    roles: MODERATORS,
    targetTypes: CONTENT,
    reasonKind: 'violation',
    destructive: false,
    fields: ['note'],
    required: [],
    confirmTitle: ({ target }) => `Hide ${target.label}?`,
    consequence: () => "It won't be visible to members.",
  },
  {
    id: 'remove',
    label: 'Remove content',
    roles: MODERATORS,
    targetTypes: CONTENT,
    reasonKind: 'violation',
    destructive: true,
    fields: ['note'],
    required: [],
    confirmTitle: ({ target }) => `Remove ${target.label}?`,
    consequence: () => "It will be removed for everyone. This can't be undone.",
  },
  {
    id: 'warn',
    label: 'Warn account',
    roles: MODERATORS,
    targetTypes: ['account'],
    reasonKind: 'violation',
    destructive: false,
    fields: ['message', 'note'],
    required: ['message'],
    confirmTitle: ({ target }) => `Warn ${target.label}?`,
    consequence: () => "They'll see this warning next time they sign in.",
  },
  {
    id: 'restrict',
    label: 'Restrict account',
    roles: MODERATORS,
    targetTypes: ['account'],
    reasonKind: 'violation',
    destructive: true,
    fields: ['durationDays', 'note'],
    required: ['durationDays'],
    confirmTitle: ({ target, values }) => `Restrict ${target.label} for ${days(values)}?`,
    consequence: () => "They won't be able to list, offer or comment.",
  },
  {
    id: 'lift_restriction',
    label: 'Lift restriction',
    roles: MODERATORS,
    targetTypes: ['account'],
    reasonKind: 'decision',
    destructive: false,
    fields: ['note'],
    required: [],
    confirmTitle: ({ target }) => `Lift the restriction on ${target.label}?`,
    consequence: () => 'They can list, offer and comment again.',
  },
  {
    id: 'close',
    label: 'Close report',
    roles: MODERATORS,
    targetTypes: ['case'],
    reasonKind: 'by_outcome',
    destructive: false,
    fields: ['outcome', 'note'],
    required: ['outcome'],
    confirmTitle: ({ target }) => `Close ${target.label}?`,
    consequence: () => 'The case will close. Reporters are told it was reviewed.',
  },
  {
    id: 'request_info',
    label: 'Request information',
    roles: ['support_agent', 'moderator', 'administrator'],
    targetTypes: ['case'],
    reasonKind: null,
    destructive: false,
    fields: ['message', 'note'],
    required: ['message'],
    confirmTitle: () => 'Ask for more information?',
    consequence: () => 'The members on the case get your message. The case waits for a reply.',
  },
  {
    id: 'escalate',
    label: 'Escalate',
    roles: ['support_agent', 'moderator'],
    targetTypes: ['case'],
    reasonKind: null,
    destructive: false,
    fields: ['note'],
    required: ['note'],
    confirmTitle: ({ target }) => `Escalate ${target.label}?`,
    consequence: () => 'Administrators see it as escalated. It stays assigned to the same person.',
  },
  {
    id: 'propose',
    label: 'Record decision',
    roles: ['support_agent'],
    targetTypes: ['case'],
    reasonKind: null,
    destructive: false,
    fields: ['outcome', 'note'],
    required: ['outcome', 'note'],
    confirmTitle: () => 'Record your proposed decision?',
    consequence: () => "It's added as a note for a moderator to act on. Nothing else changes yet.",
  },
  {
    id: 'resolve',
    label: 'Resolve transaction',
    roles: ['administrator'],
    targetTypes: ['transaction'],
    reasonKind: 'decision',
    destructive: false,
    fields: ['outcome', 'note'],
    required: ['outcome'],
    confirmTitle: ({ target }) => `Resolve ${target.label}?`,
    consequence: ({ values }) =>
      RESOLVE_CONSEQUENCE[values.outcome as TransactionOutcome] ?? 'The transaction will be resolved.',
  },
  {
    id: 'release',
    label: 'Release item',
    roles: ['administrator'],
    targetTypes: ['transaction'],
    reasonKind: 'decision',
    destructive: false,
    fields: ['item', 'note'],
    required: ['item'],
    confirmTitle: (ctx) => `Release ${reservationTitle(ctx)}?`,
    consequence: () => 'The item becomes available to new offers.',
  },
]

const isTerminalCase = (c: CaseDetail) => c.status === 'resolved' || c.status === 'closed'

/** Who or what an action can apply to in this context: content, the parties' accounts, or the record itself. */
export function targetsFor(definition: ActionDefinition, context: ActionContext): ActionTarget[] {
  if (context.kind === 'transaction') {
    return definition.targetTypes.includes('transaction')
      ? [{ type: 'transaction', id: context.tx.id, label: `transaction ${context.tx.id}` }]
      : []
  }
  const c = context.caseDetail
  const targets: ActionTarget[] = []
  if (definition.targetTypes.includes('case')) targets.push({ type: 'case', id: c.id, label: `case ${c.id}` })
  if (c.content && !c.content.redaction && definition.targetTypes.includes(c.content.type)) {
    targets.push({
      type: c.content.type,
      id: c.content.id,
      label: `${TARGET_TYPE_LABELS[c.content.type].toLowerCase()} ${c.content.id}`,
    })
  }
  if (definition.targetTypes.includes('account')) {
    // The reported member first: the usual subject of an account action
    const parties = [...c.parties].sort((a, b) => Number(b.role === 'reported') - Number(a.role === 'reported'))
    for (const p of parties) targets.push({ type: 'account', id: p.userId, label: p.displayName })
  }
  return targets
}

/** The actions this role may take here, labelled for the context (design §5.4: never shown disabled). */
export function actionsFor(roles: readonly StaffRole[], context: ActionContext): ActionDefinition[] {
  const allowed = ACTIONS.filter((a) => a.roles.some((r) => roles.includes(r)))
  if (context.kind === 'case') {
    const { status } = context.caseDetail
    if (isTerminalCase(context.caseDetail)) return []
    return allowed.filter(
      (a) =>
        a.id !== 'resolve' &&
        a.id !== 'release' &&
        // Nothing to do when the case is already there
        !(a.id === 'escalate' && status === 'escalated') &&
        !(a.id === 'request_info' && status === 'awaiting_info') &&
        targetsFor(a, context).length > 0,
    )
  }
  const { tx } = context
  return allowed.flatMap((a) => {
    if (a.id === 'resolve' && tx.flags.length > 0 && tx.allowedOutcomes.length > 0) {
      return [{ ...a, label: tx.flags.includes('DISPUTED') ? 'Resolve dispute' : 'Resolve transaction' }]
    }
    if (a.id === 'release' && tx.reservations.some((r) => r.releasable && !r.releasedAt)) return [a]
    return []
  })
}

/** The kind of reason code the form needs now */
export function reasonKindFor(definition: ActionDefinition, values: Pick<ActionValues, 'outcome'>) {
  if (definition.reasonKind !== 'by_outcome') return definition.reasonKind
  return values.outcome === 'action_taken' ? 'violation' : 'decision'
}
