import { useParams } from 'react-router'
import { PlaceholderPage } from '@/components/layout/PlaceholderPage'
import { recordKindLabel } from '@/lib/permissions/permissions'

export function RecordDetailPage() {
  const { kind, id = '' } = useParams()
  return (
    <PlaceholderPage
      title={`${recordKindLabel(kind) ?? 'Record'} ${id}`}
      phase="C"
      summary="Record detail, linked along the chain: member, item, listing, offer, transaction and case."
    />
  )
}
