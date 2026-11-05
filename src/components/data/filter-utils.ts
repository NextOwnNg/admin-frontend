export type FilterOption = { value: string; label: string }

/** The look shared by every filter control and Table options */
export const controlClass =
  'flex h-control-compact items-center gap-2 rounded-control border border-border bg-paper px-3 text-compact font-medium text-ink hover:bg-cloud'

/** `"Open, Assigned"` for chips */
export const labelsOf = (values: string[], options: { value: string; label: string }[]) =>
  values.map((v) => options.find((o) => o.value === v)?.label ?? v).join(', ')
