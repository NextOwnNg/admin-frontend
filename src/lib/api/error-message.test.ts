import { describe, expect, it } from 'vitest'
import { ApiError } from '@/lib/api/api-error'
import { errorMessage, fieldError, isConflict, isForbidden, isRetryable, waitSeconds } from '@/lib/api/error-message'
import { newIdempotencyKey } from '@/lib/api/idempotency'

const http = (status: number, code: string, extra: Partial<ConstructorParameters<typeof ApiError>[0]> = {}) =>
  new ApiError({ kind: 'http', status, code, message: 'from server', ...extra })
const offline = new ApiError({ kind: 'network', code: 'UNKNOWN', message: 'Network error' })

describe('errorMessage (PRD §3.3)', () => {
  it('names a missing permission and nothing more', () => {
    expect(errorMessage(http(403, 'FORBIDDEN'))).toBe("You don't have permission for this action.")
  })

  it('asks the operator to review a case that changed underneath them', () => {
    expect(errorMessage(http(409, 'CONFLICT'))).toBe(
      'This case changed since you opened it. Review the latest version before acting again.',
    )
  })

  it('asks people to wait for as long as the server says', () => {
    expect(errorMessage(http(429, 'RATE_LIMITED', { retryAfterSeconds: 120 }))).toContain('Wait 2 minutes')
    expect(waitSeconds(http(429, 'RATE_LIMITED'))).toBe(60)
  })

  it('separates connection problems from server failures', () => {
    expect(errorMessage(offline)).toBe('Check your connection and try again.')
    expect(errorMessage(http(503, 'SERVER_ERROR'))).toBe('Something went wrong on our side. Try again in a moment.')
  })

  it('says what was wrong with a sign-in code or number', () => {
    expect(errorMessage(http(422, 'OTP_INVALID'))).toBe(
      "That code doesn't match. Check the text message and try again.",
    )
    expect(errorMessage(http(403, 'NOT_STAFF'))).toBe("This number can't sign in here.")
  })

  it('prefixes what failed before the reason', () => {
    expect(errorMessage(offline, 'The note wasn’t saved.')).toBe(
      'The note wasn’t saved. Check your connection and try again.',
    )
  })

  it('uses the server’s wording for a field it rejected', () => {
    const error = http(422, 'VALIDATION_ERROR', { fieldErrors: { phone: 'Enter a Nigerian mobile number.' } })
    expect(fieldError(error, 'phone')).toBe('Enter a Nigerian mobile number.')
    expect(errorMessage(error)).toBe('Enter a Nigerian mobile number.')
  })
})

describe('error checks', () => {
  it('answers yes/no questions about a failure', () => {
    expect(isForbidden(http(403, 'FORBIDDEN'))).toBe(true)
    expect(isConflict(http(409, 'CONFLICT'))).toBe(true)
    expect(isRetryable(http(503, 'SERVER_ERROR'))).toBe(true)
    expect(isRetryable(offline)).toBe(true)
    expect(isRetryable(http(404, 'NOT_FOUND'))).toBe(false)
  })
})

describe('newIdempotencyKey', () => {
  it('creates a distinct key per intent', () => {
    expect(newIdempotencyKey()).not.toBe(newIdempotencyKey())
  })
})
