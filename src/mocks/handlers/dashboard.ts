import { http, HttpResponse, type RequestHandler } from 'msw'
import { rangeError } from '@/features/dashboard/range'
import { apiBaseUrl } from '@/lib/env'
import { addDays, watToday } from '@/lib/time/time'
import { dashboardFor, PILOT_START } from '@/mocks/db/dashboard'
import { error } from '@/mocks/handlers/http'
import { forbidden, hasRole, signedIn } from '@/mocks/handlers/viewer'

const API = `${apiBaseUrl}/admin`
const DATE = /^\d{4}-\d{2}-\d{2}$/
const isDate = (value: string) =>
  DATE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && addDays(value, 0) === value

const invalid = (field: string, message: string) =>
  error(422, 'VALIDATION_ERROR', 'Check the highlighted fields', { fieldErrors: { [field]: message } })

export const dashboardHandlers: RequestHandler[] = [
  // Operational figures are for administrators only (PRD §2)
  http.get(`${API}/dashboard`, async ({ request }) => {
    const auth = await signedIn()
    if ('failure' in auth) return auth.failure
    if (!hasRole(auth.viewer, 'administrator')) return forbidden()

    const params = new URL(request.url).searchParams
    const now = Date.now()
    const today = watToday(now)
    const from = params.get('from') ?? undefined
    const to = params.get('to') ?? today
    if (from !== undefined && !isDate(from)) return invalid('from', 'Enter a date.')
    if (!isDate(to)) return invalid('to', 'Enter a date.')
    const problem = rangeError(from, to, PILOT_START)
    if (problem) return invalid(problem.field, problem.message)

    // The figures cover the pilot up to today. A range wholly outside it keeps its dates and counts nothing.
    const clampedTo = to > today ? today : to
    const clampedFrom = from === undefined || from < PILOT_START ? PILOT_START : from
    const outside = clampedFrom > clampedTo
    return HttpResponse.json(
      dashboardFor(
        {
          from: outside ? (from ?? PILOT_START) : clampedFrom,
          to: outside ? to : clampedTo,
          category: params.get('category') ?? undefined,
          area: params.get('area') ?? undefined,
        },
        now,
      ),
    )
  }),
]
