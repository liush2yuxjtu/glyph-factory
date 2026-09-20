---
name: verify
description: Verify Glyph Factory changes by running its real browser surfaces and the repository's verification harness, then capturing exact-candidate visual and interaction evidence.
---

# Verify Glyph Factory

Upstream behavior reference:
`https://raw.githubusercontent.com/asgeirtj/system_prompts_leaks/main/Anthropic/claude-code/skills/verify/SKILL.md`

## Candidate

Verify the exact commit/PR candidate. For deployed behavior, use the exact Preview/Pages URL for that SHA.

## Launch

From repo root:

```bash
npm run dev
```

Default Next.js readiness is the local URL printed by the dev server.

The repository also provides:

```bash
npm run verify:fast
npm run verify
```

`npm run verify` runs the Node contract suite, static build, and browser unittest layer. Treat those as supporting harness evidence; still drive the user-facing surface for UI changes.

## Drive

Use Playwright/Chromium (and WebKit when cross-engine behavior is relevant).

Important user surfaces:
- `/`
- `/aha-lab`
- `/product-demo`
- any changed developer/asset surface present in the candidate

For Aha Lab or asset changes:
1. navigate to the exact route;
2. trigger the changed asset/screen interaction;
3. confirm the expected visual/state transition;
4. capture the resulting screen and any relevant browser errors.

For product-demo changes, interact with the demo rather than accepting an idle screenshot.

## Evidence

Write candidate-specific screenshots and browser observations under:

`/tmp/glyph-factory-verify/<sha-or-pr>/`

Record route, viewport/browser, action, and resulting state. Build/test success alone is not a UI PASS.

## Probe

Exercise one adjacent state: alternate asset, repeated interaction, resize/mobile viewport, missing/invalid input, or another browser engine when the diff suggests it.

## Cleanup

Stop the dev server/browser sessions started by verification. Preserve evidence.

## Maintain this verifier

Update only when actual launch commands, routes, browser harness, or proof requirements change.
