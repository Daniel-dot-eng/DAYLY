# Environment

What exists around the code. Treat this as fact unless the PM updates it. Never guess values that are not written here; add a question to docs/QUESTIONS.md instead.

## Repository

- GitHub repository `DAYLY`, private, owned by the PM. This is the only repository you may use.
- `main` is protected by convention: nobody pushes to it directly. You work on branch `mvp0` and open pull requests. A merge to `main` deploys to the VM through GitHub Actions.
- If your access to the repository is read-only, say so immediately (see docs/START_HERE.md, K0).

## Production VM (target of the deploy workflow)

| Item | Value |
|---|---|
| Provider | Oracle Cloud Infrastructure |
| Shape | VM.Standard.A1.Flex, ARM (aarch64), 2 OCPU, 12 GB RAM |
| Disk | About 150 GB |
| OS | Ubuntu (arm64) |
| Docker | Installed, with Docker Compose |
| Other workloads | The VM already runs other Docker containers, including n8n connected to a PostgreSQL database. Those belong to other projects. |

Consequences for your work:

1. DAYLY uses its own Compose project named `dayly`, its own network and its own Postgres container. Never connect to, reuse or modify the existing Postgres or n8n.
2. Never run commands that affect other containers or projects: no `docker system prune`, no `docker compose down` without `-p dayly`, no `docker rm` or `docker stop` by wildcard, no volume pruning. `scripts/deploy.sh` must only operate on the `dayly` project.
3. Ports 80 and 443 may already be in use by another reverse proxy. Make the Caddy host ports configurable (`CADDY_HTTP_PORT`, `CADDY_HTTPS_PORT`, defaults 80 and 443) and never publish any other port to the host. The PM will confirm what is free before the first deploy.
4. Resources are shared. Keep the memory limits from task M1-01 (api 1g, postgres 3g, caddy 256m).
5. Bind mounts live under `/srv/dayly` (`pgdata`, `files`, `backups`, `app`). Locally they live under `./data`.
6. All images must run on arm64.

## Deployment path

GitHub Actions on push to `main`: install, typecheck, test, leak test, then rsync the repository to `/srv/dayly/app` on the VM over SSH and run `scripts/deploy.sh` there. Secrets used by the workflow: `VM_HOST`, `VM_USER`, `VM_SSH_KEY`, `VM_HOST_KEY` (set by the PM). The production `.env` lives on the VM at `/srv/dayly/app/.env`, created by the PM, never in git.

## Accounts and tools around you

Your tool list may include GitHub, Supabase, Vercel, Sites, Plugin Management, Computer Use, Work Pets and Codex App Tools. For DAYLY only GitHub (this repo) and your sandbox are allowed. See "Tool boundaries" in AGENTS.md.

## Services and their status

| Service | Status in MVP-0 |
|---|---|
| Email (Resend) | Not used in MVP-0 |
| Object storage or photos | Not used in MVP-0 |
| WhatsApp | Not used in MVP-0; later through a notification interface and n8n |
| Billing | Not used in MVP-0 |
| Domain and DNS | Provided by the PM before the first deploy; variable `DOMAIN` |

## Your sandbox

Do not assume Docker or network access inside your sandbox. If Docker is missing, install and run PostgreSQL 16 natively for tests. Tests that need the database must run against a real PostgreSQL with the `dayly_app` and `dayly_owner` roles, never a mock.
