/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_API_BASE_URL?: string
  readonly VITE_USE_MOCK_API?: string
  /** local | preview | staging | production: drives the environment ribbon */
  readonly VITE_ENV_NAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
