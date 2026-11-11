import { act, renderHook } from '@testing-library/react'
import { useEffect, type ReactNode } from 'react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { commaList, useUrlFilters } from '@/hooks/useUrlFilters'

const schema = z.object({
  severity: commaList(['S1', 'S2', 'S3', 'S4'] as const).optional(),
  status: commaList(['open', 'closed'] as const).default(['open']),
  age: z.enum(['1h', '24h']).optional(),
  cursor: z.string().optional(),
})

function setup(path: string) {
  const seen = { search: '' }
  const wrapper = ({ children }: { children: ReactNode }) => {
    const Probe = () => {
      const { search } = useLocation()
      useEffect(() => {
        seen.search = search
      }, [search])
      return <>{children}</>
    }
    const router = createMemoryRouter([{ path: '/', element: <Probe /> }], { initialEntries: [path] })
    return <RouterProvider router={router} />
  }
  const hook = renderHook(() => useUrlFilters(schema), { wrapper })
  return { hook, search: () => new URLSearchParams(seen.search) }
}

describe('useUrlFilters (design §4.2)', () => {
  it('drops values it does not know and applies defaults', () => {
    const { hook } = setup('/?severity=S9&status=nope&age=forever')
    expect(hook.result.current.filters).toEqual({ status: ['open'] })
    expect(hook.result.current.present).toEqual({})
  })

  it('keeps known values from a comma list', () => {
    const { hook } = setup('/?severity=S1,S9,S2')
    expect(hook.result.current.filters.severity).toEqual(['S1', 'S2'])
    expect(hook.result.current.present).toEqual({ severity: ['S1', 'S2'] })
  })

  it('sets several filters at once and starts paging again', () => {
    const { hook, search } = setup('/?cursor=25&age=1h')
    act(() => hook.result.current.setFilters({ severity: ['S2'], age: undefined }))
    expect(search().get('severity')).toBe('S2')
    expect(search().has('age')).toBe(false)
    expect(search().has('cursor')).toBe(false)
  })

  it('writes filters to the address and starts paging again', () => {
    const { hook, search } = setup('/?cursor=25')
    act(() => hook.result.current.setFilter('severity', ['S3']))
    expect(search().get('severity')).toBe('S3')
    expect(search().has('cursor')).toBe(false)
    expect(hook.result.current.filters.severity).toEqual(['S3'])

    act(() => hook.result.current.setFilter('severity', undefined))
    expect(search().has('severity')).toBe(false)
  })

  it('clears every filter', () => {
    const { hook, search } = setup('/?severity=S1&age=1h')
    act(() => hook.result.current.clear())
    expect(search().toString()).toBe('')
  })
})
