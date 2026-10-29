// ESLint runs after oxlint (see `npm run lint`). oxlint is the fast first pass; ESLint adds what it can't do:
// type-aware TypeScript rules, the full React Hooks rules and jsx-a11y. eslint-plugin-oxlint switches off the
// ESLint rules oxlint already covers, and eslint-config-prettier switches off anything Prettier formats.
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import oxlint from 'eslint-plugin-oxlint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'public/mockServiceWorker.js', '.impeccable', '.superpowers']),

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // `_unused` names are deliberate (e.g. destructuring a field away)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      // Event handlers may start async work; `void promise` marks the ones we don't await
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  {
    // Tests and mocks: Testing Library and MSW patterns trip the strictest type-aware rules
    files: ['**/*.test.{ts,tsx}', 'src/test/**', 'src/mocks/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  {
    files: ['vite.config.ts', '*.config.js'],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['*.config.js'],
    extends: [js.configs.recommended],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module' },
  },

  ...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json'),
  prettier,
])
