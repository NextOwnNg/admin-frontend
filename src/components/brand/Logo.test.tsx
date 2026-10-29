import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AdminLogo } from '@/components/brand/AdminLogo'
import { Logo, LogoMark } from '@/components/brand/Logo'

describe('Logo', () => {
  it('is announced as NextOwn and keeps the lockup aspect ratio', () => {
    render(<Logo height={36} />)

    const logo = screen.getByRole('img', { name: 'NextOwn' })
    expect(logo).toHaveAttribute('height', '36')
    expect(Number(logo.getAttribute('width'))).toBeCloseTo((36 * 375.55) / 78)
  })

  it('gives each instance its own clip path so repeated logos render correctly', () => {
    const { container } = render(
      <>
        <Logo />
        <LogoMark />
      </>,
    )

    const ids = [...container.querySelectorAll('clipPath')].map((el) => el.id)
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })

  it('hides a decorative mark from assistive technology', () => {
    const { container } = render(<LogoMark label="" />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('AdminLogo', () => {
  it('names the full logo "NextOwn Admin" and shows the Admin label', () => {
    render(<AdminLogo />)

    expect(screen.getByRole('img', { name: 'NextOwn Admin' })).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('keeps the accessible name when collapsed to the mark', () => {
    render(<AdminLogo collapsed />)

    expect(screen.getByRole('img', { name: 'NextOwn Admin' })).toBeInTheDocument()
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })
})
