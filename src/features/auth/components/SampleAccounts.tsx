import { Button } from '@heroui/react'
import { useState } from 'react'
import { STAFF_ROLES, ROLE_LABELS, type StaffRole } from '@/lib/copy/labels'

/**
 * One-click sign-in as each fictional staff role. Shown only while the mock API is on (design §7a), never
 * against a real API.
 */
export function SampleAccounts({ onSignIn }: { onSignIn: (role: StaffRole) => Promise<void> }) {
  const [pending, setPending] = useState<StaffRole | null>(null)

  async function signIn(role: StaffRole) {
    setPending(role)
    try {
      await onSignIn(role)
    } finally {
      setPending(null)
    }
  }

  return (
    <section aria-labelledby="sample-accounts" className="flex flex-col gap-3 rounded-card border border-border p-4">
      <div>
        <h2 id="sample-accounts" className="text-compact font-semibold text-ink">
          Sample staff accounts
        </h2>
        <p className="text-caption text-muted">Mock API only. Fictional accounts.</p>
      </div>
      <div className="flex flex-col gap-2">
        {STAFF_ROLES.map((role) => (
          <Button
            key={role}
            variant="secondary"
            size="sm"
            fullWidth
            isPending={pending === role}
            isDisabled={pending !== null && pending !== role}
            onPress={() => void signIn(role)}
          >
            {`Sign in as ${ROLE_LABELS[role].toLowerCase()}`}
          </Button>
        ))}
      </div>
    </section>
  )
}
