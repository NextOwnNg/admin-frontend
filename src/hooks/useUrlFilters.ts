import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { z } from 'zod'

/**
 * A comma-separated URL list of known values: unknown values are dropped, and a list with none left is
 * invalid (so the filter falls back to its default). `severity=S1,S9` → `['S1']`.
 */
export function commaList<const T extends readonly [string, ...string[]]>(values: T) {
  return z
    .string()
    .transform((raw) => raw.split(',').filter((v): v is T[number] => (values as readonly string[]).includes(v)))
    .pipe(z.array(z.enum(values)).min(1))
}

/** An opaque paging cursor as the API issues them; anything else in the address is dropped */
export const CURSOR = z.string().regex(/^[A-Za-z0-9._~-]{1,128}$/)

type Shape = z.ZodObject<z.ZodRawShape>

/**
 * Filters, sort and cursor kept in the URL (design §4.2): shareable, survive reload, back and forward.
 * Each parameter is read on its own, so one bad value never breaks the page; it is simply ignored.
 * `present` holds only the filters actually in the URL (for chips); `filters` adds the defaults.
 */
export function useUrlFilters<S extends Shape>(schema: S) {
  type Out = z.output<S>
  const [params, setParams] = useSearchParams()

  const { filters, present } = useMemo(() => {
    const filters: Record<string, unknown> = {}
    const present: Record<string, unknown> = {}
    for (const [key, field] of Object.entries(schema.shape)) {
      const raw = params.get(key)
      const parsed = raw === null ? undefined : z.safeParse(field, raw)
      if (parsed?.success) {
        filters[key] = parsed.data
        present[key] = parsed.data
        continue
      }
      const fallback = z.safeParse(field, undefined)
      if (fallback.success && fallback.data !== undefined) filters[key] = fallback.data
    }
    return { filters: filters as Out, present: present as Partial<Out> }
  }, [params, schema])

  /** Several filters in one address change; `undefined` removes one. A new filter starts from the first page. */
  const setFilters = useCallback(
    (patch: { [K in Extract<keyof Out, string>]?: Out[K] | undefined }) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(patch)) {
            const text = Array.isArray(value) ? value.join(',') : value === undefined ? '' : String(value)
            if (text) next.set(key, text)
            else next.delete(key)
          }
          if (!Object.keys(patch).every((key) => key === 'cursor')) next.delete('cursor')
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const setFilter = useCallback(
    <K extends Extract<keyof Out, string>>(key: K, value: Out[K] | undefined) =>
      setFilters({ [key]: value } as { [P in Extract<keyof Out, string>]?: Out[P] }),
    [setFilters],
  )

  const clear = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams])

  return { filters, present, setFilter, setFilters, clear }
}
