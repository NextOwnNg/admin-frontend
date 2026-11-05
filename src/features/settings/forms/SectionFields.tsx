import { Plus, Trash2 } from 'lucide-react'
import { Controller, useFieldArray, useWatch, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { PlainButton } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { QUICK_SELL_LABELS } from '@/features/settings/schemas'
import type { QuickSellOption, SettingsSection } from '@/lib/api/types/settings'

/**
 * Each settings section's fields. The form holds `{ value }`, so a field's path (`value.0.areas.1.name`)
 * is also where the server reports its error (Phase C design §4.5).
 */

type Form = UseFormReturn<FieldValues>
type Props = { form: Form; inUse: string[] }

/** The message for a dotted path, if the form has one */
function errorAt(form: Form, path: string): string | null {
  let node: unknown = form.formState.errors
  for (const part of path.split('.')) node = (node as Record<string, unknown> | undefined)?.[part]
  const message = (node as { message?: unknown } | undefined)?.message
  return typeof message === 'string' ? message : null
}

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`

function TextInput({ form, path, label, type = 'text' }: { form: Form; path: string; label: string; type?: string }) {
  return (
    <Field label={label} error={errorAt(form, path)}>
      {({ inputId, describedBy, invalid }) => (
        <input
          id={inputId}
          type={type}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className="field-input h-control-compact text-compact"
          {...form.register(path)}
        />
      )}
    </Field>
  )
}

function NumberInput({ form, path, label }: { form: Form; path: string; label: string }) {
  return (
    <Field label={label} error={errorAt(form, path)}>
      {({ inputId, describedBy, invalid }) => (
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className="field-input h-control-compact w-32 text-compact tabular-nums"
          {...form.register(path, { valueAsNumber: true })}
        />
      )}
    </Field>
  )
}

/** A named place or category row: name, Active, and Remove unless it is in use */
function PlaceRow({
  form,
  path,
  label,
  inUse,
  onRemove,
}: {
  form: Form
  path: string
  label: string
  inUse: boolean
  onRemove: () => void
}) {
  const name = (useWatch({ control: form.control, name: `${path}.name` }) as string | undefined) ?? ''
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-48 flex-1">
        <Field label={label} error={errorAt(form, `${path}.name`)}>
          {({ inputId, describedBy, invalid }) => (
            <input
              id={inputId}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              maxLength={60}
              className="field-input h-control-compact text-compact"
              {...form.register(`${path}.name`)}
            />
          )}
        </Field>
      </div>
      <label className="flex h-control-compact items-center gap-2 text-compact text-ink">
        <input type="checkbox" className="size-4 accent-action" {...form.register(`${path}.active`)} />
        Active
        <span className="sr-only"> ({name.trim() || label})</span>
      </label>
      {!inUse && (
        <PlainButton size="compact" variant="ghost" aria-label={`Remove ${name.trim() || label}`} onClick={onRemove}>
          <Trash2 aria-hidden className="size-4" />
          Remove
        </PlainButton>
      )}
    </div>
  )
}

function AreaList({ form, cityIndex, cityName, inUse }: Props & { cityIndex: number; cityName: string }) {
  const areas = useFieldArray({ control: form.control, name: `value.${cityIndex}.areas` })
  return (
    <div className="flex flex-col gap-2 border-l-2 border-border pl-4">
      {areas.fields.map((area, j) => (
        <PlaceRow
          key={area.id}
          form={form}
          path={`value.${cityIndex}.areas.${j}`}
          label={`Area ${j + 1} in ${cityName}`}
          inUse={inUse.includes((form.getValues(`value.${cityIndex}.areas.${j}.id`) as string | undefined) ?? '')}
          onRemove={() => areas.remove(j)}
        />
      ))}
      <div>
        <PlainButton
          size="compact"
          variant="secondary"
          onClick={() => areas.append({ id: newId('a'), name: '', active: true })}
        >
          <Plus aria-hidden className="size-4" />
          Add area to {cityName}
        </PlainButton>
      </div>
    </div>
  )
}

function LocationFields({ form, inUse }: Props) {
  const cities = useFieldArray({ control: form.control, name: 'value' })
  const names = (useWatch({ control: form.control, name: 'value' }) as { name: string }[] | undefined) ?? []
  return (
    <div className="flex flex-col gap-4">
      {cities.fields.map((city, i) => {
        const cityName = names[i]?.name.trim() || `city ${i + 1}`
        return (
          <div key={city.id} className="flex flex-col gap-3">
            <PlaceRow
              form={form}
              path={`value.${i}`}
              label={`City ${i + 1} name`}
              inUse={inUse.includes((form.getValues(`value.${i}.id`) as string | undefined) ?? '')}
              onRemove={() => cities.remove(i)}
            />
            <AreaList form={form} inUse={inUse} cityIndex={i} cityName={cityName} />
          </div>
        )
      })}
      <div>
        <PlainButton
          size="compact"
          variant="secondary"
          onClick={() => cities.append({ id: newId('c'), name: '', active: true, areas: [] })}
        >
          <Plus aria-hidden className="size-4" />
          Add city
        </PlainButton>
      </div>
    </div>
  )
}

function CategoryFields({ form, inUse }: Props) {
  const rows = useFieldArray({ control: form.control, name: 'value' })
  return (
    <div className="flex flex-col gap-2">
      {rows.fields.map((row, i) => (
        <PlaceRow
          key={row.id}
          form={form}
          path={`value.${i}`}
          label={`Category ${i + 1}`}
          inUse={inUse.includes((form.getValues(`value.${i}.id`) as string | undefined) ?? '')}
          onRemove={() => rows.remove(i)}
        />
      ))}
      <div>
        <PlainButton
          size="compact"
          variant="secondary"
          onClick={() => rows.append({ id: newId('k'), name: '', active: true })}
        >
          <Plus aria-hidden className="size-4" />
          Add category
        </PlainButton>
      </div>
    </div>
  )
}

function QuickSellFields({ form }: Props) {
  return (
    <Controller
      control={form.control}
      name="value"
      render={({ field }) => {
        const chosen = (field.value as QuickSellOption[] | undefined) ?? []
        return (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-compact font-medium text-ink">Deadlines sellers may choose</legend>
            {(Object.keys(QUICK_SELL_LABELS) as QuickSellOption[]).map((option) => (
              <label key={option} className="flex items-center gap-2 text-compact text-ink">
                <input
                  type="checkbox"
                  className="size-4 accent-action"
                  checked={chosen.includes(option)}
                  onChange={(e) =>
                    field.onChange(
                      e.target.checked
                        ? (Object.keys(QUICK_SELL_LABELS) as QuickSellOption[]).filter(
                            (o) => o === option || chosen.includes(o),
                          )
                        : chosen.filter((o) => o !== option),
                    )
                  }
                />
                {QUICK_SELL_LABELS[option]}
              </label>
            ))}
            {errorAt(form, 'value') && <p className="text-compact text-danger">{errorAt(form, 'value')}</p>}
          </fieldset>
        )
      }}
    />
  )
}

function ContentRuleFields({ form }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <Controller
        control={form.control}
        name="value.prohibitedItems"
        render={({ field }) => (
          <Field
            label="Prohibited items (one per line)"
            error={
              errorAt(form, 'value.prohibitedItems') ??
              ((field.value as string[] | undefined) ?? [])
                .map((_, i) => errorAt(form, `value.prohibitedItems.${i}`))
                .find(Boolean) ??
              null
            }
          >
            {({ inputId, describedBy, invalid }) => (
              <textarea
                id={inputId}
                rows={5}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                className="field-input min-h-28 py-3 text-compact"
                defaultValue={((field.value as string[] | undefined) ?? []).join('\n')}
                onChange={(e) =>
                  field.onChange(
                    e.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean),
                  )
                }
              />
            )}
          </Field>
        )}
      />
      <TextInput form={form} path="value.rulesUrl" label="Community rules link" type="url" />
    </div>
  )
}

function SupportFields({ form }: Props) {
  return (
    <div className="grid gap-3 tablet:grid-cols-2">
      <TextInput form={form} path="value.phone" label="Support phone" type="tel" />
      <TextInput form={form} path="value.email" label="Support email" type="email" />
      <div className="tablet:col-span-2">
        <TextInput form={form} path="value.hours" label="Support hours" />
      </div>
    </div>
  )
}

/** The fields for one section */
export function SectionFields({ section, form, inUse }: Props & { section: SettingsSection }) {
  switch (section) {
    case 'locations':
      return <LocationFields form={form} inUse={inUse} />
    case 'categories':
      return <CategoryFields form={form} inUse={inUse} />
    case 'offerLifetimeHours':
      return <NumberInput form={form} path="value" label="Offer lifetime (hours)" />
    case 'reservationDays':
      return <NumberInput form={form} path="value" label="Reservation duration (days)" />
    case 'quickSellOptions':
      return <QuickSellFields form={form} inUse={inUse} />
    case 'photoLimits':
      return (
        <div className="flex flex-wrap gap-4">
          <NumberInput form={form} path="value.min" label="Minimum photos" />
          <NumberInput form={form} path="value.max" label="Maximum photos" />
        </div>
      )
    case 'contentRules':
      return <ContentRuleFields form={form} inUse={inUse} />
    case 'supportContacts':
      return <SupportFields form={form} inUse={inUse} />
  }
}
