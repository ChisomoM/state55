# P2 Versioned SQL migrations and the four commands

**Size** M · **Needs first** none (do before the second module reaches production) · **Read first** [README.md](README.md)

## Why
Today the database is built by GORM `AutoMigrate` at startup, and the SQL files in `db/migrations/` are
not run. That is fine for development but unsafe for production: changes are not reviewed, cannot be
rolled back, and every instance migrates itself on boot. The blueprint requires reviewed SQL migrations
and separate commands for serving, background work, migrating and seeding.

## Scope
1. **Migration tool**: adopt `golang-migrate` or `goose` (pick one, record the reason in the pull
   request). Migrations are plain `.sql` files, numbered, embedded in the binary.
2. **Baseline**: generate one baseline migration from the current models, run on an empty database and
   compare with what `AutoMigrate` creates. Include indexes, unique constraints, and the tenant row-level
   security policies that `CLAUDE.md` describes.
3. **Commands** (Cobra or a small `flag` switch in `main.go`):
   - `serve`: HTTP API only.
   - `worker`: Asynq server and the outbox dispatcher only (moved out of the API process).
   - `migrate up|down|status`: uses the migration role (`DB_MIGRATION_*`).
   - `seed`: default tenant, permissions and roles, bootstrap admin (what `main.go` does at start today).
4. `AutoMigrate` stays **only** behind `APP_ENV=development` and a flag, never in production.
5. **Backward compatibility rule** written into `MODULE-GUIDE.md`: a migration must work with the
   previous release's code, so rollback is "redeploy the previous image".
6. Scheduled jobs (if any are added later) take a Postgres advisory lock so two workers never run one.

## Rules
- The app role must not own tables or have `BYPASSRLS`; the migration role does the changes.
- Ballots (M10) will need `REVOKE UPDATE, DELETE`: make sure the tool can express grants.
- Update `docker-compose.yml`, the `Makefile` and `README` so a new developer can still start with `make run`.

## Acceptance criteria
- [ ] `migrate up` on an empty database produces the same schema as the old `AutoMigrate`
- [ ] `serve` and `worker` run as separate processes; email and queued jobs still work
- [ ] `AutoMigrate` is not called in production
- [ ] CI (P3) runs `migrate up` and `down` on a fresh database
