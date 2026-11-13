# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Monorepo with two independent apps (no root-level build tooling; the root README is just a stub):

- `backend/` — Go (Echo + GORM + PostgreSQL) multi-tenant API, derived from a template. Go module name is `backend`.
- `frontend/` — React 19 + Vite + TypeScript + Tailwind + Radix/shadcn-style UI, with Firebase. (`package.json` name is still `backend`; ignore that.)
- `docs/State_55_Architecture_Blueprint_v1.2.pdf` — the product architecture blueprint.

## Product: State 55 Pan-African Digital Community

The product is defined by `docs/State_55_Architecture_Blueprint_v1.2.pdf` (target architecture; the code is still the generic template and has not caught up). It is a continental Pan-African / diaspora community platform: culture and heritage, communities, social feeds, **membership**, and **member-led governance**. Clients: React web and Flutter mobile (mobile is not in this repo yet).

**Phase 1 (MVP) scope**: identity with MFA and a unique public member ID; organizations / wards / constituencies; membership with a signed digital card (QR, ES256) + printable PDF + public verification; posts/comments/reactions/follows; communities; cultural stories and country pages; documents; volunteering tracking; leader evaluations; **governance** (offices, nominations, per-constituency adoption certificates, online elections, auditable results); search; notifications (in-app, SMTP, FCM push); moderation; admin console. **Phase 2** (payments, subscriptions, rewards, meetings, diaspora services, virtual passport) and **Phase 3** (wallet, investment/trade exchange, livestreaming) get reserved package/schema names only — no logic until then.

### Target architecture (from the blueprint)

- **Go modular monolith**, one binary with `serve`, `worker`, `migrate`, `seed` commands. Modules: identity, profiles, organizations, membership, social, communities, culture, discovery, creators, events, documents, volunteering, governance, evaluations, notifications, moderation, administration.
- **Module rules**: each module owns its models, repository and one PostgreSQL schema; other modules call published interfaces only; **no GORM associations/Preload across modules**; async workflows via domain events using a **transactional outbox** (outbox row written in the same transaction).
- **Stack**: Gin, GORM, PostgreSQL 16, Redis + Asynq workers (email, push, card generation, image processing, search indexing; scheduled jobs take a Postgres advisory lock), MinIO (buckets `media-public`, `member-private`, `cards`, `documents`, `backups`; clients get presigned URLs only), SMTP via env vars, PostgreSQL full-text search first. Deployed as containers on Coolify (app server + separate private data server), GitHub Actions CI/CD, Prometheus/Grafana/Loki/OpenTelemetry.
- **API**: REST under `/v1/*` (auth, users, organizations, memberships/cards, feed/posts, communities, culture, atlas, search, creators, events, documents, volunteering, governance, evaluations, notifications, reports, admin), OpenAPI as the contract with generated TypeScript and Dart clients, cursor pagination for feeds, idempotency keys on registration and ballot casting.
- **Data rules**: UUIDs for public entities, UTC timestamps, soft delete only where justified, immutable audit records written in the same transaction as the action, no media in Postgres, money as `numeric(18,2)`/minor units (never floats). Production schema changes are reviewed **SQL migrations only** (goose or golang-migrate); GORM `AutoMigrate` is local-dev only. Migrations must stay backward compatible for one release so rollback = redeploy previous image tag.
- **Security rules**: Argon2id; MFA for admins and for roles managing elections, organizations or money; browser sessions via httpOnly/secure/same-site cookies (**not localStorage**); mobile tokens in secure store; access vs refresh tokens carry distinct type claims; identity comes only from the verified session (proxy strips client identity headers); login rate limits fail closed if Redis is down; app refuses to start with a missing or default secret; no secrets in example files.
- **Member ID / card**: internal UUID plus a separate public member ID (fixed prefix + random chars + check digit; never sequential, leaks no country/join date). Public card verification returns only valid/expired/revoked plus name and organization.
- **Election integrity (treat as invariants)**: eligibility enforced server-side; one ballot per member per election via DB constraint; **ballot content and the who-voted record live in separate tables with no join key**; ballots append-only with a hash-chained election log and reproducible result computation; election config frozen once voting opens; open/close/certify needs two MFA'd admins; adoption certificates unique per constituency; elections have a `symbolic` (default) vs `binding` mode flag, and binding stays disabled pending audit and legal review. Member affiliation and voting data are sensitive personal data.

### Where the current code diverges from the blueprint

Plan for these when building features; do not assume the template's patterns are the intended end state:

| Area | Current code | Blueprint |
|---|---|---|
| HTTP framework | Echo | Gin |
| Route prefix | `/api/v1`, `/controlhub/*` | `/v1` |
| Tenancy | Multi-tenant (`tenant_id`, RLS, ControlHub platform admins) | No tenant concept; scoping is by organization/constituency/community authorization |
| Schemas | Single schema, shared `models/` | One Postgres schema and package-owned models per module |
| Migrations | GORM `AutoMigrate` at startup + SQL files | Versioned SQL migrations via a `migrate` command; AutoMigrate local only |
| Process model | Single `main.go` server | `serve` / `worker` / `migrate` / `seed` commands, Asynq worker, Redis, MinIO |
| Web auth | JWT in `localStorage` (+ Firebase present) | httpOnly cookie sessions; no localStorage tokens |
| API client | Hand-written `lib/api/crud.tsx` | Generated from OpenAPI |

Blueprint v1.3 (repository structure, network topology, first migrations) is the next planned deliverable and will likely settle these; ask the user before doing large migrations away from the template.

## Backend (`backend/`)

Commands (run from `backend/`; see `Makefile`):

- `make db-up` / `make db-down` — start/stop PostgreSQL via docker-compose
- `make run` — starts DB then `go run main.go` (server on `APP_PORT`, default 8080)
- `make build` — builds `bin/server`
- `make test` — `go test -v ./...`; single test: `go test -v ./modules/auth -run TestName`
- `make lint` — `go fmt` + `go vet`
- `make new-module NAME=foo` — copies `modules/_template` into `modules/foo` (uses `sed -i`, needs a POSIX shell)

Setup: copy `.env.example` to `.env`. Required: `DB_HOST`, `DB_PORT`, `DB_NAME`, `JWT_SECRET`. `backend/docs/README.md` is a long template guide; the points below are the parts that need cross-file context.

### Architecture

- **Wiring is manual in `main.go`**: load config → `db.Initialize` → `db.AutoMigrate` → seed default roles → build `global.App` (Config, Logger, optional Email/Upload interfaces, currently nil) → construct each module's `NewService(app)`/`NewHandler(service)` → register routes. A new module must be wired here *and* given a `Setup*Routes` function in `routes/routes.go`.
- **Module shape** (`modules/<name>/`): `handler.go` (HTTP), `service.go` (business logic), `models.go` (DTOs), `public.go` (exported interface for other modules). Domain/GORM entities live in `models/`, not in modules.
- **Two separate auth systems**, deliberately isolated:
  - Tenant auth: `/api/v1/auth/*`, `users` table, JWT claims include `tenant_id` and `role_slug`; protected routes get `JWTMiddleware` → `TenantMiddleware` → `AuditMiddleware`, plus optional per-route `RBACMiddleware(..., "resource.action")`.
  - ControlHub (platform admin): `/controlhub/auth/*` (no `/api/v1` prefix), `company_admins` table, no tenant in JWT; protected routes under `/api/v1/controlhub` use `JWTMiddleware` + `ControlHubOnly` and skip tenant scoping.
- **Multi-tenancy** is enforced by middleware plus PostgreSQL RLS (`app.tenant_id` setting). `MULTI_TENANT_ENABLED=false` turns `TenantMiddleware` into a no-op. Tenant tables need `tenant_id`, an index, and an RLS policy in their migration.
- **DB roles**: runtime uses an app role without BYPASSRLS; migrations use a separate migration role (`DB_APP_*` / `DB_MIGRATION_*` env vars, falling back to `DB_USERNAME`/`DB_PASSWORD`).
- **Migrations**: SQL files in `db/migrations/` (embedded and run by `db/migrations.go`), alongside GORM `AutoMigrate`. Note numbering currently skips `002` (the README mentions an RLS policies file that isn't present).
- **Responses** use the envelope `{status: 0|1, message, data}` via `pkg/response` — use it rather than raw `c.JSON`. (The health endpoint in `main.go` is an exception.)

## Frontend (`frontend/`)

Commands (run from `frontend/`; pnpm is the intended package manager — see `.npmrc` and `DEPENDENCY_INSTALLATION_GUIDE.md`, though a `package-lock.json` also exists):

- `pnpm dev` — Vite dev server
- `pnpm build` — `tsc -b && vite build`
- `pnpm lint` — ESLint
- `pnpm verify-deps` — checks dependency installation (`scripts/verify-dependencies.mjs`)

No test runner is configured.

Env (`frontend/.env`, `VITE_` prefix): `VITE_BACKEND_URL` plus the `VITE_FIREBASE_*` keys.

### Architecture

- Routing is in `src/App.tsx` (react-router v7). Pages live in route-group folders `src/(public)/…` and `src/(admin)/…`; admin routes are wrapped in `ProtectedRoute` + `layouts/AdminLayout`. Path alias `@` → `src/`.
- **Auth state**: `src/lib/context/` (`AuthContext.ts`, `auth.tsx` provider, `useAuth.ts`) persists tokens/user in localStorage under `STORAGE_KEYS` from `src/types/auth.ts`. `ProtectedRoute` supports an optional `requiredAccountType`.
- **API layer**: `src/lib/api/crud.tsx` is the fetch wrapper (reads `VITE_BACKEND_URL`, attaches the stored access token, handles refresh); `end_points.tsx` maps named keys to paths via `getRoute`/`pipe`. Its endpoint names (`admin/login`, `login`, `refresh-token`) are leftovers and don't yet match the backend routes (`/api/v1/auth/login`, `/api/v1/auth/refresh`, `/controlhub/auth/login`) — verify before relying on them.
- Firebase (auth/firestore/storage) is set up in `src/lib/firebase/` and `src/lib/auth/firebaseAuth.ts`, alongside the backend JWT flow — check which one a given feature uses.
- `frontend/Design_system.md` defines the visual design rules (restrained palette with blue only as accent, Sora typography, generous spacing); follow it for UI work.
