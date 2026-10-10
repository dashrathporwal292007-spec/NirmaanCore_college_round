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

## Phase 2: adaptive rules and worker

Implemented Sections 27–29 against the existing Phase 1 code, without changing Phase 1. The worker source is actually in Section 23; Section 28 references it. No schema file was reapplied: database catalog queries confirmed campaigns.kind, outbox cancellation/dispatch fields, pending_actions and the invoice period unique constraint. Both reference smoke scripts retain their original assertions.

Corrected draft service gaps: repeated active checkout in the same invoice period does not duplicate subscribed events; existing subscribers are excluded from offer drafts and approval previews; repeated too-late checks preserve one decision per message/rule. Approval decisions include rule ID and fingerprint evidence. Usage rejects nonpositive/noninteger units and reports missing subscriptions explicitly. Invalid scenario names fail rather than silently doing nothing. Campaigns with only cancelled messages finish cancelled, rather than claiming delivery.

Adaptive mutation entry points and worker ticks use one transaction-scoped advisory lock for this single-workspace prototype. This serializes customer hooks, draft approval and dispatch, closing their eligibility-check/write races. Callers must use withTx (or withRollback for scenarios); direct SQL writes outside these services do not participate in this lock. The worker still rechecks current consent at dispatch. The lock limits throughput and is not a production multitenant design. Row locks protect individual cancellations, and the worker retains SKIP LOCKED.

The worker starts its timer only when the resolved entrypoint is scripts/worker.ts from the repository working directory. Imported tick has no timer; overlapping timer ticks are skipped. Emails and checkout remain simulated. No UI or HTTP routes were added.

Phase 2 validation: both npm run smoke and npm run smoke:adaptive printed ALL GREEN. npx tsx --env-file=.env.local scripts/check-adaptive.ts independently printed the cancelled reminder rule and exactly one automation_decision, and checked checkout event idempotency, metered overage, subscriber draft exclusion and repeated late cancellation in a rolled-back transaction. Importing the worker terminated normally without a timer. npm run typecheck and npm run build passed. npm run lint had no errors; reference-script explicit-any warnings remain. Actual email delivery/payment/Gemini and sustained timer operation were not tested. Smoke tests reset demo data; the supplementary verifier rolls its writes back.

## Phase 3: backend API contract and HTTP integration

Wrote and committed docs/API.md before implementation. All endpoint contracts are JSON, including GET /s/[slug]; public-page HTML and all UI are deferred. Canonical approval is POST /api/agent/approve, with the blueprint's run decision path also available. Checkout is POST /api/billing/checkout. Added the pending draft approval endpoint to make the existing Phase 2 service usable. Optional structured plan input supports frontend tool composition and deterministic testing through the same role validation, dry-run, approval and commit pipeline; it grants no direct tool execution.

The four requested page/follow-up/offer tools already existed in Phase 1 and were registered. Kept their implementations and verified them via real HTTP. Added the simulated activate_subscription tool using the Phase 2 checkout service; no real provider call. It remains irreversible/HIGH, requires another owner and CONFIRM, and reports simulated invoice amounts. Checkout and tick now return their actual outcomes. Offer effects fingerprint the exact changed contacts. The existing plan hash omitted money/public visibility; now includes both, so a changed price cannot execute against an old financial preview. No reference smoke assertions changed.

Retained blueprint demo auth: uid cookie, user and role loaded from users. Seed user UUIDs have zero version/variant bits, so auth uses Zod GUID validation rather than strict RFC-version UUID validation; resource IDs still use UUID validation. This is not production authentication. Mutation routes reject a mismatched Origin. Inputs are schema-validated, private responses have a shared error envelope and no-store headers, and unexpected database errors return a generic message. Next internal request-time/prerender exceptions are rethrown using the installed guide's unstable_rethrow before handling application errors.

Agent dry-run/commit/rewind now take the same advisory lock as adaptive services. Commit takes it before business-table locks, avoiding a lock-order inversion when activation calls a customer hook. Public registration takes it before contact upsert and locks the published page/scheduled webinar before registering. The endpoint preserves existing name/consent and never forwards form text to the planner. User actions (close, checkout, cancel-pending, tick, public registration) are audited; cancellations include rule, reason and evidence. Cancel-pending handles only the run's own schedule_campaign outbox IDs and preserves history and already-sent messages.

Read endpoints include exact stored rule IDs/reasons, steps/approvals/audit/rewind notes and computed analytics. Multi-query analytics/run-detail/public-page reads use repeatable-read snapshots. Savings count only completed runs and are explicitly estimates; billing and delivery are explicitly simulated. Pagination is capped at 200 rows.

Phase 3 verification: npm run smoke and npm run smoke:adaptive retained ALL GREEN. npm run build and npm run typecheck passed. npm run smoke:routes started a real loopback production Next server against the configured PostgreSQL database and printed ALL GREEN; it covered auth/error shapes, dry-run isolation, refusal, approval/duplicate approval/decision alias, rewind, public registration and deduplication, exactly one reminder decision with rule/reason/evidence on the HTTP timeline, close/draft approval/stale fingerprint, tick/outbox/run filters, simulated checkout idempotency, all requested tools, HIGH self-approval/typed confirmation, price-change reapproval, irreversible rewind notes, cancel-pending idempotency, CRM/runs/analytics. npm run check:core also passed, including concurrent approval. Lint passed with 0 errors and the same 35 existing warnings as Phase 2; no new lint warnings.

The route smoke test seeds/reset synthetic demo data and adds a second synthetic owner to exercise the separate-owner gate. It stops its own HTTP process. No schema migrations, UI, real delivery/payment, live Gemini or production auth were implemented/tested. Long-running worker operation and load testing remain unverified.

## Hardening: planner and demo reliability

Planner output is now validated for JSON/envelope, allowlisted tools, backward references and concrete tool arguments before propose can write a run. Unresolved prior-step references are validated structurally and remain runtime-validated by the runner. Clarifications must contain no executable steps. Planner failure never calls propose; failure tests compare hashes/counts of all 18 business/audit tables and HTTP error tests confirm no run/audit writes. Runtime execution/authorization failures remain separately recorded runner outcomes.

Gemini has a total deadline (default 12 seconds, environment override clamped 100–20000 ms) covering context and the single repair retry. Transport receives AbortSignal, remaining timeout and SDK retry attempts=1, verified against the installed @google/genai types. Only malformed JSON/invalid plans are repaired once; transport/timeouts fail or return canned results. Errors expose stable safe categories rather than raw provider text. createPlanner accepts injected transport/config only in server code for failure tests; API input cannot inject them.

Five normalized canned prompts cover launch, vip tagging, draft business page, missing webinar date and ambiguous email audience. Explicit DEMO_MODE never calls Gemini or loads planner context. Missing key/provider failure also uses those exact canned responses; unrelated prompts return a clear error. API retains source for compatibility and adds plannerMode (gemini/demo/fallback/supplied) and fallbackReason. docs/API.md lists every supported prompt and response field.

The first live attempt used configured gemini-2.5-flash and all five prompts degraded to fallback. A sanitized diagnostic returned HTTP 404 model_not_found. Listed accessible model metadata using the real key, then reran with the listed gemini-flash-latest alias: five actual Gemini responses, three valid plans and two appropriate clarification questions, full database snapshots unchanged. Saved the verified model to ignored .env.local, .env.example and default configuration; never printed/staged the key. Per-prompt outcomes are in docs/GEMINI_REPORT.md.

Added demo:reset with post-reset assertions and rehearse with a shared real HTTP harness. Publication uses its own approved plan because the original seven-step cached launch deliberately creates a draft page. Synthetic attendance and due-time advancement are explicit rehearsal fixtures, not new production routes. After sending, rewind must report cannot-recall notes and preserve registrations/activated billing; independent vip rewind must remove exactly the newly added tags. Existing smoke assertions remain unchanged except added planner-mode/no-write assertions and moving HTTP lifecycle functions to the shared helper.

Reviewed all 35 prior lint warnings: no unused variables/dead functions remained in evaluator, worker or tools. The planner replacement naturally removes its prior catch-any warning; the other 34 typing/scaffold warnings are retained as requested. No unrelated lint cleanup or UI added.

Hardening verification: live Gemini 5/5 on gemini-flash-latest (main launch 7 steps, vip 2, business page 1, missing-date clarification, ambiguous-email clarification). Planner snapshots unchanged after every live and deterministic failure test. demo:reset verified twice consecutively and again after all tests, leaving 50 contacts/40 trial/3 unsubscribed and no runs/outbox. rehearse passed three consecutive real-HTTP runs from fresh seeds. All three smoke commands printed ALL GREEN; check:planner, check:core, typecheck and production build passed. Lint: 0 errors, 34 retained warnings; no unused/dead evaluator/worker/tool code found. No UI, real delivery/payment, production auth, load testing or long-running worker soak was verified. All Git commits are local; no push.

## Additive distinct recipient metric

Tool output carries internal resolved recipient IDs; executePlan deduplicates them, and only the count is exposed as diff.totals.distinctRecipients. No selection, effects, hash, risk or mutation changes. Existing rehearsal used exact-object equality for totals; it now asserts the original three-field projection unchanged and checks the new field separately. No previous expected value changed. Core and HTTP smoke tests also assert 37 distinct contacts and 74 messages.

## Routed frontend

Authorized read-only webinar list/detail endpoints and the thin opt-out wrapper were committed separately before frontend work. Attendance is omitted; unchanged services and existing adaptive smoke remain authoritative. No seed/reset changes or new backend business logic were introduced.

The main demo creates a draft page, so the webinar screen offers a supplied publish_page plan followed by the existing approval screen. Public HTML is /register/[slug]; existing /s/[slug] handlers remain JSON. Rewind remains one confirmed whole-run action with server notes; there is no step slider. Run numbers are creation-order labels, not new database identifiers.

The browser verifier scopes repeated messages to visible routes because Next retains hidden route content. The distinct count assertion targets the impact figure rather than other legitimate 37-count receipt lines. These are corrections to new UI selectors; existing backend smoke assertions were not changed. Native background visibility is unavailable in this Chromium automation, so polling pause is explicitly unverified rather than tested using fabricated visibility. Details and visual review are in docs/UI_REPORT.md.

### Animated menu rehearsal timing

The user requested the reference's reverse menu-close animation. Escape now retains the modal through its 600ms close before restoring focus. The existing browser rehearsal asserted focus immediately after the keypress. Add a wait for the menu to become hidden, retaining the exact focus assertion. Backend smoke assertions and behavior are unchanged.
