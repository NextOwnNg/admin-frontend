import { NavLink, Outlet, useParams } from 'react-router'
import { cx } from '@/lib/cx'
import { RECORD_TABS, recordKindLabel } from '@/lib/permissions/permissions'
import { NotFoundPage } from '@/pages/NotFoundPage'

/** Every record browser shares one tab row across all seven kinds (design §7). */
export function RecordsLayout() {
  const { kind } = useParams()
  if (kind !== undefined && !recordKindLabel(kind)) return <NotFoundPage />

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Records" className="-mx-1 overflow-x-auto border-b border-border">
        <ul className="flex gap-1 px-1">
          {RECORD_TABS.map((tab) => (
            <li key={tab.kind}>
              <NavLink
                to={tab.to}
                className={({ isActive }) =>
                  cx(
                    'inline-flex h-11 items-center border-b-2 px-3 text-compact font-semibold whitespace-nowrap transition-colors duration-120',
                    isActive ? 'border-action text-action' : 'border-transparent text-muted hover:text-ink',
                  )
                }
              >
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet />
    </div>
  )
}
