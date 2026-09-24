#!/bin/bash
# Installs what /verify needs in a Claude Code on the web container: node deps for the
# fast gate, and the pinned Python Playwright plus *its own* chromium and webkit builds.
# The package and the browser cache must match, or every browser stage dies in setUpClass
# with "Executable doesn't exist" (see the Playwright gotcha in .claude/skills/verify/SKILL.md).
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

npm install --no-audit --no-fund

python3 -m pip install --quiet -r tests/browser/requirements.txt
python3 -m playwright install --with-deps chromium webkit
