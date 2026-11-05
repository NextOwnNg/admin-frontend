import { http, HttpResponse, type RequestHandler } from 'msw'
import type { CaseFilters } from '@/lib/api/types/cases'
import { apiBaseUrl } from '@/lib/env'
import { CASE_STATUSES, SEVERITIES } from '@/lib/copy/status'
import { canSee, casesDb } from '@/mocks/db/cases'
import { TARGET_TYPES } from '@/mocks/handlers/targets'
import { forbidden, listParam, notFound, oneOf, signedIn } from '@/mocks/handlers/viewer'

const API = `${apiBaseUrl}/admin`

export const caseReadHandlers: RequestHandler[] = [
  http.get(`${API}/cases`, async ({ request }) => {
    const auth = await signedIn()
    if ('failure' in auth) return auth.failure
    const params = new URL(request.url).searchParams
    const filters: CaseFilters = {
      status: listParam(params, 'status', CASE_STATUSES),
      severity: listParam(params, 'severity', SEVERITIES),
      type: listParam(params, 'type', TARGET_TYPES),
      age: oneOf(params, 'age', ['1h', '24h', '7d', 'older'] as const),
      assignee: params.get('assignee') || undefined,
      sort: oneOf(params, 'sort', ['severity', 'age', '-age'] as const),
      cursor: params.get('cursor') ?? undefined,
    }
    return HttpResponse.json(casesDb.list(filters, auth.viewer))
  }),

  http.get(`${API}/cases/:id`, async ({ params }) => {
    const auth = await signedIn()
    if ('failure' in auth) return auth.failure
    const record = casesDb.record(String(params.id))
    if (!record) return notFound()
    // Says nothing about the case: not even that it exists beyond this answer (QA-16)
    if (!canSee(auth.viewer, record)) return forbidden()
    return HttpResponse.json(casesDb.detail(record.id))
  }),

  http.get(`${API}/overview`, async () => {
    const auth = await signedIn()
    if ('failure' in auth) return auth.failure
    return HttpResponse.json(casesDb.overview(auth.viewer))
  }),
]
