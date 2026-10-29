import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useIdleTimer } from '@/hooks/useIdleTimer'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

const advance = (seconds: number) =>
  act(() => {
    vi.advanceTimersByTime(seconds * 1000)
  })

describe('useIdleTimer (PRD §3.5)', () => {
  it('warns 60 seconds before the timeout, then times out', () => {
    const onTimeout = vi.fn()
    const { result } = renderHook(() => useIdleTimer({ timeoutSeconds: 120, onTimeout }))

    advance(59)
    expect(result.current.warning).toBe(false)
    advance(1)
    expect(result.current).toMatchObject({ warning: true, secondsLeft: 60 })
    advance(30)
    expect(result.current.secondsLeft).toBe(30)
    advance(30)
    expect(onTimeout).toHaveBeenCalledOnce()
  })

  it('starts over on activity before the warning', () => {
    const onTimeout = vi.fn()
    const { result } = renderHook(() => useIdleTimer({ timeoutSeconds: 120, onTimeout }))

    advance(50)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown'))
    })
    advance(50)

    expect(result.current.warning).toBe(false)
  })

  it('ignores activity once the warning shows: only "Stay signed in" keeps the session', () => {
    const onTimeout = vi.fn()
    const { result } = renderHook(() => useIdleTimer({ timeoutSeconds: 120, onTimeout }))

    advance(70)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown'))
    })
    expect(result.current.warning).toBe(true)

    act(() => result.current.stayActive())
    expect(result.current.warning).toBe(false)
    advance(100)
    expect(onTimeout).not.toHaveBeenCalled()
  })
})

describe('useIdleTimer across tabs', () => {
  it('counts activity in another tab of the console', async () => {
    vi.useRealTimers()
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
    const otherTab = new BroadcastChannel('nextown-admin-activity')
    const { result } = renderHook(() => useIdleTimer({ timeoutSeconds: 120, onTimeout: vi.fn() }))

    advance(50)
    otherTab.postMessage(Date.now())
    await new Promise((resolve) => setTimeout(resolve, 20))
    advance(50)

    expect(result.current.warning).toBe(false)
    otherTab.close()
  })
})
