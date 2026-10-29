/**
 * Every privileged action sends an Idempotency-Key created once per operator intent and reused on retry
 * (PRD §3.3). Create the key when the action form opens, not on each submit.
 */
export function newIdempotencyKey(): string {
  return crypto.randomUUID()
}

export function idempotencyHeaders(idempotencyKey: string) {
  return { 'Idempotency-Key': idempotencyKey }
}
