/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { mockGuard } from './build/mock-guard.ts'

// https://vite.dev/config/
export default defineConfig({
  define: {
    // Client error reports name the build (design §7): the deployed commit, else the package version
    'import.meta.env.VITE_BUILD_VERSION': JSON.stringify(
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? process.env.npm_package_version ?? 'dev',
    ),
  },
  plugins: [react(), tailwindcss(), mockGuard()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    env: { VITE_ADMIN_API_BASE_URL: '/api' },
    restoreMocks: true,
    // Browser flows run under `npm run test:flow` (vitest.flow.config.ts)
    exclude: ['**/node_modules/**', 'src/flows/**'],
  },
})
