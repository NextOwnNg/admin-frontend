import { Dropdown, Header } from '@heroui/react'
import { SlidersHorizontal } from 'lucide-react'
import type { Selection } from 'react-aria-components'
import { controlClass } from '@/components/data/filter-utils'
import { DEFAULT_TABLE_PREFS, useTablePrefs, type TablePrefs } from '@/stores/tablePrefs'

export type OptionColumn = { id: string; header: string; hideable: boolean }

const DENSITIES: { id: TablePrefs['density']; label: string }[] = [
  { id: 'comfortable', label: 'Comfortable' },
  { id: 'compact', label: 'Compact' },
]

/** Density and which columns show, remembered per table on this device (PRD §3.4). */
export function TableOptions({ tableId, columns }: { tableId: string; columns: OptionColumn[] }) {
  const prefs = useTablePrefs((s) => s.prefs[tableId] ?? DEFAULT_TABLE_PREFS)
  const setPrefs = useTablePrefs((s) => s.setPrefs)
  const hideable = columns.filter((c) => c.hideable)
  const shown = hideable.filter((c) => !prefs.hiddenColumns.includes(c.id)).map((c) => c.id)

  const setDensity = (keys: Selection) => {
    const [density] = keys === 'all' ? [] : [...keys]
    if (density === 'compact' || density === 'comfortable') setPrefs(tableId, { ...prefs, density })
  }
  const setShown = (keys: Selection) => {
    const visible = keys === 'all' ? hideable.map((c) => c.id) : [...keys].map(String)
    setPrefs(tableId, { ...prefs, hiddenColumns: hideable.map((c) => c.id).filter((id) => !visible.includes(id)) })
  }

  return (
    <Dropdown>
      <Dropdown.Trigger className={controlClass}>
        <SlidersHorizontal aria-hidden className="size-4 text-muted" />
        Table options
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu aria-label="Table options">
          <Dropdown.Section
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([prefs.density])}
            onSelectionChange={setDensity}
          >
            <Header>Density</Header>
            {DENSITIES.map((d) => (
              <Dropdown.Item key={d.id} id={d.id} textValue={d.label}>
                {d.label}
                <Dropdown.ItemIndicator />
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
          {hideable.length > 0 && (
            <Dropdown.Section selectionMode="multiple" selectedKeys={new Set(shown)} onSelectionChange={setShown}>
              <Header>Columns</Header>
              {hideable.map((c) => (
                <Dropdown.Item key={c.id} id={c.id} textValue={c.header}>
                  {c.header}
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
              ))}
            </Dropdown.Section>
          )}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
