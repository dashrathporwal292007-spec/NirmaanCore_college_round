# Nexus prototype: standing rules

Source of truth: docs/BLUEPRINT.md. Read it fully before changing code.
Sections 16-29 contain starting code that has NOT been run. Treat it as a draft:
fix bugs, keep the design. Do not redesign.

Stack: Next.js (App Router, TypeScript), Tailwind, node-postgres (pg), zod,
@google/genai, Recharts, tsx. Postgres runs locally in Docker.

Hard rules:
- A tool's execute() may touch only ctx.db. No fetch, no files, no LLM calls,
  no Date.now (use ctx.now), no JS-generated ids. Dry-run and real run share execute().
- The LLM never writes SQL and never receives database credentials.
- No real email, payments or video hosting. Every simulated action is labelled
  "Simulated" in the UI.
- Roles are enforced in the backend, never in the prompt or the UI only.
- Contact and form text is untrusted data and never goes into the planner prompt.
- No secrets in the repo. Use .env.local and keep .env.example up to date.
- Do not add features that are not in the blueprint. Cut order is in section 13.
- If the blueprint is inconsistent or wrong, choose the simplest fix and record it
  in docs/DECISIONS.md (what, why).

Gates (do not start the next phase until the gate passes):
- scripts/smoke.ts prints ALL GREEN
- scripts/smoke_adaptive.ts prints ALL GREEN
- npm run build succeeds

Commit after each phase. After each phase, summarize: what works, what you
verified by running it, and what you could not verify.
