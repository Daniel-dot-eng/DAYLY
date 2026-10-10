# DAYLY

Requires Node 22 and PostgreSQL 16. All development is isolated from production.

Install with `npm ci`. The PM creates local configuration from `.env.example` (never commit it).

- Database: `docker compose --env-file .env -p dayly -f infra/compose.yml up -d postgres`
- API: `npm run dev:api`
- Web: `npm run dev:web` (Vite proxies `/api` to port 3000).
- Checks: `npm run typecheck`, `npm test`, `npm run build`.

Full-stack Compose: `docker compose --env-file .env -p dayly -f infra/compose.yml up --build`.
Only Caddy publishes host ports. Use configurable host ports if another local proxy occupies 80/443.

The deploy workflow runs only after the PM merges to main. Do not run against the VM from a development session.
