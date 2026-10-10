# DAYLY build state

Codex keeps this file current after every task. The PM and the orchestrator read it to see progress.

**Current batch:** A
**Current checkpoint:** none
**Last updated:** 2026-10-10
**Branch:** mvp0

## Task table

| ID | Task | Status | Date | Notes and deviations |
|---|---|---|---|---|
| K0 | Read docs, check access, write plan | Done | 2026-10-10 | Read all reference documents; local-only policy committed first. |
| M1-01 | Skeleton, Compose, health endpoint, deploy pipeline | Review | 2026-10-10 | Scaffold, health contract/test, bundled fonts, isolated Compose and deploy CI created. Native Node 22 installed; Docker daemon unavailable, so live Caddy/Compose acceptance remains unverified. |
| M1-02 | Schema, migrations, RLS, withTenant | Done | 2026-10-10 | Applied committed migration on empty PostgreSQL 16; forced RLS, cross-tenant composite FKs, runtime role/no-context isolation tests pass. |
| M1-03 | Auth, sign-up, invites, technician join | Todo | | |
| M1-04 | Admin setup API and screens, demo seed | Todo | | |
| M1-05 | Tenant leak script | Todo | | |
| M2-01 | Technician flow | Todo | | |
| M2-02 | Submit inspection endpoint | Todo | | |
| M2-03 | Admin submissions and faults | Todo | | |
| M2-04 | Backups and restore | Todo | | |
| M2-05 | Hardening pass | Todo | | |

Status values: Todo, Doing, Review, Done, Blocked, Cut.

## Build plan

1. M1-01: npm workspace scaffold, local health page, isolated Compose and CI/deploy scripts.
2. M1-02: PostgreSQL 16 migrations, separate runtime/owner roles, forced tenant RLS and transaction helper.
3. M1-03: timeboxed Better Auth spike, admin company/session flow and atomic technician invites.
4. M1-04: scoped setup CRUD and matching admin screens; local-only demo seed.
5. M1-05: endpoint coverage and real-database leak checks, including a deliberate policy-break negative control.
6. Verify typecheck, tests, leak checks and build; write PR_C1.md and stop at C1. Commit every task locally; never push.

Assumptions: design frontmatter tokens are canonical where prose differs; production secrets and VM execution remain PM-owned. Docker daemon is unavailable locally; use native PostgreSQL 16 for database tests and explicitly report untested Compose execution.

## Decisions made during the build

(Date, decision, reason. Link ADR files where they exist.)

## Known issues

(None yet.)

## Needs from the PM

(Codex lists anything blocked on the PM here: access, secrets, DNS, settings.)
