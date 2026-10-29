import axe from 'axe-core'
import { expect } from 'vitest'

/**
 * Fails with the violated rule ids when axe finds accessibility problems (PRD §8, §9). `region` is off:
 * components render in isolation, outside the page landmarks.
 */
export async function expectNoA11yViolations(container: Element) {
  const { violations } = await axe.run(container, {
    rules: { region: { enabled: false }, 'color-contrast': { enabled: false } },
  })
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
}
