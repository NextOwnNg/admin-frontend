import { RouterProvider as AriaRouterProvider } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Outlet, ScrollRestoration, useHref, useNavigate } from 'react-router'
import { SmallScreenNotice } from '@/components/layout/SmallScreenNotice'
import { signOutAndClear } from '@/features/auth/api/useSignOut'
import { NARROW_SCREEN, useMediaQuery } from '@/hooks/useMediaQuery'
import { onAuthExpired } from '@/lib/api/client'

/**
 * Lets HeroUI (React Aria) links navigate through React Router, and ends the session when the API says it
 * has (PRD §3.3: a 401 clears the session and Query cache, keeps the URL, and routes to sign-in).
 */
export function RootLayout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const narrow = useMediaQuery(NARROW_SCREEN)

  // The guards then send the operator to sign in with `next`; repeated 401s only clear what's already gone
  useEffect(() => onAuthExpired(() => void signOutAndClear(queryClient, { callServer: false })), [queryClient])

  if (narrow) return <SmallScreenNotice />

  return (
    <AriaRouterProvider navigate={(to, options) => void navigate(to, options)} useHref={useHref}>
      <Outlet />
      <ScrollRestoration />
    </AriaRouterProvider>
  )
}
