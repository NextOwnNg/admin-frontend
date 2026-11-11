import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

/** Initial JS budget, gzipped (design §5). kB as Vite reports them: 1 kB = 1000 bytes. */
export const BUDGET_BYTES = 300_000

/**
 * The scripts a first visit loads: the entry module and the chunks it preloads. Lazy route chunks appear only
 * inside JS, so they aren't counted.
 */
export function initialScripts(indexHtml: string): string[] {
  const tags =
    /<script\b[^>]*\btype="module"[^>]*\bsrc="([^"]+)"|<link\b[^>]*\brel="modulepreload"[^>]*\bhref="([^"]+)"/g
  return [...indexHtml.matchAll(tags)].map((m) => (m[1] ?? m[2] ?? '').replace(/^\//, ''))
}

if (import.meta.main) {
  const dir = process.argv[2] ?? 'dist'
  const kb = (bytes: number) => `${(bytes / 1000).toFixed(1)} kB`
  let total = 0
  for (const file of initialScripts(readFileSync(join(dir, 'index.html'), 'utf8'))) {
    const size = gzipSync(readFileSync(join(dir, file)), { level: 9 }).length
    total += size
    console.log(`${kb(size).padStart(10)}  ${file}`)
  }
  console.log(`${kb(total).padStart(10)}  initial JS, gzipped (budget ${kb(BUDGET_BYTES)})`)
  if (total > BUDGET_BYTES) {
    console.error('Initial JS is over budget')
    process.exit(1)
  }
}
