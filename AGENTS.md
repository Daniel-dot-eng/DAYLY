# AGENTS.md: DAYLY

You are the builder for DAYLY. This file is your standing orders; everything else you need is in this repo. Do not ask the PM for context that is written here or in the docs listed below.

DAYLY is a multi-tenant SaaS for equipment inspections, intended to compete internationally. Companies configure their own departments, sections, equipment types, equipment and checklists. Technicians run inspections against that setup and admins review results and faults. It is derived from an existing single-tenant product but is a rebuild, not a port. Do not look for or reuse old code, and do not hardcode any company's equipment names anywhere except the local demo seed.

## Read order (every session, in this order)

1. `AGENTS.md` (this file)
2. `docs/START_HERE.md` (how to run the batches and when to stop)
3. `docs/STATE.md` (where the build stands; you keep it current)
4. `docs/PROJECT_BRIEF.md` (product, users, flows, data model, decisions)
5. `docs/ENVIRONMENT.md` (the machines, accounts and tools around you)
6. `docs/CODEX_PROMPTS.md` (the task list with acceptance criteria)
7. `docs/DESIGN.md` and `docs/design/` (design system and the one finished screen)

## Current target: MVP-0

An internal, demo-ready slice. The demo script is the definition of done:

1. An admin signs up and a company is created.
2. The admin adds a department, a section, an equipment type, 3 equipment units, a details form and a 6-item checklist.
3. The admin generates an invite code.
4. A technician opens the site on a phone, joins with the code, runs the full flow and submits with one NOT OK item.
5. The admin sees the submission and the fault.
6. A second company cannot see any of it (the leak script passes).
7. It runs on the production VM at an HTTPS address and a nightly backup file exists.

In scope: admin sign-up and login, company setup, invite codes, technician join, the full technician flow (online only), submissions list and detail, fault list, tenant isolation with a leak script, VM deploy, nightly backup.

Out of scope (do not build, stub or prepare for): offline mode, photos, email, analytics, billing, exports, audit log, roles beyond admin and technician, checklist versioning screens, CSV import, WhatsApp, passcode lock, a separate mobile design. If something seems necessary and is not listed, add it to `docs/QUESTIONS.md` with a default assumption and carry on.

## Tool boundaries

You may use: the GitHub repository `DAYLY` (this repo only) and your own sandbox shell and files.

You must not use, even though they appear in your tool list: the Supabase plugin, the Vercel plugin, the Sites plugin, Computer Use, Codex App Tools automations, or any other account, repository, cloud console or website. DAYLY runs on its own VM with its own Postgres. Do not create projects, databases, deployments, sites or automations anywhere else. If a task seems to need one of these, stop and write it in `docs/QUESTIONS.md`.

Never ask for, read, store, print or commit SSH keys, tokens, passwords or `.env` files. You never connect to the VM. Deployment is done by the GitHub Actions workflow after the PM merges a pull request.

## Stack (fixed, do not debate)

- Monorepo with npm workspaces: `apps/api`, `apps/web`, `packages/shared`, `infra`, `scripts`, `docs`.
- API: Node 22, TypeScript (strict), Fastify, Zod for every input and output schema, Drizzle ORM with committed SQL migrations in `apps/api/migrations`.
- Database: PostgreSQL 16, in its own container for DAYLY. Never reuse another database on the VM.
- Web: React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query. Design tokens come from `docs/DESIGN.md` and live in the Tailwind config. Fonts (Manrope and Hanken Grotesk) come from npm packages and are self-hosted. No Tailwind CDN script, no Google Fonts link, no external requests from the browser.
- Auth: Better Auth with the organization plugin and username support. Timebox: if the spike is not working after 1 hour, switch to the fallback (argon2id password hashing, server-side sessions in Postgres, httpOnly SameSite cookies) and record the decision in `docs/ADR-001-auth.md`.
- Proxy and TLS: Caddy. Deploy: Docker Compose with project name `dayly`.
- The production VM is Oracle Ampere (linux/arm64) and also runs other Docker workloads. Every image must run on arm64. Prefer official multi-arch images.

## Tenancy rules (the most important rules in this repo)

1. Every business table has `tenant_id uuid not null`. The tenant is the company (the organization).
2. The API connects as role `dayly_app`: not the table owner, not a superuser, no BYPASSRLS. Migrations run as a separate owner role.
3. Every table with `tenant_id` has `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`, with policies using `current_setting('app.tenant_id', true)::uuid`.
4. Every request touching business data runs in one transaction that starts with `SET LOCAL app.tenant_id = <tenant>`. Build one helper, `withTenant(tenantId, fn)`, and use it everywhere. No query on a tenant table may run outside it.
5. The tenant comes from the authenticated session and its membership. It is never read from the URL, query string or request body.
6. Never trust an ID from the client. Fetches by ID are scoped by tenant through RLS; return 404 (not 403) for rows of another tenant.
7. `npm run test:leak` creates two companies and proves company B cannot list, read, update or delete anything of company A on every endpoint. It must pass before any task is called done.

## Security rules

- No secrets in the repo. Configuration comes from environment variables; `.env.example` lists every variable with a dummy value.
- Parameterized queries only. Validate all input with Zod. Generic auth errors (no user enumeration).
- Passwords: argon2id or the library default if it is at least as strong. Never log passwords, tokens, invite codes or cookies.
- Rate limit sign-up, login and join. Security headers in Caddy (HSTS, nosniff, frame-ancestors none, strict referrer policy).
- Invite codes: 8 characters from an alphabet without look-alike characters, case-insensitive, 7 days expiry by default, usage count tracked.
- No debug routes. No seed credentials in production; the demo seed refuses to run when `NODE_ENV=production`.

## Data conventions

- Primary keys are UUIDs. `inspections.id` is generated by the client (UUIDv7) so submitting twice is idempotent.
- Timestamps are `timestamptz` in UTC.
- A submitted inspection copies the checklist item text into `inspection_items.item_text`, so later checklist edits never change history.
- Faults are `inspection_items` with result `not_ok`.

## Git workflow

- Commit locally on branch `mvp0`. Never commit to `main` and never push. The PM pushes with GitHub Desktop, opens the pull request at each checkpoint, and merges it; a merge to `main` triggers deployment.
- One commit per task; the message starts with the task ID (for example `M1-03: auth and invites`).
- Prepare the pull request title and description for the PM at each checkpoint (see `docs/START_HERE.md`).
- Lack of push access is expected and is not a blocker. The PM handles all pushes and pull requests with GitHub Desktop.

## Working rules

- Do tasks in the order listed in `docs/CODEX_PROMPTS.md`. After each task update `docs/STATE.md` (status, date, notes, deviations).
- Add dependencies sparingly and list each with a one-line reason in `docs/DEPENDENCIES.md`.
- Write tests where they protect tenancy, auth and submit logic. Do not chase coverage numbers.
- Before calling a task done run `npm run typecheck`, `npm test`, `npm run test:leak` (once it exists) and `npm run build`.
- Your sandbox may not have Docker. If so, run Postgres natively for tests (install PostgreSQL 16 in the environment) and never skip the RLS tests. If you genuinely cannot run something, say so plainly in the report. Never state that tests passed unless you ran them and saw them pass.
- Keep the UI plain and fast. Technician screens are mobile-first (large tap targets, one task per screen). Admin screens are desktop-first and must not break on a tablet. No banners or explanatory overlays.
- Deviations from these documents are allowed only when the documents are wrong or impossible. Record each one in `docs/STATE.md` with the reason.

## Report format (end of every task and every checkpoint)

1. What was done (files and endpoints).
2. What was cut or not done, and why.
3. How to run and verify it.
4. Questions added to `docs/QUESTIONS.md`.
5. Anything that needs the PM (secrets, DNS, settings).
