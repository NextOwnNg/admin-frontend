import { Dropdown } from '@heroui/react'
import { ChevronDown } from 'lucide-react'
import type { Selection } from 'react-aria-components'

import { controlClass } from '@/components/data/filter-utils'

/** Filter controls shared by the queue, the log and the record browsers (design §4.2). */

/** A dropdown of checkboxes; nothing chosen means no filter */
export function MultiFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[] | undefined
  onChange: (values: string[] | undefined) => void
}) {
  const change = (keys: Selection) => {
    const values = keys === 'all' ? options.map((o) => o.value) : options.map((o) => o.value).filter((v) => keys.has(v))
    onChange(values.length > 0 ? values : undefined)
  }
  return (
    <Dropdown>
      <Dropdown.Trigger className={controlClass}>
        {label}
        {selected && (
          <span aria-hidden className="rounded-full bg-mint px-1.5 text-caption text-action tabular-nums">
            {selected.length}
          </span>
        )}
        <ChevronDown aria-hidden className="size-4 text-muted" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom start">
        <Dropdown.Menu
          aria-label={label}
          selectionMode="multiple"
          selectedKeys={new Set(selected ?? [])}
          onSelectionChange={change}
        >
          {options.map((o) => (
            <Dropdown.Item key={o.value} id={o.value} textValue={o.label}>
              {o.label}
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}

/** A native select with an "any" choice */
export function SingleFilter({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string | undefined
  onChange: (value: string | undefined) => void
}) {
  return (
    <select
      aria-label={label}
      className={`${controlClass} cursor-pointer pr-8`}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
    >
      <option value="">{label}: any</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
