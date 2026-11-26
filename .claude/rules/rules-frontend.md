# rules-frontend.md — mis-frontend (Vue 3 + Vite, frontend)

<!-- Refreshed 2026-11-27 from wiki/raw/repo-profiles/fe.rules-draft.md (repo-analyzer, branch mis-29) merged with the onboarding rules: §9 Ledger (decided 2026-11-01) and the RFID realtime checklist are kept verbatim. Every rule cites a file, or says "framework default" or "decided <date>". Edit freely, and keep the citations. -->

Binding for every agent and human working in this repo. `rules-common.md` applies too; where they conflict, this file wins for this repo.

---

## 1. Stack

- Language / runtime: JavaScript ES modules, no TypeScript (`package.json` `"type": "module"`); Node 20.19+ or 22.12+ for Vite 8 (`README.md`, `AGENTS.md` Work Guidance).
- Framework: Vue ^3.5.42 `<script setup>` SFCs on Vite ^8.3.0; vue-router ^5.4, Pinia ^4.1, axios ^1.20, Tailwind ^4.3.3 via `@tailwindcss/vite`, vue-toastification 2.0.0-rc.5, `@lucide/vue`, `@fontsource-variable/manrope`; laravel-echo ^2.4 + pusher-js ^8.6 installed for the RFID flow (`package.json`). No Vuetify, no component library (`rules-frontend.md` §1, `README.md`).
- Package manager: npm (`package-lock.json`); keep `.npmrc` `legacy-peer-deps=true`.
- Database: none — all data from mis-backend at `VITE_API_URL` (`.env.example`).
- Commands: dev `npm run dev` (5173) · test `npm test` (`vitest run`) · lint none · build `npm run build` (`package.json`).

## 2. Layer Chain (build order)

1. api-service
2. store? (only cross-page state)
3. component
4. view
5. route
6. layout? (only when the shell, top bar or nav changes)

Side layer, built alongside whichever layer needs it: **util** (`src/utils/`, pure, unit-tested) (`AGENTS.md` Local Contracts).

| Layer | Folder | Naming | Base / Wiring | Example |
|---|---|---|---|---|
| util | `src/utils/` | `<domain>Form.js`, `<domain>Search.js`, `<domain>Display.js` (+ special: `moneyDisplay.js`, `dateDisplay.js`, `roleAccess.js`, `csvExport.js`); co-located `<name>.test.js` | named exports, no Vue/DOM/HTTP imports; imported by views/components/stores | `src/utils/roomForm.js`, `src/utils/roomSearch.js` |
| api-service | `src/services/` | `http.js` + `<domain>Service.js`; verb-named `async` exports (`fetchX`, `fetchAllX`, `createX`, `updateX`, `deleteX`, `deactivateX`/`reactivateX`) | `import http from '@/services/http.js'`; path constants; `return response.data` | `src/services/roomService.js` |
| store | `src/stores/` | `<name>Store.js` → `use<Name>Store` | Pinia options API (`defineStore(id, { state, getters, actions })`), `createPinia()` in `src/main.js` | `src/stores/schoolYearStore.js` |
| component | `src/components/[modal/]` | PascalCase `.vue`; families `<Domain>FilterBar`, `<Domain>FormFields`, `<Domain>RowActions`, `<Domain>…Result/Totals/List` | `<script setup>`, `defineProps`/`defineEmits`/slots | `src/components/RoomRowActions.vue`, `src/components/modal/Modal.vue` |
| view | `src/views/` (flat) | `<Name>View.vue`; embedded, non-routed `<Name>ModalView.vue` / `<Name>PanelView.vue` | `<script setup>`; page state in `ref`s; calls services | `src/views/RoomsView.vue`, `src/views/EnrollmentEnrollModalView.vue` |
| route | `src/routeNames.js`, `src/routeRoles.js`, `src/router.js` | `*_ROUTE_NAME` constants (PascalCase values), kebab-case paths, numeric params `(\\d+)` | child of the `MainPanelLayout` route, lazy `() => import('@/views/…')`, `meta: { roles: ROUTE_ROLES[NAME], title, isPrintable? }` | `src/router.js` |
| layout | `src/layout/`, `src/layout/sidebar/` | `MainPanelLayout.vue`, `MainTopBar.vue`, `MainSidebar.vue` + `navConfig.js` | `NAV_ITEMS` filtered by `listVisibleNavItems` | `src/layout/sidebar/navConfig.js` |

## 3. Layer Rules

- **util**
  - Pure: no Vue, DOM, HTTP or store imports, so it runs under Vitest's node environment (`AGENTS.md` utils block, `vite.config.js`).
  - Form modules own client rules and return Laravel-shaped `{ field: [message] }` errors and the request payload (never `is_active`, never `rfid`) (`src/utils/roomForm.js`, `AGENTS.md`).
  - Catalogs mirroring backend enums are frozen and commented as mirrors (`src/utils/subjectDisplay.js`, `src/utils/accountDisplay.js` per `AGENTS.md`).
  - Money is integer cents via `src/utils/moneyDisplay.js` (`AGENTS.md`).
  - Helpers already defined in another domain's util are imported from there rather than duplicated (`src/utils/roomForm.js` → `sectionForm.js`; `src/utils/roomSearch.js` reuses `pickOptionValue` of `subjectSearch.js` per `AGENTS.md`).
- **api-service**
  - Only services make HTTP calls; exactly one axios client, `src/services/http.js`, `baseURL = import.meta.env.VITE_API_URL` (`rules-frontend.md` §3; grep: `axios` imported only in `http.js`).
  - Return `response.data`; let errors reject unchanged with the server message (`rules-frontend.md` §3, `src/services/roomService.js`).
  - Validate path ids before the request (`assert<Entity>Id` throwing `Error`) (`src/services/roomService.js`, `gradingService.js` per `AGENTS.md`).
  - Unpaged pickers use a `fetchAll<Entities>` that walks page 1…`meta.last_page` and merges (`programService.js`, `accountService.js` per `AGENTS.md`).
  - `http.js` interceptors own auth reactions: 401 → clear session + toast + `/login`; 403 → toast, session kept; `skipAuthHandling: true` bypasses (`src/services/http.js`).
- **realtime (api-service)** — Echo `broadcaster: 'pusher'`, config only from `VITE_PUSHER_*`; channel `rfid`, event `AssignRfid`, UID in `e.message`; `POST /rfid/open` → listen → `PUT /students/rfid/{id}` → `POST /rfid/close` on modal close; leave the channel on unmount (`rules-frontend.md` §3, `AGENTS.md` Realtime contract). Not yet implemented (no Echo import in `src/`).
- **store**
  - Only cross-page state; page lists stay in view `ref`s (`rules-frontend.md` §3).
  - `authStore.js` is the only code touching `localStorage` (`AGENTS.md` stores block; grep).
  - Async loaders use a request-version counter to drop stale responses (`src/stores/schoolYearStore.js`).
- **component**
  - Presentational: props in, emits/slots out; no service or store imports (`rules-frontend.md` §3; grep finds none).
  - Row-action components emit only; the view owns confirm dialogs and calls (`src/components/RoomRowActions.vue`).
  - Reuse `DataTable.vue`, `TablePagination.vue`, `TabList.vue`, `modal/Modal.vue`, `modal/ConfirmDialog.vue` (`AGENTS.md` components block).
- **view**
  - Data only through services; loading state per async call; toast on success and failure (`rules-frontend.md` §3).
  - Skip the toast for 401/403 (already toasted by `http.js`); 422 → `fieldErrors` on the form (`toastRequestError` in `src/views/RoomsView.vue`).
  - Guard list loads with a request id; debounce search (300 ms); re-request the last page when the current page is beyond `meta.last_page` (`src/views/RoomsView.vue`).
  - Modals that load or save data are embedded `*ModalView.vue` sub-views (not routed) that call services and toast themselves (`AGENTS.md` views block, `src/views/EnrollmentEnrollModalView.vue`).
  - Named constants for every message, title and class string (`src/views/RoomsView.vue`; `rules-common.md` §7).
- **route**
  - New guarded page: constant in `routeNames.js`, entry in `ROUTE_ROLES` (`routeRoles.js`), child of `MainPanelLayout` with its own `meta.roles` + `meta.title`; never a role list or route-name literal in `router.js` or `navConfig.js` (`AGENTS.md` Work Guidance, `src/router.js`).
  - Printable pages set `meta.isPrintable` (shell hidden on print) and use the `print-page-statement` / `print-page-class-record` utilities (`src/router.js`, `src/style.css` per `AGENTS.md`).
- **layout** — menu entries only via `NAV_ITEMS` in `src/layout/sidebar/navConfig.js`, filtered by role; group order and item placement as recorded in `AGENTS.md` layout block.
- **Styling** — Tailwind utilities only; Ledger tokens from `src/style.css` `@theme`; status chips, buttons, inputs, focus ring per `rules-frontend.md` §9; icons `@lucide/vue` only.
- **Imports** — `@/` alias for everything under `src/` (`vite.config.js`; grep finds no `./` or `../` imports).

## 4. Data & Validation

- Where input is validated: client rules in `src/utils/<domain>Form.js`, applied in the view before the service call; mis-backend is authoritative and its 422 errors are shown on the fields (`src/views/RoomsView.vue`, `rules-frontend.md` §4).
- Where persistence happens: mis-backend, through services (`rules-frontend.md` §4).
- Response / error shape: services return `response.data` with a resource wrapper key (`{rooms, meta}`, `{room}`); Laravel 422 `{message, errors}`; 204 on delete (`AGENTS.md` services block).
- Pagination / unbounded queries: server pagination with `meta` + `TablePagination.vue`; `fetchAll*` walkers only for pickers and grouped views (`AGENTS.md`, `src/views/ChartOfAccountsView.vue` per `AGENTS.md`).

## 5. Cross-cutting

- Auth: Sanctum bearer token attached in `src/services/http.js`; session restored once per load by the `router.js` guard (`authStore.restoreSession`).
- Authorisation / permissions: `ROUTE_ROLES` in `src/routeRoles.js` → `meta.roles`; guard sends wrong-role users to their landing page; landing precedence and role constants in `src/utils/roleAccess.js`; in-page write gates use role-group exports (`ADMIN_REGISTRAR_ROLES`, `PAYMENT_RECORDER_ROLES`, `ACCOUNTING_ROLES`…) (`AGENTS.md` routeRoles line).
- Scoping / tenancy: none; school-year/term filters default to the active period from `schoolYearStore` (`AGENTS.md`).
- Logging: no client logger, no `console.*`/`debugger`; failures reach the user by toast (`rules-frontend.md` §5; grep finds none). Overrides the `Logger.error` example in `rules-common.md` §15.
- Config / secrets: never hardcode; read `import.meta.env.VITE_*` and document each in `.env.example`; never read `.env` (`rules-frontend.md` §5, `.gitignore`).

## 6. Tests

- Framework: Vitest 5.0.5, `environment: 'node'`, `include: ['src/**/*.test.js']`; `npm test` (`vite.config.js`, `package.json`).
- Location & naming: co-located `<name>.test.js`; every `src/utils/` module has one; services tested with `vi.mock('@/services/http.js')` asserting path, params and returned data (`src/services/roomService.test.js`); also `src/routeRoles.test.js`, `src/layout/sidebar/navConfig.test.js`.
- Required per change: new/changed util and service functions get tests; `npm test` and `npm run build` pass; changed pages checked by hand in `npm run dev` against mis-backend (`rules-frontend.md` §6, `AGENTS.md` Verification).
- Fixtures / factories: inline constants in tests; shared `src/utils/grade-computation.json` must stay byte-identical with mis-backend `tests/Fixtures/grade-computation.json` (`AGENTS.md` utils block).

## 7. Prohibitions

- No HTTP from components or views; no `axios.create` outside `src/services/http.js` (`rules-frontend.md` §7).
- No service or store imports in `src/components/` (`rules-frontend.md` §3, `AGENTS.md` components block).
- No Vuetify (`rules-frontend.md` §7).
- No `console.*` / `debugger` (`rules-frontend.md` §7).
- No hardcoded API URLs, Pusher keys or clusters (`rules-frontend.md` §7).
- No relative `../` imports into `src/` (`rules-frontend.md` §7).
- No route-name literals outside `src/routeNames.js` (except `'Login'` in `http.js`) and no role lists outside `src/routeRoles.js` / `src/utils/roleAccess.js` (`AGENTS.md`).
- No `localStorage` outside `src/stores/authStore.js` (`AGENTS.md` stores block).
- No Vue/DOM/HTTP imports in `src/utils/` (`AGENTS.md` utils block).
- No raw hex/rgb, arbitrary values or inline style colors; no second accent, gradients, emoji or card shadows (`rules-frontend.md` §7, §9).
- No reading or committing `.env`; do not copy `enrollment-fe` code blindly (`rules-frontend.md` §7).

## 8. Self-Audit Checklist

- [ ] `<script setup>`; all imports via `@/`
- [ ] HTTP only through a `src/services/<domain>Service.js` function on `http.js`; returns `response.data`; id guard on `{id}` paths
- [ ] Components import no service or store; row actions emit only
- [ ] Every async call in a view has a loading state, a stale-response guard and toasts (401/403 left to `http.js`, 422 on fields)
- [ ] New page: `routeNames.js` constant + `ROUTE_ROLES` entry + `MainPanelLayout` child with `meta.roles`/`meta.title` (+ `NAV_ITEMS` if in menu)
- [ ] New pure logic in `src/utils/` with a co-located `.test.js`; service changes covered in the service test
- [ ] `VITE_*` only for config; new variables in `.env.example`
- [ ] Ledger tokens only; status chips with words; focus ring; works at 400px
- [ ] RFID flow: channel opened before the prompt shows; missing UID refused before the PUT; list refreshed after assignment; `/rfid/close` called on modal close; Echo channel left on unmount
- [ ] No `console.*`, `debugger`, hardcoded URL or key
- [ ] Files ≤ 500 lines (hard 550), functions ≤ 40 lines, ≤ 2 args (`rules-common.md` §2, §3, §13)
- [ ] `npm test` and `npm run build` pass (Node ≥ 20.19)
- [ ] `AGENTS.md` updated when a route, service, component, util or contract changed (DOX)

## 9. Visual Design — Ledger (decided 2026-11-01)

Light, calm office software: white surfaces, a light grey page, one blue accent. The data and the attendance status colors are the only loud things on screen. Reference mockup: https://claude.ai/artifact/6DvLHSjN1wtMZDGJvXLYxa (style "Ledger").

**Theme tokens** — define once in `src/style.css` with Tailwind v4 `@theme`, then use them as classes (`bg-surface`, `text-ink-muted`, `bg-accent`…). Components never use hex values.

```css
@theme {
  --color-page: #f7f8fa;        /* app background */
  --color-surface: #ffffff;     /* sidebar, top bar, cards, tables */
  --color-line: #e3e6eb;        /* every border and table rule */
  --color-ink: #18202c;         /* body text */
  --color-ink-muted: #67707f;   /* secondary text, table headers, captions */
  --color-accent: #1d4fcf;      /* primary buttons, active nav, links, focus ring */
  --color-accent-soft: #eaf0fd; /* active nav background, selected rows */
  --font-sans: "Manrope Variable", "Manrope", ui-sans-serif, system-ui, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, Consolas, monospace;  /* RFID UIDs, codes */
}
```

**Status chips** (semantic, separate from the accent — same everywhere): Present `bg-green-100 text-green-800`, Late `bg-amber-100 text-amber-800`, Absent `bg-red-100 text-red-800`, Timed out / neutral `bg-slate-200 text-slate-700`. Pill shape `rounded-full px-2.5 py-0.5 text-xs font-bold`. Never color alone — always a word.

**Shell** (`src/layout/MainPanelLayout.vue`):
- Sidebar `w-58` (≈232px), `bg-surface border-r border-line`; groups with uppercase `text-xs tracking-wider text-ink-muted` headings; items `rounded-md px-2.5 py-2 text-sm` with an icon; active item `bg-accent-soft text-accent font-semibold` plus a 3px left accent edge. Items come from one nav config filtered by the user's roles.
- Below `md`, the sidebar collapses to an icon rail / drawer; it never pushes the page sideways.
- Top bar `bg-surface border-b border-line px-6 py-3.5`: breadcrumb + page title (`text-lg font-bold`) on the left; school-year badge, scanner status and user menu (name, roles, Logout) on the right.
- Content `p-6 gap-4` (`p-3.5` on phones), on `bg-page`.

**Components**:
- Cards and panels: `bg-surface border border-line rounded-lg` — no shadow. Panel header row `px-4 py-3 border-b border-line` with title left, actions right.
- Tables: header `text-xs uppercase tracking-wider text-ink-muted bg-page`, rows `border-t border-line`, `tabular-nums` for times and counts, UIDs in `font-mono text-xs`; wrap wide tables in `overflow-x-auto`.
- Buttons: primary `bg-accent text-white rounded-md px-3 py-1.5 text-sm font-semibold`; secondary `border border-line bg-surface`; destructive `bg-red-600 text-white`. One primary button per view area.
- Inputs: `border border-line rounded-md bg-surface px-3 py-2`, label above, error text `text-red-700 text-xs` below.
- Focus: every interactive element shows `focus-visible:ring-2 ring-accent ring-offset-1`.
- Radius scale: `rounded-md` (controls), `rounded-lg` (cards), `rounded-full` (chips, avatars). Nothing larger.

**Typography**: Manrope (self-hosted via `@fontsource-variable/manrope`, imported once in `src/main.js` (MIS-2); system font fallback). Sizes: page title `text-lg`/`font-bold`, panel title `text-sm font-bold`, body `text-sm`, captions `text-xs`. Numbers in tables and stat tiles use `tabular-nums`.

**Icons**: `@lucide/vue` only (replaces the deprecated `lucide-vue-next`, decided 2026-11-01), 16–18px, `stroke-width` default; no emoji.
