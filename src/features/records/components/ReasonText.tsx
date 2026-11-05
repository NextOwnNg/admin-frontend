import { useReasonLabel } from '@/lib/api/reference'

/** A reason code in words once reason codes have loaded */
export function ReasonText({ code }: { code: string }) {
  return <>{useReasonLabel(code)}</>
}
