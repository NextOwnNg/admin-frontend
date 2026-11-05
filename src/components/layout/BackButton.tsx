import { ArrowLeft } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { PlainButton } from '@/components/ui/Button'

/**
 * Back to wherever the operator came from inside the console. Opened directly (a pasted link, a new tab),
 * there is nowhere to go back to, so it goes to the page's natural parent instead.
 */
export function BackButton({ fallback }: { fallback: string }) {
  const navigate = useNavigate()
  // The router marks the first entry of this tab's console history as `default`
  const cameFromConsole = useLocation().key !== 'default'
  return (
    <div>
      <PlainButton
        size="compact"
        variant="ghost"
        className="-ml-3"
        onClick={() => void (cameFromConsole ? navigate(-1) : navigate(fallback))}
      >
        <ArrowLeft aria-hidden className="size-4" />
        Back
      </PlainButton>
    </div>
  )
}
