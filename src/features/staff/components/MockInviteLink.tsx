import { Link } from 'react-router'

/**
 * The link the invite email would carry, so a demo works without a real inbox. Its own module, loaded only
 * while the mock API is on: a real build has neither the link nor this text (design 2026-11-21 §4.5), which is
 * why the wording lives here and not in `lib/copy`.
 */
export function MockInviteLink({ url }: { url: string }) {
  return (
    <Link to={url} className="font-semibold text-action underline underline-offset-2">
      Mock only: open the invite link
    </Link>
  )
}
