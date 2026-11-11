import { describe, expect, it, vi } from 'vitest'
import type { StaffSession } from '@/lib/api/types/auth'
import { applySession, resetAllStores, useSessionStore } from '@/stores/session'
import { useTablePrefs } from '@/stores/tablePrefs'
import { useUiStore } from '@/stores/ui'

const session = (roles: string[]): StaffSession => ({
  staffId: 's-1',
  displayName: 'Test Staff',
  roles: roles as StaffSession['roles'],
  idleTimeoutSeconds: 1800,
})

describe('session store', () => {
  it('mirrors a staff session', () => {
    applySession(session(['moderator']))
    expect(useSessionStore.getState()).toMatchObject({
      status: 'staff',
      displayName: 'Test Staff',
      roles: ['moderator'],
    })
  })

  it('drops role names it does not know', () => {
    applySession(session(['moderator', 'wizard']))
    expect(useSessionStore.getState().roles).toEqual(['moderator'])
  })

  it('treats a session with no known role as not staff', () => {
    applySession(session(['wizard']))
    expect(useSessionStore.getState()).toMatchObject({ status: 'signed-out', roles: [] })

    applySession(session([]))
    expect(useSessionStore.getState().status).toBe('signed-out')
  })

  it('signs out on reset', () => {
    applySession(session(['administrator']))
    resetAllStores()
    expect(useSessionStore.getState()).toMatchObject({ status: 'signed-out', staffId: null, roles: [] })
  })
})

describe('preference stores survive broken storage', () => {
  it('still toggles the sidebar when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    const before = useUiStore.getState().sidebarCollapsed
    useUiStore.getState().toggleSidebar()
    expect(useUiStore.getState().sidebarCollapsed).toBe(!before)
  })

  it('falls back to defaults on corrupt stored JSON', async () => {
    localStorage.setItem('nextown-admin-ui', '{not json')
    await expect(useUiStore.persist.rehydrate()).resolves.not.toThrow()
    expect(useUiStore.getState().sidebarCollapsed).toBe(false)
  })

  it('remembers table preferences per table', () => {
    useTablePrefs.getState().setPrefs('reports', { hiddenColumns: ['assignee'], density: 'compact' })
    expect(useTablePrefs.getState().prefs.reports).toEqual({ hiddenColumns: ['assignee'], density: 'compact' })
  })

  it('rehydrates broken table preferences as none', async () => {
    localStorage.setItem('nextown-admin-table-prefs', JSON.stringify({ state: { prefs: null }, version: 1 }))
    await useTablePrefs.persist.rehydrate()
    expect(useTablePrefs.getState().prefs).toEqual({})
  })

  it('drops stored table preferences with the wrong shape', async () => {
    localStorage.setItem(
      'nextown-admin-table-prefs',
      JSON.stringify({
        state: {
          prefs: {
            reports: { hiddenColumns: ['age'], density: 'compact' },
            audit: { hiddenColumns: [], density: 'huge' },
            cases: { hiddenColumns: 'all', density: 'compact' },
          },
        },
        version: 1,
      }),
    )
    await useTablePrefs.persist.rehydrate()
    expect(useTablePrefs.getState().prefs).toEqual({ reports: { hiddenColumns: ['age'], density: 'compact' } })
  })
})

describe('dashboard chart views (Phase D design §4.3)', () => {
  it('remembers chart or table per section', () => {
    useUiStore.getState().setChartView('funnel', 'table')
    expect(useUiStore.getState().chartViews).toEqual({ funnel: 'table' })
  })

  it('drops stored views it does not know', async () => {
    localStorage.setItem(
      'nextown-admin-ui',
      JSON.stringify({
        state: { sidebarCollapsed: true, chartViews: { funnel: 'pie', modes: 'table', nope: 'chart' } },
        version: 1,
      }),
    )
    await useUiStore.persist.rehydrate()
    expect(useUiStore.getState().chartViews).toEqual({ modes: 'table' })
    expect(useUiStore.getState().sidebarCollapsed).toBe(true)
  })
})
