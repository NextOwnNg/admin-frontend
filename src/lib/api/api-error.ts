import { isAxiosError } from 'axios'

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'cancelled'

/** Stable error codes from the admin API contract (PRD §3.3). Hand-written until the OpenAPI spec lands. */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'OTP_INVALID'
  | 'OTP_EXPIRED'
  | 'NOT_STAFF'
  | 'SERVER_ERROR'
  | 'UNKNOWN'

type ApiErrorBody = {
  code?: string
  message?: string
  field_errors?: Record<string, string>
  details?: Record<string, unknown>
  retry_after_seconds?: number
}

/** The single error shape every API failure is normalised into (PRD §3.3). */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly code: ApiErrorCode | (string & {})
  readonly fieldErrors?: Record<string, string>
  readonly retryAfterSeconds?: number
  readonly requestId?: string
  /** Extra facts for a specific error, e.g. the latest version behind a `CONFLICT`. */
  readonly details?: Record<string, unknown>

  constructor(init: {
    kind: ApiErrorKind
    message: string
    code: ApiError['code']
    status?: number
    fieldErrors?: Record<string, string>
    retryAfterSeconds?: number
    requestId?: string
    details?: Record<string, unknown>
  }) {
    super(init.message)
    this.name = 'ApiError'
    this.kind = init.kind
    this.code = init.code
    this.status = init.status
    this.fieldErrors = init.fieldErrors
    this.retryAfterSeconds = init.retryAfterSeconds
    this.requestId = init.requestId
    this.details = init.details
  }

  /** A timed-out or dropped action may have succeeded on the server: read state before retrying (PRD §3.3). */
  get isOutcomeUnknown() {
    return this.kind === 'timeout' || this.kind === 'network' || (this.status !== undefined && this.status >= 500)
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error

  if (!isAxiosError<ApiErrorBody>(error)) {
    return new ApiError({ kind: 'network', code: 'UNKNOWN', message: 'Unexpected error' })
  }

  const requestId = error.config?.headers?.['X-Request-ID'] as string | undefined

  if (error.code === 'ERR_CANCELED') {
    return new ApiError({ kind: 'cancelled', code: 'UNKNOWN', message: 'Request cancelled', requestId })
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiError({ kind: 'timeout', code: 'UNKNOWN', message: 'Request timed out', requestId })
  }
  if (!error.response) {
    return new ApiError({ kind: 'network', code: 'UNKNOWN', message: 'Network error', requestId })
  }

  const { status, data, headers } = error.response
  // The Retry-After header, or the same wait in the body
  const retryAfter = Number(headers['retry-after'] ?? data?.retry_after_seconds)

  return new ApiError({
    kind: 'http',
    status,
    code: data?.code ?? (status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN'),
    message: data?.message ?? `Request failed with status ${status}`,
    fieldErrors: data?.field_errors,
    details: data?.details,
    retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : undefined,
    requestId,
  })
}
