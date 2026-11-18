# P1 Single-tenant cleanup

**Size** S · **Needs first** none · **Read first** [README.md](README.md)

## Why
The blueprint has no tenant concept and we have decided to run as one tenant. The code can already do
this (`MULTI_TENANT_ENABLED=false` scopes every request to `DEFAULT_TENANT_ID`), but the template's
multi-tenant leftovers still confuse new developers and add dead code.

## Scope
1. Make single-tenant the default: `MULTI_TENANT_ENABLED` defaults to `false` in `pkg/config.go` and
   `.env.example`. Add a comment that `tenant_id` columns stay and are always the default tenant.
2. Remove the `X-Tenant-ID` header handling, the `VITE_TENANT_ID` variable in the frontend and its use
   in `lib/api/crud.tsx`, and the matching lines in `frontend/.env.example`.
3. **Ask before removing ControlHub** (platform-admin module: `modules/controlhub`, `company_admins`,
   `/controlhub/*` routes, `ControlHubOnly` middleware, `models/company_admin.go`). If confirmed
   unused, delete it and its tests, and remove it from `main.go`, `routes/routes.go` and the
   `AutoMigrate` list.
4. **Keep `modules/_template`.** `make new-module` copies it. Only remove tenant-specific wording from its
   comments if there is any.
5. Update `CLAUDE.md`: remove the tenancy rows from the divergence table and rewrite the multi-tenancy
   paragraph.

## Rules
- Do **not** drop the `tenant_id` column or `TenantBaseModel`. Every module in this pack embeds it and
  handlers rely on the scoped `c.Get("db")`.
- Existing data must keep working: no destructive migration.

## Acceptance criteria
- [ ] Fresh start with a bare `.env` runs in single-tenant mode with no warnings
- [ ] Sign up, sign in, admin pages all work with no tenant header
- [ ] `go build ./...`, `make test`, `pnpm build` pass; no references to `X-Tenant-ID` remain
- [ ] `CLAUDE.md` matches reality
