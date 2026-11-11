import { http, HttpResponse, type RequestHandler } from 'msw'
import type { AuditEntry } from '@/lib/api/types/audit'
import { CLOSE_OUTCOMES } from '@/features/actions/definitions'
import type {
  AssignBody,
  CaseActionBody,
  CaseActionId,
  CloseOutcome,
  NoteBody,
  RevealBody,
} from '@/lib/api/types/cases'
import type { TargetType } from '@/lib/api/types/reference'
import type { ReleaseBody, ResolutionBody, TransactionOutcome } from '@/lib/api/types/transactions'
import type { StaffRole } from '@/lib/copy/labels'
import { TRANSACTION_OUTCOME, type CaseStatus, type TransactionStatus } from '@/lib/copy/status'
import { apiBaseUrl } from '@/lib/env'
import { auditDb } from '@/mocks/db/audit'
import { exceptionsDb } from '@/mocks/db/exceptions'
import { canSee, casesDb, type Viewer } from '@/mocks/db/cases'
import { store } from '@/mocks/db/store'
import { transactionsDb } from '@/mocks/db/transactions'
import { REASON_CODES } from '@/mocks/fixtures/reason-codes'
import { STAFF } from '@/mocks/fixtures/staff'
import type { CaseRecord, TransactionRecord } from '@/mocks/seed'
import { error } from '@/mocks/handlers/http'
import { idempotent } from '@/mocks/handlers/idempotent'
import { canSeeTransaction } from '@/mocks/handlers/transactions'
import { forbidden, hasRole, notFound, signedIn } from '@/mocks/handlers/viewer'

const API = `${apiBaseUrl}/admin`
const MIN_REASON = 10

type Signed = Viewer & { displayName: string }

const invalid = (field: string, message: string) =>
  error(422, 'VALIDATION_ERROR', 'Check the highlighted fields', { fieldErrors: { [field]: message } })
const conflict = (version: number) =>
  error(409, 'CONFLICT', 'The record changed since it was read', { details: { version } })

const NEXT_ACTION: Partial<Record<CaseStatus, string>> = {
  open: 'Assign an operator, then review the report',
  assigned: 'Review the report and decide what happens next',
  awaiting_info: 'Waiting for the member to reply',
  escalated: 'An administrator reviews this case',
}

function setStatus(c: CaseRecord, status: CaseStatus) {
  c.status = status
  c.nextAction = NEXT_ACTION[status] ?? null
}

/** Restrictions show on the member's record too */
function setRestriction(memberId: string, until: string | null) {
  const member = store().records.members.find((m) => m.id === memberId)
  if (member) member.restrictedUntil = until
}

/** Whether a case is in an exception queue right now */
const isException = (c: CaseRecord) => exceptionsDb.queueOf(c, Date.now()) !== null

const isTerminal = (c: CaseRecord) => c.status === 'resolved' || c.status === 'closed'

/** Who may take each case action (design §4.5) */
const ACTION_ROLES: Record<CaseActionId, StaffRole[]> = {
  hide: ['moderator', 'administrator'],
  remove: ['moderator', 'administrator'],
  warn: ['moderator', 'administrator'],
  restrict: ['moderator', 'administrator'],
  lift_restriction: ['moderator', 'administrator'],
  close: ['moderator', 'administrator'],
  request_info: ['support_agent', 'moderator', 'administrator'],
  escalate: ['support_agent', 'moderator'],
  propose: ['support_agent'],
}

/** The reason-code kind each action needs, or null when it needs none (design §9a.6) */
function reasonKindFor(body: CaseActionBody): 'violation' | 'decision' | null {
  switch (body.action) {
    case 'hide':
    case 'remove':
    case 'warn':
    case 'restrict':
      return 'violation'
    case 'lift_restriction':
      return 'decision'
    case 'close':
      return body.outcome === 'action_taken' ? 'violation' : 'decision'
    default:
      return null
  }
}

const reasonFits = (
  code: string | undefined,
  kind: 'violation' | 'decision',
  target: TargetType,
  caseKind?: CaseRecord['kind'],
) =>
  REASON_CODES.some(
    (r) =>
      r.code === code &&
      r.kind === kind &&
      r.appliesTo.includes(target) &&
      (!r.caseKinds || (caseKind !== undefined && r.caseKinds.includes(caseKind))),
  )

/** A proposed outcome in words: a close outcome on a report, a transaction outcome on a transaction case */
const proposedLabel = (outcome: unknown) =>
  CLOSE_OUTCOMES[outcome as CloseOutcome] ?? TRANSACTION_OUTCOME[outcome as TransactionOutcome] ?? String(outcome)

const reasonLabel = (code: string) => REASON_CODES.find((r) => r.code === code)?.label ?? code

function targetLabel(c: CaseRecord, target: CaseActionBody['target']): string | null {
  if (target.type === 'case') return target.id === c.id ? `case ${c.id}` : null
  if (target.type === 'account') return c.parties.find((p) => p.userId === target.id)?.displayName ?? null
  if (c.content && c.content.type === target.type && c.content.id === target.id) {
    return `${target.type.replace('_', ' ')} ${target.id}`
  }
  return null
}

const nonEmpty = (value: unknown, max = 2000): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max

function caseAction(c: CaseRecord, body: CaseActionBody, viewer: Signed): Response {
  if (!ACTION_ROLES[body.action]?.some((r) => viewer.roles.includes(r))) return forbidden()
  // A stale writer gets a conflict first, whatever changed
  if (body.expectedVersion !== c.version) return conflict(c.version)
  if (isTerminal(c)) return error(422, 'VALIDATION_ERROR', 'This case is already closed')

  const label = targetLabel(c, body.target)
  const contentAction = body.action === 'hide' || body.action === 'remove'
  const accountAction = ['warn', 'restrict', 'lift_restriction'].includes(body.action)
  if (!label || (contentAction && !c.content) || (accountAction && body.target.type !== 'account')) {
    return invalid('target', 'Choose who or what this action applies to.')
  }
  if (contentAction && body.target.type === 'account') return invalid('target', 'Choose the reported content.')

  const kind = reasonKindFor(body)
  if (kind && !reasonFits(body.reasonCode, kind, body.target.type, c.kind)) {
    return invalid('reasonCode', 'Choose a reason that fits this action.')
  }
  if ((body.action === 'warn' || body.action === 'request_info') && !nonEmpty(body.message)) {
    return invalid('message', 'Write the message the member will see.')
  }
  if ((body.action === 'escalate' || body.action === 'propose') && !nonEmpty(body.note)) {
    return invalid('note', 'Add a note for the next person.')
  }
  if (body.action === 'restrict' && ![1, 3, 7, 30].includes(body.durationDays ?? 0)) {
    return invalid('durationDays', 'Choose how long the restriction lasts.')
  }
  if (
    body.action === 'close' &&
    !['no_violation', 'action_taken', 'duplicate', 'upheld'].includes(body.outcome ?? '')
  ) {
    return invalid('outcome', 'Choose the outcome.')
  }

  const before: Record<string, unknown> = { status: c.status }
  const after: Record<string, unknown> = {}
  switch (body.action) {
    case 'hide':
    case 'remove':
      before.content = 'visible'
      {
        const redaction = body.action === 'hide' ? 'hidden_by_moderation' : 'removed_by_moderation'
        c.content = { ...c.content!, text: null, redaction }
        c.redaction = redaction
      }
      after.content = body.action === 'hide' ? 'hidden' : 'removed'
      break
    case 'restrict':
      after.restrictedForDays = body.durationDays
      setRestriction(body.target.id, new Date(Date.now() + (body.durationDays ?? 0) * 86_400_000).toISOString())
      break
    case 'warn':
      after.warning = body.message
      break
    case 'close':
      setStatus(c, 'closed')
      c.decision = {
        outcome: body.outcome!,
        reasonCode: body.reasonCode!,
        by: viewer.displayName,
        at: new Date().toISOString(),
      }
      after.outcome = body.outcome
      break
    case 'request_info':
      setStatus(c, 'awaiting_info')
      after.message = body.message
      break
    case 'escalate':
      setStatus(c, 'escalated')
      break
    case 'propose':
      c.notes.push({
        id: `${c.id}-note-${c.notes.length + 1}`,
        author: viewer.displayName,
        body: `Proposed outcome: ${proposedLabel(body.outcome)}. ${body.note ?? ''}`.trim(),
        at: new Date().toISOString(),
      })
      after.proposedOutcome = body.outcome
      break
    case 'lift_restriction':
      after.restricted = false
      setRestriction(body.target.id, null)
      // Every appeal by this member now reads as lifted, open or closed
      for (const other of store().cases) {
        if (other.appeal && other.parties.some((p) => p.userId === body.target.id)) {
          other.appeal.liftedAt = new Date().toISOString()
        }
      }
      break
  }
  after.status = c.status
  c.version += 1

  const auditEntry = record(
    viewer,
    body.action,
    { type: body.target.type, id: body.target.id, label },
    {
      caseId: c.id,
      reasonCode: body.reasonCode ?? null,
      note: body.note ?? null,
      before,
      after,
    },
  )
  return HttpResponse.json({ case: casesDb.detail(c.id), auditEntry })
}

let pendingKey: string | null = null

function record(
  viewer: Signed,
  action: string,
  target: AuditEntry['target'],
  extra: { caseId?: string | null; transactionId?: string | null } & Partial<
    Pick<AuditEntry, 'reasonCode' | 'note' | 'before' | 'after'>
  >,
): AuditEntry {
  return auditDb.append({
    entry: {
      actor: viewer.displayName,
      action,
      target,
      reasonCode: extra.reasonCode ?? null,
      note: extra.note ?? null,
      before: extra.before ?? null,
      after: extra.after ?? null,
    },
    actorId: viewer.staffId,
    caseId: extra.caseId ?? null,
    transactionId: extra.transactionId ?? null,
    idempotencyKey: pendingKey,
  })
}

const OUTCOME_STATUS: Record<TransactionOutcome, TransactionStatus> = {
  completed: 'COMPLETED',
  cancelled: 'RESOLVED_BY_SUPPORT_CANCELLED',
  administratively_resolved: 'RESOLVED_BY_SUPPORT_NO_COMPLETION',
}

function resolveTransaction(tx: TransactionRecord, body: ResolutionBody, viewer: Signed): Response {
  if (!hasRole(viewer, 'administrator')) return forbidden()
  if (body.expectedVersion !== tx.version) return conflict(tx.version)
  if (!tx.allowedOutcomes.includes(body.outcome))
    return invalid('outcome', 'This outcome isn’t allowed for this transaction.')
  if (!reasonFits(body.reasonCode, 'decision', 'transaction')) return invalid('reasonCode', 'Choose a reason.')

  const now = new Date().toISOString()
  const before = { status: tx.status, flags: tx.flags }
  tx.status = OUTCOME_STATUS[body.outcome]
  tx.flags = []
  tx.allowedOutcomes = []
  // Without a completion the items go back on the market
  if (body.outcome !== 'completed') {
    for (const r of tx.reservations.filter((r) => !r.releasedAt)) {
      Object.assign(r, { releasedAt: now, releaseReason: TRANSACTION_OUTCOME[body.outcome], releasable: false })
    }
  }
  tx.version += 1

  for (const caseId of tx.caseIds) {
    const c = casesDb.record(caseId)
    if (!c || isTerminal(c)) continue
    setStatus(c, 'resolved')
    c.decision = { outcome: body.outcome, reasonCode: body.reasonCode, by: viewer.displayName, at: now }
    c.version += 1
  }

  const auditEntry = record(
    viewer,
    'resolve',
    { type: 'transaction', id: tx.id, label: `transaction ${tx.id}` },
    {
      caseId: tx.caseIds[0] ?? null,
      transactionId: tx.id,
      reasonCode: body.reasonCode,
      note: body.note ?? null,
      before,
      after: { status: tx.status, outcome: body.outcome },
    },
  )
  return HttpResponse.json({ transaction: transactionsDb.detail(tx.id), auditEntry })
}

function releaseItem(tx: TransactionRecord, body: ReleaseBody, viewer: Signed): Response {
  if (!hasRole(viewer, 'administrator')) return forbidden()
  if (body.expectedVersion !== tx.version) return conflict(tx.version)
  const reservation = tx.reservations.find((r) => r.itemId === body.itemId)
  if (!reservation?.releasable || reservation.releasedAt) return invalid('itemId', 'This item can’t be released now.')
  if (!reasonFits(body.reasonCode, 'decision', 'transaction')) return invalid('reasonCode', 'Choose a reason.')

  Object.assign(reservation, {
    releasedAt: new Date().toISOString(),
    releaseReason: `Released by support: ${reasonLabel(body.reasonCode)}`,
    releasable: false,
  })
  tx.version += 1
  const auditEntry = record(
    viewer,
    'release',
    { type: 'transaction', id: tx.id, label: `transaction ${tx.id}` },
    {
      caseId: tx.caseIds[0] ?? null,
      transactionId: tx.id,
      reasonCode: body.reasonCode,
      note: body.note ?? null,
      before: { item: reservation.itemTitle, reserved: true },
      after: { item: reservation.itemTitle, reserved: false },
    },
  )
  return HttpResponse.json({ transaction: transactionsDb.detail(tx.id), auditEntry })
}

const reasonOk = (reason: unknown): reason is string => typeof reason === 'string' && reason.trim().length >= MIN_REASON
const shortReason = () => invalid('reason', `Give a reason of at least ${MIN_REASON} characters.`)

function revealCase(c: CaseRecord, body: RevealBody, viewer: Signed): Response {
  if (!reasonOk(body.reason)) return shortReason()
  let result: { value?: string; url?: string; expiresAt?: string }
  if (body.field === 'phone') {
    const phone = body.subjectId ? c.secrets.phones[body.subjectId] : undefined
    if (!phone) return notFound()
    result = { value: phone }
  } else if (body.field === 'messages') {
    if (!c.secrets.messages) return notFound()
    result = { value: c.secrets.messages }
  } else if (body.field === 'evidence') {
    if (!c.evidence.some((e) => e.id === body.subjectId)) return notFound()
    result = {
      url: `https://evidence.example.com/${body.subjectId}?signature=mock`,
      expiresAt: new Date(Date.now() + c.secrets.evidenceTtlSeconds * 1000).toISOString(),
    }
  } else {
    return invalid('field', 'Unknown field')
  }
  record(
    viewer,
    `view_${body.field}`,
    { type: 'case', id: c.id, label: `case ${c.id}` },
    {
      caseId: c.id,
      note: body.reason.trim(),
      after: body.subjectId ? { subject: body.subjectId } : null,
    },
  )
  return HttpResponse.json(result)
}

type Handler = (args: {
  request: Request
  params: Record<string, string | readonly string[] | undefined>
}) => Promise<Response>

/** Signed in, the record exists and is visible, then an idempotent write */
function caseWrite<B>(
  write: (c: CaseRecord, body: B, viewer: Signed) => Response,
  /** Lets a write reach a case the viewer can't otherwise see (a support agent taking an exception) */
  mayReach: (c: CaseRecord, viewer: Signed) => boolean = () => false,
): Handler {
  return async ({ request, params }) => {
    const auth = await signedIn()
    if ('failure' in auth) return auth.failure
    const c = casesDb.record(String(params.id))
    if (!c) return notFound()
    if (!canSee(auth.viewer, c) && !mayReach(c, auth.viewer)) return forbidden()
    const body = (await request.json()) as B
    return idempotent(request, c.id, () => withKey(request, () => write(c, body, auth.viewer)))
  }
}

function transactionWrite<B>(write: (tx: TransactionRecord, body: B, viewer: Signed) => Response): Handler {
  return async ({ request, params }) => {
    const auth = await signedIn()
    if ('failure' in auth) return auth.failure
    const id = String(params.id)
    if (!canSeeTransaction(auth.viewer, id, new URL(request.url).searchParams.get('caseId'))) return forbidden()
    const tx = transactionsDb.record(id)
    if (!tx) return notFound()
    const body = (await request.json()) as B
    return idempotent(request, tx.id, () => withKey(request, () => write(tx, body, auth.viewer)))
  }
}

/** Audit entries written during this request carry its Idempotency-Key */
function withKey(request: Request, write: () => Response): Response {
  pendingKey = request.headers.get('Idempotency-Key')
  try {
    return write()
  } finally {
    pendingKey = null
  }
}

export const writeHandlers: RequestHandler[] = [
  http.post(
    `${API}/cases/:id/assign`,
    caseWrite<AssignBody>(
      (c, body, viewer) => {
        // Support agents may take an exception for themselves (Phase C design §4.4, call 3); nothing else
        const selfTake =
          hasRole(viewer, 'support_agent') &&
          body.assigneeId === viewer.staffId &&
          isException(c) &&
          (c.assignee === null || c.assignee.staffId === viewer.staffId)
        // A stale version first: losing a race reads as "it changed", not as a refusal
        if (body.expectedVersion !== c.version) return conflict(c.version)
        // Resolved meanwhile: say so, whoever asked, rather than refusing an agent who could have taken it
        if (isTerminal(c)) return error(409, 'CASE_RESOLVED', 'This case was already resolved.')
        if (!hasRole(viewer, 'moderator', 'administrator') && !selfTake) return forbidden()
        const assignee = body.assigneeId === null ? null : STAFF.find((s) => s.staffId === body.assigneeId)
        if (assignee === undefined) return invalid('assigneeId', 'Choose someone on the staff list.')
        if (isTerminal(c)) return error(422, 'VALIDATION_ERROR', 'This case is already closed')

        const before = { assignee: c.assignee?.displayName ?? null }
        c.assignee = assignee
        if (assignee && c.status === 'open') setStatus(c, 'assigned')
        if (!assignee && c.status === 'assigned') setStatus(c, 'open')
        c.version += 1
        record(
          viewer,
          assignee ? 'assign' : 'unassign',
          { type: 'case', id: c.id, label: `case ${c.id}` },
          {
            caseId: c.id,
            before,
            after: { assignee: assignee?.displayName ?? null },
          },
        )
        return HttpResponse.json(casesDb.detail(c.id))
      },
      // An agent may take an exception; one resolved meanwhile (unassigned or theirs) answers "already resolved"
      (c, viewer) =>
        hasRole(viewer, 'support_agent') &&
        (isException(c) || (isTerminal(c) && (c.assignee === null || c.assignee.staffId === viewer.staffId))),
    ),
  ),

  http.post(
    `${API}/cases/:id/notes`,
    caseWrite<NoteBody>((c, body, viewer) => {
      if (!nonEmpty(body.body)) return invalid('body', 'Write a note of up to 2,000 characters.')
      c.notes.push({
        id: `${c.id}-note-${c.notes.length + 1}`,
        author: viewer.displayName,
        body: body.body.trim(),
        at: new Date().toISOString(),
      })
      record(viewer, 'note', { type: 'case', id: c.id, label: `case ${c.id}` }, { caseId: c.id })
      return HttpResponse.json(casesDb.detail(c.id))
    }),
  ),

  http.post(`${API}/cases/:id/reveal`, caseWrite<RevealBody>(revealCase)),
  http.post(`${API}/cases/:id/actions`, caseWrite<CaseActionBody>(caseAction)),

  http.post(
    `${API}/transactions/:id/reveal`,
    transactionWrite<RevealBody>((tx, body, viewer) => {
      if (body.field !== 'venue') return invalid('field', 'Unknown field')
      if (!reasonOk(body.reason)) return shortReason()
      record(
        viewer,
        'view_venue',
        { type: 'transaction', id: tx.id, label: `transaction ${tx.id}` },
        {
          transactionId: tx.id,
          caseId: tx.caseIds[0] ?? null,
          note: body.reason.trim(),
        },
      )
      return HttpResponse.json({ value: tx.secrets.venue })
    }),
  ),
  http.post(`${API}/transactions/:id/resolution`, transactionWrite<ResolutionBody>(resolveTransaction)),
  http.post(`${API}/transactions/:id/release`, transactionWrite<ReleaseBody>(releaseItem)),
]
