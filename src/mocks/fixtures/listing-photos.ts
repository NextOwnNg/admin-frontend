import type { ListingPhoto } from '@/lib/api/types/reviews'

/**
 * Mock photo placeholders (design 2026-11-24 §8): a tinted tile with the item's name, as an inline SVG, so the
 * demo needs no image hosting. Mock only: production builds never contain this module ("Mock photo").
 */
const TINTS = ['#e6f4f1', '#fdf1e3', '#eef0fb', '#f6eef6']
const INK = '#14213d'
const LINK_MINUTES = 15

const escape = (text: string) => text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`)

export function placeholderPhotos(listingId: string, title: string, count: number, now: number): ListingPhoto[] {
  const expiresAt = new Date(now + LINK_MINUTES * 60_000).toISOString()
  return Array.from({ length: count }, (_, i) => {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">` +
      `<rect width="800" height="600" fill="${TINTS[i % TINTS.length]}"/>` +
      `<text x="400" y="290" font-family="sans-serif" font-size="40" fill="${INK}" text-anchor="middle">${escape(title)}</text>` +
      `<text x="400" y="350" font-family="sans-serif" font-size="24" fill="${INK}" text-anchor="middle">Mock photo ${i + 1} of ${count}</text>` +
      `</svg>`
    return {
      id: `${listingId}-P${i + 1}`,
      url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      expiresAt,
      width: 800,
      height: 600,
    }
  })
}
