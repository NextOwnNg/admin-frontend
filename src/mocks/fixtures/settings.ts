import type { PilotSettings } from '@/lib/api/types/settings'

/** The pilot settings the mock starts with (Phase C design §4.5). FICTIONAL contacts. */
export function initialSettings(now: number): PilotSettings {
  const area = (id: string, name: string, active = true) => ({ id, name, active })
  return {
    version: 1,
    updatedAt: new Date(now - 30 * 86_400_000).toISOString(),
    updatedBy: 'Ngozi Adeyemi',
    locations: [
      {
        id: 'c-lagos',
        name: 'Lagos',
        active: true,
        areas: [
          area('a-ajah', 'Ajah'),
          area('a-ikeja', 'Ikeja'),
          area('a-lekki', 'Lekki'),
          area('a-surulere', 'Surulere'),
          area('a-yaba', 'Yaba'),
          // Never used yet, so it can still be removed
          area('a-ojota', 'Ojota', false),
        ],
      },
    ],
    categories: ['Bikes', 'Electronics', 'Fashion', 'Gaming', 'Home', 'Laptops', 'Phones'].map((name) => ({
      id: `k-${name.toLowerCase()}`,
      name,
      active: true,
    })),
    offerLifetimeHours: 72,
    quickSellOptions: ['24h', '48h', '72h', '7d'],
    reservationDays: 7,
    photoLimits: { min: 3, max: 8 },
    contentRules: {
      prohibitedItems: ['Weapons and ammunition', 'Prescription medicine', 'Counterfeit goods', 'Live animals'],
      rulesUrl: 'https://nextown.ng/rules',
    },
    supportContacts: { phone: '+2348000000100', email: 'support@nextown.ng', hours: 'Mon–Sat, 8am–6pm WAT' },
    inUse: [
      'c-lagos',
      'a-ajah',
      'a-ikeja',
      'a-lekki',
      'a-surulere',
      'a-yaba',
      ...['bikes', 'electronics', 'fashion', 'gaming', 'home', 'laptops', 'phones'].map((n) => `k-${n}`),
    ],
  }
}
