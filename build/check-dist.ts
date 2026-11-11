import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

type BuiltFile = { path: string; content: string }

/** Strings that only the mock API or the sample accounts put in a bundle (design §7) */
const MARKERS = ['[MSW]', 'Sample staff accounts', 'Mock API only', '+2348000000']

/** Every sign that a build carries the mock: the MSW worker file, MSW itself, or the sample accounts. */
export function findMockLeaks(files: BuiltFile[]): string[] {
  const leaks: string[] = []
  for (const file of files) {
    if (file.path.endsWith('mockServiceWorker.js')) leaks.push(`${file.path}: the MSW worker file`)
    for (const marker of MARKERS) {
      if (file.content.includes(marker)) leaks.push(`${file.path}: contains "${marker}"`)
    }
  }
  return leaks
}

function readTree(dir: string): BuiltFile[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const full = join(entry.parentPath, entry.name)
      return { path: relative(dir, full), content: readFileSync(full, 'utf8') }
    })
}

if (import.meta.main) {
  const dir = process.argv[2] ?? 'dist'
  const leaks = findMockLeaks(readTree(dir))
  if (leaks.length > 0) {
    console.error(`Mock code found in ${dir}:\n${leaks.map((l) => `  ${l}`).join('\n')}`)
    process.exit(1)
  }
  console.log(`No mock code in ${dir}`)
}
