import { MaskedValue } from '@/components/domain/MaskedValue'
import { Section } from '@/components/ui/Section'
import { useReveal } from '@/features/cases/api/useReveal'
import { Link } from 'react-router'
import type { CaseDetail } from '@/lib/api/types/cases'
import type { TargetType } from '@/lib/api/types/reference'
import { TARGET_TYPE_LABELS } from '@/lib/copy/labels'
import { REDACTION } from '@/lib/copy/status'
import { canAccess } from '@/lib/permissions/permissions'
import { useSessionStore } from '@/stores/session'

/** Content with its own record page; a comment is found through its feed post */
const RECORD_OF: Partial<Record<TargetType, string>> = { listing: 'listings', feed_post: 'feed', account: 'users' }

/** The reported thing as plain text; private messages stay behind a reason (design §4.3). */
export function ContentSection({ caseDetail }: { caseDetail: CaseDetail }) {
  const reveal = useReveal()
  const { content, hasPrivateMessages } = caseDetail
  const canBrowse = canAccess(
    'records',
    useSessionStore((s) => s.roles),
  )
  const recordKind = content && canBrowse ? RECORD_OF[content.type] : undefined
  if (!content && !hasPrivateMessages) return null

  return (
    <Section title="Reported content">
      {content && (
        <div className="flex flex-col gap-1">
          <p className="text-caption text-muted">
            {TARGET_TYPE_LABELS[content.type]}{' '}
            {recordKind ? (
              <Link
                to={`/records/${recordKind}/${content.id}`}
                className="font-medium text-action tabular-nums underline-offset-2 hover:underline"
              >
                {content.id}
              </Link>
            ) : (
              <span className="tabular-nums">{content.id}</span>
            )}
          </p>
          {content.redaction ? (
            <p className="text-body text-muted italic">{REDACTION[content.redaction]}</p>
          ) : (
            <blockquote className="rounded-small bg-cloud p-3 text-body whitespace-pre-wrap text-ink">
              {content.text}
            </blockquote>
          )}
        </div>
      )}
      {hasPrivateMessages && (
        <div className="flex flex-col gap-1">
          <p className="text-caption text-muted">Private messages</p>
          <MaskedValue
            label="Private messages"
            reveal={async (reason) =>
              (await reveal({ scope: { kind: 'case', id: caseDetail.id }, field: 'messages', reason })).value ?? ''
            }
          />
        </div>
      )}
    </Section>
  )
}
