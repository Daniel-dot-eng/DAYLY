# DAYLY project brief

## Product in one paragraph

DAYLY lets any company that operates equipment (ports, plants, fleets, workshops) run structured daily equipment inspections. An admin sets up the company once. Technicians then inspect equipment on their phones in a guided flow. Admins see every submission and every fault. The product must feel fast, work on poor connections (offline arrives after MVP-0) and keep every company's data strictly separate. The goal is an international product, so nothing in the code may assume a particular company, country or equipment list.

## Users and roles

| Role | Who | Can do |
|---|---|---|
| Admin (owner) | Person who signs up and creates the company | Everything: setup, invites, view all submissions and faults |
| Technician | Person who joins with an invite code | Run inspections, see their own past submissions (optional in MVP-0) |

MVP-0 has only these two roles.

## Vocabulary

- **Company (tenant):** one customer organization. Everything belongs to exactly one company.
- **Department:** top level grouping (for example Operations, Workshop).
- **Section:** a part of a department (for example Container Yard).
- **Equipment type:** a kind of machine inside a section (for example Terminal Tractor). It owns a details form and a checklist.
- **Equipment (unit):** one physical machine of an equipment type, with a code (for example TT-014).
- **Details form:** extra fields a technician fills for an equipment type (text or dropdown). Date, start time and completion time are fixed fields handled by the app.
- **Checklist:** ordered items per equipment type. Each answered OK, NOT OK or N/A, with a comment (required when NOT OK).
- **Inspection:** one submitted run of a checklist against one equipment unit.
- **Fault:** a checklist item answered NOT OK.
- **Invite code:** short code an admin generates so technicians can join the company.

## Flows

### Admin setup (once per company, edited later)

1. Sign up as admin ("I'm setting up my company"): company name, name, email, password.
2. Create departments, sections, equipment types, equipment units.
3. For each equipment type: define the details form fields and the checklist items.
4. Generate invite codes for technicians.

### Technician inspection (every submission)

1. Join once with an invite code ("I'm joining my team"): name, username, password. Later sign in with username and password.
2. Pick department, section, equipment type, then the equipment unit (searchable).
3. Fill the details form. Date is automatic and read-only. Start time is entered (defaults to now, editable). Completion time is set automatically when the technician reaches the preview.
4. Answer every checklist item: OK, NOT OK or N/A, with a comment (required for NOT OK).
5. Preview everything, then submit. The client supplies the inspection UUID so a repeated submit never duplicates.

### Admin review

1. Submissions list with filters (date, equipment type, has faults) and a detail view.
2. Fault list: every NOT OK item with equipment, type, technician, date and comment.

## Data model (summary; exact columns are in task M1-02)

Identity (managed by the auth library): users, sessions, accounts, organizations (companies), members, invitations. Business tables, all with tenant_id and RLS: departments, sections, equipment_types, equipment, detail_fields, checklist_items, invites, inspections, inspection_items.

## Design

The design system is "Precision Industrial Modern" (docs/DESIGN.md): warm off-white background, cobalt blue primary, Manrope for headlines, Hanken Grotesk for body, soft rounded cards, recessed tab bars, status badges. Only the sign-up screen exists as a finished design (docs/design/). All other screens are built from the design system rules. The sign-up screen contains placeholder trust claims ("OSHA & ISO READY", "256-bit vault", version and build number): do not ship them.

## Decisions already made (do not reopen)

| Topic | Decision |
|---|---|
| Hosting | Everything on one Oracle VM (Docker Compose), no Supabase, no Vercel |
| Backend | Plain PostgreSQL 16 plus one Fastify API |
| Rebuild vs port | Rebuild; reuse domain knowledge and UX only |
| Tenancy | Shared schema, tenant_id on every table, RLS, tenant transaction per request |
| Auth | Better Auth (1-hour timebox), fallback argon2id plus server sessions |
| Technician sign-in | Invite code, then username and password (technicians may have no email) |
| MVP scope | The cut line in AGENTS.md |
| Later (not MVP-0) | Offline PWA, photos on the VM disk, email digests through Resend, billing, analytics, exports, WhatsApp alerts through a notification interface |

## Open items owned by the PM (not your problem, do not guess)

Domain name and DNS, billing route, legal entity and IP ownership, production region, standby server. If you need one of these, write it in docs/QUESTIONS.md.

## Quality bar

International SaaS means: no data leaks between companies, no data loss on submit, no secrets in code, accessible touch targets, fast first load, clear errors, and code another engineer can read in a day. Prefer boring and correct over clever.
