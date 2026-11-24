/**
 * The invite link's token (design 2026-11-21 §3.1). Read once from the address, then taken out of it so it
 * doesn't stay in history; kept for this tab only, so a reload still finds it, until it's used or refused.
 */
const STORAGE_KEY = 'nextown-admin-invite'

export function takeInviteToken(): string | null {
  const url = new URL(window.location.href)
  const fromAddress = url.searchParams.get('token')
  if (fromAddress) {
    try {
      sessionStorage.setItem(STORAGE_KEY, fromAddress)
    } catch {
      // Storage unavailable: the token lives only as long as this page
    }
    url.searchParams.delete('token')
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
    return fromAddress
  }
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function forgetInviteToken() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing kept
  }
}
