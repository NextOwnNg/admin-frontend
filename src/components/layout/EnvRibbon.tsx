import { ENV_LABELS, type EnvName } from '@/lib/copy/labels'
import { envName } from '@/lib/env'

/** Non-production builds say so on every screen, so operators never confuse environments (PRD §3.7). */
export function EnvRibbon({ env = envName }: { env?: EnvName }) {
  if (env === 'production') return null
  return (
    <span
      aria-label={`Environment: ${env}`}
      className="inline-flex h-7 items-center rounded-small bg-warning px-2 text-caption font-semibold tracking-wide text-paper"
    >
      {ENV_LABELS[env]}
    </span>
  )
}
