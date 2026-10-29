import type { RequestHandler } from 'msw'
import { authHandlers } from '@/mocks/handlers/auth'

/** The mock admin API. Each phase adds the handlers its screens need. */
export const handlers: RequestHandler[] = [...authHandlers]
