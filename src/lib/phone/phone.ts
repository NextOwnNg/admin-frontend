/** Nigerian mobile numbers: +234 followed by 10 national digits starting 7, 8 or 9 (staff sign-in, PRD §3.5). */

export type PhoneResult = { ok: true; e164: string } | { ok: false }

export function normalisePhone(input: string): PhoneResult {
  let digits = input.replace(/\D/g, '')
  if (digits.startsWith('234')) digits = digits.slice(3)
  else if (digits.startsWith('0')) digits = digits.slice(1)

  if (!/^[789]\d{9}$/.test(digits)) return { ok: false }
  return { ok: true, e164: `+234${digits}` }
}

/** `+2348031234567` → `"+234 803 123 4567"` */
export function formatPhoneDisplay(e164: string): string {
  const national = e164.replace(/^\+234/, '')
  return `+234 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`
}
