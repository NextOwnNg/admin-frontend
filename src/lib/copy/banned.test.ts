import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BANNED_PHRASES, findBannedPhrases } from '@/lib/copy/banned'

const SRC = join(process.cwd(), 'src')
const EXCLUDED = new Set(['lib/copy/banned.ts', 'lib/copy/banned.test.ts'])

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx)$/.test(name) ? [path] : []
  })
}

describe('banned phrases (PRD §4.7)', () => {
  it('detects banned claims case-insensitively', () => {
    expect(findBannedPhrases('Your payment is ESCROW protected')).toEqual(['Escrow protected', 'Escrow'])
    expect(findBannedPhrases('Phone confirmed')).toEqual([])
  })

  it('never appear in console source', () => {
    const offenders = sourceFiles(SRC)
      .map((path) => ({ file: relative(SRC, path), hits: findBannedPhrases(readFileSync(path, 'utf8')) }))
      .filter(({ file, hits }) => !EXCLUDED.has(file) && hits.length > 0)

    expect(offenders).toEqual([])
    expect(BANNED_PHRASES.length).toBeGreaterThan(10)
  })
})
