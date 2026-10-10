#!/usr/bin/env bash
set -euo pipefail
cd /srv/dayly/app
docker compose --env-file .env -p dayly -f infra/compose.yml build
docker compose --env-file .env -p dayly -f infra/compose.yml up -d --wait
# Migration command is added in M1-02, before the application is released.
docker compose --env-file .env -p dayly -f infra/compose.yml exec -T api node -e 'fetch("http://localhost:3000/api/health").then(async r=>{if(!r.ok)process.exit(1); console.log(await r.text())}).catch(()=>process.exit(1))'
