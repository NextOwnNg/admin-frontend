import { http, HttpResponse, type RequestHandler } from 'msw'
import { apiBaseUrl } from '@/lib/env'
import { REASON_CODES } from '@/mocks/fixtures/reason-codes'
import { STAFF } from '@/mocks/fixtures/staff'
import { signedIn } from '@/mocks/handlers/viewer'

const API = `${apiBaseUrl}/admin`

export const referenceHandlers: RequestHandler[] = [
  http.get(`${API}/reason-codes`, async () => {
    const auth = await signedIn()
    if ('failure' in auth) return auth.failure
    return HttpResponse.json(REASON_CODES)
  }),

  http.get(`${API}/staff`, async () => {
    const auth = await signedIn()
    if ('failure' in auth) return auth.failure
    return HttpResponse.json(STAFF)
  }),
]
