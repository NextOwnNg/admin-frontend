import { buildRecords } from '@/mocks/records-seed'
import { buildSeed } from '@/mocks/seed'

function build(now: number) {
  const base = buildSeed(now)
  return { ...base, records: buildRecords(now, base) }
}

/** The mock API's moderation data, seeded relative to now. Reloading the page reseeds it. */
let state = build(Date.now())
/** The first answer to each Idempotency-Key, replayed for repeats */
let replies = new Map<string, { status: number; body: unknown }>()
/** Record ids whose next write is applied but its answer lost (tests of uncertain outcomes) */
let dropAfterApply = new Set<string>()

export const store = () => state
export const idempotentReplies = () => replies
export const droppedAnswers = () => dropAfterApply

export function reseed() {
  state = build(Date.now())
  replies = new Map()
  dropAfterApply = new Set()
}
