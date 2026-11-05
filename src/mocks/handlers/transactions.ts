import { http, HttpResponse, type RequestHandler } from 'msw'
import { apiBaseUrl } from '@/lib/env'
import { canSee, casesDb, type Viewer } from '@/mocks/db/cases'
import { transactionsDb } from '@/mocks/db/transactions'
import { forbidden, hasRole, notFound, signedIn } from '@/mocks/handlers/viewer'

const API = `${apiBaseUrl}/admin`

/**
 * Administrators may open any transaction; other staff only through a case they may see that links to it
 * (design §9a.2). The case comes as `?caseId=`.
 */
export function canSeeTransaction(viewer: Viewer, transactionId: string, caseId: string | null) {
  if (hasRole(viewer, 'administrator')) return true
  const linked = caseId ? casesDb.record(caseId) : undefined
  return Boolean(linked && linked.transactionId === transactionId && canSee(viewer, linked))
}

export const transactionReadHandlers: RequestHandler[] = [
  http.get(`${API}/transactions/:id`, async ({ params, request }) => {
    const auth = await signedIn()
    if ('failure' in auth) return auth.failure
    const id = String(params.id)
    const caseId = new URL(request.url).searchParams.get('caseId')
    if (!canSeeTransaction(auth.viewer, id, caseId)) return forbidden()
    const detail = transactionsDb.detail(id)
    return detail ? HttpResponse.json(detail) : notFound()
  }),
]
