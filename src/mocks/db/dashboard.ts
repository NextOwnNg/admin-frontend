import type {
  DashboardData,
  DashboardQuery,
  LiquidityRow,
  ModeKey,
  TrustCounts,
  Window,
} from '@/lib/api/types/dashboard'
import type { ListingMode } from '@/lib/api/types/records'
import { addDays, watDayStart, watToday } from '@/lib/time/time'
import { settingsDb } from '@/mocks/db/settings'

/**
 * FICTIONAL dashboard figures (Phase D design §4.4). Every figure is counted from synthetic listings generated per
 * WAT day, category and area from a fixed seed: a day's listings never depend on today, so a past day never changes,
 * and events later than "now" simply haven't happened yet. Every event is attributed to its listing's publish day
 * (a cohort view); the real API decides its own attribution.
 */

export const PILOT_START = '2026-10-01'
export const MATURITY_DAYS = 7

const HOUR = 3_600_000
const DAY = 24 * HOUR
const MODES: ListingMode[] = ['CASH', 'SWAP', 'SWAP_PLUS_CASH']
const CATEGORY_IDS = ['k-bikes', 'k-electronics', 'k-fashion', 'k-gaming', 'k-home', 'k-laptops', 'k-phones']
/** The pilot areas in use from the start; generated from IDs so a rename never changes history */
const AREA_IDS = ['a-ajah', 'a-ikeja', 'a-lekki', 'a-surulere', 'a-yaba']

type Outcome = 'completed' | 'cancelled' | 'disputed' | 'lossReported'

type Listing = {
  day: string
  categoryId: string
  areaId: string
  mode: ListingMode
  publishedAt: number
  offerAt: number | null
  decision: { at: number; accepted: boolean } | null
  outcome: { at: number; kind: Outcome } | null
  support: { openedAt: number; resolvedAt: number } | null
}

/** FNV-1a: a string to a 32-bit seed */
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** mulberry32: a small seeded generator, uniform in [0, 1) */
function random(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

function pick<T>(rand: () => number, weighted: [T, number][]): T {
  let roll = rand()
  for (const [value, weight] of weighted) {
    if (roll < weight) return value
    roll -= weight
  }
  return weighted[weighted.length - 1]![0]
}

const generated = new Map<string, Listing[]>()

/** Every listing published on one WAT day, whatever happens to it later */
function listingsOn(day: string): Listing[] {
  const cached = generated.get(day)
  if (cached) return cached
  const dayStart = Date.parse(watDayStart(day))
  const out: Listing[] = []
  for (const categoryId of CATEGORY_IDS) {
    for (const areaId of AREA_IDS) {
      const rand = random(hash(`${day}|${categoryId}|${areaId}`))
      const count = pick(rand, [
        [0, 0.35],
        [1, 0.4],
        [2, 0.2],
        [3, 0.05],
      ])
      for (let i = 0; i < count; i++) {
        const publishedAt = dayStart + (8 + rand() * 13) * HOUR
        const mode = pick(rand, [
          ['CASH', 0.5],
          ['SWAP', 0.25],
          ['SWAP_PLUS_CASH', 0.25],
        ] as [ListingMode, number][])
        const offerAt = rand() < 0.75 ? publishedAt + (1 + rand() * 96) * HOUR : null
        const decided = offerAt !== null && rand() < 0.8
        const decision = decided ? { at: offerAt + (2 + rand() * 70) * HOUR, accepted: rand() < 0.6 } : null
        const kind = pick<Outcome>(rand, [
          ['completed', 0.78],
          ['cancelled', 0.12],
          ['disputed', 0.07],
          ['lossReported', 0.03],
        ])
        const outcome = decision?.accepted ? { at: decision.at + (6 + rand() * 160) * HOUR, kind } : null
        const supportOpenedAt = rand() < 0.15 ? publishedAt + rand() * 10 * DAY : null
        const support =
          supportOpenedAt === null
            ? null
            : { openedAt: supportOpenedAt, resolvedAt: supportOpenedAt + (1 + rand() * 95) * HOUR }
        out.push({ day, categoryId, areaId, mode, publishedAt, offerAt, decision, outcome, support })
      }
    }
  }
  generated.set(day, out)
  return out
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

/** The Monday (WAT) of a WAT calendar date's week */
function weekOf(day: string): string {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay()
  return addDays(day, -((weekday + 6) % 7))
}

const round1 = (hours: number) => Math.round(hours * 10) / 10

/** The figures for one query; `from` and `to` are already clamped to the pilot and today */
export function dashboardFor(
  query: Required<Pick<DashboardQuery, 'from' | 'to'>> & DashboardQuery,
  nowMs: number,
): DashboardData {
  const settings = settingsDb.get()
  const today = watToday(nowMs)
  const happened = (at: number | null | undefined): at is number => at != null && at <= nowMs

  const cohort: Listing[] = []
  const start = query.from < PILOT_START ? PILOT_START : query.from
  for (let day = start; day <= query.to && day <= today; day = addDays(day, 1)) {
    for (const listing of listingsOn(day)) {
      if (!happened(listing.publishedAt)) continue
      if (query.category && listing.categoryId !== query.category) continue
      if (query.area && listing.areaId !== query.area) continue
      cohort.push(listing)
    }
  }

  const accepted = (l: Listing) => l.decision?.accepted === true && happened(l.decision.at)
  const outcomeIs = (l: Listing, kind: Outcome) => accepted(l) && l.outcome?.kind === kind && happened(l.outcome.at)
  const completed = (l: Listing) => outcomeIs(l, 'completed')
  const mature = (l: Listing) => accepted(l) && l.decision!.at <= nowMs - MATURITY_DAYS * DAY

  const byMode = <T>(count: (listings: Listing[]) => T) =>
    Object.fromEntries(
      (['ALL', ...MODES] as ModeKey[]).map((mode) => [
        mode,
        count(mode === 'ALL' ? cohort : cohort.filter((l) => l.mode === mode)),
      ]),
    ) as Record<ModeKey, T>

  const window = (listings: Listing[], days: number): Window | null => {
    const eligible = listings.filter((l) => l.publishedAt <= nowMs - days * DAY)
    if (eligible.length === 0) return null
    const done = eligible.filter((l) => completed(l) && l.outcome!.at - l.publishedAt <= days * DAY)
    return { completed: done.length, eligible: eligible.length }
  }
  const liquidityRows = (key: 'categoryId' | 'areaId', named: { id: string; name: string }[]): LiquidityRow[] =>
    named.flatMap(({ id, name }) => {
      const group = cohort.filter((l) => l[key] === id)
      if (group.length === 0) return []
      return [{ id, name, cohort: group.length, d7: window(group, 7), d14: window(group, 14), d30: window(group, 30) }]
    })

  const trustOf = (listings: Listing[]): TrustCounts => ({
    accepted: listings.filter(accepted).length,
    cancelled: listings.filter((l) => outcomeIs(l, 'cancelled')).length,
    disputed: listings.filter((l) => outcomeIs(l, 'disputed')).length,
    lossReported: listings.filter((l) => outcomeIs(l, 'lossReported')).length,
  })
  // Every week of the range, empty ones included, so a quiet week reads as zero rather than missing
  const weeks: string[] = []
  for (let w = weekOf(query.from); w <= query.to; w = addDays(w, 7)) weeks.push(w)

  // Support cases opened within the range, on the cohort's listings
  const inRange = (at: number) => watToday(at) >= query.from && watToday(at) <= query.to
  const opened = cohort.filter((l) => l.support !== null && happened(l.support.openedAt) && inRange(l.support.openedAt))
  const resolved = opened.filter((l) => happened(l.support!.resolvedAt))
  const supportWeeks = weeks

  return {
    range: { from: query.from, to: query.to },
    pilotStart: PILOT_START,
    dataThrough: new Date(nowMs).toISOString(),
    maturityDays: MATURITY_DAYS,
    funnel: {
      published: cohort.length,
      receivedOffer: cohort.filter((l) => happened(l.offerAt)).length,
      accepted: cohort.filter(accepted).length,
      completed: cohort.filter(completed).length,
    },
    acceptance: byMode((listings) => ({
      accepted: listings.filter(accepted).length,
      decided: listings.filter((l) => happened(l.decision?.at)).length,
    })),
    completion: byMode((listings) => {
      const matured = listings.filter(mature)
      const done = matured.filter(completed)
      // The rate waits for maturity; the time is "among completed deals" (PRD §13.1), mature or not
      const hours = median(listings.filter(completed).map((l) => (l.outcome!.at - l.decision!.at) / HOUR))
      return {
        completed: done.length,
        matureAccepted: matured.length,
        medianHours: hours === null ? null : round1(hours),
      }
    }),
    liquidity: {
      byCategory: liquidityRows('categoryId', settings.categories),
      byArea: liquidityRows(
        'areaId',
        settings.locations.flatMap((city) => city.areas),
      ),
    },
    trust: {
      ...trustOf(cohort),
      weekly: weeks.map((weekStart) => ({ weekStart, ...trustOf(cohort.filter((l) => weekOf(l.day) === weekStart)) })),
    },
    support: {
      opened: opened.length,
      resolved: resolved.length,
      medianHoursToResolve: (() => {
        const hours = median(resolved.map((l) => (l.support!.resolvedAt - l.support!.openedAt) / HOUR))
        return hours === null ? null : round1(hours)
      })(),
      weekly: supportWeeks.map((weekStart) => {
        const inWeek = opened.filter((l) => weekOf(watToday(l.support!.openedAt)) === weekStart)
        return {
          weekStart,
          opened: inWeek.length,
          resolved: inWeek.filter((l) => happened(l.support!.resolvedAt)).length,
        }
      }),
      minutesPerCompleted: { value: null, reason: 'Needs time tracking from the operations team.' },
      costPerCompleted: { value: null, reason: 'Needs variable operating cost inputs from the operations team.' },
    },
  }
}
