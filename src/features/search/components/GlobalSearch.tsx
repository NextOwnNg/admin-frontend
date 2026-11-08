import { ComboBox, Header, ListBox } from '@heroui/react'
import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type Key } from 'react'
// The unstyled input: the console's field style, not HeroUI's taller one
import { Collection, Input } from 'react-aria-components'
import { useNavigate } from 'react-router'
import { MIN_SEARCH, useSearch } from '@/features/search/api/useSearch'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { SearchResult } from '@/lib/api/types/search'
import { RECORD_KIND_LABEL } from '@/lib/copy/records'

const DEBOUNCE_MS = 250
const resultKey = (r: SearchResult) => `${r.kind}:${r.id}:${r.label}`

type Group = { id: string; label: string; results: (SearchResult & { key: string })[] }

/** Typing in one of these is never interrupted by the "/" shortcut */
const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/**
 * The top bar's record search (Phase C design §4.3): by ID or name, grouped by kind. The API decides what
 * each role may find, so a result never reveals a record the viewer can't open.
 */
export function GlobalSearch() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const settled = useDebouncedValue(text, DEBOUNCE_MS)
  const search = useSearch(settled)
  const query = settled.trim()
  // Only the answer to what is in the box now counts
  const current = settled === text && query.length >= MIN_SEARCH ? search.data : undefined

  const groups = useMemo<Group[]>(() => {
    const all = (current?.groups ?? []).map((g) => ({
      id: g.kind,
      label: RECORD_KIND_LABEL[g.kind],
      results: g.results.map((r) => ({ ...r, key: resultKey(r) })),
    }))
    // An exact ID match leads: its group first, and it first within the group
    const exactHref = current?.exact?.href
    if (!exactHref) return all
    const isExact = (r: SearchResult) => r.href === exactHref
    const ordered = all.map((g) => ({
      ...g,
      results: [...g.results.filter(isExact), ...g.results.filter((r) => !isExact(r))],
    }))
    return [...ordered.filter((g) => g.results.some(isExact)), ...ordered.filter((g) => !g.results.some(isExact))]
  }, [current])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // The top bar remounts this box on every navigation, which clears it
  const open = (href: string) => void navigate(href)
  const choose = (key: Key | null) => {
    const result = groups.flatMap((g) => g.results).find((r) => r.key === key)
    if (result) open(result.href)
  }

  // Enter pressed before the answer arrived: act on it once the answer for that same text lands
  const pendingEnter = useRef<string | null>(null)
  useEffect(() => {
    const pending = pendingEnter.current
    if (pending === null) return
    if (settled.trim() !== pending || search.isError) {
      if (text.trim() !== pending || search.isError) pendingEnter.current = null
      return
    }
    if (!current) return
    pendingEnter.current = null
    if (current.exact) void navigate(current.exact.href)
  }, [current, settled, text, search.isError, navigate])

  const message =
    text.trim().length < MIN_SEARCH
      ? 'Type at least 2 characters'
      : search.isError && settled === text
        ? "Search isn't available right now. Try again."
        : current
          ? `No matches for "${query}"`
          : 'Searching…'

  const resultCount = groups.reduce((n, g) => n + g.results.length, 0)
  // Read out what the list shows, since the list itself isn't announced as it changes
  const announcement =
    text.trim().length < MIN_SEARCH
      ? ''
      : resultCount > 0
        ? `${resultCount} ${resultCount === 1 ? 'result' : 'results'}`
        : message

  return (
    <>
      <p data-testid="search-status" role="status" className="sr-only">
        {announcement}
      </p>
      <ComboBox
        aria-label="Search records by ID or name"
        className="w-48 desktop:w-72"
        inputValue={text}
        onInputChange={setText}
        items={groups}
        selectedKey={null}
        onSelectionChange={choose}
        allowsCustomValue
        allowsEmptyCollection
        menuTrigger="input"
      >
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted"
          />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search ID or name"
            maxLength={80}
            className="field-input h-control-compact w-full pl-9 text-compact"
            onKeyDown={(e) => {
              // Enter with no option highlighted opens an exact ID match, and only for the answered query
              if (e.key !== 'Enter' || e.currentTarget.getAttribute('aria-activedescendant')) return
              if (current) {
                if (current.exact) open(current.exact.href)
              } else if (text.trim().length >= MIN_SEARCH) {
                pendingEnter.current = text.trim()
              }
            }}
          />
        </div>
        <ComboBox.Popover placement="bottom end" className="w-96">
          <ListBox renderEmptyState={() => <p className="px-3 py-2 text-compact text-muted">{message}</p>}>
            {(item) => {
              const group = item as Group
              return (
                <ListBox.Section id={group.id}>
                  <Header className="px-3 pt-2 pb-1 text-caption font-semibold text-muted">{group.label}</Header>
                  <Collection items={group.results}>
                    {(r) => (
                      <ListBox.Item id={r.key} textValue={`${r.label} ${r.id}`}>
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-compact text-ink">{r.label}</span>
                          <span className="text-caption text-muted tabular-nums">{r.id}</span>
                        </span>
                      </ListBox.Item>
                    )}
                  </Collection>
                </ListBox.Section>
              )
            }}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>
    </>
  )
}
