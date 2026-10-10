# Batch A verification

## Backend first

The requested additive routes already exist in separate commit 79ea6f7, preceding frontend implementation: GET /api/webinars, GET /api/webinars/[id], and POST /api/contacts/[id]/opt-out. Route files delegate to existing reads/actions; opt-out calls unchanged optOut with the existing actor, UUID, transaction and adaptive lock patterns. API.md documents all three; smoke_routes.ts already checks list/detail counts/status, authorization/validation and opt-out idempotence. No new route, field, business behavior, seed or smoke assertion is needed. Corrected the stale API introduction to distinguish JSON /s/[slug] from rendered /register/[slug].

## Shared shell

All screens already have real routes under app/(workspace) with its shared layout. Added the existing real-event ticker to the shell outside Live view, using actual contact timeline responses. The API exposes contact timelines rather than a global event stream, so the shell explicitly names its selected customer. Live view keeps its own selectable-contact ticker; no fabricated or inferred events, and no new endpoint. Both feeds pause requests while hidden; the ticker pauses animation on hover/focus and becomes static under reduced motion. Existing wordmark/Menu/worker controls and local illustration/cursor fixes are preserved.

## Agent screen

Already implemented separately in 580874e (hold timing refinement e892acc). components/agent.tsx opens with the giant condensed/italic statement, preserves the command bar and receipt, shows 37 people separately from 74 messages, and applies has-receipt to shrink the statement after planning. Hold-to-approve, clarification, stale and duplicate handling, HIGH confirmation and whole-run rewind remain unchanged. No duplicate implementation or behavior change was necessary for Batch A.

## Public registration screen

Already implemented separately in 8b099f3 (initial route 89e73a5). app/register/[slug]/page.tsx renders components/registration.tsx outside the workspace chrome. Its poster headline uses the real published page/webinar title, with a quiet name/email form, API-backed success and duplicate notices, native required/email validation and an explicit Simulated note. It consumes the existing JSON /s/[slug] endpoints; no handler or public-page route change was necessary.

## Live view

The existing full-bleed trace already uses stored automatic decisions, real rule IDs/reasons/evidence and the corresponding real outbox effect. Stages advance at 480ms and 960ms; existing history renders reached rather than replaying a made-up new event. The /register/[slug] iframe works with real public registration, and contact email/timeline reads poll every two seconds with hidden-document checks and visibility resume. Updated the empty state to the exact requested next-step/reset sentence; preserved a separate explanation of the real draft-publication approval step. No attendance, UI reset or unapproved-draft cancellation was added.

### Screenshot correction

The first clean-seed capture placed next-step guidance after the tall inactive trace, below the first desktop viewport. Move that real empty state directly after the heading and before the ticker/trace, and show the registration instruction only when an eligible published webinar exists. This preserves the required display hierarchy while making the exact next-step sentence visible before inactive stages. It changes no API, seed or trace data.
