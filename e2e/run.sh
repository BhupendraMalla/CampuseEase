#!/usr/bin/env bash
# Run the CampusEase end-to-end demo + smoke test (records a video).
# Playwright is borrowed from the Playwright-MCP install so nothing is added
# to the app's package.json. Override PW_PATH if your install differs.
set -euo pipefail
cd "$(dirname "$0")/.."

PW_PATH="${PW_PATH:-/Users/nirajkafle/.npm/_npx/e41f203b7505f1fb/node_modules}"
if [ ! -d "$PW_PATH/playwright" ]; then
  echo "playwright not found at $PW_PATH — set PW_PATH or run: npx playwright install chromium" >&2
  exit 1
fi

NODE_PATH="$PW_PATH" node e2e/demo.mjs
