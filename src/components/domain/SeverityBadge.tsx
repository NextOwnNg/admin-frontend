import { StatusBadge } from '@/components/ui/StatusBadge'
import { SEVERITY, type Severity } from '@/lib/copy/status'

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <StatusBadge {...SEVERITY[severity]} />
}
