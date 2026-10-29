/** Staff roles as the session endpoint returns them (PRD §2). */
export type StaffRole = 'support_agent' | 'moderator' | 'administrator'

export const STAFF_ROLES: readonly StaffRole[] = ['support_agent', 'moderator', 'administrator']

export const ROLE_LABELS: Record<StaffRole, string> = {
  support_agent: 'Support agent',
  moderator: 'Moderator',
  administrator: 'Administrator',
}

export type EnvName = 'local' | 'preview' | 'staging' | 'production'

/** Environment ribbon text: an environment code, so upper case is deliberate (PRD §3.7). */
export const ENV_LABELS: Record<EnvName, string> = {
  local: 'LOCAL',
  preview: 'PREVIEW',
  staging: 'STAGING',
  production: 'PRODUCTION',
}
