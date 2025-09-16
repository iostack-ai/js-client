#!/usr/bin/env bash
set -euo pipefail

# Usage: ./release.sh [patch|minor|major|prerelease] [commit-message]
BUMP_TYPE="${1:-patch}"
COMMIT_MSG="${2:-"release: %s"}"  # %s will be replaced with the version by npm

# 1) Ensure we're on main and working tree is clean
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$current_branch" != "main" ]]; then
  echo "❌ You must release from 'main' (current: $current_branch)"; exit 1
fi
if ! git diff-index --quiet HEAD --; then
  echo "❌ Working tree not clean. Commit or stash changes."; exit 1
fi

# 2) Update, install, test, build
git pull --ff-only
npm ci
npm test
npm run build

# 3) Bump version (creates commit + tag)
npm version "$BUMP_TYPE" -m "$COMMIT_MSG"

# 4) Push branch + tags (triggers CI publish)
git push origin main --follow-tags

# 5) Show what we did
NEW_VER=$(node -p "require('./package.json').version")
echo "✅ Released v$NEW_VER (tag v$NEW_VER pushed)"
