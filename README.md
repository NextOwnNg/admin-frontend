# NextOwn Admin Console

The staff-only console that support agents, moderators and administrators use to run the NextOwn one-city pilot. It lives in its own repository, separate from the marketplace app (`client-frontend`), and shares no code with it at build time.

- Requirements: [docs/admin-prd.md](docs/admin-prd.md) (NX-ADM-PRD-001)
- Operator walkthrough for the PRD §15 moderation gate: [docs/operator-walkthrough.md](docs/operator-walkthrough.md)
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
| `npm run test:flow` | Browser flows and the accessibility sweep in Chromium (run `npx playwright install chromium` once) |
| `npm run lint` | oxlint, then ESLint (type-aware, React Hooks, jsx-a11y) |
| `npm run format` | Prettier |
| `npm run check` | Typecheck, lint, format check and all jsdom tests |
| `npm run check:dist` | Fails if a build in `dist/` (or the folder given) carries any mock code: the MSW worker, MSW, or the sample accounts |
| `npm run check:bundle` | Fails if the initial JS in `dist/` is over 300 kB gzipped |

## Environment

| Variable | Meaning |
| :-- | :-- |
| `VITE_ADMIN_API_BASE_URL` | Admin API base URL. Defaults to same-origin `/api`, where the mock API answers |
| `VITE_USE_MOCK_API` | `true` serves the in-browser mock admin API (fictional data). On locally and on previews until the backend exists |
| `VITE_ENV_NAME` | `local`, `preview`, `staging` or `production`. Every value except `production` shows the environment ribbon |

Nothing secret goes in `VITE_*` variables: they ship in the browser bundle.

`VITE_BUILD_VERSION` is set by `vite.config.ts` (the Vercel commit, else the package version) and names the build in client error reports. Don't set it by hand.

A build with `VITE_ENV_NAME=production` and `VITE_USE_MOCK_API=true` fails on purpose. Production never serves fictional data.

## Mock accounts

With `VITE_USE_MOCK_API=true`, these fictional staff accounts sign in. The sign-in page also offers one-click buttons for each while the mock API is on.

| Role | Name | Phone | Codes |
| :-- | :-- | :-- | :-- |
| Support agent | Chiamaka Eze | 0800 000 0101 | `123456` |
| Moderator | Tunde Bakare | 0800 000 0102 | `123456` |
| Administrator | Ngozi Adeyemi | 0800 000 0103 | `123456`, then second code `654321` |
| Not staff (refused) | — | 0800 000 0199 | `123456` → "This number can't sign in here." |

The mock admin API lives in `src/mocks/` (`db/` holds the in-memory data, `handlers/` the endpoints).

### Sample records to walk through

Scenario IDs are exported as `SCENARIO`, `TX` (`src/mocks/seed.ts`) and `REC` (`src/mocks/records-seed.ts`). Good starting points, signed in as the moderator:

| What | Where |
| :-- | :-- |
| The full chain: member → item → listing → offer → transaction → case | `/records/users/u-kunle` (MacBook Air: `I-1102` → `L-5101` → `O-6101` → `T-000301` → `NX-000202`) |
| Restricted member | `/records/users/u-segun` |
| New member with nothing yet | `/records/users/u-yemi` |
| Listing hidden by moderation / removed | `/records/listings/L-5218` / `/records/listings/L-5214` |
| Offer with three versions, still open | `/records/offers/O-6201` |
| Feed post removed by its author; post with a removed comment | `/records/feed/F-910`; `/records/feed/F-904` |

The top-bar search (press `/`) finds cases, transactions and records by ID or name. Support agents only find their own cases and those cases' transactions.

### Exceptions and settings

| What | Where |
| :-- | :-- |
| Every exception queue, with counts and a next action per row | `/exceptions` (administrator or support agent) |
| Account appeal: Segun asks for his restriction to be lifted | `NX-000233` |
| Possible duplicate listing | `NX-000220`, repeating `L-5219` |
| Reservation about to expire, no action needed yet | `NX-000234` / `T-000308` |
| Pilot settings, history and the agreements notice | `/settings` (administrator); every change also appears in the moderation log |

Support agents see every exception but take a row with **Assign to me** before acting on it.

### Dashboard

| What | Where |
| :-- | :-- |
| Operations dashboard: funnel, rates by mode, liquidity, cancellations and disputes, support effort | `/dashboard` (administrator) |
| A recent range, where longer liquidity windows read "Too recent" | `/dashboard?range=7d` |
| One category, or an area with no activity (empty state) | `/dashboard?category=k-phones`, `/dashboard?area=a-ojota` |

The mock's dashboard figures are **fictional and generated** from a fixed seed, one set of listings per day since the mock pilot start (1 October 2026). They don't match the sample records above. Every chart has a table (Chart / Table, remembered per user), and support minutes and cost per deal read "Not measured yet" until operations supplies those inputs.

## Questions for the real admin API

The mock answers these one way. The real API may choose differently; each is a single place to change in the console.

| Question | What the mock does now |
| :-- | :-- |
| Cursor and ID formats | Cursors are opaque strings of `A–Z a–z 0–9 . _ ~ -`, up to 128 characters. IDs look like `NX-000202`, `T-000301`, `u-kunle`, `s-mod`. The console drops anything else from the address |
| Filtering records by area and category | By **name**. Matching by settings ID would survive renames and tell apart the same area name in two cities |
| A 409 and its idempotency key | A conflict is not stored under the key, so the same key can succeed after a reload. If the real API stores it, the console's "Try again" after a conflict needs a new key |
| An answer lost in transit | The console reads the record back. A settings save counts as saved when the section now equals what was sent, so an identical change saved by someone else at that moment would also read as yours |
| A revealed phone number | The revealed value stays in memory only while its section is on screen. The mock logs a retried reveal twice |
| Exceptions for support agents | Every agent sees every exception and takes unassigned ones for themselves. The real API may scope rows per agent |
| Dashboard attribution | Every event counts toward the day its listing was published (a cohort view). Completion counts deals accepted at least 7 days before the data-through time. The pilot start comes from the API (`pilotStart`) |
| Client error reports | `POST /admin/client-errors` with the error name, a scrubbed message (no addresses, emails or long numbers, 200 characters at most), the route pattern (`/cases/:id`), the request ID, build version and environment. At most 10 a minute. The mock accepts reports from anyone, signed in or not |

## Hosting notes

- `vercel.json` serves `index.html` for unknown paths, long-caches hashed assets and sets the security headers from PRD §7 (strict CSP, `frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, `nosniff`, `X-Robots-Tag: noindex`, and a `Permissions-Policy` that turns off camera, microphone, geolocation, payment and USB).
- **Production builds carry no mock.** The sample accounts and the MSW worker load only when `VITE_USE_MOCK_API=true`, and a build without the mock leaves `mockServiceWorker.js` out. CI builds for production, then runs `check:dist` and `check:bundle`.
- **Client errors** are posted to `POST /admin/client-errors` on the API origin, so they need no CSP change beyond the API origin itself.
- The CSP's `connect-src` is `'self'` only, because the API is same-origin `/api` for now. When the real admin API origin is decided (AD-D-01), add it to `connect-src` and either a rewrite in `vercel.json` or an absolute `VITE_ADMIN_API_BASE_URL`.
