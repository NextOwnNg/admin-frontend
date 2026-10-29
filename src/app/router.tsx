import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { RedirectIfStaff } from '@/app/guards/RedirectIfStaff'
import { RequireRole } from '@/app/guards/RequireRole'
import { RequireStaff } from '@/app/guards/RequireStaff'
import { AdminLayout } from '@/app/layouts/AdminLayout'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { RootLayout } from '@/app/layouts/RootLayout'
import type { RouteHandle } from '@/components/layout/Breadcrumbs'
import { recordKindLabel, type RouteId } from '@/lib/permissions/permissions'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RouteErrorPage } from '@/pages/RouteErrorPage'
import { TransactionRecordRedirect } from '@/pages/records/TransactionRecordRedirect'
import { SignInPage } from '@/pages/SignInPage'

/** Wraps a route in its role check (PRD §5). The API still decides; this keeps the screen honest. */
const guarded = (routeId: RouteId, route: RouteObject): RouteObject => ({
  element: <RequireRole routeId={routeId} />,
  children: [route],
})

const crumb = (value: RouteHandle['crumb']): RouteHandle => ({ crumb: value })

/**
 * The route tree (PRD §5, design §7). The shell and sign-in load eagerly; every page after sign-in is its
 * own lazy chunk.
 */
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <RedirectIfStaff />,
        children: [{ element: <AuthLayout />, children: [{ path: 'sign-in', element: <SignInPage /> }] }],
      },
      {
        element: <RequireStaff />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              guarded('overview', {
                index: true,
                handle: crumb('Overview'),
                lazy: () => import('@/pages/OverviewPage').then((m) => ({ Component: m.OverviewPage })),
              }),
              guarded('reports', {
                path: 'reports',
                handle: crumb('Reports'),
                lazy: () => import('@/pages/ReportsQueuePage').then((m) => ({ Component: m.ReportsQueuePage })),
              }),
              guarded('case', {
                path: 'cases/:id',
                handle: crumb((p) => `Case ${p.id ?? ''}`),
                lazy: () => import('@/pages/CasePage').then((m) => ({ Component: m.CasePage })),
              }),
              guarded('transaction', {
                path: 'transactions/:id',
                handle: crumb((p) => `Transaction ${p.id ?? ''}`),
                lazy: () => import('@/pages/TransactionPage').then((m) => ({ Component: m.TransactionPage })),
              }),
              guarded('records', {
                path: 'records',
                handle: crumb('Records'),
                lazy: () => import('@/pages/records/RecordsLayout').then((m) => ({ Component: m.RecordsLayout })),
                children: [
                  { index: true, element: <Navigate to="users" replace /> },
                  { path: 'transactions/:id', element: <TransactionRecordRedirect /> },
                  {
                    path: ':kind',
                    handle: crumb((p) => recordKindLabel(p.kind) ?? p.kind ?? ''),
                    children: [
                      {
                        index: true,
                        lazy: () =>
                          import('@/pages/records/RecordListPage').then((m) => ({ Component: m.RecordListPage })),
                      },
                      {
                        path: ':id',
                        handle: crumb((p) => p.id ?? ''),
                        lazy: () =>
                          import('@/pages/records/RecordDetailPage').then((m) => ({
                            Component: m.RecordDetailPage,
                          })),
                      },
                    ],
                  },
                ],
              }),
              guarded('exceptions', {
                path: 'exceptions',
                handle: crumb('Exceptions'),
                lazy: () => import('@/pages/ExceptionsPage').then((m) => ({ Component: m.ExceptionsPage })),
              }),
              guarded('audit', {
                path: 'audit',
                handle: crumb('Moderation log'),
                lazy: () => import('@/pages/AuditLogPage').then((m) => ({ Component: m.AuditLogPage })),
              }),
              guarded('settings', {
                path: 'settings',
                handle: crumb('Settings'),
                lazy: () => import('@/pages/SettingsPage').then((m) => ({ Component: m.SettingsPage })),
              }),
              guarded('dashboard', {
                path: 'dashboard',
                handle: crumb('Dashboard'),
                lazy: () => import('@/pages/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
              }),
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const createRouter = () => createBrowserRouter(routes)
