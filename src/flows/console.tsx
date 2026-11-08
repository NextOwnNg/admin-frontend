import { QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render } from '@testing-library/react'
import { computeAccessibleName } from 'dom-accessibility-api'
import { HelmetProvider } from 'react-helmet-async'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { expect } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createQueryClient } from '@/app/query-client'
import { routes } from '@/app/router'
import { signOut } from '@/features/auth/api/auth-api'
import type { StaffRole } from '@/lib/copy/labels'
import { useSessionStore } from '@/stores/session'
import { signInAs } from '@/test/auth'

/** The sizes the PRD's flows run at (§10.1) */
export const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1024', width: 1024, height: 768 },
] as const

/** Signs in through the mock API (when a role is given) and renders the whole console at `path`. */
export async function openConsole(path: string, role?: StaffRole) {
  if (role) await signInAs(role)
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <HelmetProvider>
      <QueryClientProvider client={createQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </HelmetProvider>,
  )
  return { router }
}

/** Ends this session and opens the console again as someone else. */
export async function switchTo(role: StaffRole, path: string) {
  cleanup()
  await signOut()
  useSessionStore.setState(useSessionStore.getInitialState())
  return openConsole(path, role)
}

const nameOf = (el: Element) => computeAccessibleName(el).replace(/\s+/g, ' ').trim()
const matches = (name: string, wanted: string | RegExp) =>
  typeof wanted === 'string' ? name === wanted : wanted.test(name)

function drawsRing(el: Element) {
  const style = getComputedStyle(el)
  return style.outlineStyle !== 'none' || style.boxShadow !== 'none'
}

/** An outline or ring on the element; a focused table row draws its ring on its cells (HeroUI) */
const hasIndicator = (el: Element) =>
  drawsRing(el) || (el.getAttribute('role') === 'row' && [...el.children].some(drawsRing))

/** Focus is on `el`, and a sighted keyboard user can see it */
export function expectFocusVisible(el: Element) {
  expect(document.activeElement).toBe(el)
  expect(el.matches(':focus-visible'), `focus not visible on "${nameOf(el)}"`).toBe(true)
  expect(hasIndicator(el), `no focus indicator on "${nameOf(el)}"`).toBe(true)
}

/** After a dialog closes, focus is somewhere the operator can carry on from: not lost on the page body */
export function expectFocusInPage() {
  const el = document.activeElement
  expect(el && el !== document.body, 'focus was lost to the page body').toBe(true)
  expect((el as HTMLElement).checkVisibility(), 'focus is on a hidden element').toBe(true)
}

/** Presses Tab (or Shift+Tab) until the focused element has the accessible name wanted. */
export async function tabTo(wanted: string | RegExp, { max = 80, shift = false } = {}) {
  for (let i = 0; i < max; i++) {
    await userEvent.keyboard(shift ? '{Shift>}{Tab}{/Shift}' : '{Tab}')
    const el = document.activeElement
    if (el && el !== document.body && matches(nameOf(el), wanted)) {
      expectFocusVisible(el)
      return el as HTMLElement
    }
  }
  throw new Error(`Tab never reached "${String(wanted)}" (last: "${nameOf(document.activeElement ?? document.body)}")`)
}

/**
 * Moves through a table by arrow keys until the focused row or cell has the accessible name wanted. HeroUI tables
 * are one Tab stop: arrows move between rows and cells, then Tab enters a cell's link or button.
 */
export async function arrowTo(wanted: string | RegExp, key: 'ArrowDown' | 'ArrowRight' | 'ArrowUp', max = 40) {
  for (let i = 0; i <= max; i++) {
    const el = document.activeElement
    if (el && matches(nameOf(el), wanted)) {
      expectFocusVisible(el)
      return el as HTMLElement
    }
    await userEvent.keyboard(`{${key}}`)
  }
  throw new Error(
    `${key} never reached "${String(wanted)}" (last: "${nameOf(document.activeElement ?? document.body)}")`,
  )
}

/** Waits until `find` returns an element, polling the live page */
export async function waitForElement<T extends Element>(find: () => T | null | undefined, timeout = 5_000) {
  let found: T | null | undefined
  await expect.poll(() => (found = find()), { timeout }).toBeTruthy()
  return found as T
}
