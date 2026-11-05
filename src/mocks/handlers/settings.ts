import { http, HttpResponse, type RequestHandler } from 'msw'
import { z } from 'zod'
import { SECTION_LABELS, SECTION_SCHEMAS, SETTINGS_SECTIONS } from '@/features/settings/schemas'
import type { PilotSettings, SettingsSection, SettingsUpdateBody } from '@/lib/api/types/settings'
import { apiBaseUrl } from '@/lib/env'
import { auditDb } from '@/mocks/db/audit'
import { SETTINGS_RECORD, settingsDb } from '@/mocks/db/settings'
import { error } from '@/mocks/handlers/http'
import { idempotent } from '@/mocks/handlers/idempotent'
import { forbidden, hasRole, notFound, signedIn } from '@/mocks/handlers/viewer'

const API = `${apiBaseUrl}/admin`
const MIN_REASON = 10

const invalid = (fieldErrors: Record<string, string>) =>
  error(422, 'VALIDATION_ERROR', 'Check the highlighted fields', { fieldErrors })

/** `value.0.areas.1.name` → message, first message per field */
function fieldErrorsOf(issues: z.core.$ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const path = ['value', ...issue.path.map(String)].join('.')
    out[path] ??= issue.message
  }
  return out
}

/** Every id and name in a locations or categories value */
function namedIds(section: SettingsSection, value: unknown): Map<string, string> {
  const rows = value as { id: string; name: string; areas?: { id: string; name: string }[] }[]
  const out = new Map<string, string>()
  for (const row of rows) {
    out.set(row.id, row.name)
    for (const a of section === 'locations' ? (row.areas ?? []) : []) out.set(a.id, a.name)
  }
  return out
}

/** A place or category in use was left out: it may go inactive, never away (spec §9 call 6) */
function removedInUse(section: SettingsSection, current: PilotSettings, next: unknown): string | null {
  if (section !== 'locations' && section !== 'categories') return null
  const before = namedIds(section, current[section])
  const after = namedIds(section, next)
  const gone = [...before.keys()].find((id) => current.inUse.includes(id) && !after.has(id))
  return gone ? `${before.get(gone)} is in use. Make it inactive instead.` : null
}

export const settingsHandlers: RequestHandler[] = [
  // Every staff member reads settings (record filters need areas and categories); only administrators change them
  http.get(`${API}/settings`, async () => {
    const auth = await signedIn()
    if ('failure' in auth) return auth.failure
    return HttpResponse.json(settingsDb.get())
  }),

  http.get(`${API}/settings/history`, async () => {
    const auth = await signedIn()
    if ('failure' in auth) return auth.failure
    if (!hasRole(auth.viewer, 'administrator')) return forbidden()
    return HttpResponse.json({ items: settingsDb.history() })
  }),

  http.put(`${API}/settings/:section`, async ({ params, request }) => {
    const auth = await signedIn()
    if ('failure' in auth) return auth.failure
    if (!hasRole(auth.viewer, 'administrator')) return forbidden()
    const section = String(params.section) as SettingsSection
    if (!SETTINGS_SECTIONS.includes(section)) return notFound()
    const body = (await request.json()) as Partial<SettingsUpdateBody>

    return idempotent(request, SETTINGS_RECORD, () => {
      const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
      if (reason.length < MIN_REASON) return invalid({ reason: `Give a reason of at least ${MIN_REASON} characters.` })
      const current = settingsDb.get()
      if (body.expectedVersion !== current.version) {
        return error(409, 'CONFLICT', 'The settings changed since they were read', {
          details: { version: current.version },
        })
      }
      const parsed = z.safeParse(SECTION_SCHEMAS[section], body.value)
      if (!parsed.success) return invalid(fieldErrorsOf(parsed.error.issues))
      const inUse = removedInUse(section, current, parsed.data)
      if (inUse) return invalid({ value: inUse })

      const settings = settingsDb.apply(section, parsed.data, auth.viewer.displayName, reason)
      const auditEntry = auditDb.append({
        entry: {
          actor: auth.viewer.displayName,
          action: 'update_settings',
          target: { type: 'settings', id: section, label: SECTION_LABELS[section] },
          reasonCode: null,
          note: reason,
          before: { [section]: current[section] },
          after: { [section]: parsed.data },
          caseId: null,
          transactionId: null,
        },
        actorId: auth.viewer.staffId,
        caseId: null,
        transactionId: null,
        idempotencyKey: request.headers.get('Idempotency-Key'),
      })
      return HttpResponse.json({ settings, auditEntry })
    })
  }),
]
