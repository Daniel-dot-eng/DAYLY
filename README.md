# DAYLY

Requires Node 22 and PostgreSQL 16. All development is isolated from production.

Install with `npm ci`. The PM creates local configuration from `.env.example` (never commit it).

- Database: `docker compose --env-file .env -p dayly -f infra/compose.yml up -d postgres`
- API: `npm run dev:api`
- Web: `npm run dev:web` (Vite proxies `/api` to port 3000).
- Checks: `npm run typecheck`, `npm test`, `npm run build`.
- Tenant safety: `npm run test:leak`; negative control: `npm run test:leak:negative` (local `*_test` database only).
- Browser acceptance: `npx playwright install chromium`, then `npm run test:browser`.

Without Docker, install Node 22 and PostgreSQL 16, initialize an isolated cluster in `data/test-pg`, and start it on localhost port 55432. `bash scripts/local-db.sh` creates fresh local fixture roles/database (run once). Apply migrations with `MIGRATION_DATABASE_URL=postgresql://dayly_owner@127.0.0.1:55432/dayly_test npm run migrate`. Database tests default to the matching local `dayly_app` connection, or use `TEST_DATABASE_URL` in CI. These local trust-auth connections contain no production credentials. Set `DATABASE_URL` to this isolated runtime URL for API development. Never point fixture tests or seeds at production.

Full-stack Compose: `docker compose --env-file .env -p dayly -f infra/compose.yml up --build`.
Only Caddy publishes host ports. Use configurable host ports if another local proxy occupies 80/443.

The deploy workflow runs only after the PM merges to main. Do not run against the VM from a development session.
