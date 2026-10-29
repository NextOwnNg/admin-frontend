import { Helmet } from 'react-helmet-async'

/** Per-route title and `noindex, nofollow` on every console page (PRD §3.2). */
export function PageHead({ title }: { title: string }) {
  return (
    <Helmet>
      <title>{`${title} · NextOwn Admin`}</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
  )
}
