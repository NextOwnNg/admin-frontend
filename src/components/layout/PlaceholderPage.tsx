import { CalendarClock } from 'lucide-react'
import { PageHead } from '@/components/seo/PageHead'
import { StatusBadge } from '@/components/ui/StatusBadge'

const PHASES = { B: 'Core operations', C: 'Operations support', D: 'Insight and hardening' } as const

/** A route that exists now and gets its screen in a later phase (design §6). */
export function PlaceholderPage({
  title,
  phase,
  summary,
}: {
  title: string
  phase: keyof typeof PHASES
  summary: string
}) {
  return (
    <>
      <PageHead title={title} />
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-h1 text-ink">{title}</h1>
        <StatusBadge tone="info" icon={CalendarClock} label={`Arrives in Phase ${phase}: ${PHASES[phase]}`} />
        <p className="max-w-2xl text-body text-muted">{summary}</p>
      </div>
    </>
  )
}
