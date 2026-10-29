import { Outlet } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { EnvRibbon } from '@/components/layout/EnvRibbon'
import { SkipLink } from '@/components/layout/SkipLink'

/** Sign-in: one calm panel on Cloud, the brand lockup above it, nothing else to compete with the task. */
export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-background px-4 py-16">
      <SkipLink />
      <header className="flex w-full max-w-md items-center justify-between">
        <Logo height={28} />
        <EnvRibbon />
      </header>
      <main id="main" className="mt-8 w-full max-w-md rounded-card border border-border bg-surface p-8 shadow-card">
        <Outlet />
      </main>
    </div>
  )
}
