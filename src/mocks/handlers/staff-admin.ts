import { http, HttpResponse, type RequestHandler } from 'msw'
import type { InviteBody, InviteResult, ReasonBody, StaffAccountRow } from '@/lib/api/types/staff'
import { AUTH_COPY } from '@/lib/copy/auth'
import { STAFF_ROLES } from '@/lib/copy/labels'
import { apiBaseUrl } from '@/lib/env'
import { auditDb } from '@/mocks/db/audit'
import { normaliseEmail, staffDb } from '@/mocks/db/staff'
import { error } from '@/mocks/handlers/http'
import { idempotent } from '@/mocks/handlers/idempotent'
import { forbidden, hasRole, notFound, signedIn } from '@/mocks/handlers/viewer'

const API = `${apiBaseUrl}/admin`
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const invalid = (fieldErrors: Record<string, string>) =>
  error(422, 'VALIDATION_ERROR', 'Check the highlighted fields', { fieldErrors })

/** A reason is required on every staff change, as on every privileged action (ADM-T-03) */
const reasonOf = (body: Partial<ReasonBody>) => {
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  return reason.length > 0 && reason.length <= 500 ? reason : null
}

/** Administrators only, after the simulated network */
async function administrator() {
  const auth = await signedIn()
  if ('failure' in auth) return auth
  if (!hasRole(auth.viewer, 'administrator')) return { failure: forbidden() }
  return auth
}

function log(actor: string, action: string, row: StaffAccountRow, reason: string, key: string | null) {
  auditDb.append({
    entry: {
      actor,
      action,
      target: { type: 'account', id: row.id, label: row.displayName },
      reasonCode: null,
      note: reason,
      before: null,
      after: { email: row.email, role: row.role },
      caseId: null,
      transactionId: null,
    },
    actorId: null,
    caseId: null,
    transactionId: null,
    idempotencyKey: key,
  })
}

/** The link the invite email would carry. Mock only: the real API never returns it */
const withLink = (row: StaffAccountRow, token: string): InviteResult => ({
  ...row,
  mockInviteUrl: `/join?token=${token}`,
})

export const staffAdminHandlers: RequestHandler[] = [
  http.get(`${API}/staff/members`, async () => {
    const auth = await administrator()
    if ('failure' in auth) return auth.failure
    return HttpResponse.json(staffDb.accounts())
  }),

  http.post(`${API}/staff/invites`, async ({ request }) => {
    const auth = await administrator()
    if ('failure' in auth) return auth.failure
    const body = (await request.json()) as Partial<InviteBody>
    const email = typeof body.email === 'string' ? normaliseEmail(body.email) : ''
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
    const reason = reasonOf(body)
    const fields: Record<string, string> = {}
    if (!EMAIL.test(email)) fields.email = AUTH_COPY.invalidEmail
    if (!displayName) fields.displayName = 'Enter their name.'
    if (!body.role || !STAFF_ROLES.includes(body.role)) fields.role = 'Choose a role.'
    if (!reason) fields.reason = 'Say why you are adding them.'
    if (Object.keys(fields).length > 0) return invalid(fields)

    return idempotent(request, `invite:${email}`, () => {
      const result = staffDb.invite({ email, displayName, role: body.role! })
      if (!result.ok) {
        return invalid({ email: result.reason === 'has_access' ? AUTH_COPY.hasAccess : AUTH_COPY.invitePending })
      }
      log(auth.viewer.displayName, 'invite_staff', result.row, reason!, request.headers.get('Idempotency-Key'))
      return HttpResponse.json(withLink(result.row, result.token), { status: 201 })
    })
  }),

  http.post(`${API}/staff/invites/:id/resend`, async ({ params, request }) => {
    const auth = await administrator()
    if ('failure' in auth) return auth.failure
    const reason = reasonOf((await request.json()) as Partial<ReasonBody>)
    if (!reason) return invalid({ reason: 'Say why you are resending it.' })

    return idempotent(request, `resend:${String(params.id)}`, () => {
      const result = staffDb.resendInvite(String(params.id))
      if (!result.ok) return notFound()
      log(auth.viewer.displayName, 'resend_invite', result.row, reason, request.headers.get('Idempotency-Key'))
      return HttpResponse.json(withLink(result.row, result.token))
    })
  }),

  http.post(`${API}/staff/invites/:id/revoke`, async ({ params, request }) => {
    const auth = await administrator()
    if ('failure' in auth) return auth.failure
    const reason = reasonOf((await request.json()) as Partial<ReasonBody>)
    if (!reason) return invalid({ reason: 'Say why you are revoking it.' })

    return idempotent(request, `revoke:${String(params.id)}`, () => {
      const row = staffDb.revokeInvite(String(params.id))
      if (!row) return notFound()
      log(auth.viewer.displayName, 'revoke_invite', row, reason, request.headers.get('Idempotency-Key'))
      return new HttpResponse(null, { status: 204 })
    })
  }),
]
