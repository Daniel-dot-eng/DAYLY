CREATE TABLE auth_invite_lookup (code_hash text PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES companies(id), invite_id uuid NOT NULL UNIQUE REFERENCES invites(id));
GRANT SELECT,INSERT,DELETE ON auth_invite_lookup TO dayly_app;
