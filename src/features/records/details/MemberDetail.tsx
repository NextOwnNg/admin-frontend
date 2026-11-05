import { KeyValueList } from '@/components/data/KeyValueList'
import { MaskedValue } from '@/components/domain/MaskedValue'
import { Section } from '@/components/ui/Section'
import { HistorySection } from '@/features/cases/components/HistorySection'
import { useRevealMemberPhone } from '@/features/records/api/useRevealMemberPhone'
import { RecordDetailLayout } from '@/features/records/components/RecordDetailLayout'
import {
  ItemList,
  ListingList,
  OfferList,
  ReportList,
  TransactionList,
} from '@/features/records/components/RecordLists'
import type { MemberDetail as MemberDetailData } from '@/lib/api/types/records'
import { memberStatusText } from '@/lib/copy/records'
import { formatWATDate } from '@/lib/time/time'

/** A member: who they are, what they own and trade, and what moderation has done (ADM-FE-07) */
export function MemberDetail({ member }: { member: MemberDetailData }) {
  const revealPhone = useRevealMemberPhone(member.id)
  return (
    <RecordDetailLayout kind="users" id={member.id} title={member.displayName} detail={member}>
      <Section title="Profile">
        <KeyValueList
          items={[
            { term: 'Member ID', value: <span className="tabular-nums">{member.id}</span> },
            { term: 'Area', value: member.area },
            { term: 'Joined', value: formatWATDate(member.joinedAt) },
            { term: 'Status', value: memberStatusText(member.status, member.restrictedUntil) },
            { term: 'Open cases', value: <span className="tabular-nums">{member.openCases}</span> },
          ]}
        />
      </Section>
      <Section title="Phone">
        {member.hasPhone ? (
          <MaskedValue label={`Phone number of ${member.displayName}`} reveal={revealPhone} />
        ) : (
          <p className="text-compact text-muted">No phone on record</p>
        )}
      </Section>
      <Section title="Items">
        <ItemList rows={member.items} />
      </Section>
      <Section title="Listings">
        <ListingList rows={member.listings} />
      </Section>
      <Section title="Offers">
        <OfferList rows={member.offers} />
      </Section>
      <Section title="Transactions">
        <TransactionList rows={member.transactions} />
      </Section>
      <Section title="Reports filed">
        <ReportList rows={member.reportsFiled} empty="No reports filed" />
      </Section>
      <Section title="Reports received">
        <ReportList rows={member.reportsReceived} empty="No reports received" />
      </Section>
      <HistorySection title="Moderation history" entries={member.history} />
    </RecordDetailLayout>
  )
}
