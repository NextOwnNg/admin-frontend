import {
  ArrowLeftRight,
  ChartColumn,
  ClockAlert,
  Flag,
  History,
  House,
  Settings,
  Tag,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { StaffRole } from '@/lib/copy/labels'

/**
 * Which roles see which screens (PRD §2, §5; sidebar mapping in design §7). Display only: the API is the
 * authority on every permission and refuses requests either way.
 */

export type RouteId =
  'overview' | 'reports' | 'case' | 'transaction' | 'records' | 'exceptions' | 'audit' | 'settings' | 'dashboard'

const ALL_STAFF: StaffRole[] = ['support_agent', 'moderator', 'administrator']

export const ROUTE_ROLES: Record<RouteId, StaffRole[]> = {
  overview: ALL_STAFF,
  reports: ALL_STAFF, // support agents see assigned reports only; the API filters
  case: ALL_STAFF, // the API decides who is assigned
  transaction: ALL_STAFF,
  records: ['moderator', 'administrator'],
  exceptions: ['support_agent', 'administrator'],
  audit: ['administrator'],
  settings: ['administrator'],
  dashboard: ['administrator'],
}

export function canAccess(routeId: RouteId, roles: readonly StaffRole[]): boolean {
  return ROUTE_ROLES[routeId].some((role) => roles.includes(role))
}

export type NavItem = { id: string; label: string; to: string; icon: LucideIcon; routeId: RouteId }

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', to: '/', icon: House, routeId: 'overview' },
  { id: 'reports', label: 'Reports', to: '/reports', icon: Flag, routeId: 'reports' },
  { id: 'members', label: 'Members', to: '/records/users', icon: Users, routeId: 'records' },
  { id: 'listings', label: 'Listings', to: '/records/listings', icon: Tag, routeId: 'records' },
  { id: 'transactions', label: 'Transactions', to: '/records/transactions', icon: ArrowLeftRight, routeId: 'records' },
  { id: 'exceptions', label: 'Exceptions', to: '/exceptions', icon: ClockAlert, routeId: 'exceptions' },
  { id: 'audit', label: 'Moderation log', to: '/audit', icon: History, routeId: 'audit' },
  { id: 'settings', label: 'Settings', to: '/settings', icon: Settings, routeId: 'settings' },
  { id: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: ChartColumn, routeId: 'dashboard' },
]

export function navItemsFor(roles: readonly StaffRole[]): NavItem[] {
  return NAV_ITEMS.filter((item) => canAccess(item.routeId, roles))
}

/** Every records page shows all seven browsers as tabs; only three have sidebar entries. */
export const RECORD_TABS: { kind: string; label: string; to: string }[] = [
  { kind: 'users', label: 'Members', to: '/records/users' },
  { kind: 'items', label: 'Items', to: '/records/items' },
  { kind: 'listings', label: 'Listings', to: '/records/listings' },
  { kind: 'offers', label: 'Offers', to: '/records/offers' },
  { kind: 'transactions', label: 'Transactions', to: '/records/transactions' },
  { kind: 'feed', label: 'Feed', to: '/records/feed' },
  { kind: 'reports', label: 'Reports', to: '/records/reports' },
]

/** "Members", "Offers"…; undefined for a kind that isn't a record browser. */
export const recordKindLabel = (kind?: string) => RECORD_TABS.find((tab) => tab.kind === kind)?.label
