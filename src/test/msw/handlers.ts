import type { RequestHandler } from 'msw'
import { handlers as mockApiHandlers } from '@/mocks/handlers'

/** Tests share the dev mock API; individual tests override with server.use(). */
export const handlers: RequestHandler[] = [...mockApiHandlers]
