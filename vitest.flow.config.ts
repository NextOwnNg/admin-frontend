import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Flow tests (PRD §10.1, design §7): the real route tree in Chromium, on the MSW worker with the mock's
 * latency. The script passes `--mode flow` (Vitest ignores `mode` in config): any mode but `test` keeps that
 * latency on. Run with `npm run test:flow`, never in `check`.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/flows/**/*.flow.tsx'],
    setupFiles: ['./src/flows/setup.ts'],
    env: { VITE_ADMIN_API_BASE_URL: '/api' },
    testTimeout: 30_000,
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
})
