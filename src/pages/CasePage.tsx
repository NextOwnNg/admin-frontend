import { useParams } from 'react-router'
import { PlaceholderPage } from '@/components/layout/PlaceholderPage'

export function CasePage() {
  const { id = '' } = useParams()
  return (
    <PlaceholderPage
      title={`Case ${id}`}
      phase="B"
      summary="Case summary, parties (masked by default), affected content, staff notes and the resolution workflow."
    />
  )
}
