import type { RequestHandler } from 'msw'
import { auditHandlers } from '@/mocks/handlers/audit'
import { authHandlers } from '@/mocks/handlers/auth'
import { caseReadHandlers } from '@/mocks/handlers/cases'
import { clientErrorHandlers } from '@/mocks/handlers/client-errors'
import { dashboardHandlers } from '@/mocks/handlers/dashboard'
import { exceptionHandlers } from '@/mocks/handlers/exceptions'
import { recordHandlers } from '@/mocks/handlers/records'
import { referenceHandlers } from '@/mocks/handlers/reference'
import { reviewHandlers } from '@/mocks/handlers/reviews'
import { searchHandlers } from '@/mocks/handlers/search'
import { settingsHandlers } from '@/mocks/handlers/settings'
import { staffAdminHandlers } from '@/mocks/handlers/staff-admin'
import { transactionReadHandlers } from '@/mocks/handlers/transactions'
import { writeHandlers } from '@/mocks/handlers/writes'

/** The mock admin API. Each phase adds the handlers its screens need. */
export const handlers: RequestHandler[] = [
  ...authHandlers,
  ...caseReadHandlers,
  ...transactionReadHandlers,
  ...auditHandlers,
  ...referenceHandlers,
  ...recordHandlers,
  ...reviewHandlers,
  ...exceptionHandlers,
  ...searchHandlers,
  ...settingsHandlers,
  ...staffAdminHandlers,
  ...dashboardHandlers,
  ...writeHandlers,
  ...clientErrorHandlers,
]
