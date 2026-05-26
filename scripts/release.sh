#!/usr/bin/env bash
# Usage: ./scripts/release.sh <package-name>
# Example: ./scripts/release.sh bridge
set -euo pipefail

for cmd in jq gh; do
  command -v "$cmd" >/dev/null || { echo "Missing required tool: $cmd"; exit 1; }
done

PKG="${1:-}"
[ -n "$PKG" ] || { echo "Usage: $0 <package-name>"; exit 1; }

PKG_DIR="packages/${PKG}"
[ -f "${PKG_DIR}/package.json" ] || { echo "No package at ${PKG_DIR}"; exit 1; }

publishable=$(jq -r '.private == false' "${PKG_DIR}/package.json")
[ "$publishable" = "true" ] || { echo "${PKG} is not publishable (private !== false)"; exit 1; }

VERSION=$(jq -r .version "${PKG_DIR}/package.json")
TAG="${PKG}@${VERSION}"

# Remote is the source of truth for tags; sync before any tag-state check so
# this works on a fresh clone or after a prior run on a teammate's machine.
git fetch --tags --quiet origin

if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  echo "Tag ${TAG} already exists. Bump the version in package.json first."
  exit 1
fi

# Previous tag for THIS package (most recent <pkg>@* tag, from origin after the fetch above).
# --sort=-version:refname uses git's semver-aware version sort (descending), so
# 1.0.1 > 1.0.0 > 1.0.0-beta — prereleases correctly rank below their stable.
PREV_TAG=$(git tag --list "${PKG}@*" --sort=-version:refname | head -n1 || true)

if [ -z "$PREV_TAG" ]; then
  # First GitHub-driven release for this package — don't dump full history.
  NOTES="_Initial GitHub release of @vetro-protocol/${PKG}._"
else
  # Per-PR notes scoped to this one package's path, bounded by the previous tag.
  # Uses --first-parent so each PR is one line (the merge commit) and feature-branch
  # commits don't show as separate entries. Direct-to-master commits (no PR) fall back
  # to subject + SHA.
  NOTES=$(
    git log "${PREV_TAG}..HEAD" --first-parent --pretty='%H|%s' -- "${PKG_DIR}/" \
    | while IFS='|' read -r sha subject; do
        if [[ "$subject" =~ ^Merge\ pull\ request\ \#([0-9]+) ]]; then
          pr=${BASH_REMATCH[1]}
          gh pr view "$pr" --json number,title,author \
            --jq '"- \(.title) by @\(.author.login) in #\(.number)"' \
            2>/dev/null || echo "- PR #${pr} (info unavailable)"
        elif [ -n "$subject" ]; then
          echo "- ${subject} (${sha:0:7})"
        fi
      done
  )

  [ -n "$NOTES" ] || NOTES="_No commits touched ${PKG_DIR}/ since ${PREV_TAG}._"
fi

echo "Package:  ${PKG}"
echo "Version:  ${VERSION}"
echo "Tag:      ${TAG}"
echo "Prev tag: ${PREV_TAG:-(none)}"
echo
echo "Notes:"
echo "$NOTES"
echo
read -rp "Create draft release ${TAG}? [y/N] " ok
[ "$ok" = "y" ] || exit 1

git tag "${TAG}"
git push origin "${TAG}"
gh release create "${TAG}" --title "${TAG}" --notes "$NOTES" --draft

echo
echo "Draft release created. Review at:"
gh release view "${TAG}" --json url --jq .url
echo
echo "When ready, click 'Publish release' on GitHub. That fires the workflow and publishes ${PKG} to npm."
