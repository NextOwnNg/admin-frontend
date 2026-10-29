import type { ButtonVariants } from '@heroui/react'
import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cx } from '@/lib/cx'

/** HeroUI's sizes plus `compact`: 40px controls inside table rows and filter bars (PRD §4.3). */
export type ButtonSize = NonNullable<ButtonVariants['size']> | 'compact'
type Look = Pick<ButtonVariants, 'variant' | 'fullWidth'> & { size?: ButtonSize }

const buttonClass = ({ variant = 'primary', size = 'md', fullWidth }: Look, className?: string) =>
  cx('button', fullWidth && 'button--full-width', `button--${size}`, `button--${variant}`, className)

/**
 * A router link that looks like a button, for navigation actions ("Go to overview", "Open case").
 * Uses HeroUI's BEM classes directly. Dialogs and forms use HeroUI's `Button` for pending states.
 */
export function ButtonLink({ variant, size, fullWidth, className, ...props }: LinkProps & Look) {
  return <Link className={buttonClass({ variant, size, fullWidth }, className)} {...props} />
}

/** A native button with HeroUI's button styles (its CSS covers hover, active, disabled and focus-visible). */
export function PlainButton({
  variant,
  size,
  fullWidth,
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & Look) {
  return <button type={type} className={buttonClass({ variant, size, fullWidth }, className)} {...props} />
}
