import { afterEach, describe, expect, it, vi } from 'vitest'
import { safeStorage } from '@/lib/storage/safe-storage'

afterEach(() => localStorage.clear())

describe('safeStorage', () => {
  it('reads and writes like localStorage', () => {
    safeStorage.set('k', 'v')
    expect(safeStorage.get('k')).toBe('v')
    safeStorage.remove('k')
    expect(safeStorage.get('k')).toBeNull()
  })

  it('returns null when storage throws on read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(safeStorage.get('k')).toBeNull()
  })

  it('never throws when storage throws on write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => safeStorage.set('k', 'v')).not.toThrow()
  })
})
