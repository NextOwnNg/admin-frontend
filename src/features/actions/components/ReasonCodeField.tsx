import type { SelectHTMLAttributes } from 'react'
import { SelectField } from '@/components/ui/SelectField'
import { reasonCodeLabel, useReasonCodes } from '@/lib/api/reference'
import type { TargetType } from '@/lib/api/types/reference'

/** The required reason (ADM-T-03): only the codes that fit this action and target (design §9a.6). */
export function ReasonCodeField({
  kind,
  targetType,
  error,
  ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  kind: 'violation' | 'decision'
  targetType: TargetType
  error?: string | null
}) {
  const reasons = useReasonCodes()
  const options = (reasons.data ?? [])
    .filter((r) => r.kind === kind && r.appliesTo.includes(targetType))
    .map((r) => ({ value: r.code, label: reasonCodeLabel(r) }))
  return (
    <SelectField
      label="Reason"
      placeholder={reasons.isPending ? 'Loading reasons…' : 'Choose a reason'}
      options={options}
      error={error}
      required
      {...props}
    />
  )
}
