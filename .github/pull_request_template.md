## Player behavior changed

Describe the player-visible behavior. Keep internal surprise descriptions in design docs.

## Regression evidence

- Reproduction/test that fails before the fix:
- Fix and unchanged gameplay constraints:
- Exact commit tested and `npm run verify:fast` result:
- Chromium and WebKit results / trace artifacts:

## Review contract

Do not mark this verified based only on a Vercel READY badge or source-string checks.
Discovered controls must survive resource depletion and reload. New secrets must stay
out of the visible UI, accessibility tree and deployed review artifacts.
`Player merge gate` must pass for the exact commit under review.
