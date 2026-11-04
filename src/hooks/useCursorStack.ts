import { useState } from 'react'

/**
 * Earlier pages' cursors, for Previous. Opaque cursors can't be counted back, so they are remembered;
 * the memory belongs to one set of filters and starts again when any of them changes.
 */
export function useCursorStack(filters: Record<string, unknown>) {
  const { cursor, ...rest } = filters
  const key = JSON.stringify(rest)
  const [state, setState] = useState<{ key: string; stack: (string | undefined)[] }>({ key, stack: [] })
  const stack = state.key === key ? state.stack : []
  return {
    hasPrevious: stack.length > 0,
    /** Remember the current page and return nothing; call before moving to the next cursor */
    push: () => setState({ key, stack: [...stack, cursor as string | undefined] }),
    /** Forget the last page and return its cursor */
    pop: () => {
      setState({ key, stack: stack.slice(0, -1) })
      return stack.at(-1)
    },
  }
}
