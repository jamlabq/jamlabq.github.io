# jamlab homepage — first visual prototype

Goal: build a reviewable homepage expressing a playful private laboratory with serious engineering at its heart. User requested a first page to view, so implementation proceeds directly from the supplied scene brief. No public deployment in this iteration.

Design: warm paper, charcoal type, vermilion tools and mint light. A bespoke orthographic 3D workshop anchors the hero: playful desk experiments and a heavy, futuristic core machine in the rear corner. Headline: 把好奇心，折腾成真。 The core is a visual concept for the laboratory, not an assertion about an existing physical product.

Files:
- index.html: accessible navigation, hero, object exploration, LearnEverything link, future project slot and about section.
- styles.css: responsive composition, focus, reduced motion, light/dark lab states.
- lab-scene.mjs: locally vendored Three.js scene; geometric equipment, lighting, bounded animation, resize handling, DOM hotspot projection, fallback image.
- app.mjs: object selection, core activation, day/night switch, pause, native information dialog, escape/focus behavior.
- vendor/: pinned Three.js 0.169.0 and MIT license; no runtime CDN dependency.
- assets/: local favicon and static scene fallback captured from the actual render.
- tests/browser_check.py: real-browser check of navigation, interactions, narrow layouts, reduced motion, fallback and links.

Implementation:
1. Create static page and distinctive typographic layout.
2. Build laboratory with core, workbench, small robot, oscilloscope, rover and shelf details. Add meaningful interaction controls accessible without canvas or pointer.
3. Connect project links and honest concept explanations. Persist no personal data; require no account.
4. Inspect rendered desktop/mobile screenshot and refine lighting/composition.
5. Verify all interactions, reduced motion, WebGL failure fallback, no horizontal overflow and static hosting. Start local preview.

Hosting: public API returned 404 for jamlabq/jamlabq.github.io and root domain. Prepare this separate directory for the GitHub user-site repository; do not replace LearnEverything or publish yet.
