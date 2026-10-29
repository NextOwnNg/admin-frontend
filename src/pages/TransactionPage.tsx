import { useParams } from 'react-router'
import { PlaceholderPage } from '@/components/layout/PlaceholderPage'

export function TransactionPage() {
  const { id = '' } = useParams()
  return (
    <PlaceholderPage
      title={`Transaction ${id}`}
      phase="B"
      summary="The accepted agreement snapshot, every offer version, each participant's confirmation and the audit trail."
    />
  )
}
