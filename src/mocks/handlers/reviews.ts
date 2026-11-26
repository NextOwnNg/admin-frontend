import { http, HttpResponse, type RequestHandler } from 'msw'
import type { OverturnBody, ReviewBody } from '@/lib/api/types/reviews'
import { apiBaseUrl } from '@/lib/env'
import { reviewsDb, type ReviewOutcome } from '@/mocks/db/reviews'
import { error } from '@/mocks/handlers/http'
import { idempotent } from '@/mocks/handlers/idempotent'
import { forbidden, hasRole, notFound, signedIn } from '@/mocks/handlers/viewer'

const API = `${apiBaseUrl}/admin`

/** Listing review (design 2026-11-24 §7): moderators and administrators; overturning is for administrators */
async function reviewer(...roles: ('moderator' | 'administrator')[]) {
  const auth = await signedIn()
  if ('failure' in auth) return auth
  if (!hasRole(auth.viewer, ...roles)) return { failure: forbidden() }
  return auth
}

function answer(outcome: ReviewOutcome) {
  if ('ok' in outcome) return HttpResponse.json(outcome.ok)
  if ('invalid' in outcome) {
    return error(422, 'VALIDATION_ERROR', 'Check the highlighted fields', { fieldErrors: outcome.invalid })
  }
  return outcome.failure === 'not_found' ? notFound() : error(409, 'CONFLICT', 'The listing changed since it was read')
}

export const reviewHandlers: RequestHandler[] = [
  http.get(`${API}/listing-reviews`, async ({ request }) => {
    const auth = await reviewer('moderator', 'administrator')
    if ('failure' in auth) return auth.failure
    return HttpResponse.json(reviewsDb.list(new URL(request.url).searchParams))
  }),

  http.post(`${API}/listings/:id/review`, async ({ params, request }) => {
    const auth = await reviewer('moderator', 'administrator')
    if ('failure' in auth) return auth.failure
    const id = String(params.id)
    const body = (await request.clone().json()) as ReviewBody
    return idempotent(request, id, () =>
      answer(reviewsDb.decide(id, body, auth.viewer, request.headers.get('Idempotency-Key'))),
    )
  }),

  http.post(`${API}/listings/:id/review/overturn`, async ({ params, request }) => {
    const auth = await reviewer('administrator')
    if ('failure' in auth) return auth.failure
    const id = String(params.id)
    const body = (await request.clone().json()) as OverturnBody
    return idempotent(request, id, () =>
      answer(reviewsDb.overturn(id, body, auth.viewer, request.headers.get('Idempotency-Key'))),
    )
  }),
]
