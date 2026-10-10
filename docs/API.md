# Nexus backend API — Phase 3

All successful responses are JSON with HTTP 200. Public pages are JSON, not rendered HTML. No UI is provided in this phase. Database field names use snake_case; agent runner results retain camelCase. IDs below are UUID strings (examples use fixed illustrative UUIDs); timestamps are ISO 8601 strings. Bigserial event/audit IDs are JSON strings. Responses have `Cache-Control: no-store`.

## Authentication and errors

Private endpoints require the demo `uid` cookie containing an existing users.id. Roles are always read from PostgreSQL, never from request JSON. Seed users: owner `00000000-0000-0000-0000-000000000001`, marketer `00000000-0000-0000-0000-000000000002`, viewer `00000000-0000-0000-0000-000000000003`. Owner includes marketer/viewer permissions. This is the blueprint's local demo user switcher, not production authentication: knowing an ID permits impersonation. Send cookies with same-origin requests (`credentials: "same-origin"`). Write endpoints reject an Origin header that differs from the request's origin; nonbrowser tests may omit Origin.

Handled errors use exactly this envelope:

```json
{"error":{"code":"INVALID_INPUT","message":"Invalid input","details":[{"path":"email","message":"Invalid email address"}]}}
```

`details` is optional. Status/code pairs: 400 `INVALID_INPUT` (including malformed JSON/UUID/query), 401 `UNAUTHENTICATED`, 403 `FORBIDDEN`, 404 `NOT_FOUND`, 409 `CONFLICT` (invalid run/webinar state or competing decision), 422 `PLAN_FAILED` (planner/dry-run/commit failed), 500 `INTERNAL_ERROR` (generic message, no SQL/credentials). A refused plan is 403 with `details: {"runId":"..."}`; a failed persisted plan is 422 with the same details. Missing private resources return 404. Framework-generated unsupported methods (405) and unmatched paths are outside this JSON envelope.

Stale previews are **200 results**, not errors. Show the returned preview and ask again. Do not automatically retry approval. Duplicate approval of a completed run returns 200 with `duplicate: true`; rejected/failed/rewound runs cannot be approved.

## Agent and runs

### POST /api/agent/plan — authenticated viewer+, tool permissions enforced

Request:
```json
{"instruction":"Run a webinar this Friday called AI Content for Local Brands for contacts tagged trial, send them an invite, remind anyone who has not registered, and offer attendees the Social Growth plan."}
```
Instruction: trimmed string, 5–2000 characters. Optional `plan` allows a frontend tool composer to submit an explicit structured plan through the **same** validation, dry-run and approval pipeline (not direct execution):
```json
{"instruction":"Create and publish our business page","plan":{"summary":"Create and publish page","clarification":null,"deferred":[],"steps":[{"tool":"create_page","args":{"title":"Our agency","template":"business","headline":"Grow your brand"}},{"tool":"publish_page","args":{"page_id":"$step1.page_id"}}]}}
```
Response awaiting approval:
```json
{"runId":"11111111-1111-4111-8111-111111111111","status":"awaiting_approval","diff":{"lines":[{"entity":"page","action":"published","count":1,"publicVisible":true,"sample":["/s/our-agency-11111111-1111-4111-8111-111111111111"],"tool":"publish_page","step":2}],"totals":{"recipients":0,"moneyInr":0,"publicVisible":true}},"risk":"MEDIUM","requiredRole":"marketer","summary":"Create and publish page","deferred":[],"source":"supplied","plannerMode":"supplied","fallbackReason":null}
```
The example diff line is illustrative; every tool effect appears in `lines`. Source is `supplied`, `fallback` or `llm` (retained for compatibility). Every plan/clarification response also has `plannerMode`: `supplied`, `gemini`, `demo` (explicit offline mode), or `fallback` (Gemini/key/context failure); `fallbackReason` is null or a safe code (`timeout`, `invalid_json`, `invalid_plan`, `missing_key`, `unavailable`, `context_failed`). LOW runs auto-commit and return `{runId,status:"completed",summary,deferred,source,plannerMode,fallbackReason}`; fetch run detail for stored diff. Clarification response creates no run: `{"clarification":"When should it start?","summary":"Need a date","source":"llm","plannerMode":"gemini","fallbackReason":null}`. DEMO_MODE=1 returns canned results without network or planner-context reads for these prompts (case/punctuation insensitive):

- The main demo sentence above.
- `Tag the trial contacts as vip`
- `Create a business landing page for Nexora Digital with headline Grow your local brand`
- `Run a webinar for trial contacts` (date clarification, no run).
- `Email everyone about our new plan` (audience/plan clarification, no run).

The same canned results are used when Gemini fails or the key is missing. Unknown prompts fail clearly instead of receiving an unrelated canned plan. Gemini has a total planning deadline of 12 seconds by default (`PLANNER_TIMEOUT_MS`, clamped 100–20000 ms), including context/retry. Malformed JSON/invalid tool/reference/schema gets exactly one repair retry within that deadline; network failure/timeout is not retried. Non-canned planner failures return 422 with `error.details.plannerCode` and create no runs, audit or business rows. Model output is validated before the runner. Authorization refusals and execution/dry-run failures are separate runner outcomes with stored run IDs. Structured supplied plans remain supported. Errors: 400,401,403,422,500.

### POST /api/agent/approve — authenticated; run's required role

Request:
```json
{"run_id":"11111111-1111-4111-8111-111111111111","decision":"approved","typed":"CONFIRM"}
```
`decision`: approved or rejected. `typed` optional, but exactly CONFIRM for HIGH approval. HIGH runs require a different owner from the requester, including for rejection. Response: `{"runId":"...","status":"completed"}` or rejected. Stale: `{"runId":"...","status":"awaiting_approval","changed":true,"diff":{"lines":[],"totals":{"recipients":0,"moneyInr":0,"publicVisible":false}},"risk":"MEDIUM"}`. Completed duplicate: `{"runId":"...","status":"completed","duplicate":true}`. Errors: 400,401,403,404,409,422,500.

### POST /api/runs/[id]/decision — same auth and behavior as agent approve

Request: `{"decision":"approved","typed":"CONFIRM"}`; ID comes from path. Same response/error variants as `/api/agent/approve`.

### POST /api/runs/[id]/rewind — authenticated; run's required role

No request body. Response: `{"runId":"...","status":"rewound","notes":[]}`. Nonempty notes describe effects that could not be reversed. Only completed runs are accepted. Errors: 400,401,403,404,409,500.

### GET /api/runs — authenticated viewer+

No JSON request. Query `limit` (1–200, default 50), `offset` (0+, default 0). Response:
```json
{"runs":[{"id":"...","user_id":"...","instruction":"Launch webinar","status":"completed","risk":"MEDIUM","required_role":"marketer","created_at":"2026-10-10T10:00:00.000Z","completed_at":"2026-10-10T10:01:00.000Z","error":null}],"limit":50,"offset":0}
```
Most recent first. Errors: 400,401,500.

### GET /api/runs/[id] — authenticated viewer+

No JSON request. Response:
```json
{"run":{"id":"...","user_id":"...","instruction":"Launch","plan":{"summary":"Launch","deferred":[],"steps":[]},"diff":{"lines":[],"totals":{"recipients":0,"moneyInr":0,"publicVisible":false}},"risk":"MEDIUM","plan_hash":"sha256","required_role":"marketer","status":"completed","error":null,"created_at":"2026-10-10T10:00:00.000Z","completed_at":"2026-10-10T10:01:00.000Z"},"steps":[{"id":"...","seq":1,"tool":"query_contacts","args":{"tag":"trial"},"result":{"contact_ids":[],"count":0,"unsubscribed":0},"compensation":null,"status":"done"}],"approvals":[{"id":"...","required_role":"marketer","requested_by":"...","decided_by":"...","decision":"approved","decided_at":"2026-10-10T10:01:00.000Z"}],"audit":[{"id":"1","actor":"user:...","action":"dry_run","entity":"agent_run","before":null,"after":{"risk":"MEDIUM"},"at":"2026-10-10T10:00:00.000Z"}],"notes":[]}
```
Plan/diff/risk may be null on failed/refused runs. Notes come from the rewind audit. Errors: 400,401,404,500.

## Adaptive actions

### POST /api/webinars/[id]/close — authenticated marketer+

No request body. Only scheduled/done webinars, not archived. Response: `{"drafted":6}`; repeat returns 0. Audited as acting user. Errors: 400,401,403,404,409,500.

### GET /api/webinars/[id]/pending?kind=offer — authenticated marketer+

No JSON request. `kind` required: offer or followup. Response:
```json
{"recipients":[{"id":"...","name":"Brew & Bean"}],"subject":"Your Social Growth offer","body":"Thanks for joining our session. Here is a Social Growth plan to keep your content going every month.","fingerprint":"sha256"}
```
Only eligible awaiting drafts; no subscribed offer recipients. Errors: 400,401,403,404,500.

### POST /api/webinars/[id]/pending/approve — authenticated owner

Request: `{"kind":"offer","fingerprint":"64 lowercase hex characters"}`. Response: `{"approved":4}`; stale response `{"stale":true,"preview":{"recipients":[],"subject":"Your Social Growth offer","body":"...","fingerprint":"new sha256"}}`. This queues simulated messages after the hold window; it does not activate subscriptions. Errors: 400,401,403,404,500.

### POST /api/billing/checkout — authenticated owner, simulated

Request: `{"contact_id":"...","plan":"Social Growth"}`. Response:
```json
{"simulated":true,"subscription_id":"...","invoice_id":"...","invoice_created":true,"amount_inr":8000}
```
Same-period repeat: invoice_id null, invoice_created false, amount_inr 0. No card/payment provider. Existing subscriptions and history are retained; queued offers cancelled via adaptive hook. Errors: 400,401,403,404,500.

### POST /api/runs/[id]/cancel-pending — authenticated marketer+

No request body. Cancels only still-queued messages created by this run's schedule_campaign steps. Response: `{"cancelled":12,"already_sent":2}`. Existing cancellations stay unchanged; registrations/subscriptions never removed. New cancellations have `CANCELLED_BY_USER` plus reason/evidence on timeline and actor user in audit. Errors: 400,401,403,404,500.

### POST /api/worker/tick — authenticated owner

No request body. Calls exported worker tick without changing hold times. Response: `{"simulated":true,"sent":36,"blocked":1}`. At most 200 due queued messages per tick. Errors: 401,403,500.

### GET /api/outbox — authenticated viewer+

No JSON request. Optional `status` queued/sent/cancelled/failed, `run_id` UUID, `contact_id` UUID, `webinar_id` UUID; limit/offset as runs. Response:
```json
{"outbox":[{"id":"...","campaign_id":"...","contact_id":"...","contact_name":"Brew & Bean","kind":"reminder","webinar_id":"...","payload":{"subject":"Reminder","body":"Register"},"dispatch_after":"2026-10-10T10:03:00.000Z","status":"cancelled","cancel_reason":{"allow":false,"ruleId":"REMINDER_REQUIRES_UNREGISTERED","reason":"Contact already registered for this webinar","evidence":{"webinar_id":"...","registered_at":"2026-10-10T10:01:00.000Z"}},"dispatched_at":null}],"limit":50,"offset":0,"simulated":true}
```
Errors: 400,401,500.

## Public pages and CRM

### GET /s/[slug] — public, no authentication

No JSON request. Published pages only. Response:
```json
{"page":{"id":"...","slug":"workshop","title":"Workshop","blocks":[{"type":"hero","headline":"Workshop","sub":"Welcome"},{"type":"webinar_signup"}],"version":1},"webinar":{"id":"...","title":"Workshop","description":"Welcome","starts_at":"2026-10-16T11:30:00.000Z","status":"scheduled"},"registration_open":true}
```
`webinar` null for a business page; registration_open false if no scheduled webinar. Join URL is not exposed. Errors: 400,404,500. This returns JSON; frontend rendering is a separate phase.

### POST /s/[slug]/register — public, no authentication

Request: `{"name":"New visitor","email":"visitor@example.com"}`. Name trimmed 1–100, email trimmed/normalized lowercase <=200. Published page linked to scheduled webinar required. Existing contact name/consent preserved; no re-subscription. Response: `{"registered":true}`; duplicate `{"registered":false}`. No private contact ID/data returned. Adaptive registration hook cancels reminders and logs rule/reason/evidence. Errors: 400,403 (cross-origin),404,500. Public business-page form submission is not supported in this phase.

### GET /api/contacts — authenticated viewer+

No JSON request. Optional tag (<=100), status new/engaged/registered/customer, source (<=100), limit/offset. Response:
```json
{"contacts":[{"id":"...","name":"Brew & Bean","email":"brew@example.com","phone":null,"tags":["trial"],"source":"instagram","status":"registered","unsubscribed":false,"created_at":"2026-10-10T10:00:00.000Z"}],"limit":50,"offset":0}
```
Errors: 400,401,500.

### GET /api/contacts/[id]/timeline — authenticated viewer+

No JSON request. Limit/offset as runs. Most recent first, stable ordering by event ID. Response:
```json
{"events":[{"id":"123","type":"automation_decision","payload":{"decision":"cancelled","rule_id":"REMINDER_REQUIRES_UNREGISTERED","reason":"Contact already registered for this webinar","evidence":{"webinar_id":"...","registered_at":"2026-10-10T10:01:00.000Z"},"outbox_id":"..."},"run_id":null,"created_at":"2026-10-10T10:01:00.000Z","instruction":null,"rule_id":"REMINDER_REQUIRES_UNREGISTERED","reason":"Contact already registered for this webinar"}],"limit":50,"offset":0}
```
Top-level rule_id/reason null for events without them; full payload is always retained. Errors: 400,401,404,500.

### GET /api/analytics/summary — authenticated viewer+

No JSON request. Response:
```json
{"funnel":{"leads":50,"registered":11,"attended":6,"subscribed":1},"campaigns":{"queued":37,"sent":36,"cancelled":1,"failed":0,"opened":0,"clicked":0},"billing":{"mrr_inr":8000,"usage_units":0,"invoiced_inr":8000},"automation":{"estimated_minutes_saved":98,"by_run":[{"run_id":"...","estimated_minutes":98}]},"simulated":true,"savings_are_estimates":true}
```
Funnel uses distinct contacts; subscribers/MRR count active subscriptions (MRR flat plans only). Usage is total stored units, invoices total simulated_paid amount. Open/click counts use stored simulated engagement rows. Savings use only completed runs and done/cannot_rewind executed steps times tool minutesSaved, not wall-clock measurements. Errors: 401,500.

## Tool composer arguments

All tools use the registered pipeline. `create_page`: title (3–120), template business/webinar, headline (1–160), sub optional <=500, cta_label optional 1–80. `publish_page`: page_id UUID. `draft_followup`: webinar_id UUID, audience attended/no_show. `offer_subscription`: plan_name and contact_ids UUID array <=500; owner, no charge. `activate_subscription`: contact_id UUID, plan_name; owner, simulated activation/invoice, irreversible HIGH risk, different-owner approval + CONFIRM. References such as `$step1.page_id` are allowed only to previous steps. Rewind archives new pages, restores publication when version unchanged, removes only newly added follow-up tags, and preserves activated subscriptions/history.

## Running the contract test

`npm run smoke:routes` starts an isolated Next HTTP server on loopback, seeds the configured real demo database, calls the routes with fetch, and stops its server. Run serially with the other smoke scripts; it resets demo data. No live email, payment or LLM is required (DEMO_MODE=1). You can instead set ROUTES_BASE_URL to an already-running loopback server; it must use the same DATABASE_URL and DEMO_MODE=1. Run the build first when using the auto-started production server.

## Reset and rehearsal

`npm run demo:reset` transactionally restores the synthetic seed, then verifies 50 contacts, 40 trial, 3 unsubscribed, and zero runs/outbox/pending/registrations/subscriptions/invoices. Repeating it is safe; it removes demo history.

After `npm run build`, `npm run rehearse` starts its own loopback production HTTP server in DEMO_MODE=1, resets the configured demo database, and exercises plan/approve, publication through a second supplied plan, public registration, simulated attendance, close, pending draft approval, simulated checkout, tick and rewind. It advances synthetic outbox due times to avoid waiting minutes, but dispatch still calls the real worker/evaluator. After dispatch it expects honest cannot-recall notes and preserved registrations/subscriptions; a separate vip run proves exact reversible tag rewind. Any mismatch exits nonzero; the server is stopped on exit. Run reset/rehearsal/smoke tests serially; they share the demo database.

`npm run check:planner` tests bounded timeout, malformed JSON repair/failure, invalid tools/arguments, missing key, unavailable provider and all canned prompts while comparing complete stored-row snapshots. `npm run check:gemini` uses the local key, temporarily disables demo mode in its process, runs all five prompts without execution, verifies unchanged snapshots, and writes sanitized outcomes to docs/GEMINI_REPORT.md. It exits nonzero if any prompt did not receive an actual Gemini response. Neither command prints credentials/raw provider errors. The verified live model is `gemini-flash-latest`; no real email or payments are used.

## Gemini model configuration

Set the model in the ignored `.env.local` file:

```dotenv
GEMINI_MODEL=gemini-flash-latest
```

The planner reads `GEMINI_MODEL` at request time and defaults to `gemini-flash-latest` when it is unset, blank or whitespace-only. Set another supported model name here to override the default; restart the running Next server after editing `.env.local`. `.env.example` includes this setting. Keep `GEMINI_API_KEY` in `.env.local`; do not commit that file.
