#!/usr/bin/env bash
set -euo pipefail

# -----------------------------
# release.sh
# Bumps version, tags, and pushes to origin/main.
# Usage:
#   ./release.sh [patch|minor|major|prepatch|preminor|premajor|prerelease|<x.y.z>] [preid]
#
# Examples:
#   ./release.sh                     # defaults to patch
#   ./release.sh minor               # 1.2.3 -> 1.3.0
#   ./release.sh major               # 1.2.3 -> 2.0.0
#   ./release.sh prerelease rc       # 1.2.3 -> 1.2.4-rc.0  (or bumps existing -rc.X)
#   ./release.sh preminor beta       # 1.2.3 -> 1.3.0-beta.0
#   ./release.sh 2.1.0               # sets exact version
# -----------------------------

usage() {
  cat <<'USAGE'
Usage:
  ./release.sh [patch|minor|major|prepatch|preminor|premajor|prerelease|<x.y.z>] [preid]

Notes:
  - If omitted, the bump defaults to "patch".
  - For pre* bumps (prepatch|preminor|premajor|prerelease), you may provide a preid
    (e.g. "beta", "rc"). If omitted, the script defaults to "beta".
  - When specifying an exact version (e.g. "2.1.0"), do not pass a preid.

Examples:
  ./release.sh
  ./release.sh minor
  ./release.sh major
  ./release.sh prerelease rc
  ./release.sh preminor beta
  ./release.sh 2.1.0
USAGE
}

# Parse args
BUMP="${1:-patch}"
PREID="${2:-}"

# Allow -h/--help
if [[ "${BUMP}" == "-h" || "${BUMP}" == "--help" ]]; then
  usage; exit 0
fi

# Helpers
is_semver() {
  # Matches 1.2.3, 1.2.3-beta.0, 10.11.12-rc.1+meta
  [[ "$1" =~ ^[0-9]+(\.[0-9]+){2}(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$ ]]
}

# Validate combination
case "$BUMP" in
  patch|minor|major)
    if [[ -n "$PREID" ]]; then
      echo "❌ 'preid' is not valid with '$BUMP' bumps."
      usage; exit 1
    fi
    ;;
  prepatch|preminor|premajor|prerelease)
    # preid optional; we'll default to 'beta' if not provided
    ;;
  *)
    if is_semver "$BUMP"; then
      if [[ -n "$PREID" ]]; then
        echo "❌ Do not pass a preid when specifying an exact version ($BUMP)."
        usage; exit 1
      fi
    else
      echo "❌ Unknown bump '$BUMP'."
      usage; exit 1
    fi
    ;;
esac

# Safety checks
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$current_branch" != "main" ]]; then
  echo "❌ You must release from 'main' (current: $current_branch)"; exit 1
fi
if ! git diff-index --quiet HEAD --; then
  echo "❌ Working tree not clean. Commit or stash changes."; exit 1
fi

# Update & verify
git pull --ff-only
npm ci
npm test
npm run build

# Commit message template (%s is replaced by version)
MSG='release: %s'

# Version bump
if is_semver "$BUMP"; then
  npm version "$BUMP" -m "$MSG"
else
  if [[ "$BUMP" == prepatch || "$BUMP" == preminor || "$BUMP" == premajor || "$BUMP" == prerelease ]]; then
    if [[ -z "$PREID" ]]; then
      PREID="beta"
      echo "ℹ️  No preid provided for '$BUMP'; defaulting to '$PREID'."
    fi
    npm version "$BUMP" --preid "$PREID" -m "$MSG"
  else
    npm version "$BUMP" -m "$MSG"
  fi
fi

# Push branch + tags (triggers your CI publish)
git push origin main --follow-tags

NEW_VER=$(node -p "require('./package.json').version")
echo "✅ Released v$NEW_VER (tag v$NEW_VER pushed)"
