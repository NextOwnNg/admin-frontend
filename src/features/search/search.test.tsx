import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { routes } from '@/app/router'
import { apiBaseUrl } from '@/lib/env'
import { SCENARIO, TX } from '@/mocks/seed'
import { signInAs } from '@/test/auth'
import { expectNoA11yViolations } from '@/test/axe'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'

const box = () => screen.findByRole('combobox', { name: 'Search records by ID or name' })
const listbox = () => screen.findByRole('listbox')

/** Every search request the console sends */
function searches() {
  const queries: string[] = []
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url)
    if (url.pathname.endsWith('/admin/search')) queries.push(url.searchParams.get('q') ?? '')
  })
  return queries
}

async function shell(path = '/') {
  const view = renderWithProviders(routes, { initialPath: path })
  await screen.findByRole('navigation', { name: 'Main' })
  return view
}

describe('global search (Phase C design §4.3)', () => {
  it('groups results by kind and opens the one chosen', async () => {
    await signInAs('moderator')
    const { router } = await shell()
    await userEvent.type(await box(), 'segun')
    const members = await within(await listbox()).findByRole('group', { name: 'Members' })
    await userEvent.click(within(members).getByRole('option', { name: /Segun F\./ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/records/users/u-segun'))
    expect(await box()).toHaveValue('')
  })

  it('goes straight to an exact ID on Enter', async () => {
    await signInAs('moderator')
    const { router } = await shell()
    await userEvent.type(await box(), SCENARIO.paymentDispute)
    await within(await listbox()).findByRole('option', { name: new RegExp(SCENARIO.paymentDispute) })
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(router.state.location.pathname).toBe(`/cases/${SCENARIO.paymentDispute}`))

    await userEvent.type(await box(), TX.paymentDispute)
    await within(await listbox()).findByRole('option', { name: new RegExp(TX.paymentDispute) })
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(router.state.location.pathname).toBe(`/transactions/${TX.paymentDispute}`))
  })

  it('goes to a pasted ID when Enter is pressed before the answer arrives (Phase C1 review)', async () => {
    await signInAs('moderator')
    const { router } = await shell()
    await userEvent.click(await box())
    await userEvent.paste(SCENARIO.paymentDispute)
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(router.state.location.pathname).toBe(`/cases/${SCENARIO.paymentDispute}`))
  })

  it('finds nothing a support agent may not open, and Enter stays put (Review Focus 5)', async () => {
    await signInAs('support_agent')
    const { router } = await shell()
    await userEvent.type(await box(), SCENARIO.s1Unassigned)
    expect(await screen.findByText(`No matches for "${SCENARIO.s1Unassigned}"`)).toBeInTheDocument()
    await userEvent.keyboard('{Enter}')
    expect(router.state.location.pathname).toBe('/')

    await userEvent.clear(await box())
    await userEvent.type(await box(), SCENARIO.paymentDispute)
    expect(
      await within(await listbox()).findByRole('option', { name: new RegExp(SCENARIO.paymentDispute) }),
    ).toBeInTheDocument()

    await userEvent.clear(await box())
    await userEvent.type(await box(), 'segun')
    expect(await screen.findByText('No matches for "segun"')).toBeInTheDocument()
  })

  it('sends nothing for blank or one-letter input (Review Focus 2)', async () => {
    await signInAs('moderator')
    const queries = searches()
    await shell()
    await userEvent.type(await box(), '   ')
    await userEvent.clear(await box())
    await userEvent.type(await box(), 's')
    await new Promise((r) => setTimeout(r, 400))
    expect(queries).toEqual([])
  })

  it('never shows an older answer over a newer one (Review Focus 2)', async () => {
    await signInAs('moderator')
    server.use(
      http.get(`${apiBaseUrl}/admin/search`, async ({ request }) => {
        if (new URL(request.url).searchParams.get('q') === 'ip') await delay(700)
        return undefined
      }),
    )
    await shell()
    await userEvent.type(await box(), 'ip')
    await new Promise((r) => setTimeout(r, 350))
    await userEvent.type(await box(), 'hone')
    await within(await listbox()).findAllByRole('option', { name: /iPhone 13 Pro/ })
    await new Promise((r) => setTimeout(r, 700))
    expect(within(await listbox()).queryByRole('option', { name: /iPad/ })).not.toBeInTheDocument()
  })

  it('says so when search fails', async () => {
    await signInAs('moderator')
    server.use(
      http.get(`${apiBaseUrl}/admin/search`, () =>
        HttpResponse.json({ code: 'INTERNAL', message: 'Broken' }, { status: 500 }),
      ),
    )
    await shell()
    await userEvent.type(await box(), 'segun')
    expect(await screen.findByText("Search isn't available right now. Try again.")).toBeInTheDocument()
  })

  it('focuses on "/" unless someone is typing elsewhere', async () => {
    await signInAs('moderator')
    await shell(`/cases/${SCENARIO.paymentDispute}`)
    await userEvent.keyboard('/')
    expect(await box()).toHaveFocus()

    const note = await screen.findByRole('textbox', { name: /Add a note/ })
    await userEvent.click(note)
    await userEvent.keyboard('a/b')
    expect(note).toHaveValue('a/b')
    expect(await box()).not.toHaveFocus()
  })

  it('has no accessibility problems with results open', async () => {
    await signInAs('moderator')
    const { container } = await shell()
    await userEvent.type(await box(), 'kunle')
    await within(await listbox()).findAllByRole('option')
    await expectNoA11yViolations(container)
  })
})
