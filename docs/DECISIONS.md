# Phase 0–1 implementation decisions

## Workspace and scope

The supplied chat workspace was not a Git repository and contained no AGENTS.md in the workspace or its applicable parent directories. Initialized this directory as the project repository and copied the complete attached document to docs/BLUEPRINT.md before authoring code. The Next.js scaffold subsequently generated AGENTS.md; retained it and reviewed its installed Next.js installation/CSS guidance, including the Webpack option and Tailwind PostCSS setup. No GitHub remote is configured or pushed.

Implemented setup and backend core only. Both schema migrations are applied, but adaptive services, worker, API routes, authentication, public registration, billing checkout and business UI are intentionally deferred. The starter Next.js route is not a completed Nexus frontend. Gemini requires a later live-key test. DEMO_MODE=1 never calls Gemini, including for an unmatched instruction.

## Reference test

scripts/smoke.ts is extracted verbatim from Section 25. No assertions, expectations, or test logic were changed. scripts/check-core.ts supplements it with cached-planner, stale-preview, concurrent approval, rejection, malformed reference/tool and risk checks. Both tests reset the synthetic dataset, so they must run sequentially, not concurrently.

## Stable preview content

The reference create_webinar generated a new random slug and Jitsi URL on every dry-run. Section 19 fingerprints the resolved campaign body, so unchanged plans would always appear stale. Generate the page slug using the run ID, and reuse that run ID for initial preview, approval re-preview and commit. Database-generated resource UUIDs can still differ across rolled-back previews; the customer-visible URL and campaign content stay stable. No recipient or content normalization hides changes.

## Execution and approval guards

Approval/rejection decisions are conditional, transactional writes. Concurrent commits lock the run and recheck its state. Rewind also locks the run. Commit revalidates the requester's current database role and reruns the preview through a savepoint before applying changes. Stale results return to awaiting_approval and reset approval metadata; a changed risk updates the required role.

For this single-workspace prototype, commit takes coarse business-table write locks before savepoint re-preview and holds them through execution. This closes the gap between final preview and execution but limits concurrency. Replace these with narrowly scoped locks/version checks for a production system. External delivery is not implemented in this phase and is never called by tools.

Compensations preserve archived history and active subscriptions. A partial/blocked compensation marks its step cannot_rewind and returns a note. A run labeled rewound can therefore contain steps that were not fully reversible; callers must present the notes and step states, not claim complete restoration.

## Validation and tooling

Validate the plan envelope, disallow executing clarifications, require own-property tool names and reference outputs, and validate resolved tool arguments with Zod. The planner clears timeout timers and requires an API key outside demo mode. The DB helper refuses to assume a database URL. Seed CLI closes its pool and reports failures.

The seed's original duplicate-email attempt is valid; it was preserved. Verified contract is 50 contacts, 40 trial, 3 unsubscribed.

TypeScript strict checking is enabled. The blueprint's heterogeneous tool payloads and the unchanged reference smoke script contain explicit any types. ESLint reports these as warnings in lib/scripts rather than errors; all other scaffold lint rules remain enabled. This is a documented prototype typing limitation, not a modification to smoke assertions.

## Build environment

Turbopack failed while binding its CSS-loader helper port, even after a sandbox escalation. Switched dev/build scripts to Next's Webpack option and installed Tailwind's PostCSS adapter. A production Webpack build succeeded. Removed remote Google-font loading so the shell build does not need Google font access.

Postgres 16 is container nexus-db. Port 5432 is published to loopback only rather than every network interface. Both SQL schemas match the supplied sections. Credentials are local demo credentials. .env.local is ignored; .env.example has a blank Gemini key and DEMO_MODE=1.

npm audit reports five high-severity findings in the ESLint development dependency chain (braces/micromatch/fast-glob/Next ESLint). Its suggested automatic fix downgrades eslint-config-next across major versions; no forced downgrade was applied. These findings remain and are separate from backend test results.
