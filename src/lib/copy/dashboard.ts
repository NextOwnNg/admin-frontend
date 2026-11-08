/**
 * Operations dashboard copy (ADM-FE-10). Titles and definitions follow parent PRD §13.1; no targets anywhere
 * (§13.3: thresholds are the founding team's to set after the baseline).
 */

export type DashboardSectionId = 'funnel' | 'modes' | 'liquidity' | 'trust' | 'support'

export const DASHBOARD_COPY = {
  funnel: {
    title: 'Listing to completion',
    definition:
      'Listings published in the range, how many received any offer, were accepted and were completed. Any offer counts here: telling credible offers apart needs the manual quality rubric.',
  },
  acceptance: {
    title: 'Offer acceptance rate',
    definition: 'Accepted negotiations / negotiations reaching decision, by mode.',
  },
  completion: {
    title: 'Completion rate',
    definition: 'COMPLETED / accepted transactions after a maturity window of {days} days, by mode.',
  },
  timeToCompletion: {
    title: 'Time to completion',
    definition:
      'Median time from acceptance to both confirmations among completed deals. The incomplete share is shown beside it.',
  },
  liquidity: {
    title: '7/14/30-day liquidity',
    definition:
      'Listings that completed within the time window / eligible published listing cohort, by category and area.',
  },
  trust: {
    title: 'Cancellations and disputes',
    definition: 'Cancelled, disputed and loss-reported transactions per 100 accepted.',
  },
  support: {
    title: 'Support effort',
    definition:
      'Support cases opened and resolved, median time to resolve, and cases per 100 accepted. Support minutes and variable operating cost per completed deal need inputs from operations.',
  },
} as const

/** The completion definition with the API's maturity window filled in */
export const completionDefinition = (days: number) =>
  DASHBOARD_COPY.completion.definition.replace('{days}', String(days))

export const TOO_RECENT = (days: number) => `Too recent for ${days}-day`
export const NOT_MEASURED = 'Not measured yet'
export const ALL_MODES = 'All modes'

export type RangePreset = '7d' | '30d' | 'pilot'
export const RANGE_PRESETS: Record<RangePreset | 'custom', string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  pilot: 'Pilot to date',
  custom: 'Custom',
}
