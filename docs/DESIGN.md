# Nexus interface

The agent proposes. You decide. Every change leaves a receipt.

## Colour and contrast

Dark only. Role tokens: background #0B0B0D, surface #141416, raised #1D1D20, line #2A2A2E, hairline #3F3F45, ink #F5F2EE, muted #A9A5A1. Decision/primary/pending/medium #FFB02E with text #1B1206; added/committed #45D9A8, tint #0F2E24; changed #7CC4FF, tint #13263A; blocked/cancelled/high #FF8AA0, tint #3D1722. Saffron means a human decision, never decoration. Every text pair must meet 4.5:1; rules are structural rather than text.

## Type and space

All fonts use next/font. Display token: Big Shoulders Display 700/800. Body: Public Sans. Receipt and rule IDs: JetBrains Mono. Instrument Serif italic appears only on one heading phrase. Body 16px/1.65, small 16px, heading 48–72px, impact numbers 64–96px. Text measures max 76ch. Section space 48px; receipt padding 32px; mobile 20px. Corners: controls 6px, containers 2px, pills 999px. No shadows or gradients.

## Structure and controls

Slim wordmark/navigation bar with worker tick, last tick outcome, role switch, planner source and simulation note. Agent command bar precedes a broad receipt left and impact/approval right. Two-pixel dashed perforations mark receipt edges and major sections. Dotted leaders connect receipt items to counts. A tilted status stamp is the only ornament.

Restyle every input, textarea, select and button. Keyboard focus is a 2px changed-colour outline with 3px offset. Sentence case, plain verbs, no button arrows. Errors explain a repair action. Empty states invite a request. No identical card grids, stock decorative icons, all-caps labels, glows, glass or light theme.

## Honest data

People reached uses totals.distinctRecipients; messages scheduled uses totals.recipients. Old receipts without the additive field say unavailable, never infer unique people from message counts. Public page counts sum actual published page effects. Money is INR. LOW plans auto-run: do not say nothing happened after completion. HIGH needs CONFIRM and another owner; backend is authoritative. Clarifying questions are conversation replies. Stale approval requires a fresh deliberate approval; duplicate approval explains that nothing ran twice.

Webinars use the authorized read-only list and detail endpoints. Registration, opt-out and checkout are explicitly simulated; attendance actions, draft cancellation and UI reset are omitted. Live view reads contact timelines and their stored rule/reason/evidence. No fabricated feeds, predicted metrics or invented endpoints.

## Approval, rewind and motion

Hold for approximately one second to approve, using pointer or Enter/Space, with a visible fill. Release, blur, cancellation or Escape resets it. Reduced motion removes animated fill but retains deliberate hold duration. Pending previews show Nothing has happened yet. Rejection is explicit.

Rewind is whole-run only: confirm once, call the existing endpoint, show its notes and cannot_rewind steps. Never imply sent messages or active subscriptions were recalled. No step slider.

Only receipt printing (170ms stagger, reversed on rewind), hold fill and Live view rule trace (480ms per stage) animate. Reduced motion shows end states immediately. Everything else stays still.

## Review gate

Capture 1440×900, 1280×720 and 390×844 against real API responses. Check overflow, readable type, hierarchy, focus, honest empty states and controls. Fix identified defects and remove one decorative element before final delivery. Record actual findings separately.

## First visual critique

The first desktop capture pushed the approval control below the fold because three impact numbers were stacked. Place the three figures on one desktop row, retain 64px display type, and keep the full receipt readable. Add entity names to terse backend effect actions such as created. Mobile keeps natural vertical reading and page scrolling. Remove the decorative period from the wordmark. Use localhost for local browser testing: the existing origin guard rejects the 127.0.0.1 browser origin, although nonbrowser smoke requests omit Origin. No security check is bypassed or changed.

## Final verification

Real Chromium interactions pass: main preview (37 people / 74 messages), cancelled short hold, Space-key deliberate approval, rewind confirmation/cancellation, public registration through existing APIs, real REMINDER_REQUIRES_UNREGISTERED timeline, contacts/outbox/runs navigation, clarification reply, LOW auto-run, owner/viewer switch, worker tick and reduced-motion receipt. No browser runtime errors. Text contrast measured 6.99:1 or higher for tested semantic pairs (including their tints); body/muted exceed 7.5:1. Viewports have no horizontal overflow. Captures include exact 1440×900, 1280×720 and 390×844 images plus full-page versions. Narrow/short screens scroll naturally rather than shrinking type. The empty Next route announcer is excluded from application-error assertions.

The command measure is capped at 76ch and the textarea expands to its content, so the main prompt is readable on mobile. The desktop heading compacts only once a receipt exists, making room for the decision. Tilted stamp and perforations remain; the decorative wordmark period was removed.

Not manually verified: Safari/Firefox, a physical projector or screen reader, and live Gemini failure rendering in the browser. Existing backend tests cover stale/duplicate decisions and HIGH typed/different-owner rules; the browser pass uses offline demo mode.

To reproduce: build, run demo:reset, start the server at http://localhost:3000, then run `PLAYWRIGHT_BROWSERS_PATH=.cache/playwright node scripts/check-ui.mjs`. Install the local browser with `PLAYWRIGHT_BROWSERS_PATH=.cache/playwright npx playwright install chromium` if needed. This check changes real demo data; run serially with the smoke scripts.

## Routed-screen completion

All requested routes now use the shared shell and real client API. Public registration remains outside app chrome. Mobile contact fields stack so tags and consent stay visible. Rule inspector uses a verified static catalogue and trapped keyboard focus. The final rewind motion resolves to fully opaque text; reduced motion covers both pseudo-elements. Decorative navigation numbers were removed.

The per-screen report and native hidden-tab verification limitation are in docs/UI_REPORT.md. Three browser rehearsals, required viewports, final build/typecheck/three smoke scripts/rehearse and clean reset passed. No attendance UI/route, unapproved-draft cancellation, UI reset or step slider was added. Production served the browser paths without runtime errors.

## Editorial direction — supersedes conflicting visual rules above

Black base (#0A0A0B), white text (#F5F2EE), generous empty space. Keep existing jade, sky, rose and saffron strictly for effects, statuses and decisions. Locally bundled next/font fonts remain Big Shoulders Display (one heading token), Instrument Serif italic emphasis, Public Sans body and JetBrains Mono for rule IDs and receipt lines.

Page statements use clamp(56px, 10.4vw, 150px), line-height .94, tracking −.025em. Body 16–18px, at most 76ch. Desktop gutters 6vw, section separation 96–144px, mobile gutters 24px and section separation 96px. Once a plan exists, Agent's statement shrinks to 56–72px so the receipt is the focus. The receipt remains a readable operational document; replace ornamental dashed borders and tilted stamps with hairlines.

A minimal wordmark / worker / Menu bar opens an accessible full-screen native dialog. Role, planner source and simulation disclosure remain available. Five numbered rules expand on hover, focus and explicit touch activation; rule IDs link to that page. Runs use a numbered index with a revealed summary. Live keeps its real three-stage trace at generous scale and public registration is a typographic poster with a quiet form.

Entry, menu, row reveals and receipt printing use 600ms cubic-bezier(.16,1,.3,1). Hold uses a deliberate 700ms threshold and matching 700ms ease-out fill, following the updated motion direction. Release, Escape and blur still cancel approval. Trace advances at 480ms per stage with 600ms visual transitions. The event ticker uses a slow linear loop, pauses on hover/focus and is static under reduced motion. All motion respects prefers-reduced-motion. No copied reference assets, remote runtime fonts, decorative charts, shadows, gradients, autoplay video, cursor effects or scroll hijacking.

## Scroll and pointer update

The user's latest direction authorizes reference-inspired cursor and scroll effects, superseding the earlier cursor restriction. On fine mouse pointers a 6px dot and a trailing 36px ring stretch with velocity; interactive controls enlarge the ring. Inputs keep their native caret, keyboard input hides the decoration, and coarse pointers/reduced motion disable it. Sections reveal over 650ms and headings drift at most 28px with natural scrolling. No wheel interception or forced scene navigation; approval, receipt and trace semantics remain unchanged. Motion adds no requests or backend changes.
