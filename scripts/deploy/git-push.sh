#!/usr/bin/env bash
set -euo pipefail

# Usage:
# ./scripts/git-push.sh "Commit message"
# If no message is provided, a timestamped default message will be used.

if [ -n "${1-}" ]; then
  msg="$*"
else
  msg="Auto commit $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
fi

echo "Staging all changes..."
git add -A

# If there are no staged changes, push anyway
if git diff --staged --quiet; then
  echo "No changes to commit. Pushing current branch..."
  branch=$(git rev-parse --abbrev-ref HEAD)
  git push origin "$branch"
  exit 0
fi

echo "Committing: $msg"
git commit -m "$msg"

branch=$(git rev-parse --abbrev-ref HEAD)

echo "Pushing branch $branch to origin..."
git push origin "$branch"

echo "Done."
