import { http, HttpResponse, type RequestHandler } from 'msw'
import { apiBaseUrl } from '@/lib/env'
import { canSee, casesDb, type Viewer } from '@/mocks/db/cases'
import { recordsDb } from '@/mocks/db/records'
import { transactionsDb } from '@/mocks/db/transactions'
import { forbidden, hasRole, notFound, signedIn } from '@/mocks/handlers/viewer'

const API = `${apiBaseUrl}/admin`

/**
 * Administrators and moderators may open any transaction; support agents only through a case they may see that links to it
 * (design §9a.2). The case comes as `?caseId=`.
 */
export function canSeeTransaction(viewer: Viewer, transactionId: string, caseId: string | null) {
  // Moderators browse transactions in the records tabs, so they open them directly too (Phase C design §9 call 11)
  if (hasRole(viewer, 'administrator', 'moderator')) return true
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
    if (!detail) return notFound()
    // Record links only for staff who may open records
    const links = hasRole(auth.viewer, 'moderator', 'administrator') ? recordsDb.transactionLinks(id) : undefined
    return HttpResponse.json({ ...detail, ...(links && { links }) })
  }),
]
