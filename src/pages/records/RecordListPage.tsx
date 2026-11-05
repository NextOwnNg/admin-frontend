import { useParams } from 'react-router'
import { RecordBrowser } from '@/features/records/components/RecordBrowser'
import type { RecordKind } from '@/lib/api/types/records'

/** `/records/:kind`; the layout has already turned unknown kinds away */
export function RecordListPage() {
  const { kind } = useParams()
  return <RecordBrowser key={kind} kind={kind as RecordKind} />
}
