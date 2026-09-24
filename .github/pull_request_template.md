## Player behavior changed

Describe the player-visible behavior. Keep internal surprise descriptions in design docs.

## Regression evidence

- Reproduction/test that fails before the fix:
- Fix and unchanged gameplay constraints:
- Exact commit tested and `npm run verify:fast` result:
- Chromium and WebKit results / trace artifacts (from `/verify`, not from CI):

## Review contract

Do not mark this verified based only on a Vercel READY badge or source-string checks.
Discovered controls must survive resource depletion and reload. New secrets must stay
out of the visible UI, accessibility tree and deployed review artifacts.
There is no CI to fall back on: `/verify` must have run on the exact commit under review,
and every stage it names must be one that actually ran. An unrun stage is not a pass.
