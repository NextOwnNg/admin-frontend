import { rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { loadEnv, type Plugin } from 'vite'

type Env = Record<string, string | undefined>

/** Why this build must not go ahead: production never serves fictional data (design §7). */
export function mockBuildProblem(env: Env): string | null {
  if (env.VITE_ENV_NAME === 'production' && env.VITE_USE_MOCK_API === 'true') {
    return 'VITE_USE_MOCK_API=true is not allowed when VITE_ENV_NAME=production'
  }
  return null
}

/**
 * Fails a production build that would serve the mock API, and leaves the MSW worker (copied from `public/`)
 * out of any build that doesn't use the mock. Shell variables win over `.env` files, as in Vite itself.
 */
export function mockGuard(): Plugin {
  let env: Env = {}
  let outDir = 'dist'
  let isBuild = false
  return {
    name: 'nextown-mock-guard',
    configResolved(config) {
      env = { ...loadEnv(config.mode, config.root, 'VITE_'), ...process.env }
      outDir = resolve(config.root, config.build.outDir)
      isBuild = config.command === 'build'
      const problem = mockBuildProblem(env)
      if (problem && isBuild) throw new Error(problem)
    },
    closeBundle() {
      if (isBuild && env.VITE_USE_MOCK_API !== 'true') rmSync(join(outDir, 'mockServiceWorker.js'), { force: true })
    },
  }
}
