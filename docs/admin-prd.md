# NextOwn — Admin Console Frontend PRD

| Field | Value |
| :---- | :---- |
| Document ID | NX-ADM-PRD-001 · Revision 0.2 · 22 October 2026 |
| Scope | The standalone, staff-only admin console used by support agents, moderators and administrators to run the NextOwn one-city pilot. Lives in its **own repository** (`admin-frontend`), separate from the client app |
| Parent documents | [NX-PRD-001 Product Requirements](./NextOwn%20Product%20Requirements%20Document.md) (§2.1, §5.7, §5.8, §7.3, §12) · [NX-UX-001 UI/UX Brief](./NextOwn%20UIUX%20Design%20Agent%20Ready%20Template.md) (UX-27, UX-28) · [Brand Kit & Design System](./NextOwn%20Brand%20Kit%20and%20Design%20System.md) |
| Sibling document | [NX-FE-PRD-001 Client Frontend PRD](./prd.md): the user-facing marketplace app (separate repository) |
| Status | Draft for review by product owner, operations lead and frontend lead |
| Audience | Frontend engineers building the console, the operations/support team who will use it, and the backend team that owns the admin API |

**Precedence.** NX-PRD-001 decides behaviour and permissions. The Brand Kit decides visual values. This document decides how the admin frontend implements both. It is **self-contained**: everything needed to build the console is here, without depending on the client app's repository.

**Evidence key** (from NX-PRD-001): **S** = from the source proposal; **R** = recommended implementation detail; **D** = open decision. **P0** = required for the pilot launch; **P1** = pilot improvement.

> **Admin decision principle.** The console exists to resolve real cases accurately and accountably. It shows only the private data a case needs, records why every privileged action was taken, and can never fabricate a user's confirmation or rewrite an accepted agreement.

---

## 1. Purpose and Scope

### 1.1 Why the console is a separate application

| Reason | Effect |
| :---- | :---- |
| Security boundary | Staff-only code, routes and endpoints never ship in the public bundle. A public user cannot discover admin screens |
| Different users and devices | Desktop-first, data-dense layouts for trained operators, not mobile-first marketplace UX |
| Independent release | Moderation tooling changes on its own schedule without redeploying the marketplace |
| Different hosting rules | Served from its own origin (e.g., `admin.nextown.ng`), optionally restricted by network or SSO policy |

### 1.2 In scope (pilot)

- Moderation queue and report handling (UX-27)
- Case and transaction detail with evidence and resolution workflow (UX-28)
- Record browsers for users, items, listings, offers/versions, transactions, feed content and reports
- Exception queues: partial-confirmation timeouts, reservation expiries, duplicate items, disputes, appeals
- Content and account actions: hide, remove, warn, restrict, release item, each with reason codes
- Pilot settings: cities/areas, categories, default expiries, content rules, support contacts
- Operations dashboard: funnel, liquidity, disputes, support effort
- Audit log viewing

### 1.3 Out of scope

- Any action that moves money, issues refunds or claims payment verification
- Creating, editing or impersonating a participant's confirmation, offer or message
- Rewriting an accepted agreement snapshot
- Unlogged bulk bans or bulk deletions
- Role/permission management beyond what the API exposes to administrators (P1 if needed)
- Masked audit export (P1, ADM-FE-11)

---

## 2. Users and Permissions

| Role | Can see | Can do | Cannot do |
| :---- | :---- | :---- | :---- |
| Support agent | Assigned cases; transaction evidence and limited content needed for those cases (audited access) | Add internal notes, request information, propose resolutions, escalate | Irreversible actions; settings; role changes |
| Moderator | Report queue; listings, comments, feed posts and accounts under review | Hide/remove content, warn or temporarily restrict accounts, close reports, all with reason codes | Settings; role changes; viewing private messages without a case context |
| Administrator | Everything above, plus operational dashboards, settings and the audit log | Configure pilot settings, manage permitted roles, record dispute resolutions and authorised item releases | Edit audit rows; fabricate confirmations; rewrite agreements |

Rules:

- The API is the authority on every permission. The console hides or disables actions a role cannot take, for clarity only.
- Navigation items and actions are derived from the role list returned by the session endpoint.
- A `403` from any action shows "You don't have permission for this action" and leaves the page state intact.
- Non-staff users who reach the console see a generic sign-in or not-found page, never a description of what the console contains.

---

## 3. Technical Architecture

### 3.1 Stack

The console uses the same technology choices as the client app, so engineers can move between the two. The code lives in its own repository and shares nothing at build time.

| Concern | Choice | Role in the admin console |
| :---- | :---- | :---- |
| Language | **TypeScript** (strict mode) | Compile-time safety on money, enums, roles and API payloads |
| Build tool / dev server | **Vite** | Dev server, route-level code splitting, env handling (`import.meta.env`) |
| UI framework | **React** | Single-page application |
| Routing | **React Router** (data router: `createBrowserRouter`) | Nested layouts, lazy routes, staff/role guards, URL-synced table filters |
| Component library | **HeroUI** | Accessible base components (built on React Aria): Table, Input, Select, Autocomplete, Modal, Drawer, Tabs, Chip, Card, Dropdown, Pagination, Tooltip, Skeleton, DatePicker. Themed with the Brand Kit (§4.4) |
| Styling | **Tailwind CSS** built on the Brand Kit tokens | Brand colours, type, spacing, radius, shadow and motion as Tailwind theme values and CSS variables. No raw hex in components |
| Icons | **Lucide** (`lucide-react`), rounded line, 20 px default in dense views, 24 px elsewhere, 1.75–2 px stroke | Brand Kit §5.1 |
| Server state | **TanStack Query** | All API data: queues, records, cases, settings, dashboards; polling and invalidation after actions |
| Client state | **Zustand** | UI and session-view state only (§3.4) |
| Forms and validation | **React Hook Form + Zod** | Action forms with reason codes, settings forms, filters |
| HTTP client | **Axios** (one shared instance) with types generated from the admin OpenAPI spec | All API calls (§3.3) |
| Document head | **React Helmet** (`react-helmet-async`) | Per-route titles ("Case NX-000123 · NextOwn Admin") and `noindex, nofollow` on every route |
| Charts (dashboard) | **Recharts** (R) | Funnel and trend charts for the operations dashboard, styled with brand tokens |
| Testing | **Vitest** + React Testing Library + MSW + `vitest-axe`; Vitest Browser Mode for flows | Unit, component, integration, accessibility and flow tests |
| Dates/times | `Intl.DateTimeFormat` with `timeZone: 'Africa/Lagos'` | Display WAT; exact UTC available on audit and timeline entries (§5.2) |

Not used in the console: share previews, PWA/service worker, product analytics, and image compression on upload.

### 3.2 Rendering and loading

- Client-rendered SPA. The app shell and sign-in load eagerly; every other page is a lazy route chunk.
- Every route sets `noindex, nofollow` through React Helmet; `index.html` also carries `<meta name="robots" content="noindex, nofollow">`. `robots.txt` disallows all paths.
- The host serves `index.html` for unknown paths (SPA fallback) and long-cache headers for hashed assets.
- Tables show HeroUI `Skeleton` rows on first load, never full-page spinners.

### 3.3 API layer (Axios)

All HTTP calls go through **one Axios instance** in `src/lib/api/client.ts`. Components never call Axios directly; they use TanStack Query hooks in `features/<domain>/api/`, which call typed endpoint functions.

| Concern | Implementation |
| :---- | :---- |
| Instance | `axios.create({ baseURL: import.meta.env.VITE_ADMIN_API_BASE_URL, withCredentials: true, timeout: 15000, headers: { Accept: 'application/json' } })` |
| Types | Generated from the admin OpenAPI spec into `src/lib/api/generated/`; endpoint functions such as `getCase(id, { signal })`, `applyModerationAction(body, { idempotencyKey })` |
| Cancellation | TanStack Query's `signal` is passed to every request |
| Request interceptor | Adds `X-Request-ID` (UUID) and the CSRF header if the API uses one. No tokens in headers; the session is an HttpOnly cookie |
| Idempotency | Every privileged action (moderation action, release, resolution, settings change) sends an `Idempotency-Key` created once per user intent and reused on retry |
| Response interceptor | Normalises failures into one `ApiError`: `{ status, code, message, fieldErrors?, retryAfter?, requestId, kind }`, where `kind` is `http`, `network`, `timeout` or `cancelled` |
| 401 handling | Clears the Zustand session store and Query cache, keeps the current URL, routes to sign-in |
| Retries | Axios never retries. TanStack Query retries GETs up to 2 times with backoff, never on 4xx. Actions are never auto-retried |
| Uncertain outcomes | A timeout or network error on an action is treated as **unknown**: the UI shows "Checking the latest status…", refetches the case or record, then shows the true result |
| Logging | Never log request bodies, phone numbers, message text or evidence. Log only `requestId`, endpoint name, status and error code |

**Error code → UI mapping**

| API code | UI behaviour |
| :---- | :---- |
| `VALIDATION_ERROR` 422 | Per-field errors plus an error summary; input preserved |
| `AUTH_REQUIRED` 401 | Sign-in, then return to the same URL |
| `FORBIDDEN` 403 | "You don't have permission for this action." Page state kept |
| Not found 404 | Generic not-found page; no hint that a private record exists |
| Conflict 409 (case or record changed) | "This case changed since you opened it." Show the latest state and ask the operator to review before acting again. Never overwrite |
| `RATE_LIMITED` 429 | Wait message using `Retry-After` |
| 5xx / network | Retry for reads; read-before-retry for actions |

### 3.4 State ownership

| State | Owner | Examples |
| :---- | :---- | :---- |
| Server data | **TanStack Query** only | Queues, cases, records, transactions, settings, audit log, dashboard data |
| URL state | **React Router** search params | Table filters, sort, page cursor, selected tab, date range |
| Form state | **React Hook Form** | Action forms, notes, settings |
| Client/UI state | **Zustand** | Staff session view (user ID, display name, roles; no tokens), sidebar collapsed, table column preferences, server clock offset |
| Persisted preferences | Zustand `persist` to `localStorage` (wrapped in try/catch) | Column visibility and density per table only. Never case data, notes or evidence |

Rules: never copy API responses into Zustand; on sign-out or idle timeout, clear the Query cache and reset every store.

### 3.5 Authentication and session

- Staff sign in through the API's staff authentication (phone OTP plus any second factor the backend requires, AD-D-02). The session is an HttpOnly, Secure, SameSite cookie.
- Idle timeout (e.g., 30 minutes, configurable by the API) shows a 60-second warning modal, then signs out and keeps the current URL for return.
- Unsaved notes are kept in memory only; the idle-timeout warning tells the operator to save them.

### 3.6 Repository structure

```
admin-frontend/
├── README.md
├── index.html                     # noindex meta, font preload
├── vite.config.ts                 # includes Vitest config
├── tsconfig.json
├── hero.ts                        # HeroUI Tailwind plugin + NextOwn admin theme (§4.4)
├── public/
│   ├── robots.txt                 # User-agent: * / Disallow: /
│   └── favicon/                   # brand favicon set (admin variant, AD-D-04)
└── src/
    ├── main.tsx
    ├── app/
    │   ├── App.tsx                # HelmetProvider, QueryClientProvider, HeroUIProvider, RouterProvider
    │   ├── router.tsx             # route tree; lazy() for every page after sign-in
    │   ├── query-client.ts        # TanStack Query defaults
    │   ├── layouts/               # AuthLayout, AdminLayout (sidebar, top bar, breadcrumbs)
    │   └── guards/                # RequireStaff, RequireRole
    ├── pages/                     # thin route components; set <Helmet> titles
    │   ├── SignInPage.tsx
    │   ├── OverviewPage.tsx
    │   ├── ReportsQueuePage.tsx
    │   ├── CasePage.tsx
    │   ├── TransactionPage.tsx
    │   ├── records/               # UsersPage, ItemsPage, ListingsPage, OffersPage, FeedPage, ReportsPage + detail pages
    │   ├── ExceptionsPage.tsx
    │   ├── SettingsPage.tsx
    │   ├── AuditLogPage.tsx
    │   ├── DashboardPage.tsx
    │   └── NotFoundPage.tsx
    ├── features/                  # each owns api/ (query hooks), components/, schemas/ (Zod)
    │   ├── auth/
    │   ├── queue/
    │   ├── cases/
    │   ├── transactions/
    │   ├── records/
    │   ├── actions/               # moderation action forms with reason codes
    │   ├── exceptions/
    │   ├── settings/
    │   ├── dashboard/
    │   └── audit/
    ├── components/
    │   ├── ui/                    # brand wrappers around HeroUI: Button, TextField, Select, ConfirmModal,
    │   │                          # StatusBadge, EmptyState, ErrorState, Banner
    │   ├── data/                  # DataTable, FilterBar, Pagination, KeyValueList, Timeline
    │   ├── domain/                # SeverityBadge, CasePanel, ReasonCodeField, MaskedValue, EvidenceGate,
    │   │                          # AuditEntry, VersionTimeline, OfferSummary, ConfirmationEvents, MoneyText
    │   └── layout/                # Sidebar, TopBar, Breadcrumbs, IdleTimeoutModal
    ├── stores/                    # Zustand: session.ts, ui.ts, tablePrefs.ts
    ├── lib/
    │   ├── api/                   # Axios instance + interceptors, ApiError, idempotency helper, generated/ types
    │   ├── money/                 # kobo -> ₦ formatting
    │   ├── time/                  # UTC -> WAT, relative times, server clock offset
    │   ├── copy/                  # status labels, reason-code labels, banned-phrase list
    │   ├── permissions/           # role -> allowed navigation/actions map (display only)
    │   └── storage/               # safe localStorage wrapper
    ├── hooks/                     # useIdleTimer, useServerNow, usePolling
    ├── styles/
    │   └── index.css              # Tailwind entry, brand tokens as CSS variables, @font-face
    └── test/
        ├── setup.ts
        ├── msw/                   # handlers per admin resource, including every error code
        ├── utils.tsx              # renderWithProviders
        └── flows/                 # Vitest Browser Mode flow tests (§10)
```

Conventions: `pages/` stay thin; business logic lives in `features/`; a feature does not import another feature's internals; path alias `@/` → `src/`; unit tests sit next to their file.

### 3.7 Environments and configuration

- Environments: local (MSW mocks), staging (staging admin API), production.
- Vite env variables: `VITE_ADMIN_API_BASE_URL`, `VITE_ENV_NAME`. Nothing secret goes in `VITE_*` variables.
- A visible environment ribbon ("STAGING") on non-production builds, so operators never confuse environments.
- Reason codes, severity rules, roles and pilot settings come from the API, never hard-coded.

---

## 4. Design System

The [Brand Kit](./NextOwn%20Brand%20Kit%20and%20Design%20System.md) is the only source of visual values. This repository keeps its own copy of the tokens below in `src/styles/index.css` and `hero.ts`.

**Keeping the two apps in sync.** Because the admin and client apps live in separate repositories, any Brand Kit change (Brand §9.1 version bump) must be applied to both. The token block in each repo carries a header comment with the Brand Kit version it implements, e.g. `/* NextOwn Brand Kit v0.9 */`. The PR checklist (§10.3) asks reviewers to confirm the version matches.

### 4.1 Colour tokens

| Semantic token | Value | Admin use |
| :---- | :---- | :---- |
| `color.text.default` | Ink `#142D32` | Headings, body, table text |
| `color.text.muted` | Slate `#486067` | Secondary text, column headers, timestamps |
| `color.action.primary` | Exchange Teal `#0B6159` | Primary buttons, links, selected nav item, focus ring |
| `color.action.hover` | Teal Hover `#084B46` | Hover/pressed primary |
| `color.accent` | Warm Gold `#F9BB55` | Rare highlights only (e.g., "New since last visit"); **Ink text only**. Never used for severity or warnings |
| `color.surface.page` | Cloud `#F7F9F7` | Page canvas |
| `color.surface.default` | Paper `#FFFFFF` | Cards, tables, panels, modals |
| `color.surface.tinted` | Mint Mist `#E8F4EF` | Selected table row, info panels, sidebar active background |
| `color.surface.inverse` | Ink `#142D32` | Sidebar background (white text, 14.47:1) |
| `color.border.default` | Border `#D6E2DE` | Table rules, dividers, input outlines |
| `color.feedback.success` | `#147D52` | Resolved, completed |
| `color.feedback.warning` | `#9A5900` | S2, overdue, reserved, partial confirmation |
| `color.feedback.error` | `#B42318` | S1, errors, destructive actions |
| `color.feedback.info` | `#2453A6` | S3/S4, informational status, assigned |

Contrast rules (Brand §2.1): Teal and Ink buttons use white text; Gold uses Ink text only; semantic colours always pair with a text label and icon; borders are not used alone for focus or validation.

**Admin colour budget** (art direction): calmer than the marketplace. Roughly 70% Cloud/white, 20% Ink (including the sidebar), 7% Teal, 3% semantic. Gold appears almost never.

### 4.2 Typography

| Role | Font / weight | Size / line height | Admin use |
| :---- | :---- | :---- | :---- |
| H1 | Inter Display 700 | 32 / 40 | Page titles |
| H2 | Inter Display 650–700 | 26 / 34 | Section titles on detail pages |
| H3 | Inter Display 600 | 21 / 28 | Panel titles |
| Body | Inter 400 | 16 / 24 | Notes, descriptions, forms |
| Body medium | Inter 500 | 16 / 24 | Field values, emphasis |
| Compact | Inter 400–600 | 14 / 21 | **Table cells**, filter bars, metadata |
| Caption | Inter 500 | 12 / 18 | Timestamps, column helper text (never for essential data) |
| Button | Inter 600 | 16 / 24 (14 / 21 in table rows) | Actions |
| Amount | Inter 700, tabular figures | 16 / 24 in tables, 24 / 30 on detail panels | ₦ amounts |

- The display size (40 / 48) is not used in the console.
- Self-host Inter and Inter Display WOFF2 (e.g., Fontsource) with `@font-face`, subset to Latin plus `₦` (U+20A6), `font-display: swap`, preload the body weight. Fallback: `Inter Display, Inter, system-ui, "Segoe UI", sans-serif`.
- Use tabular figures (`font-variant-numeric: tabular-nums`) for all IDs, amounts, counts and times in tables.
- Sentence case for all headings, labels and buttons.

### 4.3 Spacing, layout, shape and motion

| Token family | Values |
| :---- | :---- |
| Spacing | 4, 8, 12, 16, 24, 32, 48, 64 px only |
| Radius | sm 8 · control 12 · card 16 · pill 999 (feature 24 not used) |
| Shadow | card `0 2px 12px rgba(20,45,50,.06)` · overlay `0 14px 36px rgba(20,45,50,.18)`; prefer borders over shadows in dense views |
| Motion | fast 120 ms · standard 200 ms · slow 320 ms (overlays only), ease-out; respects `prefers-reduced-motion` |
| Breakpoints | tablet 768–1023 · desktop 1024–1439 · wide 1440+. Phone width is not supported; below 768 px show a "Use a larger screen" notice |
| Content width | Full width up to 1600 px for tables; detail pages use a 12-column grid with 24 px gutters |
| Controls | Form inputs and primary buttons 48 px high. Compact controls inside tables and filter bars 40 px high, but every target stays ≥ 44 × 44 px including padding |

**Admin layout**

| Region | Specification |
| :---- | :---- |
| Sidebar | 240 px (collapsible to 72 px icons + tooltips), Ink background, white text, Teal/Mint active indicator with shape change (left bar), role-filtered items |
| Top bar | 64 px, Paper background, breadcrumbs, global record search (by ID or display name), environment ribbon, signed-in staff name and sign-out |
| List pages | Filter bar above a full-width DataTable; result count; pagination at the bottom |
| Detail pages | Two columns at ≥ 1280 px: main content (8 cols) and a sticky right panel (4 cols) for status, assignment and actions. Single column below 1280 px with actions pinned at the top |
| Modals | Max 640 px wide for action forms; confirmation modals name actor, target and consequence |

### 4.4 Tailwind and HeroUI theming

**Tailwind.** Brand tokens are declared once as CSS variables in `src/styles/index.css` and mapped into the Tailwind theme: `bg-surface-page`, `bg-surface-inverse`, `text-ink`, `text-muted`, `bg-action`, `hover:bg-action-hover`, `border-default`, `text-success`/`warning`/`danger`/`info`, `rounded-control`, `rounded-card`, `shadow-card`, `shadow-overlay`. Arbitrary hex values in classes (`bg-[#…]`) are disallowed by lint.

**HeroUI theme** (`hero.ts`):

| HeroUI theme key | Brand token | Notes |
| :---- | :---- | :---- |
| `background` | Cloud `#F7F9F7` | Page canvas |
| `foreground` | Ink `#142D32` | Default text |
| `content1` | Paper `#FFFFFF` | Tables, cards, modals |
| `content2` | Mint Mist `#E8F4EF` | Selected rows, tinted panels |
| `divider` | Border `#D6E2DE` | Table rules |
| `default` | Slate `#486067` scale | Neutral elements |
| `primary` | Exchange Teal `#0B6159` (foreground `#FFFFFF`); hover `#084B46` | Primary actions |
| `secondary` | Ink `#142D32` (foreground `#FFFFFF`) | Sidebar, dark emphasis |
| `success` | `#147D52` | Resolved |
| `warning` | `#9A5900` | S2, overdue |
| `danger` | `#B42318` | S1, destructive actions |
| `focus` | Exchange Teal `#0B6159` | Focus ring |
| Custom `accent` (Tailwind) | Warm Gold `#F9BB55` with Ink text | Rare highlights; not a HeroUI semantic colour |
| `layout.radius` | small 8 · medium 12 · large 16 | Controls medium, cards large |
| `layout.fontSize` / `lineHeight` | Brand type scale (§4.2) | Body 16/24, table 14/21 |

**Brand overrides on HeroUI defaults** (applied in `components/ui` wrappers):

- No gradient, glow or heavy shadow variants; flat or bordered styles only.
- Status chips and severity badges always include a text label and icon; colour is never the only signal.
- Destructive actions use the `danger` colour with an explicit confirmation modal; never red for ordinary emphasis.
- Critical errors appear as persistent inline banners, not auto-dismissing toasts. Toasts are allowed only for low-stakes success ("Note saved").
- HeroUI `Table` is used with `aria-label`, sortable headers, and sticky header rows; row actions sit in a labelled overflow menu.
- `HeroUIProvider` receives React Router's `navigate` and `useHref` so HeroUI links use client-side routing.

### 4.5 Iconography

Lucide only. Suggested mapping (keep consistent across screens):

| Concept | Icon |
| :---- | :---- |
| S1 urgent safety | `siren` |
| S2 active trade harm | `alert-triangle` |
| S3 policy/content | `flag` |
| S4 ordinary help | `life-buoy` |
| Assigned / assignee | `user-check` |
| Masked data | `eye-off` → `eye` after reveal |
| Evidence | `paperclip` |
| Audit entry | `history` |
| Release item | `unlock` |
| Restrict account | `user-x` |
| Hide/remove content | `eye-off` / `trash-2` |

Never use shield, badge-check or lock-with-check icons to suggest verification or protected payments.

### 4.6 Status, money and time display

- **Status labels** come from one map in `lib/copy` so the console and support scripts use the same words: Available, Reserved, Awaiting handover, Your/Their confirmation received (shown in the console as "Participant A confirmed · Participant B pending"), Completed, Under review, Cancelled, Expired, Closed, Removed.
- **Administrative outcomes are labelled differently** from participant outcomes: "Resolved by support: cancelled", never "Completed", unless both participants confirmed.
- **Money:** API values are integer kobo. Display `₦` with comma grouping and no decimals (`₦350,000`) using `Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })`. No floating-point arithmetic. Cash direction is always a sentence: "Offerer pays owner ₦50,000" / "Owner pays offerer ₦50,000" / "No cash".
- **Time:** display WAT with date, e.g. "24 Oct 2026, 18:05 WAT". Audit and timeline entries also show the exact UTC timestamp (tooltip or secondary line) because cases may need precise ordering. Relative times ("3 h ago") are always paired with the absolute time.

### 4.7 Content and voice

- Practical, neutral and factual. No jokes, blame or celebration, especially in dispute and safety contexts.
- Describe exactly what was recorded: "Participant B confirmed exchange (self-reported)", not "Payment verified".
- The banned-phrase list from the marketplace applies here too, enforced by the same kind of CI scan: Verified person · Verified seller · Identity verified · Escrow · Escrow protected · Guaranteed buyer · Secure payment · Protected payment · We hold your money · Funds secured · Payment confirmed by NextOwn · Certified authentic · Fraud-free · Delivery guaranteed.
- Action confirmations name the actor, target and consequence: "Restrict Ada O. for 7 days? They won't be able to list, offer or comment. Reason: Spam (S3)."

---

## 5. Information Architecture

| Route | Screen | Roles |
| :---- | :---- | :---- |
| `/sign-in` | Staff sign-in | Public (staff accounts only succeed) |
| `/` | Overview: my assigned cases, queue counts by severity, overdue items | All staff |
| `/reports` | Moderation queue (UX-27) | Moderator, administrator; support agent sees assigned only |
| `/cases/:id` | Case detail (UX-28) | Assigned staff, administrator |
| `/transactions/:id` | Transaction detail (UX-28) | Assigned staff with case context, administrator |
| `/records/users`, `/records/items`, `/records/listings`, `/records/offers`, `/records/feed`, `/records/reports` (+ `/:id`) | Record browsers and detail | Moderator, administrator |
| `/exceptions` | Exception queues | Support agent, administrator |
| `/settings` | Pilot settings | Administrator |
| `/audit` | Audit log | Administrator |
| `/dashboard` | Operations dashboard | Administrator |

Sidebar: Overview · Reports · Listings · Transactions · Members · Exceptions · Moderation log · Settings · Dashboard, shown according to role.

---

## 6. Functional Requirements

| ID | Pri | Requirement | Traces to | Acceptance |
| :---- | :---- | :---- | :---- | :---- |
| ADM-FE-01 | P0 | Standalone app with staff sign-in, role-aware navigation, idle timeout and `noindex` on every route | ADM-01, PRD §8 | Non-staff accounts cannot reach any admin screen; idle timeout signs out and returns to the same URL after sign-in |
| ADM-FE-02 | P0 | Moderation queue: filters (status, severity S1–S4, type, age, assignee), sort by severity then age, report cards/rows showing affected content, policy flag, time, priority and assignee; assign to self or another operator; open case | TRU-07, UX-27 | Filters persist in the URL; duplicate reports grouped; no bulk action without per-item reasons |
| ADM-FE-03 | P0 | Case detail: summary, parties (masked by default), affected content, linked transaction, staff notes, status, due date, resolution workflow | ADM-02, UX-28 | Every reveal of masked data or evidence records a reason first (§7) |
| ADM-FE-04 | P0 | Transaction detail: frozen agreement snapshot, full offer version timeline, **separate** confirmation events per participant with timestamps, reservations, cancellation/dispute history, audit entries | TRX-08, UX-28 | The UI has **no** control that creates or edits a participant confirmation or the agreement snapshot |
| ADM-FE-05 | P0 | Moderation actions: hide/remove content, warn, restrict (with duration), lift restriction, close report. Each needs a reason code plus optional note, a confirmation modal naming actor, target and consequence, and shows the resulting audit entry | TRU-04, ADM-02, QA-19 | Submit disabled until a reason code is chosen; audit entry visible after success |
| ADM-FE-06 | P0 | Dispute resolution and item release: record a case decision; release reserved items with a reason; resolve as Completed only when both legitimate confirmations exist, otherwise cancel or mark administratively resolved | TRX-06/07/08, PRD §7.3 | "Mark completed" is unavailable unless the API reports two valid confirmations |
| ADM-FE-07 | P0 | Record browsers for users, items, listings, offers/versions, transactions, feed posts/comments and reports, with search, filters, pagination and links along the chain (user → item → listing → offer → transaction → case) | ADM-01 | Each browser has loading, empty, error and permission-denied states |
| ADM-FE-08 | P0 | Exception queues: partial-confirmation timeouts, reservation expiries, duplicate items, open disputes and account appeals, each with due date, priority and next action | ADM-04, TRX-07 | No item sits in a queue without a visible next action |
| ADM-FE-09 | P0 | Pilot settings: cities/areas, categories, offer lifetime, Quick Sell options, reservation duration, photo limits, content rules, support contacts. Versioned, validated, with a confirmation that changes don't alter existing agreements | ADM-03 | Invalid values blocked with field errors; change appears in the audit log |
| ADM-FE-10 | P0 | Operations dashboard: listing → offer → acceptance → completion funnel, category/area liquidity, cancellations and disputes per 100 accepted, support effort; filters by date range, category and area | ADM-05, PRD §13.1 | Metric labels and definitions match PRD §13.1; no invented targets; every chart has a data-table alternative |
| ADM-FE-11 | P1 | Masked export of case/transaction audit for authorised requests | ADM-06 | Export requires a reason, is logged and excludes unrelated private data |
| ADM-FE-12 | P1 | Simple suspicious-pattern flags (repeated accounts/listings) shown as hints on records; moderators decide sanctions | TRU-08 | Flags labelled as automated hints, never findings |

---

## 7. Privacy, Evidence and Audit Rules

- **Masked by default.** Phone numbers, private handover venues, chat messages and evidence files stay hidden until a staff member opens them within a case and enters an access reason. The API logs each access.
- **Least data.** Record browsers show only the fields needed to identify a record. Private message content never appears in list views.
- **No hidden actions.** Every state-changing action shows who will be affected and records actor, target, reason, time and before/after state (via the API). The console shows the audit entry afterwards.
- **Immutable history.** Offer versions, agreement snapshots, user confirmations and audit rows are read-only, with no edit affordance anywhere.
- **Severity tiers** (PRD §12.3) drive queue order and badges: S1 urgent safety, S2 active trade harm, S3 policy/content, S4 ordinary help. S1 items are pinned at the top and visually distinct (icon, label and colour).
- **Private media** (evidence, offer-only item photos, chat attachments) loads through short-lived signed URLs and is never cached beyond the session.
- **Security headers:** strict CSP with no third-party scripts, `frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`.
- No `dangerouslySetInnerHTML` for any user-generated content; all user text renders as plain text.

---

## 8. Components

Built on HeroUI through the `components/ui` wrappers. Each has Vitest tests for every listed state, keyboard behaviour and an axe check.

| Component | Required states | Rules |
| :---- | :---- | :---- |
| Button | Primary, secondary, tertiary, danger; default/hover/focus/disabled/loading; M (48 px) and compact (40 px, table rows) | Loading blocks double-submit |
| DataTable | Loading (skeleton rows), empty, error, permission denied, paginated, sorted, filtered, row selected, compact/comfortable density | Sticky header; horizontal scroll inside the container only; column preferences remembered per user |
| FilterBar | Default, active filters (removable chips), reset | Synced to URL params |
| SeverityBadge | S1–S4 | Icon + label + colour (§4.5) |
| StatusBadge | Every status in §4.6 | Text + icon; administrative outcomes visibly different |
| CasePanel | Open, assigned, awaiting info, resolved, escalated, overdue | Shows due date and next action |
| ReasonCodeField | Empty, selected, with note, error | Required for every privileged action; codes loaded from API |
| MaskedValue | Masked, reveal requested, revealed, denied | Reveal requires a reason; announced to screen readers |
| EvidenceGate | Locked, reason entry, loading, available, link expired | Loads through signed URLs |
| AuditEntry | Collapsed, expanded (before/after diff) | Read-only; WAT + UTC times |
| VersionTimeline | Cash, swap, swap + cash versions; accepted/superseded/expired | Uses OfferSummary with "gives / receives" panels and the cash-direction sentence |
| OfferSummary | Mode = Cash / Swap / Mixed; Direction = OffererPays / OwnerPays / None | Same structure as the marketplace's summary so staff see what users saw |
| ConfirmationEvents | 0/2, 1/2, 2/2, disputed | Each participant shown separately with timestamp and self-reported checkboxes |
| MoneyText | Default, large | Tabular figures; ₦ formatting from `lib/money` |
| ConfirmModal | Destructive, standard | Names actor, target, consequence and reason |
| Banner | Info, warning, error, success | Persistent for critical errors |
| EmptyState / ErrorState | Per list and detail page | Always offers a next action (clear filters, retry, go to queue) |
| Chart | Loading, empty, error | Brand colours; data-table toggle for accessibility |

---

## 9. Non-functional Requirements

| Attribute | Requirement |
| :---- | :---- |
| Accessibility | WCAG 2.2 AA; full keyboard operation of tables, filters, menus and modals; visible focus (≥ 3:1, not border colour alone); sortable headers announced; live regions for action results; charts have table alternatives |
| Responsiveness | Designed at 1440 × 900; fully usable at 1024 px and 768 px; below 768 px show a "Use a larger screen" notice |
| Performance | First page of queues and record lists renders in ≤ 1.5 s on office broadband; cursor pagination; initial JS ≤ 300 KB gzipped (R) with lazy routes |
| Reliability | Concurrent edits (two moderators on one case) surface the conflict message and reload; nothing is silently overwritten |
| Browser support | Latest two versions of Chrome, Edge, Firefox and Safari on desktop |
| Observability | Request IDs on every call; client errors reported without personal data |

---

## 10. Testing and Acceptance

### 10.1 Test layers

| Layer | Tooling | Focus |
| :---- | :---- | :---- |
| Unit | Vitest | Money/time formatting, status and reason-code labels, permission map, Zod schemas |
| Component | Vitest + Testing Library + `vitest-axe` | Every component in §8 and its states |
| Integration | Vitest + Testing Library + MSW with all providers | Pages with TanStack Query, React Router, Zustand and RHF wired together; every error code in §3.3 |
| Flow | Vitest Browser Mode at 1440 × 900 and 1024 × 768 | Queue → case → action → audit; dispute resolution; settings change |
| Copy | Banned-phrase scan in CI | §4.7 |

### 10.2 Acceptance cases

| Case | Verification |
| :---- | :---- |
| QA-08 (admin view) | Transaction detail shows the accepted snapshot after the seller edits the listing price |
| QA-13 | Disputed transaction appears in the exception queue; completion control unavailable |
| QA-14 / QA-15 | Reservation expiry with 0/2 confirmations offers cancel and release; 1/2 confirmations goes to review, never auto-released |
| QA-16 (admin) | A role without access to a case gets the permission-denied state with no leaked metadata |
| QA-19 | Moderator hides an abusive comment with a reason code; audit entry shown |
| ADM-T-01 | No route, component or API call allows creating a participant confirmation (code review + flow test) |
| ADM-T-02 | Masked values and evidence cannot be revealed without entering a reason |
| ADM-T-03 | Every privileged action form blocks submit without a reason code |
| ADM-T-04 | A non-staff session cannot load any admin page |
| ADM-T-05 | Two concurrent moderators on one case: the second action gets the conflict message |
| ADM-T-06 | Idle timeout warns, signs out, clears cached data and returns to the same URL after sign-in |

### 10.3 Definition of done (per feature)

- Requirements and all states (loading, empty, error, permission denied, conflict) implemented.
- Vitest unit, component, integration and flow tests passing; axe clean.
- Copy from `lib/copy`; banned-phrase scan passes.
- Works at 1440, 1024 and 768 px; keyboard and screen-reader checked.
- Tokens still match the current Brand Kit version.
- Operations lead sign-off on staging.

---

## 11. Delivery

Runs in parallel with the client app's later phases and must be ready **before the closed beta**: the pilot cannot run without moderation and support tooling.

| Phase | Weeks | Deliverables |
| :---- | :---- | :---- |
| A. Foundations | 5–6 | Repo, CI (lint, types, tests, banned copy), Vite + TypeScript scaffold, brand tokens, HeroUI theme, fonts, `components/ui` wrappers, Axios instance, TanStack Query client, Zustand stores, staff auth, AdminLayout, role guards, MSW mocks |
| B. Core operations | 6–8 | Moderation queue, case detail, transaction detail, moderation actions, audit display |
| C. Operations support | 7–8 | Record browsers, exception queues, pilot settings |
| D. Insight and hardening | 8–9 | Operations dashboard, accessibility pass, operator training run-through (PRD §15 moderation gate) |

---

## 12. Dependencies and Open Decisions

### 12.1 Dependencies

| Dependency | From | Needed by |
| :---- | :---- | :---- |
| Admin OpenAPI spec and endpoints (`/admin/cases`, `/admin/content`, `/admin/transactions`, records, settings, audit, dashboard) with role enforcement | Backend | Phase A (spec), Phase B (endpoints) |
| Staff authentication and session endpoint returning roles | Backend | Phase A |
| Conflict error code for concurrent case updates | Backend | Phase B |
| Reason-code list and severity rules | Product + safety | Phase B |
| Evidence access logging and signed URLs | Backend | Phase B |
| Metric definitions and data endpoints for the dashboard | Backend + growth | Phase D |
| Moderation and support playbooks | Operations | Before beta |
| Brand Kit updates communicated to both frontend repos | Design | Ongoing |

### 12.2 Open decisions

| ID | Question | Recommendation | Owner |
| :---- | :---- | :---- | :---- |
| AD-D-01 | Admin origin and network restrictions | `admin.nextown.ng`, optionally behind an IP allow-list or SSO | Engineering + ops |
| AD-D-02 | Staff authentication strength (second factor, SSO) | Require a second factor for all staff, at minimum administrators | Security + backend |
| AD-D-03 | Staffing, support hours and SLA per severity | Pending PRD D-06 | Operations |
| AD-D-04 | Admin favicon/wordmark variant so staff can tell tabs apart | Brand mark with an "Admin" label or Ink background variant | Brand designer (BR-01) |
| AD-D-05 | Chart library for the dashboard | Recharts | Frontend lead |
