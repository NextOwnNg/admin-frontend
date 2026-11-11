import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

type HeaderBlock = { source: string; headers: { key: string; value: string }[] }

describe('hosting headers (PRD §7, design §7)', () => {
  it('sets Permissions-Policy on every response', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as { headers: HeaderBlock[] }
    const all = config.headers.find((block) => block.source === '/(.*)')
    expect(all?.headers.find((h) => h.key === 'Permissions-Policy')?.value).toBe(
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    )
  })
})
