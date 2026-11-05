import { http, HttpResponse, type RequestHandler } from 'msw'
import { apiBaseUrl } from '@/lib/env'
import { auditDb } from '@/mocks/db/audit'
import { TARGET_TYPES } from '@/mocks/handlers/targets'
import { forbidden, hasRole, oneOf, signedIn } from '@/mocks/handlers/viewer'

const API = `${apiBaseUrl}/admin`

export const auditHandlers: RequestHandler[] = [
  http.get(`${API}/audit`, async ({ request }) => {
    const auth = await signedIn()
    if ('failure' in auth) return auth.failure
    if (!hasRole(auth.viewer, 'administrator')) return forbidden()
    const params = new URL(request.url).searchParams
    return HttpResponse.json(
      auditDb.list({
        actor: params.get('actor') || undefined,
        action: params.get('action') || undefined,
        targetType: oneOf(params, 'targetType', TARGET_TYPES),
        from: params.get('from') || undefined,
        to: params.get('to') || undefined,
        cursor: params.get('cursor') ?? undefined,
      }),
    )
  }),
]
