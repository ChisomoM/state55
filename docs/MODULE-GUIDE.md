# Module guide: how every package is built

Plain version: a "module" is one folder of backend code plus a few frontend pages. It owns its own
data, talks to other modules only through a small public interface, and every action it performs is
checked for permission and written to the audit log. This guide is the checklist for doing that the
same way every time.

## 1. Backend recipe

1. **Create the module.** From `backend/`: `make new-module NAME=<name>` (needs a POSIX shell such as
   Git Bash). You get `modules/<name>/` with `handler.go` (HTTP), `service.go` (business rules),
   `models.go` (request and response DTOs) and `public.go` (the interface other modules may use).
2. **Entities.** GORM models go in `backend/models/<name>.go` (current convention).
   - Embed `models.TenantBaseModel` (UUID id, timestamps, `tenant_id`). Public entities use UUIDs.
   - All timestamps UTC. Money is `numeric(18,2)` or integer minor units, never float.
   - Soft delete only where there is a reason (`DeletedAt` is on `BaseModel`; opt out by not using it).
   - **No GORM associations or `Preload` across modules.** Store the other module's id and call its
     `public.go` interface.
   - Add the model to the list in `db/migrations.go` (`AutoMigrate`). Note: the SQL files in
     `db/migrations/` are not executed today (package P2 changes that).
3. **Permissions.** Add new codes to `models.DefaultPermissions` (`models/permissions.go`). They seed on
   the next start and `admin` gets them automatically. **Naming is strict CRUD**: the code is
   `<thing>[.<part>[.<part>]].<create|read|update|delete>`, for example `users.read` or
   `org.zone.create`. No `manage`, `view` or custom verbs. For a finer permission name the thing, not a
   new verb: approving a membership is `membership.approval.create`. A test enforces this.
   If you rename a permission that already shipped, add the old code to
   `models.LegacyPermissionRenames` so existing roles keep working.
   - Global permission: `middleware.RBACMiddleware(logger, "users.read")` on the route.
   - "Admin of this organization or community" (a scoped check): register a checker with
     `authz.RegisterScope("organization", checker)` and guard routes with `middleware.ScopeMiddleware`.
   - Permissions are read from the database on every check. Never trust the JWT for them.
   - Nobody can grant what they do not hold (`authz.CanGrant`).
4. **Routes.** Add `Setup<Name>Routes` in `routes/routes.go` and call it from `main.go` after the
   other `routes.Setup*` calls. Wire the service and handler in `main.go` (manual wiring).
   Prefix is `/api/v1`. Add a per-route rate limit to anything public or abusable
   (`middleware.RateLimit`).
5. **Handlers.** Read the scoped database from `c.Get("db")` and the tenant from `c.Get("tenantID")`.
   Reply only with `pkg/response` (`Success`, `SuccessWithMessage`, `ErrorCode("snake_case_code", "Message")`).
   List endpoints return `pagination.Page` (`?page=&limit=`, max 100). Feeds use cursor pagination
   instead (see M05).
6. **Audit.** Every create, update, delete and state change calls `auditlog.Record(...)` (never log
   request bodies or secrets). Audit rows for sensitive actions are written in the same transaction as
   the action.
7. **Email and background work.** Never send in a request. Inside your transaction call
   `notifications.Send(tx, userID, category, template, data)` for member email, or
   `outbox.Publish(tx, taskType, payload)` for other jobs, then register the handler with
   `queueServer.Handle` in `main.go`. Delivery is at least once, so handlers must be idempotent.
   New email templates go in `infra/mail/templates` (English only) and the subject map in `mail.go`.
8. **Files.** Binary files go to MinIO, never Postgres. Buckets: `media-public` (anonymous read) and
   `private` (presigned URLs only, use prefixes such as `cards/`, `documents/`).
9. **Errors.** Use stable machine codes (`data.code`) the frontend can switch on. Never leak whether an
   email or id exists.
10. **Tests.** Table-driven Go tests for every business rule and every permission check (allowed and
    denied). Run `make test` and `make lint`. There is no SQLite: tests that need a database should be
    written against interfaces or skipped with a clear note.

## 2. Frontend recipe

Follow `frontend/design.md`. The short version: 14px root, 12px control radius, 16px card radius,
sand-filled inputs with a visible border, one clay primary button per view, no gradients except that
button, plain sentence-case copy, no emoji, no exclamation marks, no em dashes.

1. **API.** Add keys to `src/lib/api/end_points.tsx`, typed wrappers in `src/lib/api/<name>.tsx`
   (copy the style of `lib/api/admin.tsx`), types in `src/types/<name>.ts`.
2. **Pages.** Member-facing pages go under `src/(member)/<name>/`, admin pages under
   `src/(admin)/<name>/`. Add the route in `src/App.tsx` inside the existing `AppLayout` route, and a
   nav entry in `NAV_GROUPS` in `src/layouts/AppLayout.tsx` with the right `permission`.
3. **Compose, do not hand-build.** Use `components/shared`: `PageHeader`, `SectionCard`, `KpiTile`,
   `StatusBadge`, `EmptyState`, `SectionBody` (loading, error with retry, empty), `TableLoadingSkeleton`,
   `DataTablePagination`, `PillTabBar`, `ActionIconButton`. Data hook: `useApi(loader, deps)`.
   If you need a new piece of furniture, add it to `components/shared` and document it in design.md 7.12.
4. **States.** Every screen has a loading, an error (with retry) and an empty state. Forms show field
   errors with an icon and words, never colour alone.
5. **Permission checks in the UI only hide screens.** The backend enforces. Use `useAuth().hasPermission`.
6. **Accessibility.** Real labels, `aria-invalid` and `aria-describedby` on fields, visible focus,
   icon-only buttons need a label, 44px touch targets on phones, works at 360px wide.
7. Run `pnpm build` (type-check plus build) and `pnpm lint`. Both must pass.

## 3. Definition of done (copy into the pull request)

- [ ] Module follows the folder shape; entities registered in `AutoMigrate`; no cross-module Preload
- [ ] New permissions added to `DefaultPermissions`; every route is guarded; deny cases tested
- [ ] Every state change writes an audit entry; no secrets or bodies in logs
- [ ] Emails and background work go through `notifications.Send` / `outbox.Publish`
- [ ] Responses use the standard envelope; list endpoints are paginated
- [ ] Backend tests cover each business rule; `make test` and `make lint` pass
- [ ] Frontend screens have loading, error and empty states; built from shared components
- [ ] `pnpm build` and `pnpm lint` pass; checked at 360px and 1280px
- [ ] Copy follows the voice rules (design.md section 12); strings are plain, no banned words
- [ ] The package's own acceptance criteria are all ticked
- [ ] README status table updated; `CLAUDE.md` updated if you changed an architectural rule

## 4. Rules that apply everywhere

- Identity comes only from the verified session (`c.Get("user_id")`), never from the request body.
- Member affiliation and voting data are sensitive personal data. Do not expose them in list endpoints,
  logs, search indexes or error messages.
- Public endpoints return the minimum (see M03 for the model of this).
- A new module must not edit another module's tables. Ask its owner for a function in `public.go`.
- If a rule in a package conflicts with the blueprint PDF, the PDF wins: stop and ask.
