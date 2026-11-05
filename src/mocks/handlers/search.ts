import { http, HttpResponse, type RequestHandler } from 'msw'
import { apiBaseUrl } from '@/lib/env'
import { canSee } from '@/mocks/db/cases'
import { recordsDb } from '@/mocks/db/records'
import { error } from '@/mocks/handlers/http'
import { hasRole, signedIn } from '@/mocks/handlers/viewer'

const API = `${apiBaseUrl}/admin`

/**
 * `GET /admin/search?q=` (Phase C design §4.3): every staff member may search, but only finds what they may
 * open, so a result never reveals that a private record exists.
 */
export const searchHandlers: RequestHandler[] = [
  http.get(`${API}/search`, async ({ request }) => {
    const auth = await signedIn()
    if ('failure' in auth) return auth.failure
    const q = (new URL(request.url).searchParams.get('q') ?? '').trim()
    if (q.length < 2 || q.length > 80) {
      return error(422, 'VALIDATION_ERROR', 'Check the highlighted fields', {
        fieldErrors: { q: 'Search for 2 to 80 characters.' },
      })
    }
    const { viewer } = auth
    return HttpResponse.json(
      recordsDb.search(q, (c) => canSee(viewer, c), hasRole(viewer, 'moderator', 'administrator')),
    )
  }),
]
