const PROBE_ORIGIN = 'https://nextown.invalid'
const SIGN_IN = /^\/sign-in(\/|$)/

/**
 * Where to go after signing in. Only a same-origin relative path is honoured (no open redirects); anything
 * else, or the sign-in page itself, falls back to the overview.
 */
export function safeNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/'
  let url: URL
  try {
    url = new URL(raw, PROBE_ORIGIN)
  } catch {
    return '/'
  }
  if (url.origin !== PROBE_ORIGIN || SIGN_IN.test(url.pathname)) return '/'
  return url.pathname + url.search + url.hash
}

/** Sign-in that returns to `next` afterwards (PRD §3.3: 401 keeps the current URL). */
export const signInPath = (next: string) => `/sign-in?next=${encodeURIComponent(next)}`
