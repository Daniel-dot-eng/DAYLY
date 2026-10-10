#!/usr/bin/env bash
set -euo pipefail
# Isolated local fixture. Never targets a remote database and never reads .env.
pgbin="${PG_BIN:-/opt/homebrew/opt/postgresql@16/bin}"
"$pgbin/psql" -h 127.0.0.1 -p 55432 -d postgres -v ON_ERROR_STOP=1 -c "CREATE ROLE dayly_owner LOGIN NOSUPERUSER NOBYPASSRLS;" -c "CREATE ROLE dayly_app LOGIN NOSUPERUSER NOBYPASSRLS;" -c "CREATE DATABASE dayly_test OWNER dayly_owner;"
