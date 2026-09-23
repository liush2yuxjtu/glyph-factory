<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- verify-shift-left:start -->
## Pre-PR verification

Use /verify skill every time BEFORE we make a PR

- Canonical skill source: `liush2yuxjtu/claude-runtime-verification-skills@0d585c02bbeaa756e45865dd0a36f84d1b08f589`.
- Run relevant existing tests locally through `/verify` before PR creation.
- Keep test files in the repository; shift their execution left instead of deleting coverage.
- There is no CI. Every check that used to run in GitHub Actions now runs through `/verify` on the machine, except the Replit adapter checks, which were deleted outright rather than moved.
- Fixing the shift-left boundary belongs to the versioned skill and docs, not to a workflow file; do not reintroduce `.github/workflows/`.
- Do not open a PR on `FAIL` or `BLOCKED`. `SKIP` is only valid when the skill says no executable runtime behavior applies.

<!-- verify-shift-left:end -->

<!-- vercel-deploy-budget:start -->
## Vercel deploy budget

Every push to `main` triggers a billed Vercel production build. Preview deployments are disabled for this project, so branch pushes (including `gh-pages`) do not build on Vercel.

- Batch work: do not push to `main` after every small change. Collect related commits on a branch and land them in one squash merge.
- Do not push doc-only or agent-config-only changes (`*.md`, `.agents/`, `.claude/`) to `main` on their own; let them ride with the next real code change.
- Do not run `vercel deploy` or `vercel --prod` unless the user explicitly asks for a deploy.
- If a production build fails, reproduce and fix it locally with `/verify` before pushing again. Never push repeatedly just to see whether the Vercel build passes.
<!-- vercel-deploy-budget:end -->
