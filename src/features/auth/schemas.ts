import { z } from 'zod'
import { normalisePhone } from '@/lib/phone/phone'

export const PHONE_HINT = 'Enter a Nigerian mobile number, like 0800 000 0101.'

/** What's typed (`0800 000 0101`, `+234…`) becomes E.164 before it is sent. */
export const phoneSchema = z.object({
  phone: z.string().transform((value, ctx) => {
    const result = normalisePhone(value)
    if (!result.ok) {
      ctx.addIssue({ code: 'custom', message: PHONE_HINT })
      return z.NEVER
    }
    return result.e164
  }),
})

export const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code.'),
})

export type PhoneInput = z.input<typeof phoneSchema>
export type PhoneForm = z.output<typeof phoneSchema>
export type CodeForm = z.output<typeof codeSchema>
