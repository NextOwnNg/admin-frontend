import { isApiError } from '@/lib/api/api-error'
import type { EnvName } from '@/lib/copy/labels'
import { apiBaseUrl, buildVersion, envName } from '@/lib/env'

/**
 * What the console tells the API about an error it couldn't handle (PRD §9). Never personal data: no names,
 * phones, member IDs, free text or addresses. The route is its pattern (`/cases/:id`), not the real path.
 */
export type ClientErrorReport = {
  name: string
  message: string
  route: string
  requestId?: string
  version: string
  env: EnvName
}

const MAX_MESSAGE = 200

type RouteMatch = { pathname: string; params: Record<string, string | undefined> }

/**
 * The route on screen as a pattern (`/records/:kind/:id`), never the address with its IDs or query. Built from
 * the deepest match: every path segment that is a parameter's value becomes `:name`, and a splat becomes `*`.
 */
export function routePattern(matches: RouteMatch[]): string {
  const deepest = matches.at(-1)
  if (!deepest) return '/'
  const { '*': splat, ...params } = deepest.params
  let path = safeDecode(deepest.pathname).replace(/\/+$/, '')
  if (splat) path = `${path.slice(0, path.length - splat.length).replace(/\/+$/, '')}/*`
  const named = Object.entries(params)
  const segments = path.split('/').map((segment) => {
    const param = named.find(([, v]) => v !== undefined && v === segment)
    return param ? `:${param[0]}` : segment
  })
  return segments.join('/') || '/'
}

function safeDecode(segment: string) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

/** A number written with spaces, brackets or dashes, as phones are shown (`+234 803 123 4567`) */
const SPACED_NUMBER = /\+?\(?\d[\d\s().-]{5,}\d/g
const digitCount = (text: string) => text.replace(/\D/g, '').length

/** Takes out what could identify someone: addresses, emails and long numbers (phones, IDs). */
export function scrub(message: string): string {
  return message
    .replace(/https?:\/\/\S+/g, '[url]')
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[email]')
    .replace(SPACED_NUMBER, (match) => (digitCount(match) >= 7 ? '#' : match))
    .replace(/\d{4,}/g, '#')
    .slice(0, MAX_MESSAGE)
}

export function toReport(error: unknown, route: string): ClientErrorReport {
  const known = error instanceof Error
  return {
    name: known ? error.name : 'Error',
    message: scrub(known ? error.message : String(error)),
    route,
    ...(isApiError(error) && error.requestId && { requestId: error.requestId }),
    version: buildVersion,
    env: envName,
  }
}

type ReporterOptions = {
  send: (report: ClientErrorReport) => Promise<unknown>
  now?: () => number
  /** Reports allowed per window (design §7: 10 a minute) */
  limit?: number
  windowMs?: number
}

/** A throttled reporter. Sending never throws, and a failed send is never itself reported. */
export function createReporter({ send, now = Date.now, limit = 10, windowMs = 60_000 }: ReporterOptions) {
  let sent: number[] = []
  return (error: unknown, route: string) => {
    if (isApiError(error) && error.kind === 'cancelled') return
    const time = now()
    sent = sent.filter((at) => time - at < windowMs)
    if (sent.length >= limit) return
    sent.push(time)
    send(toReport(error, route)).catch(() => {})
  }
}

/**
 * Plain `fetch`, not the API client: a report must never trip the client's 401 handling (which signs the
 * operator out) or carry its retries.
 */
function post(report: ClientErrorReport) {
  return fetch(new URL(`${apiBaseUrl}/admin/client-errors`, window.location.origin), {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  })
}

const report = createReporter({ send: post })
let currentRoute = '/'

/** Kept up to date by the root layout, for errors raised outside React. */
export function setCurrentRoute(pattern: string) {
  currentRoute = pattern
}

export function reportError(error: unknown, route: string = currentRoute) {
  report(error, route)
}

/** Reports uncaught errors and unhandled promise rejections. Returns the cleanup. */
export function installGlobalErrorReporting(target: EventTarget = window) {
  const onError = (event: Event) => {
    const { error, message } = event as Event & { error?: unknown; message?: string }
    reportError(error ?? message)
  }
  const onRejection = (event: Event) => reportError((event as PromiseRejectionEvent).reason)
  target.addEventListener('error', onError)
  target.addEventListener('unhandledrejection', onRejection)
  return () => {
    target.removeEventListener('error', onError)
    target.removeEventListener('unhandledrejection', onRejection)
  }
}
