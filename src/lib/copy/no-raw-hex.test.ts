import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = join(process.cwd(), 'src')
const RAW_HEX_CLASS = /-\[#[0-9a-fA-F]{3,8}\]/

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx)$/.test(name) ? [path] : []
  })
}

describe('brand colours (PRD §4.4)', () => {
  it('detects arbitrary hex colours in class names', () => {
    expect(RAW_HEX_CLASS.test('bg-[#0b6159] p-4')).toBe(true)
    expect(RAW_HEX_CLASS.test('bg-action text-ink')).toBe(false)
  })

  it('never uses arbitrary hex colours in class names', () => {
    const offenders = sourceFiles(SRC)
      .filter((path) => !path.endsWith('no-raw-hex.test.ts'))
      .filter((path) => RAW_HEX_CLASS.test(readFileSync(path, 'utf8')))
      .map((path) => relative(SRC, path))

    expect(offenders).toEqual([])
  })
})
