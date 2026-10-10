# Nexus editorial frontend verification

## Screens

| Screen | Built | Verification | Limits |
| --- | --- | --- | --- |
| Agent `/` | Yes | Real plan, 37 distinct people / 74 messages, short-hold cancellation, keyboard hold approval, receipt, real source indicator; screenshots at all three sizes | HIGH different-owner UI path not exercised in browser; enforced and covered by existing HTTP smoke |
| Public `/register/[slug]` | Yes | Real registration, duplicate, native validation and success; no workspace chrome; all three sizes | No physical phone or screen-reader test |
| Live `/live` | Yes | Real iframe registration, polling, stored cancellation rule/reason/evidence, completed three-stage trace; all three sizes | Automated Chromium keeps background tabs visible, so native hidden-tab pause could not be exercised |
| Contacts `/contacts` | Yes | Real clean 50-contact seed, list and consent/tag states; all three sizes | Larger-than-seed pagination/search combinations not exhaustively tested |
| Contact `/contacts/[id]` | Yes | Real imported history, new automatic decision, reason/evidence and link to Rules; all three sizes | Every event type is not represented in the seed demo |
| Rules `/rules` | Yes | Five confirmed adaptive rules, direct hash opens/focuses explanation, mouse/keyboard/touch activation, manual-action explanations; all three sizes | Unknown IDs are flagged rather than assigned invented behavior |
| Webinars `/webinars` | Yes | Real list and link into detail; all three sizes | Large pagination not exercised |
| Webinar `/webinars/[id]` | Yes | Publication through plan/approval, simulated registration/opt-out/checkout, close, pending draft, stale fingerprint rejection, fresh approval; all three sizes | Attendance action deliberately omitted; unapproved draft cancellation deliberately omitted |
| Runs `/runs` | Yes | Real creation-order numbering, statuses and instruction summaries; all three sizes | Numbering is a display index, not a new persisted backend field |
| Run `/runs/[id]` | Yes | Real effects, approval, confirmed whole-run rewind, API irreversible notes, reversed receipt; all three sizes | Step-by-step rewind deliberately omitted |
| Outbox `/outbox` | Yes | Real queued/sent/cancelled records after customer actions and dispatch; all three sizes | All status/filter combinations not exhaustively clicked |
| Analytics `/analytics` | Yes | Existing computed API values, large plain numbers and honest simulation/estimate labels; all three sizes | No claim of real revenue or delivery |
| Shell | Yes | Production navigation, visible worker result, role switcher, planner source, simulation note, menu keyboard containment and Escape restoration | No screen-reader audit |

## Gates and scope

Typecheck, build and all three smoke scripts passed after every screen. Existing smoke assertions were not changed. Backend rehearsal passed. The production server was used for browser demo runs; browser requests are checked against the local origin, including locally bundled fonts. Lint has zero errors and the 34 existing warnings remain.

Backend routes, services, planning/approval/commit/rewind logic, seed/reset, and all three backend smoke scripts are unchanged by this design pass. No fetch, pull, push, rebase, remote operation or branch switch was performed. Local commits only.

No reset button was added. Live retains the CLI reset hint and the clean seed remains imported history only. Attendance is not simulated. Drafts stay untouched unless approved. All email/payment/hosting actions remain simulated.

Visual comparison, critique and screenshot findings are recorded in `VISUAL_REVIEW.md`; the side-by-side gallery is `screenshots/comparison.html`. The decorative tilted stamp was removed.

## Final outcome

Three full production browser rehearsals passed, including the third with reduced motion. After the observed menu focus fix, a fourth full run passed and regenerated every screenshot. That final run includes the 700ms hold threshold, explicit menu Tab wrapping and route-entry reveals. No browser runtime errors or external browser-origin requests were recorded.

Additional real-browser checks passed: first-tap rule expansion, menu Tab containment/Escape focus restoration, and the real-event ticker pausing on hover/focus and becoming static under reduced motion. Minimum checked text contrast is 6.99:1. Build/start is stable; the final clean seed is verified separately after browser testing.

## Expanded reference interaction verification

Studied the homepage at both viewport sizes and all main navigation destinations (projects, expertise, agency, blog, contact and case-study index). This is not an exhaustive review of every article or client case. Implemented circular top-right menu open/reverse close, staggered full-height expanding territories, title-layer swaps, hover/focus descriptions, moving rule titles, masked display entrances and scroll reveals that also handle API-loaded sections. Existing cursor, receipt, hold-to-approve and rule trace remain.

Production build, typecheck and all three smoke scripts passed after each implementation pass; all existing smoke assertions remain unchanged. Edited-file ESLint passed. Real Chromium checks passed for all requested viewport sizes, hover expansion, menu navigation, Escape, keyboard focus containment and dynamic reduced-motion switching. One full existing browser rehearsal passed (UI CHECKS ALL GREEN), including real plan/approve/register/rule/tick/rewind; backend rehearse passed. The only browser harness change waits for the animated menu to become hidden before its unchanged focus-restoration assertion. Recorded in DECISIONS.md. No backend behavior changed.

Saved new animation-state captures as menu-circle-opening.png, menu-panels-1440x900.png, menu-panels-1280x720.png, menu-panels-390x844.png and rules-territory-hover.png; refreshed the existing three-size screen captures and comparison gallery. Screenshot critique fixed clipped menu labels and mobile text contrast. Physical touch devices, Safari/Firefox and screen-reader interaction remain unverified. The current pass retains native scrolling rather than reproducing the reference's forced opening scene, and does not reproduce its copyrighted photography/films or every site-specific content feature. Demo reset restored 50 contacts, 40 trial, 3 unsubscribed and no leftover runs/outbox. Local commits only; no remote or branch operations.
