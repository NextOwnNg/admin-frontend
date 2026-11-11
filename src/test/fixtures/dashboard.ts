import type { DashboardData } from '@/lib/api/types/dashboard'

/** A hand-written dashboard answer with exact figures, for page and section tests */
export function sampleDashboard(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    range: { from: '2026-10-10', to: '2026-11-08' },
    pilotStart: '2026-10-01',
    dataThrough: '2026-11-08T10:00:00.000Z',
    maturityDays: 7,
    funnel: { published: 50, receivedOffer: 38, accepted: 19, completed: 12 },
    acceptance: {
      ALL: { accepted: 19, decided: 30 },
      CASH: { accepted: 10, decided: 15 },
      SWAP: { accepted: 5, decided: 8 },
      SWAP_PLUS_CASH: { accepted: 4, decided: 7 },
    },
    completion: {
      ALL: { completed: 12, matureAccepted: 16, medianHours: 52 },
      CASH: { completed: 7, matureAccepted: 9, medianHours: 40 },
      SWAP: { completed: 3, matureAccepted: 4, medianHours: 30 },
      SWAP_PLUS_CASH: { completed: 2, matureAccepted: 3, medianHours: 77 },
    },
    liquidity: {
      byCategory: [
        {
          id: 'k-phones',
          name: 'Phones',
          cohort: 20,
          d7: { completed: 2, eligible: 8 },
          d14: { completed: 3, eligible: 6 },
          d30: null,
        },
        {
          id: 'k-bikes',
          name: 'Bikes',
          cohort: 30,
          d7: { completed: 5, eligible: 20 },
          d14: { completed: 6, eligible: 12 },
          d30: null,
        },
      ],
      byArea: [
        {
          id: 'a-yaba',
          name: 'Yaba',
          cohort: 50,
          d7: { completed: 7, eligible: 28 },
          d14: { completed: 9, eligible: 18 },
          d30: null,
        },
      ],
    },
    trust: {
      accepted: 19,
      cancelled: 2,
      disputed: 1,
      lossReported: 0,
      weekly: [
        { weekStart: '2026-10-26', accepted: 9, cancelled: 1, disputed: 1, lossReported: 0 },
        { weekStart: '2026-11-02', accepted: 0, cancelled: 0, disputed: 0, lossReported: 0 },
      ],
    },
    support: {
      opened: 6,
      resolved: 5,
      medianHoursToResolve: 20.4,
      weekly: [
        { weekStart: '2026-10-26', opened: 4, resolved: 4 },
        { weekStart: '2026-11-02', opened: 2, resolved: 1 },
      ],
      minutesPerCompleted: { value: null, reason: 'Needs time tracking from the operations team.' },
      costPerCompleted: { value: null, reason: 'Needs variable operating cost inputs from the operations team.' },
    },
    ...overrides,
  }
}
