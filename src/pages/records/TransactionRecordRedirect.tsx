import { Navigate, useParams } from 'react-router'

/** A transaction's record page is its transaction detail (design §7). */
export function TransactionRecordRedirect() {
  const { id = '' } = useParams()
  return <Navigate to={`/transactions/${encodeURIComponent(id)}`} replace />
}
