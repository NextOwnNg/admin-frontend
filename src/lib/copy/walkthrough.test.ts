import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { apiClient } from '@/lib/api/client'
import type { CaseDetail } from '@/lib/api/types/cases'
import { signInAs } from '@/test/auth'

const walkthrough = () => readFileSync('docs/operator-walkthrough.md', 'utf8')

const RECORD_KINDS: Record<string, string> = { I: 'items', L: 'listings', O: 'offers', F: 'feed', u: 'users' }

/** Where the mock answers for an ID the walkthrough names */
function pathFor(id: string): string | null {
  if (id.startsWith('NX-')) return `/admin/cases/${id}`
  if (id.startsWith('T-')) return `/admin/transactions/${id}`
  if (id.startsWith('C-')) return null
  return `/admin/records/${RECORD_KINDS[id[0]!]}/${id}`
}

describe('operator walkthrough (design §8)', () => {
  it('names only records that exist in the mock', async () => {
    const ids = [...new Set(walkthrough().match(/\b(NX-\d{6}|T-\d{6}|[ILOF]-\d{3,4}|C-\d{4}|u-[a-z]+)\b/g))]
    expect(ids.length).toBeGreaterThan(5)
    await signInAs('administrator')

    const missing: string[] = []
    const caseContent: string[] = []
    for (const id of ids) {
      const path = pathFor(id)
      if (!path) continue
      const status = await apiClient.get<CaseDetail>(path).then(
        (r) => {
          if (r.data.content?.id) caseContent.push(r.data.content.id)
          return r.status
        },
        () => 0,
      )
      if (status !== 200) missing.push(id)
    }
    // Comments are checked through the cases that hold them
    for (const id of ids.filter((i) => i.startsWith('C-'))) if (!caseContent.includes(id)) missing.push(id)
    expect(missing).toEqual([])
  })

  it('covers every threat test', () => {
    for (const n of [1, 2, 3, 4, 5, 6]) expect(walkthrough()).toContain(`ADM-T-0${n}`)
  })

  it('includes the screen-reader checklist and a sign-off table', () => {
    expect(walkthrough()).toContain('## Screen-reader checklist')
    expect(walkthrough()).toContain('## Sign-off')
  })
})
