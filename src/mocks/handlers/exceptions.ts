import { http, HttpResponse, type RequestHandler } from 'msw'
import type { ExceptionQueue } from '@/lib/api/types/exceptions'
import { apiBaseUrl } from '@/lib/env'
import { EXCEPTION_QUEUES, exceptionsDb } from '@/mocks/db/exceptions'
import { error } from '@/mocks/handlers/http'
import { forbidden, hasRole, signedIn } from '@/mocks/handlers/viewer'

const API = `${apiBaseUrl}/admin`

/** `GET /admin/exceptions` (ADM-FE-08): support agents and administrators triage every row */
export const exceptionHandlers: RequestHandler[] = [
  http.get(`${API}/exceptions`, async ({ request }) => {
    const auth = await signedIn()
    if ('failure' in auth) return auth.failure
    if (!hasRole(auth.viewer, 'support_agent', 'administrator')) return forbidden()
    const params = new URL(request.url).searchParams
    const queue = params.get('queue') ?? 'partial_confirmation'
    if (!(EXCEPTION_QUEUES as readonly string[]).includes(queue)) {
      return error(422, 'VALIDATION_ERROR', 'Unknown queue', { fieldErrors: { queue: 'Choose a queue.' } })
    }
    return HttpResponse.json(exceptionsDb.list(queue as ExceptionQueue, params.get('cursor') ?? undefined))
  }),
]
