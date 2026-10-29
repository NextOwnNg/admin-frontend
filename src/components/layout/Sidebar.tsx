import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { NavLink } from 'react-router'
import { AdminLogo } from '@/components/brand/AdminLogo'
import { cx } from '@/lib/cx'
import { navItemsFor } from '@/lib/permissions/permissions'
import { useSessionStore } from '@/stores/session'
import { useUiStore } from '@/stores/ui'

/**
 * Ink sidebar (PRD §4.3): role-filtered items, Mint left bar plus tint on the active item (shape, not just
 * colour). Collapsed to icons, each link keeps its name and shows it on hover or keyboard focus.
 */
export function Sidebar() {
  const roles = useSessionStore((s) => s.roles)
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggle = useUiStore((s) => s.toggleSidebar)
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <aside
      className={cx(
        'sticky top-0 flex h-dvh shrink-0 flex-col bg-ink text-paper transition-[width] duration-200 ease-brand',
        collapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
      )}
    >
      <div className={cx('flex h-topbar items-center', collapsed ? 'justify-center' : 'px-5')}>
        <AdminLogo collapsed={collapsed} />
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto py-2">
        <ul className="flex flex-col gap-1 px-3">
          {navItemsFor(roles).map(({ id, label, to, icon: Icon }) => (
            <li key={id}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cx(
                    'group relative flex h-11 items-center gap-3 rounded-control px-3 text-compact font-medium transition-colors duration-120',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-paper/10 text-paper before:absolute before:inset-y-2 before:-left-3 before:w-1 before:rounded-r-full before:bg-mint'
                      : 'text-mint/80 hover:bg-paper/5 hover:text-paper',
                  )
                }
              >
                <Icon aria-hidden className="size-5 shrink-0" strokeWidth={1.75} />
                <span className={collapsed ? 'sr-only' : 'truncate'}>{label}</span>
                {collapsed && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-full z-10 ml-3 hidden rounded-small bg-ink px-2 py-1 text-caption whitespace-nowrap text-paper shadow-overlay ring-1 ring-paper/10 group-hover:block group-focus-visible:block"
                  >
                    {label}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-paper/10 p-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cx(
            'flex h-11 w-full items-center gap-3 rounded-control px-3 text-compact text-mint/80 hover:bg-paper/5 hover:text-paper',
            collapsed && 'justify-center px-0',
          )}
        >
          <ToggleIcon aria-hidden className="size-5" strokeWidth={1.75} />
          {!collapsed && <span aria-hidden>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
