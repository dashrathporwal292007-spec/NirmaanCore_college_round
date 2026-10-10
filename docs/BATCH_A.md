# Batch A verification

## Backend first

The requested additive routes already exist in separate commit 79ea6f7, preceding frontend implementation: GET /api/webinars, GET /api/webinars/[id], and POST /api/contacts/[id]/opt-out. Route files delegate to existing reads/actions; opt-out calls unchanged optOut with the existing actor, UUID, transaction and adaptive lock patterns. API.md documents all three; smoke_routes.ts already checks list/detail counts/status, authorization/validation and opt-out idempotence. No new route, field, business behavior, seed or smoke assertion is needed. Corrected the stale API introduction to distinguish JSON /s/[slug] from rendered /register/[slug].

## Shared shell

All screens already have real routes under app/(workspace) with its shared layout. Added the existing real-event ticker to the shell outside Live view, using actual contact timeline responses. The API exposes contact timelines rather than a global event stream, so the shell explicitly names its selected customer. Live view keeps its own selectable-contact ticker; no fabricated or inferred events, and no new endpoint. Both feeds pause requests while hidden; the ticker pauses animation on hover/focus and becomes static under reduced motion. Existing wordmark/Menu/worker controls and local illustration/cursor fixes are preserved.
