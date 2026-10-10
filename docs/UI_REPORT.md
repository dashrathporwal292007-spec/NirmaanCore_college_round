# Routed prototype verification

All screens use the real JSON endpoints and the existing demo-cookie authentication. The backend additions were isolated in commit 79ea6f7 before frontend routing. Attendance services/routes, adaptive services, seed and reset code were not changed. No old smoke assertion was changed.

| Screen                      | Status and files                                            | Verification                                                                                                                                       |
| --------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared routing and controls | Built: app/(workspace)/layout.tsx, components/workspace.tsx | Real route links, tick outcome, owner/viewer controls and focused planner-source tooltip                                                           |
| Agent /                     | Built: components/agent.tsx                                 | 37 distinct contacts / 74 messages, short hold cancellation, Space-key approval, real plan/approve and clarification reply                         |
| Public /register/[slug]     | Built: components/registration.tsx                          | Public iframe registration, success, duplicate, native required-field validation; no app chrome                                                    |
| Live /live                  | Built: components/live.tsx                                  | Registration produces the real REMINDER_REQUIRES_UNREGISTERED decision, reason, evidence and cancelled reminder; three stages resolve              |
| Contacts /contacts          | Built: components/contacts.tsx                              | Search by email verified to one real contact; keyboard link navigation; mobile fields show tags and consent                                        |
| Contact /contacts/[id]      | Built: components/timeline.tsx                              | Real imported and automatic events on a vertical spine; rule IDs, reasons, evidence and run links                                                  |
| Rule inspector              | Built: components/rule-inspector.tsx, lib/rule-catalogue.ts | Enter opens, Tab stays inside, Escape closes and restores focus; catalogue checked against evaluator/adaptive/rewind code                          |
| Webinars /webinars          | Built: components/webinars.tsx                              | Stored status, linked page state and actual registrant counts                                                                                      |
| Webinar /webinars/[id]      | Built: components/webinar-detail.tsx                        | Publication preview through a second approved plan; registration, close, stale fingerprint refusal and fresh approval, opt-out, simulated checkout |
| Runs /runs                  | Built: components/runs.tsx                                  | Real history; numbered by creation order, with stored UUID retained on detail                                                                      |
| Run /runs/[id]              | Built: components/run-detail.tsx and components/agent.tsx   | Steps/results, approval/audit records, cancel rewind confirmation, confirmed whole-run rewind, API cannot-recall notes                             |
| Outbox /outbox              | Built: components/outbox.tsx                                | Cancelled filter verified; stored statuses, bodies and rules; no invented blocked status                                                           |
| Analytics /analytics        | Built: components/analytics.tsx                             | Computed contacts, delivery states, invoices, recurring amounts and usage; estimates labelled; no decorative charts                                |

## Demo path

The cached main plan deliberately creates a draft registration page. Approving it does not publish the page. Open Webinars, select the webinar, choose “Preview registration publication,” and approve that real supplied plan on Run detail. Then register through the public page or its Live iframe. This preserves the backend pipeline.

The worker respects the actual hold window. An immediate tick can legitimately send zero emails. Browser rehearsals wait for the stored dispatch time, then tick again; database times are not altered. Rewind lists the API's notes about already-sent messages rather than claiming recall.

Pending drafts have only Approve. Not approving leaves the draft untouched. A changed recipient set is refused, displayed as a fresh preview, and requires another deliberate approval.

## Visual critique and fixes

Reviewed exact 1440×900, 1280×720 and 390×844 captures plus full-page versions in docs/screenshots. Kept dark-only colours, local next/font type, readable 16px body text, semantic colour, hairline structure and perforated receipts.

- Mobile contact columns initially required horizontal table scrolling. Stack labelled fields so tags, state and consent remain visible.
- Rewind's final fade reduced coloured-text contrast. Resolve the reverse entry to full opacity, keeping the reverse order and direction.
- Native one-button dialogs allowed Tab to leave the control. Keep focus on Close; Escape restores the triggering rule button.
- Give webinar/contact selectors explicit accessible names.
- Include pseudo-elements in reduced-motion suppression so the trace rail also settles instantly.
- Re-selecting an observed contact now restores its existing settled trace.
- Remove decorative navigation numbers and obsolete hash-view code.
- Capture viewport screenshots at the top; otherwise form focus preserved a misleading scroll offset.

Tested semantic text pairs range from 6.99:1 to 16.49:1. All captured viewports have no horizontal document overflow. Narrow screens scroll naturally instead of shrinking text. Reduced motion ends the trace immediately and disables receipt animation while keeping deliberate hold duration.

## Checks

Final serial checks passed: typecheck, production build, all three smoke scripts (ALL GREEN), rehearse (REHEARSAL ALL GREEN), and demo:reset. Lint has zero errors and 34 retained legacy warnings; new frontend lint is clean. Three full browser rehearsals printed ALL GREEN, including a reduced-motion cycle. The final rebuilt production server also passed a read-only check of clean Live state and zero-duration rail pseudo-element motion. Browser script: PLAYWRIGHT_BROWSERS_PATH=.cache/playwright node scripts/check-ui.mjs. It opens local Chromium, resets real demo data once per cycle and runs three full paths. It does not send real email or collect payments.

Clean reset is checked through HTTP: 50 contacts, 40 trial, 3 unsubscribed; every contact has an imported event and no automatic decisions. The seed is unchanged.

## Omitted and unverified

Attendance button/route/service, cancellation of an unapproved draft, UI reset and step rewind slider are deliberately omitted. Attendance remains a read-only stored field; existing backend rehearsal fixtures are unchanged.

Native hidden-tab polling could not be exercised: this Chromium automation reports both background tabs and minimised windows as visible, even after disabling focus emulation. The verifier explicitly reports this limitation; it does not fabricate document.hidden. Live polls every two seconds and checks document.hidden before each request.

Not verified: Safari/Firefox, physical mobile devices/projector, screen reader, load/soak testing, live Gemini failure rendering in the browser, and HIGH/different-owner approval through the UI. Existing real-HTTP smoke tests cover HIGH, stale and duplicate approval contracts. All browser runs use offline demo mode. Pagination beyond this small demo dataset is not exercised in the browser.
