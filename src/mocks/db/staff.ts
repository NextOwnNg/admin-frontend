import type { StaffRole, StaffSession } from '@/lib/api/types/auth'
import { SAMPLE_CODE, SAMPLE_SECOND_FACTOR, STAFF_PHONES } from '@/mocks/sample-code'

export { STAFF_PHONES }

/**
 * The mock admin API's staff accounts, codes and session: a stand-in for the server and its HttpOnly cookie.
 * FICTIONAL people and numbers. In the browser only the signed-in staff id is kept in the mock's own storage
 * (never a phone number), so a reload stays signed in; tests keep everything in memory and reset after each.
 */

const CODE_TTL_MS = 10 * 60_000
const RESEND_AFTER_SECONDS = 60
const REQUEST_WINDOW_MS = 10 * 60_000
const MAX_REQUESTS = 3
const DEFAULT_IDLE_TIMEOUT_SECONDS = 30 * 60
const STORAGE_KEY = 'nextown-admin-mock-session'
const persistent = import.meta.env.MODE !== 'test'

type StaffAccount = {
  id: string
  displayName: string
  phone: string
  roles: StaffRole[]
  secondFactor: boolean
}

const ACCOUNTS: StaffAccount[] = [
  {
    id: 's-agent',
    displayName: 'Chiamaka Eze',
    phone: STAFF_PHONES.support_agent,
    roles: ['support_agent'],
    secondFactor: false,
  },
  {
    id: 's-mod',
    displayName: 'Tunde Bakare',
    phone: STAFF_PHONES.moderator,
    roles: ['moderator'],
    secondFactor: false,
  },
  {
    id: 's-admin',
    displayName: 'Ngozi Adeyemi',
    phone: STAFF_PHONES.administrator,
    roles: ['administrator'],
    secondFactor: true,
  },
]

type CodeEntry = { expiresAt: number; requests: number[] }

let codes = new Map<string, CodeEntry>()
/** Verified the first code, waiting for the second factor */
let pendingStaffId: string | null = null
let sessionStaffId: string | null = null
let idleTimeoutSeconds = DEFAULT_IDLE_TIMEOUT_SECONDS

function save() {
  if (!persistent) return
  try {
    if (sessionStaffId) localStorage.setItem(STORAGE_KEY, sessionStaffId)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable: the mock session lasts until reload
  }
}

function load() {
  if (!persistent) return
  try {
    const id = localStorage.getItem(STORAGE_KEY)
    if (id && ACCOUNTS.some((a) => a.id === id)) sessionStaffId = id
  } catch {
    // Storage unavailable: start signed out
  }
}
load()

function startSession(id: string) {
  sessionStaffId = id
  pendingStaffId = null
  save()
}

export type CodeRequestResult = { ok: true } | { ok: false; retryAfterSeconds: number }
export type VerifyResult =
  { ok: true; secondFactorRequired: boolean } | { ok: false; reason: 'invalid' | 'expired' | 'not_staff' }

export const staffDb = {
  requestCode(phone: string): CodeRequestResult {
    const now = Date.now()
    const requests = (codes.get(phone)?.requests ?? []).filter((t) => now - t < REQUEST_WINDOW_MS)
    if (requests.length >= MAX_REQUESTS) {
      return { ok: false, retryAfterSeconds: Math.ceil((requests[0]! + REQUEST_WINDOW_MS - now) / 1000) }
    }
    codes.set(phone, { expiresAt: now + CODE_TTL_MS, requests: [...requests, now] })
    return { ok: true }
  },

  verify(phone: string, code: string): VerifyResult {
    const entry = codes.get(phone)
    if (!entry || entry.expiresAt <= Date.now()) return { ok: false, reason: 'expired' }
    if (code !== SAMPLE_CODE) return { ok: false, reason: 'invalid' }

    codes.delete(phone)
    const account = ACCOUNTS.find((a) => a.phone === phone)
    if (!account) return { ok: false, reason: 'not_staff' }
    if (account.secondFactor) {
      pendingStaffId = account.id
      return { ok: true, secondFactorRequired: true }
    }
    startSession(account.id)
    return { ok: true, secondFactorRequired: false }
  },

  /** `null` when no first code was verified; `false` for a wrong code. */
  secondFactor(code: string): boolean | null {
    if (!pendingStaffId) return null
    if (code !== SAMPLE_SECOND_FACTOR) return false
    startSession(pendingStaffId)
    return true
  },

  current(): StaffSession | null {
    const account = ACCOUNTS.find((a) => a.id === sessionStaffId)
    if (!account) return null
    return {
      staffId: account.id,
      displayName: account.displayName,
      roles: account.roles,
      idleTimeoutSeconds,
      csrfToken: `mock-csrf-${account.id}`,
    }
  },

  signOut() {
    sessionStaffId = null
    pendingStaffId = null
    save()
  },

  /** The server forgets the session; the console still thinks it's signed in until its next request. */
  expireSession() {
    staffDb.signOut()
  },

  /** Tests only: shorten the idle timeout the session reports. */
  setIdleTimeout(seconds: number) {
    idleTimeoutSeconds = seconds
  },

  reset() {
    codes = new Map()
    pendingStaffId = null
    sessionStaffId = null
    idleTimeoutSeconds = DEFAULT_IDLE_TIMEOUT_SECONDS
  },
}

export const staffAuthLimits = { resendAfterSeconds: RESEND_AFTER_SECONDS }
export const STAFF_ACCOUNTS: readonly Pick<StaffAccount, 'id' | 'displayName' | 'roles' | 'phone'>[] = ACCOUNTS
