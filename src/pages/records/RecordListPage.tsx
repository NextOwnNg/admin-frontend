import { useParams } from 'react-router'
import { PlaceholderPage } from '@/components/layout/PlaceholderPage'
import { recordKindLabel } from '@/lib/permissions/permissions'

export function RecordListPage() {
  const { kind } = useParams()
  const label = recordKindLabel(kind) ?? 'Records'
  return (
    <PlaceholderPage
      title={label}
      phase="C"
      summary={`Search, filter and page through ${label.toLowerCase()}, showing only the fields needed to identify each record.`}
    />
  )
}
