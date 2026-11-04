import { MaskedValue } from '@/components/domain/MaskedValue'
import { Section } from '@/components/ui/Section'
import { useReveal } from '@/features/cases/api/useReveal'
import type { CaseDetail } from '@/lib/api/types/cases'
import { TARGET_TYPE_LABELS } from '@/lib/copy/labels'
import { REDACTION } from '@/lib/copy/status'

/** The reported thing as plain text; private messages stay behind a reason (design §4.3). */
export function ContentSection({ caseDetail }: { caseDetail: CaseDetail }) {
  const reveal = useReveal()
  const { content, hasPrivateMessages } = caseDetail
  if (!content && !hasPrivateMessages) return null

  return (
    <Section title="Reported content">
      {content && (
        <div className="flex flex-col gap-1">
          <p className="text-caption text-muted">
            {TARGET_TYPE_LABELS[content.type]} <span className="tabular-nums">{content.id}</span>
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
