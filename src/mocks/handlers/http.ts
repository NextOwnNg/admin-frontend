import { HttpResponse } from 'msw'

/** An API error body in the admin contract's shape (PRD §3.3). */
export const error = (
  status: number,
  code: string,
  message: string,
  extra: { fieldErrors?: Record<string, string>; retryAfter?: number; details?: Record<string, unknown> } = {},
) =>
  HttpResponse.json(
    {
      code,
      message,
      ...(extra.fieldErrors && { field_errors: extra.fieldErrors }),
      ...(extra.details && { details: extra.details }),
    },
    { status, headers: extra.retryAfter ? { 'Retry-After': String(extra.retryAfter) } : undefined },
  )
