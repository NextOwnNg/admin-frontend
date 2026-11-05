import type { ReactNode } from 'react'
import { LinkedRecordsPanel } from '@/features/records/components/LinkedRecordsPanel'
import { RecordCasesList } from '@/features/records/components/RecordCasesList'
import type { DetailBase, RecordKind } from '@/lib/api/types/records'
import { RECORD_KIND_SINGULAR } from '@/lib/copy/records'

/**
 * A record page (Phase C design §4.2): the case page's layout, with linked records and cases beside the
 * sections at 1280 px and wider, and before them below that. Read-only: acting starts from a case.
 */
export function RecordDetailLayout({
  kind,
  id,
  title,
  badge,
  detail,
  children,
}: {
  kind: RecordKind
  id: string
  title: string
  badge?: ReactNode
  detail: DetailBase
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h1 text-ink">{title}</h1>
          {badge}
        </div>
        <p className="text-compact text-muted tabular-nums">
          {RECORD_KIND_SINGULAR[kind]} · {id}
        </p>
      </header>
      <div className="grid gap-6 detail:grid-cols-12 detail:items-start">
        <div className="flex flex-col gap-6 detail:sticky detail:top-[calc(var(--nx-topbar-height)+24px)] detail:order-last detail:col-span-4">
          <LinkedRecordsPanel groups={detail.links} />
          <RecordCasesList cases={detail.cases} />
        </div>
        <div className="flex min-w-0 flex-col gap-6 detail:col-span-8">{children}</div>
      </div>
    </div>
  )
}
