#!/usr/bin/env bash
set -euo pipefail
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  --set=owner_password="$DAYLY_OWNER_PASSWORD" --set=app_password="$DAYLY_APP_PASSWORD" <<'SQL'
CREATE ROLE dayly_owner LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD :'owner_password';
CREATE ROLE dayly_app LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD :'app_password';
ALTER SCHEMA public OWNER TO dayly_owner;
GRANT CONNECT ON DATABASE dayly TO dayly_owner, dayly_app;
GRANT USAGE ON SCHEMA public TO dayly_app;
SQL
