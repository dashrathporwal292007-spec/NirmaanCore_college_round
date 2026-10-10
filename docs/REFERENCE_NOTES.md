# Reference study — Ownitt

Inspected https://ownitt.fr with local Playwright Chromium at 1440×900 and 390×844. Captures and raw computed styles are in `docs/screenshots/reference/`. These are study material, not product assets.

The site alternates cream (#F4F1EA) and near-black (#0A0A0B); the requested Nexus direction stays black. Its opening includes a branded intro and a cream hero. The menu becomes clearly visible after scrolling. This is not an interaction Nexus needs to reproduce.

## Measured typography and rhythm

- Display: Elza Condensed, weight 800. Desktop showreel heading 86.4px / 82.08px, tracking −2.16px; large definition 230.4px / 198.144px, tracking −6.912px. Mobile equivalents 38.4px / 36.48px and 64px / 55.04px.
- Serif: IvyPresto Display. Desktop question 100.8px / 102.816px, tracking −1.512px; project introduction 79.2px / 80.784px, weight 300. Mobile question 38.4px / 39.168px.
- Desktop text section padding 144px 86.4px. Project index 153px 86.4px 63px. Territories section 162px 86.4px 144px. Most structural separation comes from spacing and thin rules, rather than card containers.
- Nexus uses OFL fonts already installed and self-hosted through next/font/local: Big Shoulders Display, Instrument Serif italic, Public Sans and JetBrains Mono. No reference font, image, logo, monogram, motif or copy is used.

## Interactions

The menu button reports aria-expanded and aria-controls. Opening produces a full-screen overlay with large navigation and smaller descriptions. Button entrance: opacity 500ms and transform 550ms, cubic-bezier(0.16,1,0.3,1); label width 800ms cubic-bezier(0.65,0,0.35,1); word hover transform 450ms cubic-bezier(0.5,0,0.1,1).

The numbered project index relies on typography, compact metadata and hover contrast rather than repeated cards. Territories reveal moving repeated titles and services on hover. Measured overlay opacity transition: 300ms cubic-bezier(0.16,1,0.3,1); territory title track 22 seconds and service track 28 seconds, linear. Project background text tracks run 380, 400 and 440 seconds; the duration is a loop period, not a measured pixel velocity. These timings are read from browser animations, not guessed from screenshots.

Nexus adopts a restrained 600ms ease-out reveal, an accessible full-screen menu, numbered rows and expandable rule explanations. It does not adopt the site's intro, cursor treatment, grain, rotating motifs, video or scroll-linked scenes. Its real-event ticker pauses on hover and focus and becomes static under reduced motion.

## Limits

The study captures a particular live-site state. Responsive scenes and scroll-dependent animations change what is visible; the raw JSON preserves the measured elements. No claim is made that every animation on the reference has been catalogued.
