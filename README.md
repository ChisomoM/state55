# State 55 (Motherland)

A Pan-African digital community platform. This repository holds the **web app** (React) and the
**API** (Go) in one place. It is a monorepo with two independent apps and no root-level build tool:

| Folder | What it is | Stack |
| --- | --- | --- |
| [`backend/`](backend) | The API | Go, Echo, GORM, PostgreSQL, Redis, MinIO |
| [`frontend/`](frontend) | The web app | React 19, Vite, TypeScript, Tailwind CSS 3, Radix UI |
| [`docs/`](docs) | Project documents, including the product architecture blueprint (PDF) | |

Other files worth knowing: [`frontend/design.md`](frontend/design.md) (the visual design system) and
[`backend/docs/`](backend/docs) (a long guide inherited from the backend template; parts are out of date).

---

## 1. What works today

- **Accounts:** sign up, sign in, verify email, forgot and reset password, change password, edit your
  name. Every verified member gets a unique public member ID (`S55-XXXXX-XXXXX-C`).
- **Sessions:** access tokens that last 4 hours and rotating refresh tokens that last 30 days. The web
  app refreshes silently and sends you to the sign-in page if the session cannot be renewed.
- **Member area:** a Home page with your membership card layout, and My account (profile, password,
  email preferences).
- **Admin console:** dashboard with live counts, charts and recent activity, user management (invite,
  edit, activate or deactivate, delete), roles and permissions, the audit log, and the email delivery log.
- **Roles and permissions:** built-in roles (`super_admin`, `admin`, `user`) plus custom roles you build
  in the admin console. Permissions are read from the database on every request, so a change applies
  immediately.
- **Email:** sent through a background queue with retries, a delivery log, and per-member preferences.
  Locally, emails land in Mailpit. A switch (`SKIP_EMAILS`) turns delivery off for setups with no mail server.
- **Safety:** rate limits on every public auth route (shared through Redis), an audit entry for every
  change, and a startup check that refuses to run with a missing or default secret.
- The public home page is a "coming soon" page with Sign up and Log in buttons.

The rest of the product (organizations, memberships and cards, communities, posts, elections and so on)
is not built yet.

---

## 2. What you need installed

| Tool | Version | Why | Install |
| --- | --- | --- | --- |
| **Git** | any recent | clone the repo; on Windows it also gives you Git Bash | https://git-scm.com |
| **Go** | the version in `backend/go.mod` (1.26 or newer) | build and run the API | https://go.dev/dl |
| **Node.js** | 20.19 or newer, or 22.12 or newer (Vite 7 requires it; 24 is what the project was last run with) | run the web app | https://nodejs.org |
| **pnpm** | 9 or newer | install the web app's packages (we use pnpm, not npm) | see below |
| **Docker Desktop** | any recent | runs Redis, MinIO and Mailpit (and optionally PostgreSQL) | https://www.docker.com/products/docker-desktop |
| **PostgreSQL** | 14 or newer (the optional Docker one is 15) | the database | local install, or Docker (see step 2 below) |
| **make** (optional) | any | short commands such as `make run` | see below |

### Installing pnpm

```bash
npm install -g pnpm        # simplest
# or, with Node's built-in manager:
corepack enable && corepack prepare pnpm@latest --activate
pnpm -v                    # should print a version number
```

### Installing make (optional)

`make` only gives you shortcuts. Everything it does is listed in the table in section 5, so you can skip it.

- **Windows:** `winget install ezwinports.make` or `choco install make` or `scoop install make`. Then use
  **Git Bash** to run it, because the Makefile uses `rm` and `sed`. (`make new-module` needs a POSIX shell.)
- **macOS:** `xcode-select --install` (make is included).
- **Linux:** `sudo apt install make` (or your distribution's equivalent).

Check with `make --version`.

---

## 3. First-time setup, step by step

All commands assume you start in the repository root.

### Step 1. Get the code and the web packages

```bash
git clone <repository-url> state55
cd state55
cd frontend && pnpm install && cd ..
cd backend && go mod download && cd ..      # or: cd backend && make setup
```

### Step 2. Start the supporting services

The API needs **PostgreSQL**, **Redis** and (for file storage) **MinIO**. Mailpit catches emails.

```bash
cd backend
docker compose up -d                        # Redis, MinIO and Mailpit
```

`make db-up` does the same thing. (If your Docker has no `docker compose`, use `docker-compose`.)

Now PostgreSQL, **pick one**:

- **A. Use Docker for it too.** This also creates the database for you:
  ```bash
  docker compose --profile db up -d
  ```
  It starts PostgreSQL on port 5432 with user `postgres`, password `postgres` and database `template_db`,
  which already match `.env.example`.
- **B. Use PostgreSQL installed on your machine.** The API creates the tables itself, but it does **not**
  create the database. Create an empty one first:
  ```bash
  psql -U postgres -c "CREATE DATABASE template_db;"
  ```
  and make sure `DB_USERNAME` and `DB_PASSWORD` in `.env` match your install.

### Step 3. Configure the backend

```bash
cd backend
cp .env.example .env              # PowerShell: Copy-Item .env.example .env
```

Then open `backend/.env` and set at least these (full reference in section 4):

| Setting | What to put |
| --- | --- |
| `JWT_SECRET` | A long random string, for example `openssl rand -hex 32`. Never reuse it elsewhere |
| `BOOTSTRAP_ADMIN_EMAIL` | The email for your first admin account |
| `BOOTSTRAP_ADMIN_PASSWORD` | A password of 8 to 72 characters |
| `MULTI_TENANT_ENABLED` | `false`. The product runs as a single tenant |
| `SKIP_EMAILS` | `true` if you have no mail server and do not want to use Mailpit (see section 6) |

If you are happy with Mailpit (started in step 2), leave `SKIP_EMAILS=false` and the `SMTP_*` defaults.

### Step 4. Start the API

```bash
cd backend
go run .                          # or: make run   (which also runs docker compose up -d)
```

On the first start the API creates all tables, creates the default tenant, creates the permissions and
built-in roles, and creates your first admin from the bootstrap settings. You should see log lines ending
with the server listening on port 8080. Check it:

```bash
curl http://localhost:8080/api/v1/health      # liveness
curl http://localhost:8080/api/v1/ready       # 200 when Postgres, Redis and MinIO are reachable
```

When the admin has been created, **delete `BOOTSTRAP_ADMIN_PASSWORD` from `.env`**. It is only used while no
super admin exists.

### Step 5. Start the web app

```bash
cd frontend
cp .env.example .env              # optional; the defaults work in development
pnpm dev
```

Open http://localhost:5173 (Vite prints the exact address; it moves to the next port if 5173 is taken, and
then you must add that origin to `CORS_ALLOWED_ORIGINS` in the backend `.env`).

### Step 6. Sign in

- Click **Log in** and use the bootstrap admin email and password. You land on the admin dashboard.
- Or click **Sign up** to create a normal member. With `SKIP_EMAILS=true` you are signed in immediately and
  land on the member Home page. With emails on, open Mailpit at http://localhost:8025 and click the
  verification link first.

---

## 4. Configuration reference

All backend settings live in **one file: `backend/.env`** (copy of `.env.example`). The API reads it at
startup, and real environment variables win over the file. The API **refuses to start** if a required
value is missing or is the built-in default secret.

### Backend (`backend/.env`)

| Variable | Required | Default | What it does |
| --- | --- | --- | --- |
| `APP_PORT` | no | `8080` | Port the API listens on |
| `APP_ENV` | no | `development` | `development` or `production`. In production, `SKIP_EMAILS=true` is refused |
| `APP_BASE_URL` | no | `http://localhost:5173` | Public web address. Used to build the links in emails |
| `MULTI_TENANT_ENABLED` | no | `true` | Set `false`. Every request is then scoped to `DEFAULT_TENANT_ID` |
| `DEFAULT_TENANT_ID` | **yes** | none | A UUID. The tenant is created at startup if missing. Keep the example value |
| `BOOTSTRAP_ADMIN_EMAIL` | first run | empty | Email of the first super admin (marked verified) |
| `BOOTSTRAP_ADMIN_PASSWORD` | first run | empty | Its password. Remove it after the first start |
| `DB_HOST`, `DB_PORT` | **yes** | `localhost`, `5432` | PostgreSQL address |
| `DB_NAME` | **yes** | `template_db` | Database name (must already exist) |
| `DB_USERNAME`, `DB_PASSWORD` | **yes** | `postgres`, empty | PostgreSQL login |
| `DB_POOL_MAX_OPEN`, `DB_POOL_MAX_IDLE` | no | `25`, `5` | Connection pool size |
| `REDIS_URL` | **yes** | `redis://localhost:6379/0` | Redis, used for the job queue and rate limits |
| `ASYNQ_CONCURRENCY` | no | `10` | How many background jobs run at once |
| `CORS_ALLOWED_ORIGINS` | no | `http://localhost:3000,http://localhost:5173` | Comma-separated web origins allowed to call the API |
| `JWT_SECRET` | **yes** | none | Signs sign-in tokens. Must not be the template default |
| `ACCESS_TOKEN_TTL_MINUTES` | no | `240` | Access token lifetime in minutes (4 hours) |
| `REFRESH_TOKEN_TTL_HOURS` | no | `720` | Refresh token lifetime (30 days) |
| `TRUSTED_PROXIES` | no | empty | CIDRs of reverse proxies whose `X-Forwarded-For` is trusted. Leave empty locally. Behind a proxy, set it, or every request looks like it comes from the proxy and rate limits break |
| `SMTP_HOST`, `SMTP_PORT` | no | `localhost`, `1025` in the example | Mail server. The example points at Mailpit |
| `SMTP_USERNAME`, `SMTP_PASSWORD` | no | empty | Mail server login, if it needs one |
| `SMTP_FROM_EMAIL` | no | `no-reply@state55.local` | Sender address |
| `SKIP_EMAILS` | no | `false` | `true` sends no email at all (section 6). Refused when `APP_ENV=production` |
| `MINIO_ENDPOINT` | no | `localhost:9000` | File storage. Leave empty to turn storage off |
| `MINIO_USE_SSL` | no | `false` | Use HTTPS to reach MinIO |
| `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` | with MinIO | `minioadmin` | MinIO login (matches the Docker container) |
| `MINIO_PUBLIC_BUCKET` | no | `media-public` | Bucket anyone can read |
| `MINIO_PRIVATE_BUCKET` | no | `private` | Bucket reachable only through short-lived signed links |
| `MINIO_PUBLIC_URL` | no | empty (`http://localhost:9000` in the example) | Browser-reachable address of the public bucket |

Each key must appear **once**. If a key is repeated, the last line wins.

### Frontend (`frontend/.env`, all optional in development)

| Variable | Default | What it does |
| --- | --- | --- |
| `VITE_BACKEND_URL` | `http://localhost:8080` when empty in development | API address, no trailing slash. Set it for any deployed build |
| `VITE_TENANT_ID` | empty | Sent as `X-Tenant-ID`. Leave empty |
| `VITE_FIREBASE_*` | empty | Firebase settings. The current app does not use Firebase, so you can ignore these |

Variables starting with `VITE_` are baked into the web app at build time, so never put a secret in them.

### Ports used locally

| Service | Port | Address |
| --- | --- | --- |
| Web app (Vite) | 5173 | http://localhost:5173 |
| API | 8080 | http://localhost:8080/api/v1 |
| PostgreSQL | 5432 | |
| Redis | 6379 | |
| MinIO storage / console | 9000 / 9001 | http://localhost:9001 (login `minioadmin` / `minioadmin`) |
| Mailpit SMTP / inbox | 1025 / 8025 | http://localhost:8025 |

---

## 5. Everyday commands

### Backend (run from `backend/`)

| `make` command | Same thing without make | What it does |
| --- | --- | --- |
| `make setup` | `go mod download && go mod tidy` | Install Go dependencies |
| `make db-up` | `docker compose up -d` | Start Redis, MinIO, Mailpit |
| `make db-down` | `docker compose down` | Stop them (data is kept in Docker volumes) |
| `make run` | `docker compose up -d && go run .` | Start services, then the API |
| `make build` | `go build -o bin/server .` | Build the binary |
| `make test` | `go test -v ./...` | Run every test |
| `make lint` | `go fmt ./... && go vet ./...` | Format and check the code |
| `make clean` | `rm -rf bin/` | Delete build output |
| `make new-module NAME=foo` | copy `modules/_template` to `modules/foo` | Start a new module |

Run one test: `go test -v ./modules/auth -run TestName`.

### Frontend (run from `frontend/`)

| Command | What it does |
| --- | --- |
| `pnpm install` | Install packages |
| `pnpm dev` | Start the dev server with hot reload |
| `pnpm build` | Type-check, then build for production into `dist/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm lint` | Run ESLint |
| `pnpm verify-deps` | Check that dependencies installed correctly |

There is no frontend test runner yet.

---

## 6. Using the system

### Accounts, roles and permissions

- **`user`** is the default role. Members land on **Home** (`/dashboard`) and can open **My account**.
- **`admin`** holds every permission except managing super admins. **`super_admin`** bypasses permission
  checks and is the only role that can manage other super admins. People holding the permission
  `admin.console.read` land on the admin dashboard (`/admin/dashboard`).
- Create custom roles in the admin console under **Roles**. You cannot give a role a permission you do not
  hold yourself, and you cannot change your own role or delete your own account.
- Permission codes follow one rule: `<thing>[.<part>].<create|read|update|delete>`, for example
  `users.read` or `roles.update`. There are no other verbs. The full list is in
  `backend/models/permissions.go`.
- To bring in a new admin: **Users > Invite**, pick a role. The invitee gets a link to set a password
  (which also verifies their email).

### Email, Mailpit and `SKIP_EMAILS`

Emails (verification, password reset, invitations, notifications) are put in a queue and sent by a
background worker inside the API process, so a slow or broken mail server never blocks a request. Each
email appears in **Admin > Email log** with its status (queued, sent, failed, skipped), and failed ones
are retried automatically.

- **With Mailpit (default):** leave `SMTP_HOST=localhost`, `SMTP_PORT=1025`. Read every email at
  http://localhost:8025.
- **With no mail server:** set `SKIP_EMAILS=true`. Then:
  - New accounts are created already verified, get their member ID, and are signed in right after sign-up.
  - Accounts that registered earlier are verified the next time they sign in.
  - Other emails (password reset, invitations) are not sent. Their text, including the link, is printed in
    the API log, and they show as **Skipped** in the email log. Copy the link from the log.
  - The API will not start with `SKIP_EMAILS=true` when `APP_ENV=production`.

### Useful addresses

- Web app: http://localhost:5173
- API health: http://localhost:8080/api/v1/health and `/api/v1/ready`
- Emails: http://localhost:8025
- File storage console: http://localhost:9001

---

## 7. How it is built

### The idea in plain English

The **web app** is a single-page React site. It talks to the **API** over HTTPS and JSON. The API keeps
data in **PostgreSQL**, uses **Redis** to run background jobs (like sending email) and to count requests for
rate limiting, and stores files in **MinIO**. Everything the API does for a signed-in person goes through
the same pipeline: check who they are, check what they are allowed to do, do the work, write an audit entry.

### Backend (`backend/`)

- **One Go program** (`main.go`) wires everything by hand: load config, connect to the database and
  create tables, seed the default tenant, permissions and roles, create the bootstrap admin, connect Redis
  and optional MinIO and SMTP, start the background job worker and the outbox dispatcher, build each
  module, and register routes. The routes are in `routes/routes.go`.
- **Modules** live in `modules/<name>/`: `handler.go` (HTTP), `service.go` (business rules), `models.go`
  (request and response shapes) and `public.go` (what other modules may call). The database entities
  themselves are in `models/`. Today's modules: `auth`, `users`, `rbac`, `audit`, `notifications`
  (and `controlhub`, a platform-admin area inherited from the template). A new module starts from
  `make new-module NAME=...`.
- **Infrastructure** is in `infra/`: `mail` (SMTP and the email templates), `queue` (Asynq worker),
  `outbox` (see below), `ratelimit`, `cache` (Redis) and `storage` (MinIO).
- **Requests** go through middleware in this order for protected routes: JWT check, tenant scoping, audit
  logging, then an optional permission check (`RBACMiddleware(..., "users.read")`). Public routes (sign in,
  sign up, reset) get per-IP and per-account rate limits instead.
- **Tokens:** every JWT has a type. Only `access` tokens are accepted on API calls; `refresh` tokens only
  renew a session. Permissions are looked up in the database on each request rather than trusted from the token.
- **The outbox:** when something needs a background job (for example an email), the job is written to the
  database in the **same transaction** as the change that caused it, then picked up and run by the worker.
  If the change rolls back, no email is sent. Jobs run at least once, so they are written to be safe to repeat.
- **Single tenant:** with `MULTI_TENANT_ENABLED=false` every request is scoped to the one default tenant.
  The `tenant_id` column stays on tables, and handlers read the scoped database from the request, so the
  code is the same in both modes.
- **Responses** always use `{ "status": 0|1, "message": "...", "data": ... }`. Errors carry a stable
  `data.code` (for example `email_not_verified`) that the web app switches on. Lists return
  `{ items, total, page, limit }` and accept `?page=&limit=` (maximum 100).
- **Database:** tables are created and updated by GORM `AutoMigrate` at every start. This is deliberate for
  now. The SQL files in `backend/db/migrations/` are not executed.
- **Audit:** every `POST`, `PUT`, `PATCH` and `DELETE` is logged with its result status (never the request
  body). Sign-ins, verification, password and role changes are recorded with details.

### Frontend (`frontend/src/`)

- **Routing** is in `App.tsx`. There are two kinds of page: **public** pages (home, sign in, sign up,
  forgot and reset password, verify email) and the **signed-in app**, which is one shell
  (`layouts/AppLayout.tsx`: sidebar, top bar, page area) used by members and admins. Signed-in people are
  redirected away from the public pages straight to their dashboard.
- **Folders:** `(public)/`, `(member)/` and `(admin)/` hold the pages by audience. `components/ui/` holds
  the base controls (button, input, table and so on), `components/shared/` holds the reusable page parts
  (page header, section card, KPI tile, status badge, empty state, charts), `components/brand/` holds the
  logo and pattern graphics, and `lib/` holds the API layer and sign-in state.
- **Signing in:** `lib/context/auth.tsx` keeps the user and their permission list, exposed through
  `useAuth()` (`hasPermission`, `landingPath`, `login`, `logout`). Tokens are stored through
  `lib/auth/tokenStore.ts` only. Hiding a screen in the UI is a convenience; the API enforces access.
- **Talking to the API:** `lib/api/crud.tsx` is the one fetch wrapper. It unwraps the response envelope,
  attaches the token, renews it once on a 401 (one shared request, because refresh tokens rotate), and
  sends you to sign-in if renewal fails. Endpoint paths are listed in `lib/api/end_points.tsx` and typed
  helpers are in `lib/api/auth.tsx` and `lib/api/admin.tsx`.
- **Look and feel:** Tailwind with design tokens (`src/styles/tokens.css`) and the rules in
  [`frontend/design.md`](frontend/design.md): the Motherland palette (Earth, Clay, Ochre), a 14px base size,
  12px control and 16px card corners, one gradient (the primary button), the woven-border brand graphics,
  light and dark colour sets.

---

## 8. Checks before you push

```bash
cd backend && make lint && make test        # format, vet, all tests
cd frontend && pnpm lint && pnpm build      # lint, type-check, production build
```

## 9. Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| API exits with `missing or invalid environment variables: ...` | The named setting is missing. `JWT_SECRET` must not be the template default and `DEFAULT_TENANT_ID` must be a UUID |
| `SKIP_EMAILS=true is not allowed when APP_ENV=production` | By design. Set `SKIP_EMAILS=false` or `APP_ENV=development` |
| `database "template_db" does not exist` | Create it (step 2B) or start the Docker PostgreSQL with `--profile db` |
| `password authentication failed` / connection refused on 5432 | PostgreSQL is not running, or `DB_USERNAME` / `DB_PASSWORD` in `.env` do not match |
| `Failed to connect to Redis` | Run `docker compose up -d` in `backend/` and check `REDIS_URL` |
| No admin account exists | `BOOTSTRAP_ADMIN_EMAIL` and `PASSWORD` were empty on the first start, or the key appears twice in `.env`. Fix and restart; it only runs while there is no super admin |
| Sign-in says the email is not verified | Open the link in Mailpit (http://localhost:8025), or set `SKIP_EMAILS=true` and sign in again |
| Browser console shows a CORS error | The web address is not in `CORS_ALLOWED_ORIGINS` (check the port Vite chose) |
| Everyone is rate limited at once behind a proxy | Set `TRUSTED_PROXIES` to the proxy's network |
| `make: command not found` on Windows | Install make (section 2) or use the commands in the "without make" column |
| `docker-compose: command not found` | Use `docker compose` (with a space) |
| npm prints warnings about unknown config like `shamefully-hoist` | Harmless. The project is set up for pnpm; use `pnpm`, not `npm`, to install |

## 10. Where to read more

- [`frontend/design.md`](frontend/design.md): the design system.
- [`docs/`](docs): the architecture blueprint (PDF).
- [`backend/docs/`](backend/docs): the inherited template guide (some details, such as bucket names, are stale).
