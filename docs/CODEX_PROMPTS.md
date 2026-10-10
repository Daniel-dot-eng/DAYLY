# Codex task prompts: MVP-0

This is the task list Codex works through. Codex runs it in batches as described in `docs/START_HERE.md`; the PM does not need to paste these prompts one by one. Each task below states what to build and how to know it is done. Read `AGENTS.md`, `docs/PROJECT_BRIEF.md` and `docs/ENVIRONMENT.md` before starting.

---

## K0: Kickoff (automatic, no code)

Defined in `docs/START_HERE.md`: read all documents, verify push access to branch `mvp0`, write the build plan and assumptions into `docs/STATE.md`, log gaps in `docs/QUESTIONS.md`, then continue into M1-01.

---

## M1-01: Skeleton, Compose, health endpoint, deploy pipeline

```
Task M1-01. Create the monorepo skeleton and a working deploy pipeline.

Build:
- npm workspaces: apps/api (Fastify + TypeScript), apps/web (Vite + React + TypeScript + Tailwind), packages/shared (Zod schemas and shared types), infra, scripts.
- apps/api: GET /api/health returns {"status":"ok","version":"<git sha or package version>","time":"<ISO time>"}. Config read from environment with Zod validation at startup (fail fast).
- apps/web: a placeholder page that calls /api/health and shows the result. Tailwind configured with the tokens from docs/DESIGN.md. Fonts self-hosted through npm packages.
- infra/compose.yml with three services: caddy, api, postgres:16. Compose project name is `dayly` (set `name: dayly`), with its own network. Postgres data, backups and uploaded files use bind mounts under ${DATA_DIR} (default ./data locally, /srv/dayly on the VM). Postgres must not publish a port to the host. The only host ports published are Caddy's, taken from CADDY_HTTP_PORT and CADDY_HTTPS_PORT (defaults 80 and 443), because the VM already runs other containers. Containers use restart: unless-stopped and have memory limits (api 1g, postgres 3g, caddy 256m).
- infra/Caddyfile: serves the built web app as static files, proxies /api/* to the api container, automatic TLS for ${DOMAIN}, security headers (HSTS, X-Content-Type-Options nosniff, frame-ancestors none, Referrer-Policy strict-origin-when-cross-origin).
- Dockerfiles for api and web build (multi-stage). Images must build for linux/arm64.
- .env.example with every variable and a dummy value.
- scripts/deploy.sh (runs ON the VM from /srv/dayly/app): `docker compose -p dayly` build, up -d, run migrations, print the health check result. It must only touch the dayly project: no prune commands, no commands against other containers, networks or volumes.
- .github/workflows/deploy.yml: on push to main, run typecheck and tests, then rsync the repo to the VM over SSH into /srv/dayly/app (excluding .git, node_modules, .env, data) and run scripts/deploy.sh there. Use GitHub Actions secrets VM_HOST, VM_USER, VM_SSH_KEY. Pin the host key through a VM_HOST_KEY secret (known_hosts) instead of disabling host key checking.
- README.md with local dev instructions (one command to start Postgres, one for api, one for web).

Acceptance: locally, docker compose up works and /api/health answers through Caddy. The workflow file is valid. Do not run it; the PM adds the secrets.
```

---

## M1-02: Schema, migrations, RLS

```
Task M1-02. Database schema, roles, RLS and the withTenant helper.

Roles: dayly_owner (runs migrations, owns tables) and dayly_app (used by the API at runtime; not owner, not superuser, no BYPASSRLS). Create them in an initial migration or init script; passwords come from environment.

If Better Auth creates its own tables (users, sessions, accounts, organizations, members, invitations), keep them in the same database but outside the tenant RLS policies. The auth layer is the only code that touches them directly. Business tables below use tenant_id = the organization id.

Business tables (all have id uuid primary key, tenant_id uuid not null, created_at timestamptz default now()):
- departments (name)
- sections (department_id, name)
- equipment_types (section_id, name)
- equipment (equipment_type_id, code, label, active boolean default true) unique (tenant_id, equipment_type_id, code)
- detail_fields (equipment_type_id, key, label, kind text check in ('text','dropdown'), required boolean, options jsonb, position int). Date, start time and completion time are fixed fields handled by the app, not rows here.
- checklist_items (equipment_type_id, text, position int, active boolean default true)
- invites (code unique, role text check in ('technician'), expires_at, max_uses int, uses int default 0, created_by)
- inspections (id is supplied by the client, equipment_id, technician_user_id, started_at, completed_at, details jsonb, has_faults boolean, submitted_at) with unique (tenant_id, id)
- inspection_items (inspection_id, checklist_item_id nullable, item_text, position, result text check in ('ok','not_ok','na'), comment)

Every business table: ENABLE and FORCE ROW LEVEL SECURITY, policy for all commands using tenant_id = current_setting('app.tenant_id', true)::uuid (with check as well). Add indexes on tenant_id and the obvious foreign keys, plus (tenant_id, submitted_at desc) on inspections.

Create a view or query helper for faults (inspection_items with result not_ok joined to inspections, equipment and equipment_types).

Implement withTenant(tenantId, fn) in apps/api: opens a transaction, runs SET LOCAL app.tenant_id, runs fn with the transaction handle, commits. No tenant table query may run outside it.

Acceptance: migrations apply to an empty database; a test inserts rows for two tenants and proves that, as dayly_app, a query inside withTenant(A) cannot see tenant B rows, and that a query without a tenant returns zero rows. Add the test to the suite.
```

---

## M1-03: Auth, sign-up, invites, technician join

```
Task M1-03. Authentication and company creation.

Spike first (max 1 hour): Better Auth with the organization plugin and username support. If it cannot do all of the following cleanly, switch to the fallback in AGENTS.md and write docs/ADR-001-auth.md with the reason.

Endpoints (all under /api, validated with Zod, rate limited):
- POST /api/auth/signup-admin {companyName, name, email, password}: creates the user, the company (organization) and an owner membership. Password minimum 10 characters.
- POST /api/auth/login {login, password}: login is email (admins) or username (technicians); technician usernames are unique within a company, so when logging in by username also accept companyCode, or give each technician a globally unique username automatically (for example username plus a short company suffix). Choose the simplest option that works and record it in docs/ADR-001-auth.md.
- POST /api/auth/logout
- GET /api/me: current user, role, company name.
- POST /api/invites (admin only): creates an invite code (8 characters, no look-alike letters, expires in 7 days, max uses default 25).
- GET /api/invites (admin only): list with uses and expiry. DELETE /api/invites/:id to revoke.
- POST /api/auth/join {code, name, username, password}: validates the code (case-insensitive, not expired, uses below max), creates the technician with membership in the inviting company, increments uses atomically, logs the user in.

Web: sign-up screen that matches docs/design/signup-screen.png (two paths: admin and technician). Remove the "OSHA & ISO READY", "256-bit vault" and version/build text from the design; they are placeholders and must not ship. Login screen. After login: admins go to /admin, technicians go to /t.

Rules: generic error messages for bad login or bad code; never reveal whether an email exists; cookies are httpOnly, Secure in production, SameSite Lax.

Acceptance: demo steps 1 and 3 work. Tests cover: duplicate sign-up, expired code, exhausted code, wrong password, and that an admin of company A cannot list invites of company B.
```

---

## M1-04: Admin setup

```
Task M1-04. Admin setup API and screens.

API (admin role only, all through withTenant): CRUD for departments, sections, equipment types, equipment, detail fields, checklist items. Reordering for detail fields and checklist items (position). Deleting something that already has inspections must soft-disable it (active = false) instead of deleting.

Web (desktop-first, use the DESIGN.md tokens, cards, tables and the recessed tab bar):
- /admin shell with left navigation: Setup, Submissions, Faults, Invites.
- Setup page with tabs: Structure (departments, sections, equipment types as a tree with inline add and rename), Equipment (table per equipment type, add one unit at a time), Details form (per equipment type: list of fields, text or dropdown with options, required toggle), Checklists (per equipment type: ordered items, add, edit, disable).
- Empty states with one clear primary action. No banners or explanatory overlays.

Also add `npm run seed:demo` (scripts/seed-demo.ts): creates a demo company with one admin, one department, one section, one equipment type, 3 units, 2 detail fields and 6 checklist items, for local use and the demo script. It must refuse to run when NODE_ENV=production and print the demo credentials only to the local terminal.

Acceptance: an admin can configure the demo company (1 department, 1 section, 1 equipment type, 3 units, 2 detail fields, 6 checklist items) in under 15 minutes. Tests for the API permission checks and tenant scoping.
```

---

## M1-05: Leak script

```
Task M1-05. Tenant leak script.

Create scripts/leak-test.ts and the npm script test:leak. It starts from a test database, creates two companies (A and B) with an admin and a technician each and some data in every table, then:
- For every API endpoint that lists, reads, updates, deletes or creates data, calls it with company B credentials against company A resource IDs and proves the result is 404 or an empty list, and that no row of A is ever returned or modified.
- Attempts to set tenant_id or company identifiers in request bodies and query strings and proves they are ignored.
- Connects directly as dayly_app and proves that without SET LOCAL app.tenant_id every business table returns zero rows.
- Prints a table of endpoints tested and the result. Exits non-zero on any leak.

Make the endpoint list generated from the route registry where possible, so new routes are tested automatically; fail the script if a route is not covered or explicitly excluded with a reason.

Wire it into CI before deploy. Acceptance: passes on the current code. Deliberately break a policy locally, show that it fails, then restore.
```

---

## M2-01: Technician flow

```
Task M2-01. Technician flow (web, mobile-first, online only).

Screens under /t, one step per screen with a progress indicator matching DESIGN.md step trackers:
1. Department  2. Section  3. Equipment type  4. Equipment (searchable list of active units)  5. Details form  6. Checklist  7. Preview  8. Submit and confirmation.

Details form: date is automatic and read-only; start time is entered by the technician (default to now, editable); the dropdown or text fields come from detail_fields for that equipment type, with required validation; completion time is set automatically when the technician reaches the Preview step. Show the date and times read-only on the preview.

Checklist: each item has three large buttons OK, NOT OK, N/A and an optional comment (required when NOT OK). A running count of unanswered items. All items must be answered before Preview.

State lives in memory only (no local storage, no offline in MVP-0). Warn before leaving mid-flow. Generate the inspection UUIDv7 when the flow starts.

Acceptance: runs end to end on a phone-sized viewport and on a real phone browser against the VM. Touch targets at least 44px.
```

---

## M2-02: Submit endpoint

```
Task M2-02. Submit inspection endpoint.

POST /api/inspections {id (client UUID), equipmentId, startedAt, completedAt, details (object), items: [{checklistItemId, result, comment}]}.
- Technician role. Validate that the equipment and checklist items belong to the caller's company (RLS plus explicit check) and that every active checklist item for that equipment type is answered.
- Idempotent: submitting the same id twice returns the original record and creates no duplicate (use the unique constraint and handle conflict).
- Copy each item text into inspection_items.item_text at submit time. Set has_faults when any item is not_ok. technician_user_id comes from the session.
- Everything in one transaction through withTenant.

Acceptance: a double submit creates exactly one inspection with the right number of items; a submit referencing another company's equipment is rejected with 404. Tests included.
```

---

## M2-03: Admin views

```
Task M2-03. Admin submissions and faults.

API (admin only): GET /api/inspections with filters (date range, equipment type, has_faults) and pagination; GET /api/inspections/:id with items; GET /api/faults (not_ok items with equipment, equipment type, technician, date, comment) with the same date and type filters.

Web: Submissions list (date, equipment, technician, result badge OK or FAULTS, number of faults), detail page showing details form values and every checklist item with its result badge using the DESIGN.md status badges, and a Faults page grouped by equipment type. Use the table and badge styles from DESIGN.md.

Acceptance: demo step 5 works. If time is short, ship the plain list without filters first.
```

---

## M2-04: Backups and restore

```
Task M2-04. Backups.

Write scripts/backup.sh and scripts/restore.sh (run on the VM, as the deploy user).
- backup.sh: pg_dump (custom format) of the application database from the postgres container, compressed, encrypted with age using a public key from the environment (BACKUP_AGE_RECIPIENT), written to ${DATA_DIR}/backups with a timestamped name, 14 days retained, exit non-zero on failure. Add an optional hook that copies the file off the machine when BACKUP_REMOTE is set (rclone or scp), documented in the script header.
- restore.sh <file>: decrypts (identity file path from the environment), restores into a scratch database named dayly_restore_test, runs a row-count check on the main tables and prints it. It must never touch the live database.
- docs/OPS_BACKUPS.md: crontab line for the nightly run, how to generate the age key pair, where the private key must be stored (never on the VM), and the monthly restore drill steps.

Acceptance: restore.sh works against a real backup in the local compose stack. Do not run anything against the production VM.
```

---

## M2-05: Hardening pass

```
Task M2-05. Hardening.

Review and fix: security headers in Caddy; rate limits on login, join and sign-up; cookie flags; CORS closed (same origin only); error handler that never leaks stack traces or SQL; request body size limits; no debug or seed routes; dependency audit (npm audit, list anything unfixed in docs/QUESTIONS.md); all secrets read from environment; logs contain no passwords, tokens or invite codes; production build has no source maps exposed.

Acceptance: a short checklist in docs/SECURITY_CHECKLIST.md with each item marked done or open, and all tests including test:leak still passing.
```
