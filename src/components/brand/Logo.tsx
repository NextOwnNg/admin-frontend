import { useId } from 'react'
import { WORDMARK_PATH } from '@/components/brand/wordmark-path'

/**
 * NextOwn logo (Route 3): two overlapping rounded squares, one possession becoming the next.
 * Geometry is taken from the approved lockup files in public/brand.
 *
 * Variants
 * - primary: Teal + Gold squares, Ink overlap, Ink wordmark. Use on Cloud/Paper.
 * - reverse: White + Gold squares, Teal overlap, white wordmark. Use on Ink or Teal.
 * - mono:    Ink outline mark and wordmark. Use for one-colour contexts (documents, stamps).
 */
export type LogoVariant = 'primary' | 'reverse' | 'mono'

type MarkColours = { back: string; front: string; overlap: string }

const markColours: Record<Exclude<LogoVariant, 'mono'>, MarkColours> = {
  primary: { back: 'var(--nx-teal)', front: 'var(--nx-gold)', overlap: 'var(--nx-ink)' },
  reverse: { back: 'var(--nx-paper)', front: 'var(--nx-gold)', overlap: 'var(--nx-teal)' },
}

const wordmarkColour: Record<LogoVariant, string> = {
  primary: 'var(--nx-ink)',
  reverse: 'var(--nx-paper)',
  mono: 'var(--nx-ink)',
}

/** Mark shapes in lockup coordinates: back square bottom-left, front square top-right. */
function MarkShapes({ variant, x = 0, y = 0 }: { variant: LogoVariant; x?: number; y?: number }) {
  const clipId = useId()
  const back = { x: x + 14, y: y + 38 }
  const front = { x: x + 38, y: y + 14 }

  if (variant === 'mono') {
    const ink = 'var(--nx-ink)'
    return (
      <g>
        <rect {...back} width="48" height="48" rx="10" fill="none" stroke={ink} strokeWidth="6" />
        <rect {...front} width="48" height="48" rx="10" fill="none" stroke={ink} strokeWidth="6" />
        <rect x={front.x} y={back.y} width="24" height="24" fill={ink} />
      </g>
    )
  }

  const c = markColours[variant]
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect {...back} width="48" height="48" rx="10" />
        </clipPath>
      </defs>
      <rect {...back} width="48" height="48" rx="10" fill={c.back} />
      <rect {...front} width="48" height="48" rx="10" fill={c.front} />
      <rect {...front} width="48" height="48" rx="10" fill={c.overlap} clipPath={`url(#${clipId})`} />
    </g>
  )
}

type LogoProps = {
  variant?: LogoVariant
  /** Rendered height in px. Brand minimum width is 92px on mobile and 112px on desktop (height ≥ 20 / 24). */
  height?: number
  /** Accessible name; pass an empty string when the logo is decorative inside a named element. */
  label?: string
  className?: string
}

/** Full lockup: mark + wordmark. Cropped to the artwork; leave clear space of half the N cap height around it. */
export function Logo({ variant = 'primary', height = 32, label = 'NextOwn', className }: LogoProps) {
  const decorative = label === ''
  // Artwork bounds in lockup coordinates (mark 54→126, wordmark ends at 423.55),
  // padded by 3 so the mono variant's 6-unit strokes are not clipped.
  const viewBox = { x: 51, y: 51, width: 375.55, height: 78 }

  return (
    <svg
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      height={height}
      width={(height * viewBox.width) / viewBox.height}
      className={className}
    >
      <MarkShapes variant={variant} x={40} y={40} />
      <path d={WORDMARK_PATH} fill={wordmarkColour[variant]} />
    </svg>
  )
}

type LogoMarkProps = {
  variant?: LogoVariant
  /** Rendered size in px. Keep at 20px or larger. */
  size?: number
  /** Accessible name; pass an empty string when the mark is decorative next to visible text. */
  label?: string
  className?: string
}

/** The mark on its own, for tight spaces such as the mobile header or avatars. */
export function LogoMark({ variant = 'primary', size = 32, label = 'NextOwn', className }: LogoMarkProps) {
  const decorative = label === ''

  return (
    <svg
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      viewBox="11 11 78 78"
      width={size}
      height={size}
      className={className}
    >
      <MarkShapes variant={variant} />
    </svg>
  )
}
