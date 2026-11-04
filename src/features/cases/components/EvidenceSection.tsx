import { EvidenceGate } from '@/components/domain/EvidenceGate'
import { Section } from '@/components/ui/Section'
import { useReveal } from '@/features/cases/api/useReveal'
import type { CaseDetail } from '@/lib/api/types/cases'

export function EvidenceSection({ caseDetail }: { caseDetail: CaseDetail }) {
  const reveal = useReveal()
  return (
    <Section title="Evidence">
      <EvidenceGate
        items={caseDetail.evidence}
        reveal={async (reason, id) => {
          const result = await reveal({
            scope: { kind: 'case', id: caseDetail.id },
            field: 'evidence',
            subjectId: id,
            reason,
          })
          return { url: result.url ?? '', expiresAt: result.expiresAt ?? new Date().toISOString() }
        }}
      />
    </Section>
  )
}
