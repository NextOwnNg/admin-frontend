import { http, HttpResponse, type RequestHandler } from 'msw'
import type { MemberRevealBody, RecordKind } from '@/lib/api/types/records'
import { apiBaseUrl } from '@/lib/env'
import { auditDb } from '@/mocks/db/audit'
import { recordsDb } from '@/mocks/db/records'
import { error } from '@/mocks/handlers/http'
import { forbidden, hasRole, notFound, signedIn } from '@/mocks/handlers/viewer'

const API = `${apiBaseUrl}/admin`
const KINDS: RecordKind[] = ['users', 'items', 'listings', 'offers', 'transactions', 'feed', 'reports']
const MIN_REASON = 10

const isKind = (kind: string): kind is RecordKind => (KINDS as string[]).includes(kind)

/** Record browsers (Phase C design §5): moderators and administrators only */
async function staffWhoBrowse() {
  const auth = await signedIn()
  if ('failure' in auth) return auth
  if (!hasRole(auth.viewer, 'moderator', 'administrator')) return { failure: forbidden() }
  return auth
}

export const recordHandlers: RequestHandler[] = [
  http.get(`${API}/records/:kind`, async ({ params, request }) => {
    const auth = await staffWhoBrowse()
    if ('failure' in auth) return auth.failure
    const kind = String(params.kind)
    if (!isKind(kind)) return notFound()
    return HttpResponse.json(recordsDb.list(kind, new URL(request.url).searchParams))
  }),

  http.get(`${API}/records/:kind/:id`, async ({ params }) => {
    const auth = await staffWhoBrowse()
    if ('failure' in auth) return auth.failure
    const kind = String(params.kind)
    // Transactions have their own page and endpoint
    if (!isKind(kind) || kind === 'transactions') return notFound()
    const detail = recordsDb.detail(kind, String(params.id))
    return detail ? HttpResponse.json(detail) : notFound()
  }),

  http.post(`${API}/records/users/:id/reveal`, async ({ params, request }) => {
    const auth = await staffWhoBrowse()
    if ('failure' in auth) return auth.failure
    const member = recordsDb.member(String(params.id))
    if (!member) return notFound()
    const body = (await request.json()) as Partial<MemberRevealBody>
    if (body.field !== 'phone') {
      return error(422, 'VALIDATION_ERROR', 'Check the highlighted fields', { fieldErrors: { field: 'Unknown field' } })
    }
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    if (reason.length < MIN_REASON) {
      return error(422, 'VALIDATION_ERROR', 'Check the highlighted fields', {
        fieldErrors: { reason: `Give a reason of at least ${MIN_REASON} characters.` },
      })
    }
    if (!member.phone) return notFound()
    auditDb.append({
      entry: {
        actor: auth.viewer.displayName,
        action: 'view_phone',
        target: { type: 'account', id: member.id, label: member.displayName },
        reasonCode: null,
        note: reason,
        before: null,
        after: null,
        caseId: null,
        transactionId: null,
      },
      actorId: auth.viewer.staffId,
      caseId: null,
      transactionId: null,
      idempotencyKey: request.headers.get('Idempotency-Key'),
    })
    return HttpResponse.json({ value: member.phone })
  }),
]
