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

## Tests

`tests/progressive-disclosure.test.mjs` protects both:

- one-way persistent disclosure: hidden → discovered → persistent;
- spoiler separation: internal review material is not shipped in the production player bundle.

When adding a new Aha moment, update the internal design spec and trigger tests, not the player-facing copy catalog.
