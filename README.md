# NextOwn Admin Console

The staff-only console that support agents, moderators and administrators use to run the NextOwn one-city pilot. It lives in its own repository, separate from the marketplace app (`client-frontend`), and shares no code with it at build time.

- Requirements: [docs/admin-prd.md](docs/admin-prd.md) (NX-ADM-PRD-001)
- Brand: [docs/NextOwn Brand Kit and Design System.md](docs/NextOwn%20Brand%20Kit%20and%20Design%20System.md). Tokens in `src/styles/tokens.css` implement **Brand Kit v0.9**; any Brand Kit change must be applied to both frontend repositories.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173, runs on the in-browser mock admin API
```

| Script | What it does |
| :-- | :-- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck and production build into `dist/` |
| `npm run test` / `test:run` | Vitest in watch mode / once |
| `npm run lint` | oxlint, then ESLint (type-aware, React Hooks, jsx-a11y) |
| `npm run format` | Prettier |
| `npm run check` | Typecheck, lint, format check and all tests (what CI runs) |

## Environment

| Variable | Meaning |
| :-- | :-- |
| `VITE_ADMIN_API_BASE_URL` | Admin API base URL. Defaults to same-origin `/api`, where the mock API answers |
| `VITE_USE_MOCK_API` | `true` serves the in-browser mock admin API (fictional data). On locally and on previews until the backend exists |
| `VITE_ENV_NAME` | `local`, `preview`, `staging` or `production`. Every value except `production` shows the environment ribbon |

Nothing secret goes in `VITE_*` variables: they ship in the browser bundle.

## Mock accounts

With `VITE_USE_MOCK_API=true`, these fictional staff accounts sign in. The sign-in page also offers one-click buttons for each while the mock API is on.

| Role | Name | Phone | Codes |
| :-- | :-- | :-- | :-- |
| Support agent | Chiamaka Eze | 0800 000 0101 | `123456` |
| Moderator | Tunde Bakare | 0800 000 0102 | `123456` |
| Administrator | Ngozi Adeyemi | 0800 000 0103 | `123456`, then second code `654321` |
| Not staff (refused) | — | 0800 000 0199 | `123456` → "This number can't sign in here." |

The mock admin API lives in `src/mocks/` (`db/` holds the in-memory data, `handlers/` the endpoints).

## Hosting notes

- `vercel.json` serves `index.html` for unknown paths, long-caches hashed assets and sets the security headers from PRD §7 (strict CSP, `frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, `nosniff`, `X-Robots-Tag: noindex`).
- The CSP's `connect-src` is `'self'` only, because the API is same-origin `/api` for now. When the real admin API origin is decided (AD-D-01), add it to `connect-src` and either a rewrite in `vercel.json` or an absolute `VITE_ADMIN_API_BASE_URL`.
