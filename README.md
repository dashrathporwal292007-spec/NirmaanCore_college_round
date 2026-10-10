# NirmaanCore_college_round
Bit n Build 2026

# Nexus — Phase 0–1 backend checkpoint

Next.js App Router, TypeScript, Tailwind, node-postgres, Zod, Gemini adapter and Recharts. No src directory; @/* resolves from the repository root.

## Scope

This checkpoint implements typed tools, transactional dry-run/commit, risk calculation, approval, stale-preview protection, audit/contact events and compensation. UI, API routes, authentication and adaptive services are later phases. Read docs/BLUEPRINT.md and docs/DECISIONS.md before extending it.

## Setup

Requires Node 20.9+ and Docker. The verified environment used Node 24 and Postgres 16.

```sh
npm ci
cp .env.example .env.local
docker run -d --name nexus-db -e POSTGRES_PASSWORD=nexus -e POSTGRES_DB=nexus -p 127.0.0.1:5432:5432 postgres:16
docker exec -i nexus-db psql -v ON_ERROR_STOP=1 -U postgres -d nexus < docs/schema.sql
docker exec -i nexus-db psql -v ON_ERROR_STOP=1 -U postgres -d nexus < docs/schema_adaptive.sql
npm run seed
npm run smoke
```

Migrations apply once to a new database. If the container already exists, use `docker start nexus-db`; do not reapply these migrations blindly. If Docker is unavailable, provide DATABASE_URL explicitly rather than choosing another database automatically.

**Seed and smoke reset all application data in the configured database. Use only a disposable prototype database.** Expected seed: 50 contacts, 40 trial, 3 unsubscribed; 3 users, 3 plans, one published seed page. All contact emails use example.com.

## Checks

```sh
npm run typecheck
npm run lint
npm run build
npm run check:core
npm run smoke
```

Database tests run sequentially. The core check resets data; smoke resets it again. Smoke leaves committed/rewound/failed run history; `npm run seed` resets the demo when needed.

DEMO_MODE=1 needs no API key. `makePlan(DEMO_SENTENCE)` returns the cached plan; other instructions explicitly fail without an LLM call. Set DEMO_MODE=0 and GEMINI_API_KEY only when testing live planning. No email delivery or real payments occur.

`npm run dev` starts the scaffold at localhost:3000. Webpack is selected because Turbopack's helper process cannot bind its port in this execution environment. App UI is scaffold-only.
