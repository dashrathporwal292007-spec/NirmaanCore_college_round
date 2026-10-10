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

Webinar operations use an entered real webinar ID, since the API has no webinar list endpoint. Live view reads contact timelines and their stored rule/reason/evidence. No fabricated feeds, predicted metrics or invented endpoints.

## Approval, rewind and motion

Hold for approximately one second to approve, using pointer or Enter/Space, with a visible fill. Release, blur, cancellation or Escape resets it. Reduced motion removes animated fill but retains deliberate hold duration. Pending previews show Nothing has happened yet. Rejection is explicit.

Rewind is whole-run only: confirm once, call the existing endpoint, show its notes and cannot_rewind steps. Never imply sent messages or active subscriptions were recalled. No step slider.

Only receipt printing (170ms stagger, reversed on rewind), hold fill and Live view rule trace (480ms per stage) animate. Reduced motion shows end states immediately. Everything else stays still.

## Review gate

Capture 1440×900, 1280×720 and 390×844 against real API responses. Check overflow, readable type, hierarchy, focus, honest empty states and controls. Fix identified defects and remove one decorative element before final delivery. Record actual findings separately.
