import { Button } from '@heroui/react'
import { lazy, Suspense, useState, type ComponentType } from 'react'
import { PageHead } from '@/components/seo/PageHead'
import { Banner } from '@/components/ui/Banner'
import { useStaffAccounts } from '@/features/staff/api/useStaffAccounts'
import { InviteChangeDialog } from '@/features/staff/components/InviteChangeDialog'
import { InviteDialog } from '@/features/staff/components/InviteDialog'
import { StaffTable } from '@/features/staff/components/StaffTable'
import { isForbidden } from '@/lib/api/error-message'
import type { InviteResult, StaffAccountRow } from '@/lib/api/types/staff'
import { ROLE_LABELS } from '@/lib/copy/labels'
import { STAFF_COPY } from '@/lib/copy/staff'
import { useSessionStore } from '@/stores/session'

/**
 * The invite link, shown only while the mock API is on: no real email is sent there. The comparison is inline
 * so a production build drops the module and its text (design 2026-11-21 §4.5).
 */
const defaultMockInviteLink =
  import.meta.env.VITE_USE_MOCK_API === 'true'
    ? lazy(() => import('@/features/staff/components/MockInviteLink').then((m) => ({ default: m.MockInviteLink })))
    : null

type Done = { title: string; url?: string }
type Change = { change: 'resend' | 'revoke'; row: StaffAccountRow }

/** Staff (design 2026-11-21 §4.3, administrators): who has access, and inviting people to join. */
export function StaffPage({
  mockInviteLink: MockInviteLink = defaultMockInviteLink,
}: {
  mockInviteLink?: ComponentType<{ url: string }> | null
}) {
  const staff = useStaffAccounts()
  const { displayName, roles } = useSessionStore()
  const actor = `${displayName ?? 'You'} (${roles.map((r) => ROLE_LABELS[r]).join(', ')})`
  const [inviting, setInviting] = useState(false)
  const [changing, setChanging] = useState<Change | null>(null)
  const [done, setDone] = useState<Done | null>(null)
  const status = staff.isPending
    ? 'pending'
    : isForbidden(staff.error)
      ? 'forbidden'
      : staff.isError
        ? 'error'
        : 'success'

  const linkOf = (result: InviteResult) => result.mockInviteUrl

  return (
    <>
      <PageHead title="Staff" />
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-h1 text-ink">Staff</h1>
            <p className="text-body text-muted">{STAFF_COPY.intro}</p>
          </div>
          <Button
            onPress={() => {
              setDone(null)
              setInviting(true)
            }}
          >
            Invite staff
          </Button>
        </header>

        {done && (
          <Banner key={done.title} tone="success" title={done.title} focusOnShow>
            {done.url && MockInviteLink && (
              <Suspense fallback={null}>
                <MockInviteLink url={done.url} />
              </Suspense>
            )}
          </Banner>
        )}

        <StaffTable
          rows={staff.data}
          status={status}
          onRetry={() => void staff.refetch()}
          onResend={(row) => setChanging({ change: 'resend', row })}
          onRevoke={(row) => setChanging({ change: 'revoke', row })}
        />
      </div>

      {inviting && (
        <InviteDialog
          actor={actor}
          onOpenChange={setInviting}
          onSent={(result) => setDone({ title: `Invite sent to ${result.email}`, url: linkOf(result) })}
        />
      )}
      {changing && (
        <InviteChangeDialog
          change={changing.change}
          row={changing.row}
          actor={actor}
          onOpenChange={(open) => !open && setChanging(null)}
          onDone={(result) =>
            setDone(
              result
                ? { title: `Invite resent to ${changing.row.email}`, url: linkOf(result) }
                : { title: `Invite for ${changing.row.email} revoked` },
            )
          }
        />
      )}
    </>
  )
}
