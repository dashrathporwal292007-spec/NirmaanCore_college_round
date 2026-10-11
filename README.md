# Nexus

A Bit n Build prototype: the agent proposes a business workflow, a person approves it, and deterministic rules keep pending actions appropriate. Next.js App Router, TypeScript and PostgreSQL 16.

## Run it locally

**Before you build or run:** copy `.env.example` to `.env.local`, set `DATABASE_URL` explicitly, start Postgres, then run `npm run demo:reset` after applying the schemas to a fresh database. This repo has no `db:up` or `setup` script; use the Docker commands below. A build can run without database settings, but database requests require them.

Use Node 24 and a disposable demo database. In a fresh checkout:

```sh
npm ci
cp .env.example .env.local
docker run -d --name nexus-db -e POSTGRES_PASSWORD=nexus -e POSTGRES_DB=nexus -p 127.0.0.1:5432:5432 postgres:16
docker exec -i nexus-db psql -v ON_ERROR_STOP=1 -U postgres -d nexus < docs/schema.sql
docker exec -i nexus-db psql -v ON_ERROR_STOP=1 -U postgres -d nexus < docs/schema_adaptive.sql
npm run demo:reset
npm run build
npm run start
```

Apply schemas once to a new database. For an existing container, use `docker start nexus-db`; do not blindly reapply schemas. Without Docker, explicitly configure DATABASE_URL in the ignored .env.local. Keep DEMO_MODE=1 for the offline demo; no API key is required. Optional live planning uses GEMINI_API_KEY and GEMINI_MODEL (default gemini-flash-latest). Never commit .env.local.

Open http://localhost:3000. Public registration is /register/[slug]. Publish its draft through the normal approval pipeline before registering.

## Scripts

- `npm run dev`: development server.
- `npm run typecheck`, `npm run build`, `npm run lint`: static checks.
- `npm run smoke`, `npm run smoke:adaptive`, `npm run smoke:routes`: core, adaptive and real HTTP/DB checks.
- `npm run rehearse`: backend demo rehearsal.
- `npm run demo:reset`: clean seed, 50 contacts / 40 trial / 3 unsubscribed.
- `npm run worker`: periodic simulated dispatch; the UI can also run one tick.

Run database tests serially: smoke, rehearse and reset replace demo data. For three browser rehearsals, start production, then run `PLAYWRIGHT_BROWSERS_PATH=.cache/playwright node scripts/check-ui.mjs` (install Chromium there with Playwright first).

## Real and simulated

Real: database records, registrations, permissions, dry-run previews, approvals, rule decisions, audit history and reversible compensation. Demo cookie roles are not production login.

Simulated: email delivery, payments/invoices, subscription checkout and webinar hosting. No attendance control, UI reset or unapproved-draft cancellation. Sent messages and active subscriptions cannot be recalled by rewind. Fonts and original menu artwork are bundled locally; offline demo mode needs no external runtime requests.

Contracts: docs/API.md. Design/reference: docs/DESIGN.md and docs/REFERENCE_NOTES.md. Verification: docs/BATCH_A.md and docs/BATCH_B.md.

`npm run demo:showcase` adds fictional judging activity through existing HTTP workflows: a webinar plan, approved invitations, published registration page, up to ten registrations and follow-up drafts awaiting approval. It preserves the existing seed and data, creates no attendance fixtures, and sends no external email. Re-running adds another story.
