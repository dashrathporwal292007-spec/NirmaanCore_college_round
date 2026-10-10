# Batch A verification

## Backend first

The requested additive routes already exist in separate commit 79ea6f7, preceding frontend implementation: GET /api/webinars, GET /api/webinars/[id], and POST /api/contacts/[id]/opt-out. Route files delegate to existing reads/actions; opt-out calls unchanged optOut with the existing actor, UUID, transaction and adaptive lock patterns. API.md documents all three; smoke_routes.ts already checks list/detail counts/status, authorization/validation and opt-out idempotence. No new route, field, business behavior, seed or smoke assertion is needed. Corrected the stale API introduction to distinguish JSON /s/[slug] from rendered /register/[slug].
