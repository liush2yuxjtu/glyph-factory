# Replit localization release

Release: `local-i18n-20260915.1`
Target app: `cf89d8d7-8c97-44f8-9848-abcb90ec3b8b` (HardtofindQualifiedSubweb).
Production: https://hardtofind-qualified-subweb--nyn5255.replit.app/

## Source boundary

The live Replit game is the English sci-fi Forge / System interface. This repository's original `public/play.html` is a different Chinese publishing game. Do not replace the Replit game with the repository root app, and do not change its economy, save schema, reset logic, assets, or hosting URL. This directory is an independently authored localization adapter for the existing Replit game, not a replacement application.

## Integration

Copy this directory from the pinned GitHub revision into a staging location without overwriting the existing app. Review the current app for an already-functional native language selector first; never install duplicate competing selectors. For a Vite app with exactly one `client/index.html` or `index.html`, run:

```sh
node /absolute/path/to/replit-localization/install.mjs /absolute/path/to/existing/replit/app
```

The installer embeds the reviewed adapter into that HTML entry and is idempotent. It does not edit game source, dependencies, or saved progress. An unknown entry layout, ambiguous entries, or a CSP meta tag causes a hard stop without editing the file. Do not weaken CSP to install the adapter. If the app is not compatible, report the actual layout rather than replacing or recreating the game.

Use the app's existing production build and publish settings. GitHub is the source for the adapter; Replit is only the integration and hosting target. Record the imported GitHub revision in deployment notes. Keep all unrelated workspace changes.

## Behavior

A visible top-of-page `简体中文` / `English` control defaults to Simplified Chinese, restores English originals on demand, and stores only `glyph-factory.locale`. It does not read or write the game's save. It handles dynamic DOM text, accessible labels, supported numeric phrases, and storage-unavailable errors. Code, user input, editable text, and explicitly untranslated elements are excluded. Brand/protocol identifiers remain unchanged.

The dictionary covers the observed Forge and System screens and common controls. Unknown strings deliberately remain unchanged. This is not a claim that unseen later-game content has been fully audited. Expand the source dictionary for any newly observed untranslated game copy, then retest and republish.

## Verification status: this adapter is not checked by this repository

The offline verifier (`test_verifier.py`) and the live acceptance driver (`verify_live.py`)
were removed on 2026-09-22 with the GitHub workflow that ran them. Nothing here executes
`glyph-language.js` any more, so the adapter now ships with **zero automated coverage**.

What that removes is the record of what used to pass, not a claim that anything still does:
23 isolated checks (16 offline Chromium UI tests over a fixture that mirrored the observed
initial and System screens, 7 Node installer tests) plus the live acceptance list below.
The fixture never was the full Replit source and opaque-origin storage was simulated, so even
then the coverage was adapter behavior, not native production persistence. Do not read the
absence of a verifier as a pass. Re-authoring one means restoring both scripts and running
them on the machine, which is where every other check in this repository now lives.

## Live acceptance, if this adapter is ever re-accepted

Kept as the human checklist, not as an automated gate:

- The public production URL visibly shows the selector and Chinese main controls.
- Forge works in both languages; switching does not change resource totals.
- Reload preserves selected language and existing progress using real browser storage.
- System labels and dangerous-action warning are translated; do not activate reset.
- Check mobile controls and newly unlocked content for untranslated strings.
- Confirm `window.GlyphLanguage.version` is `local-i18n-20260915.1` when this adapter is used.

A deployment status alone never proved these checks pass. At the time this document was
authored, production verification for this adapter was pending — and it still is.
