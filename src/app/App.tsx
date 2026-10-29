import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { RouterProvider } from 'react-router/dom'
import { queryClient } from '@/app/query-client'
import { createRouter } from '@/app/router'

export function App() {
  const [router] = useState(createRouter)
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </HelmetProvider>
  )
}
