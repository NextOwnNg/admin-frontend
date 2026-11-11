import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { clientErrorsDb } from '@/mocks/handlers/client-errors'
import { RouteErrorPage } from '@/pages/RouteErrorPage'
import { renderWithProviders } from '@/test/utils'

function Broken(): never {
  throw new Error('render failed')
}

describe('route error page', () => {
  it('reports the route error once, with its pattern', async () => {
    renderWithProviders(
      [{ errorElement: <RouteErrorPage />, children: [{ path: 'cases/:id', element: <Broken /> }] }],
      { initialPath: '/cases/NX-000202?tab=x' },
    )
    await screen.findByRole('heading', { name: 'Something went wrong' })
    await waitFor(() => expect(clientErrorsDb.list()).toHaveLength(1))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(clientErrorsDb.list()).toHaveLength(1)
    expect(clientErrorsDb.list()[0]?.route).toBe('/cases/:id')
    expect(JSON.stringify(clientErrorsDb.list())).not.toContain('NX-000202')
  })
})
