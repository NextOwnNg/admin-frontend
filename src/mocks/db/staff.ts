import type { InviteDetails, StaffRole, StaffSession } from '@/lib/api/types/auth'
import type { StaffAccountRow } from '@/lib/api/types/staff'
import { SAMPLE_CODE, SAMPLE_PASSWORD, STAFF_EMAILS } from '@/mocks/sample-accounts'

/**
 * The mock admin API's staff accounts, passwords, emailed codes, invites and session: a stand-in for the server
 * and its HttpOnly cookie. FICTIONAL people at the fictional nextown.test domain. In the browser only the
 * signed-in staff id is kept in the mock's own storage (never an email or password), so a reload stays signed
 * in; everything else lives in memory, and tests reset it after each.
 */

const MINUTE = 60_000
const CODE_TTL_MS = 10 * MINUTE
const RESEND_AFTER_SECONDS = 60
const REQUEST_WINDOW_MS = 10 * MINUTE
const MAX_CODE_REQUESTS = 3
const MAX_WRONG_PASSWORDS = 5
const LOCK_MS = 10 * MINUTE
const INVITE_TTL_MS = 7 * 24 * 60 * MINUTE
const DEFAULT_IDLE_TIMEOUT_SECONDS = 30 * 60
const STORAGE_KEY = 'nextown-admin-mock-session'
const persistent = import.meta.env.MODE !== 'test'

type StaffAccount = {
  id: string
  displayName: string
  email: string
  /** No roles: a marketplace member, refused after a correct password */
  roles: StaffRole[]
  /** Null: an account that can't sign in on the mock */
  password: string | null
  secondFactor: boolean
}

type Invite = {
  id: string
  /** The account the invite becomes, so log entries about it keep one target */
  accountId: string
  email: string
  displayName: string
  role: StaffRole
  token: string
  invitedAt: number
  expiresAt: number
  state: 'pending' | 'accepted' | 'revoked'
}

const SEED: StaffAccount[] = [
  {
    id: 's-agent',
    displayName: 'Chiamaka Eze',
    email: STAFF_EMAILS.support_agent,
    roles: ['support_agent'],
    password: SAMPLE_PASSWORD,
    secondFactor: false,
  },
  {
    id: 's-mod',
    displayName: 'Tunde Bakare',
    email: STAFF_EMAILS.moderator,
    roles: ['moderator'],
    password: SAMPLE_PASSWORD,
    secondFactor: false,
  },
  {
    id: 's-admin',
    displayName: 'Ngozi Adeyemi',
    email: STAFF_EMAILS.administrator,
    roles: ['administrator'],
    password: SAMPLE_PASSWORD,
    secondFactor: true,
  },
  // Colleagues who can be assigned work but can't sign in on the mock
  {
    id: 's-mod-2',
    displayName: 'Bola Akinola',
    email: 'bola@nextown.test',
    roles: ['moderator'],
    password: null,
    secondFactor: false,
  },
  {
    id: 's-agent-2',
    displayName: 'Musa Ibrahim',
    email: 'musa@nextown.test',
    roles: ['support_agent'],
    password: null,
    secondFactor: false,
  },
  {
    id: 'u-member',
    displayName: 'Kunle A.',
    email: STAFF_EMAILS.nonStaff,
    roles: [],
    password: SAMPLE_PASSWORD,
    secondFactor: false,
  },
]

type CodeEntry = { expiresAt: number; requests: number[] }

let accounts: StaffAccount[] = SEED.map((a) => ({ ...a, roles: [...a.roles] }))
let invites: Invite[] = []
let resetCodes = new Map<string, CodeEntry>()
let wrongPasswords = new Map<string, number[]>()
/** Signed in with a password, waiting for the emailed code */
let pending: { staffId: string; code: CodeEntry } | null = null
let sessionStaffId: string | null = null
let idleTimeoutSeconds = DEFAULT_IDLE_TIMEOUT_SECONDS
let inviteCount = 0

export const normaliseEmail = (email: string) => email.trim().toLowerCase()
const byEmail = (email: string) => accounts.find((a) => a.email === normaliseEmail(email))
const isStaff = (account: StaffAccount) => account.roles.length > 0

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
    if (id && accounts.some((a) => a.id === id && isStaff(a))) sessionStaffId = id
  } catch {
    // Storage unavailable: start signed out
  }
}
load()

function startSession(id: string) {
  sessionStaffId = id
  pending = null
  save()
}

/** Asks for the emailed code, or starts the session when the account needs none */
function signInAccount(account: StaffAccount, now: number) {
  if (account.secondFactor) {
    pending = { staffId: account.id, code: { expiresAt: now + CODE_TTL_MS, requests: [now] } }
    sessionStaffId = null
    save()
    return { ok: true as const, secondFactorRequired: true }
  }
  startSession(account.id)
  return { ok: true as const, secondFactorRequired: false }
}

/** At most 3 codes in 10 minutes; the wait until the oldest drops out otherwise */
function nextCode(entry: CodeEntry | undefined, now: number): CodeEntry | { retryAfterSeconds: number } {
  const requests = (entry?.requests ?? []).filter((t) => now - t < REQUEST_WINDOW_MS)
  if (requests.length >= MAX_CODE_REQUESTS) {
    return { retryAfterSeconds: Math.ceil((requests[0]! + REQUEST_WINDOW_MS - now) / 1000) }
  }
  return { expiresAt: now + CODE_TTL_MS, requests: [...requests, now] }
}

function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32)
}

const isOpen = (invite: Invite, now: number) => invite.state === 'pending' && invite.expiresAt > now

function inviteRow(invite: Invite, now: number): StaffAccountRow {
  return {
    id: invite.accountId,
    displayName: invite.displayName,
    email: invite.email,
    role: invite.role,
    status: invite.expiresAt > now ? 'invited' : 'invite_expired',
    invitedAt: new Date(invite.invitedAt).toISOString(),
    expiresAt: new Date(invite.expiresAt).toISOString(),
    inviteId: invite.id,
  }
}

export type LoginOutcome =
  | { ok: true; secondFactorRequired: boolean }
  | { ok: false; reason: 'invalid' | 'not_staff' }
  | { ok: false; reason: 'locked'; retryAfterSeconds: number }

export type Limited = { ok: true } | { ok: false; retryAfterSeconds: number }

export const staffDb = {
  login(email: string, password: string, now = Date.now()): LoginOutcome {
    const key = normaliseEmail(email)
    const failures = (wrongPasswords.get(key) ?? []).filter((t) => now - t < LOCK_MS)
    if (failures.length >= MAX_WRONG_PASSWORDS) {
      return { ok: false, reason: 'locked', retryAfterSeconds: Math.ceil((failures[0]! + LOCK_MS - now) / 1000) }
    }
    const account = byEmail(key)
    if (!account || account.password === null || account.password !== password) {
      wrongPasswords.set(key, [...failures, now])
      return { ok: false, reason: 'invalid' }
    }
    wrongPasswords.delete(key)
    if (!isStaff(account)) return { ok: false, reason: 'not_staff' }
    return signInAccount(account, now)
  },

  /** `null` when no sign-in is waiting for a code; `false` for a wrong or expired code. */
  secondFactor(code: string, now = Date.now()): boolean | null {
    if (!pending) return null
    if (pending.code.expiresAt <= now || code !== SAMPLE_CODE) return false
    startSession(pending.staffId)
    return true
  },

  /** `null` when no sign-in is waiting for a code */
  resendSecondFactor(now = Date.now()): Limited | null {
    if (!pending) return null
    const next = nextCode(pending.code, now)
    if ('retryAfterSeconds' in next) return { ok: false, retryAfterSeconds: next.retryAfterSeconds }
    pending = { ...pending, code: next }
    return { ok: true }
  },

  /** The same answer for any email: a code is only kept for a staff account with a password */
  forgotPassword(email: string, now = Date.now()): Limited {
    const key = normaliseEmail(email)
    const next = nextCode(resetCodes.get(key), now)
    if ('retryAfterSeconds' in next) return { ok: false, retryAfterSeconds: next.retryAfterSeconds }
    resetCodes.set(key, next)
    return { ok: true }
  },

  resetPassword(
    email: string,
    code: string,
    password: string,
    now = Date.now(),
  ): LoginOutcome | { ok: false; reason: 'expired' } {
    const key = normaliseEmail(email)
    const entry = resetCodes.get(key)
    const account = byEmail(key)
    // An email with no account answers exactly like a wrong code: nothing says whether it exists
    if (!entry || entry.expiresAt <= now) return { ok: false, reason: 'expired' }
    if (code !== SAMPLE_CODE || !account) return { ok: false, reason: 'invalid' }
    resetCodes.delete(key)
    wrongPasswords.delete(key)
    account.password = password
    if (!isStaff(account)) return { ok: false, reason: 'not_staff' }
    // The code proved the email: an administrator still gets their second factor on the next step
    return signInAccount(account, now)
  },

  /** Active staff and invites not yet accepted or revoked, newest invite first */
  accounts(now = Date.now()): StaffAccountRow[] {
    const open = invites
      .filter((i) => i.state === 'pending')
      .sort((a, b) => b.invitedAt - a.invitedAt)
      .map((i) => inviteRow(i, now))
    const staff = accounts
      .filter(isStaff)
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map((a): StaffAccountRow => ({
        id: a.id,
        displayName: a.displayName,
        email: a.email,
        role: a.roles[0]!,
        status: 'active',
      }))
    return [...open, ...staff]
  },

  invite(
    input: { email: string; displayName: string; role: StaffRole },
    now = Date.now(),
  ): { ok: true; row: StaffAccountRow; token: string } | { ok: false; reason: 'has_access' | 'pending' } {
    const email = normaliseEmail(input.email)
    const account = byEmail(email)
    if (account && isStaff(account)) return { ok: false, reason: 'has_access' }
    if (invites.some((i) => i.email === email && isOpen(i, now))) return { ok: false, reason: 'pending' }
    // An expired invite for the same email gives way to the new one
    for (const old of invites) if (old.email === email && old.state === 'pending') old.state = 'revoked'

    inviteCount += 1
    const invite: Invite = {
      id: `inv-${inviteCount}`,
      accountId: `s-new-${inviteCount}`,
      email,
      displayName: input.displayName.trim(),
      role: input.role,
      token: newToken(),
      invitedAt: now,
      expiresAt: now + INVITE_TTL_MS,
      state: 'pending',
    }
    invites.push(invite)
    return { ok: true, row: inviteRow(invite, now), token: invite.token }
  },

  /** A new link and a new 7 days; the old link stops working */
  resendInvite(inviteId: string, now = Date.now()): { ok: true; row: StaffAccountRow; token: string } | { ok: false } {
    const invite = invites.find((i) => i.id === inviteId && i.state === 'pending')
    if (!invite) return { ok: false }
    invite.token = newToken()
    invite.invitedAt = now
    invite.expiresAt = now + INVITE_TTL_MS
    return { ok: true, row: inviteRow(invite, now), token: invite.token }
  },

  revokeInvite(inviteId: string): StaffAccountRow | null {
    const invite = invites.find((i) => i.id === inviteId && i.state === 'pending')
    if (!invite) return null
    invite.state = 'revoked'
    return inviteRow(invite, Date.now())
  },

  /** Null for an unknown, used, revoked or expired link */
  inviteByToken(token: string, now = Date.now()): InviteDetails | null {
    const invite = invites.find((i) => i.token === token && isOpen(i, now))
    if (!invite) return null
    const { email, displayName, role } = invite
    return { email, displayName, role, expiresAt: new Date(invite.expiresAt).toISOString() }
  },

  /** Creates the account with the invite's role and starts its session */
  acceptInvite(token: string, password: string, now = Date.now()): boolean {
    const invite = invites.find((i) => i.token === token && isOpen(i, now))
    if (!invite) return false
    invite.state = 'accepted'
    accounts = accounts.filter((a) => a.email !== invite.email)
    accounts.push({
      id: invite.accountId,
      displayName: invite.displayName,
      email: invite.email,
      roles: [invite.role],
      password,
      secondFactor: invite.role === 'administrator',
    })
    startSession(invite.accountId)
    return true
  },

  /** Staff who can be assigned work: every account with a staff role */
  activeStaff(): { staffId: string; displayName: string; roles: StaffRole[] }[] {
    return accounts.filter(isStaff).map((a) => ({ staffId: a.id, displayName: a.displayName, roles: [...a.roles] }))
  },

  current(): StaffSession | null {
    const account = accounts.find((a) => a.id === sessionStaffId)
    if (!account || !isStaff(account)) return null
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
    pending = null
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
    accounts = SEED.map((a) => ({ ...a, roles: [...a.roles] }))
    invites = []
    resetCodes = new Map()
    wrongPasswords = new Map()
    pending = null
    sessionStaffId = null
    idleTimeoutSeconds = DEFAULT_IDLE_TIMEOUT_SECONDS
    inviteCount = 0
  },
}

export const staffAuthLimits = { resendAfterSeconds: RESEND_AFTER_SECONDS }
