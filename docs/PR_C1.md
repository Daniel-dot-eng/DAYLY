# Pull request title

MVP-0 checkpoint C1

# Pull request description

## Outcome

Batch A implemented locally on `mvp0`; no push, PR creation, VM connection or production changes performed. PM pushes with GitHub Desktop and opens this PR into `main`. Stop here pending review; Batch B has not started.

## Delivered

- npm workspace scaffold: Node 22/Fastify API, shared Zod health contract, Vite/React/Tailwind web, bundled Manrope/Hanken Grotesk fonts.
- Isolated `dayly` Compose project, PostgreSQL 16, Caddy-only host ports, memory limits, multi-stage API/web images, health endpoint, security headers and pinned-host-key deployment workflow.
- Committed SQL migrations, non-owner/non-superuser/non-BYPASSRLS runtime role, forced RLS on nine business tables, composite tenant foreign keys, `withTenant` transactions and scoped fault query helper.
- Admin company signup/login/logout, hashed server sessions, Argon2id, company-scoped technician usernames, atomic capped/expiring invite joins and invite revocation.
- Admin hierarchy tree with inline add/rename; setup editors for units, text/dropdown details and ordered checklist items. History-preserving disable behavior.
- Local-only demo seed: 1 department, 1 section, 1 type, 3 units, 2 fields and 6 checklist items.
- Route-registry-driven tenant leak test, no-context RLS checks, cross-tenant CRUD/create/reorder attacks, unchanged tenant-A snapshots, and CI leak gate.

## Verification

- `npm run typecheck`: PASS, including API/web/shared/scripts/browser test types.
- `npm test`: PASS, 5 integration/contract tests against isolated native PostgreSQL 16.
- `npm run test:leak`: PASS, 35 data routes, 9 business tables; 6 identity/health routes explicitly excluded with reasons and separately exercised.
- `npm run test:leak:negative`: PASS; deliberate local departments-RLS disable causes failure, restoration causes clean pass.
- `npm run test:browser`: PASS; real local browser → API → PostgreSQL → UI flow for signup, complete setup and technician joining at a phone viewport. No external browser requests.
- `npm run build`: PASS.
- Compose configuration, YAML parsing and deploy/init/local database shell syntax: PASS.
- Demo seed: PASS; refuses production execution.
- Runtime dependency audit: 0 findings. Full audit: 7 Tailwind 3 build-tool parser findings (5 high, 2 moderate), recorded for Batch B hardening.

## Limits / deviations

- Docker daemon is unavailable locally. Full Compose/Caddy health acceptance and linux/arm64 image builds are **not verified**; M1-01 stays Review until those checks run on a Docker-enabled machine. No deployment workflow was executed.
- Better Auth contract spike found email-bound signup/organization invitations incompatible with the required no-email reusable-code join without customization. Used the approved fallback; rationale in ADR-001-auth.md.
- Disable is used for all setup deletions, a conservative history-preserving default.
- No inspection submission/review flow or backups built yet; these belong to Batch B.
- PM local-only override supersedes stale push wording in unmodified reference docs; first commit changes only the approved AGENTS/START_HERE sections.

## PM handoff

1. Open this repository in GitHub Desktop, select `mvp0`, push that branch, and open a PR into `main` with this title/description.
2. Review C1 and verify full Compose plus arm64 images before deployment. GitHub Actions deployment requires PM-owned VM/DNS/environment setup described in OPS_DEPLOY_SETUP.md.
3. Reply “Continue with Batch B” after review. No builder push access is needed.

## Local commits (oldest first)

- `cd4b83c` — K0: adopt local-only checkpoint handoff
- `4b75cdc` — K0: record Batch A plan and assumptions
- `6a9e5e8` — M1-01: scaffold workspace and isolated deploy pipeline
- `4810b1e` — M1-02: add forced tenant RLS and scoped transactions
- `86b4ccd` — M1-03: implement company auth and capped technician invites
- `a5d9f58` — M1-04: add tenant-scoped admin setup and demo seed
- Final M1-05 commit: `M1-05: verify tenant isolation and prepare C1 handoff` (hash supplied in the checkpoint report).
