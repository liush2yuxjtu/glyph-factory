# Aha spoiler boundary

Audience: developers and reviewers. This document is not player-facing copy.

## Contract

The A01–A28 catalog is an internal implementation/design model. Production players must not receive the catalog as a visible roadmap or explanatory layer.

Normal player surfaces must not expose:

- the strings `Aha`, `A01`–`A28`, `NEXT AHA`, or the reveal catalog;
- Director Mode or the review preview link;
- future-act roadmap copy;
- Aha-trigger log entries;
- designer explanations such as “this is the moment the objective flips”.

The game can still use internal Aha IDs to drive deterministic state and tests.

## Scope: the game, not the repository

The boundary protects **the player surfaces**: the deployed `dist/` and the dev player on
`/`. It does not make the catalog secret. The repository is public, and so are its design
materials: `aha.md` on `main`, and the GitHub Pages site built from the `gh-pages` branch
(`aha.md`, `aha-flow/`, `asset-gallery/`). Someone who goes looking can read every Aha; a
player who just plays must never be shown one ahead of time.

So design and review surfaces (`docs/`, `aha.md`, the asset gallery, Pages) may name
A01–A28 freely, and a review that flags one of them as a spoiler leak is out of scope. What
stays in scope is anything that reaches a player through the game itself, which the build
and runtime boundaries below enforce.

## Build boundary

`scripts/build-static.mjs` is the production boundary.

It must:

1. build only the playable player HTML and runtime files into `dist/`;
2. not copy `public/preview.html`, `public/intent.html`, or the review trailer into `dist/`;
3. strip Aha title/reveal strings from the deployed engine/controller payloads;
4. inject/load `player-privacy-v3.js` to remove review affordances and scrub internal event lines from the visible status/log;
5. emit `build.json` with `playerSpoilers: false` and `internalReviewArtifactsDeployed: false`.

The source review assets can remain in the repository for designers/developers and local review.

## Local review

Director/preview behavior is allowed only as explicit local tooling. `player-privacy-v3.js` only permits review bypass on `localhost` / `127.0.0.1` with `?review=1` or `?director=1`.

Production Vercel hostnames always run through the player privacy boundary even if query parameters are manually supplied.

## Chinese-player rule

Chinese production UI should sound like the world, not like a design document. Do not show ACT numbering, engine version labels, reveal IDs, future feature names, or Aha explanations. Let the mechanic itself communicate the discovery.

## Runtime boundary on the source surface

The build boundary above does not cover `public/`. The dev player surface ships no baked
`data-audience` attribute and no `!important` hide rules, so the boundary there rests on
`player-privacy-v3.js` alone — and the controller re-renders every 500ms. A strip applied
once at load is therefore not a boundary: an Aha entering the save made `glyph-game-v3.js`
re-show `#aha-list` and its panel header on the next render, putting an `A01 · …` card and
the `AHA MOMENTS · 28` heading back in front of a player on `/`.

Two rules keep it:

1. `player-privacy-v3.js` re-asserts the hidden set on every observed mutation, not only at
   load. `hide()` is idempotent, so the re-assert cannot re-enter its own observer.
2. The controller gates its own reveal rules on the audience (`isPlayerAudience()` in
   `glyph-game-v3.js`). The Aha list, its panel header and Director Mode must not be
   re-shown by a later render.

A player on `/` must see none of that **after** the first Aha lands, not only on a fresh
save. Review and production are unaffected: the review artifact sets
`data-audience="review"`, and the built player bakes `data-audience="player"`.

## Tests

`tests/progressive-disclosure.test.mjs` protects both:

- one-way persistent disclosure: hidden → discovered → persistent;
- spoiler separation: internal review material is not shipped in the production player bundle.

`tests/browser/test_player_source_privacy.py` protects the source surface above. It serves
`public/` on an ephemeral port (the `dist/` suites cannot reach this defect), drives the real
first Aha, and asserts the boundary across timer renders and a reload. It carries a negative
control that restores the pre-fix code and requires the leak to reappear, plus an insurance
test that removes the controller gate and requires the runtime strip to hold anyway.

When adding a new Aha moment, update the internal design spec and trigger tests, not the player-facing copy catalog.
