import type { EnvName } from '@/lib/copy/labels'

/**
 * Build-time settings, read once. Set them per environment (.env.development locally, the Vercel project's
 * Environment Variables for deployments). Everything prefixed VITE_ ships in the bundle: never put secrets here.
 */

/** Where the admin API lives. Defaults to same-origin `/api`, which is also where the mock API answers. */
export const apiBaseUrl: string = import.meta.env.VITE_ADMIN_API_BASE_URL || '/api'

/** Serve the in-browser mock admin API (fictional data). On locally, and on previews until the backend exists. */
export const useMockApi: boolean = import.meta.env.VITE_USE_MOCK_API === 'true'

const ENV_NAMES: readonly EnvName[] = ['local', 'preview', 'staging', 'production']
const rawEnvName = import.meta.env.VITE_ENV_NAME

/** Which environment this build is for; drives the environment ribbon. Unknown values read as `local`. */
export const envName: EnvName = ENV_NAMES.find((name) => name === rawEnvName) ?? 'local'

export const isProduction: boolean = envName === 'production'
