# ADR-001: MVP-0 authentication fallback

2026-10-10. Accepted.

The bounded Better Auth spike installed the package and inspected the actual signup and organization invitation contracts. `signUpEmail` requires an email, and the organization invitation path binds an invitation to an email. Our required anonymous-to-authenticated join uses a reusable, expiring, capped code and permits technicians with no email. Adapting those paths would require synthetic email identities and custom invitation transactions rather than a clean plugin configuration. Use the explicitly approved fallback instead: Argon2id, random server session tokens stored only as hashes, PostgreSQL membership, and httpOnly/SameSite cookies.

Technician usernames are company-scoped at input; the stored login is `username@companyCode`. Login accepts `companyCode` with a username. Admin email logins remain global. Company and user identifiers are UUIDs.

`auth_invite_lookup` is an authentication-only hashed-code index, outside business RLS like sessions/members. It resolves an anonymous join to a tenant; the actual invite validity, capacity update and member creation occur atomically in a tenant transaction. No business record is read before that context is set.
