# Reference study — Ownitt

Inspected https://ownitt.fr with local Playwright Chromium at 1440×900 and 390×844. Captures and raw computed styles are in `docs/screenshots/reference/`. These are study material, not product assets.

The site alternates cream (#F4F1EA) and near-black (#0A0A0B); the requested Nexus direction stays black. Its opening includes a branded intro and a cream hero. The menu becomes clearly visible after scrolling. This is not an interaction Nexus needs to reproduce.

## Measured typography and rhythm

- Display: Elza Condensed, weight 800. Desktop showreel heading 86.4px / 82.08px, tracking −2.16px; large definition 230.4px / 198.144px, tracking −6.912px. Mobile equivalents 38.4px / 36.48px and 64px / 55.04px.
- Serif: IvyPresto Display. Desktop question 100.8px / 102.816px, tracking −1.512px; project introduction 79.2px / 80.784px, weight 300. Mobile question 38.4px / 39.168px.
- Desktop text section padding 144px 86.4px. Project-name wall 153px 86.4px 63px. Territories section 162px 86.4px 144px. Most structural separation comes from spacing and thin rules, rather than card containers.
- Nexus uses OFL fonts already installed and self-hosted through next/font/local: Big Shoulders Display, Instrument Serif italic, Public Sans and JetBrains Mono. No reference font, image, logo, monogram, motif or copy is used.

## Interactions

The menu button reports aria-expanded and aria-controls. Opening produces a full-screen overlay with large navigation and smaller descriptions. Button entrance: opacity 500ms and transform 550ms, cubic-bezier(0.16,1,0.3,1); label width 800ms cubic-bezier(0.65,0,0.35,1); word hover transform 450ms cubic-bezier(0.5,0,0.1,1).

The numbered project index relies on typography, compact metadata and hover contrast rather than repeated cards. Territories reveal moving repeated titles and services on hover. Measured overlay opacity transition: 300ms cubic-bezier(0.16,1,0.3,1); territory title track 22 seconds and service track 28 seconds, linear. Project background text tracks run 380, 400 and 440 seconds; the duration is a loop period, not a measured pixel velocity. These timings are read from browser animations, not guessed from screenshots.

Nexus adopts a restrained 600ms ease-out reveal, an accessible full-screen menu, numbered rows and expandable rule explanations. It does not adopt the site's intro, cursor treatment, grain, rotating motifs, video or scroll-linked scenes. Its real-event ticker pauses on hover and focus and becomes static under reduced motion.

## Limits

The study captures a particular live-site state. Responsive scenes and scroll-dependent animations change what is visible; the raw JSON preserves the measured elements. No claim is made that every animation on the reference has been catalogued.

Additional verification: captured the opened menu after scrolling, the numbered case-project navigation and the hovered Services row. The moving project-name wall is distinct from the numbered case navigation. The desktop overlay expands into vertical navigation territories with image reveals; Nexus deliberately uses text-only navigation and preserves its own black palette.

A second desktop sampling measured actual horizontal transform movement over approximately 1.2 seconds: project tracks ≈57px/s left, 52px/s right and 60px/s left; the hovered territory title ≈175px/s left and services ≈30px/s right. These values depend on viewport and track content, and are approximate. Full samples are in `screenshots/reference/marquee-speeds.json`.

The opening consumes initial wheel input to transition between scenes; real wheel input was needed to reach the numbered case navigation reliably. Its desktop 01–08 rail is hidden at 390px, so the mobile comparison captures the responsive project section instead. Nexus uses ordinary page scrolling throughout.

Cursor follow-up: a fresh desktop Playwright inspection found a 6px difference-blended dot and a 36px trailing ring. Both transforms show rotation and non-uniform scaling during pointer movement. Nexus uses its own implementation of this movement, not reference source code. Its scroll adaptation uses native scrolling, viewport-triggered reveals and limited heading drift instead of the reference's wheel-controlled opening scene.

## Full navigation study and panel-menu follow-up

Revisited the homepage at desktop and mobile and inspected all five main destinations: projects, expertise, agency, blog and contact, plus the case-study index. Captured both initial and scrolled states under `screenshots/reference/study-*.png`; route inventories and active-animation timing samples are in `site-study.json`. This covers the main site experiences, not every blog article, client case, location landing page or external social destination. No forms were submitted.

The menu overlay uses a circular clip-path reveal originating near the top-right control, 600ms cubic-bezier(.77,0,.175,1). Its five full-height desktop territories flex on hover over 500ms cubic-bezier(.76,0,.24,1), with 40ms staggered panel entrance. Title layers and supporting descriptions change separately; descriptions use a 350ms reveal with an 80ms delay. The reference uses photography for active territories. Nexus substitutes its own type-led panel treatment and retains eight real destinations. Mobile becomes a readable vertical list. Closing reverses the circular reveal before navigation; Escape and keyboard focus use the same treatment.

The other pages repeat oversized headings, alternating text-led surfaces, animated repeated typography, expandable expertise content and project reveals. Nexus maps these patterns onto its real rules, runs, receipt and registration workflows rather than adding agency content or inventing activity.
