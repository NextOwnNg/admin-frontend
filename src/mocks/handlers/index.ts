import type { RequestHandler } from 'msw'
import { auditHandlers } from '@/mocks/handlers/audit'
import { authHandlers } from '@/mocks/handlers/auth'
import { caseReadHandlers } from '@/mocks/handlers/cases'
import { referenceHandlers } from '@/mocks/handlers/reference'
import { transactionReadHandlers } from '@/mocks/handlers/transactions'
import { writeHandlers } from '@/mocks/handlers/writes'

/** The mock admin API. Each phase adds the handlers its screens need. */
export const handlers: RequestHandler[] = [
  ...authHandlers,
  ...caseReadHandlers,
  ...transactionReadHandlers,
  ...auditHandlers,
  ...referenceHandlers,
  ...writeHandlers,
]
