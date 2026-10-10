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

## Final verification and limits

| Item | State | Verification |
| --- | --- | --- |
| Additive backend reads and opt-out | Already built, reverified | Real-DB HTTP smoke assertions; unchanged wrapper/service and API fields |
| Shared routed shell | Built, ticker completed | Real stored timeline comparison; hover/focus pause; reduced-motion static ticker; menu/worker browser flow |
| Agent | Already built, preserved | Browser preview, 37 people/74 messages, cancelled short hold, keyboard deliberate approval and rewind |
| /register/[slug] | Already built, preserved | Real iframe registration, duplicate response, standalone no-chrome page and invalid required fields |
| /live | Built, guidance corrected | Real registration -> REMINDER_REQUIRES_UNREGISTERED -> Reminder cancelled; stored reason/evidence; three reached stages; 2-second polling |

After each Batch A screen/audit commit, typecheck, build, smoke, smoke:adaptive and smoke:routes passed. The backend-first audit and final Live correction also passed rehearse. Existing smoke assertions and backend behavior did not change. Edited components passed ESLint. The existing browser rehearsal passed UI CHECKS ALL GREEN against the real HTTP API and database, including publication approval, registration/duplicate, rule trace, worker delivery after the actual hold window and whole-run rewind. No browser errors or external runtime requests were detected in that rehearsal. The final guidance-only layout correction was separately recaptured and checked at all three sizes, including reduced-motion empty state.

Screenshots at 1440×900, 1280×720 and 390×844 are in docs/screenshots/editorial (Agent initial/preview, menu, public registration, populated Live and clean Live empty state). Compare against the saved reference using docs/screenshots/comparison.html; the honest critique is in docs/VISUAL_REVIEW.md. Clean guidance starts at 622px, 591px and 535px respectively. No horizontal overflow was found.

Omitted as instructed: attendance button/route, UI Reset demo, cancellation of unapproved drafts, seed changes, and a rendered /s/[slug] page. Existing JSON route handlers remain intact. No API gap prevented Batch A; the ticker is explicitly contact-scoped because the contract provides contact timelines, not a global event stream. Not verified: native hidden-tab pause in a browser that actually reports document.hidden (this automation previously kept background tabs visible), Safari/Firefox, physical phones/projector, screen readers and exhaustive pagination/filter combinations. No branch or remote operations; local commits only.
