/** `ngozi@nextown.test` → `n•••@nextown.test`: enough to recognise the inbox, not enough to read the address. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@')
  if (at < 1) return '•••'
  return `${email[0]}•••${email.slice(at)}`
}
