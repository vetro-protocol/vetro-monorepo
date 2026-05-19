#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh CLI is required but not installed. See https://cli.github.com/" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "error: gh CLI is not authenticated. Run 'gh auth login' first." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq is required but not installed. See https://jqlang.org/download/" >&2
  exit 1
fi

LAST_RELEASE_TAG=$(git describe --tags --abbrev=0 --match "[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]_*" 2>/dev/null || echo "")
NOTES=""
CHANGED=()

# Build GitHub-style per-package notes from PRs merged into master that touched the path.
# Uses --first-parent so each PR is one line (the merge commit) and feature-branch commits
# don't show as separate entries. Direct-to-master commits (no PR) fall back to subject + SHA.
# Create a draft release with these notes. Manual publish on GitHub UI
build_pkg_notes() {
  local pkg_dir=$1
  local range
  if [ -n "$LAST_RELEASE_TAG" ]; then
    range="${LAST_RELEASE_TAG}..HEAD"
  else
    range="HEAD"
  fi

  while IFS='|' read -r sha subject; do
    if [[ "$subject" =~ ^Merge\ pull\ request\ \#([0-9]+) ]]; then
      local pr=${BASH_REMATCH[1]}
      if ! gh pr view "$pr" --json number,title,author \
            --jq '"- \(.title) by @\(.author.login) in #\(.number)"' 2>/dev/null; then
        echo "- PR #${pr} (info unavailable)"
      fi
    elif [ -n "$subject" ]; then
      echo "- ${subject} (${sha:0:7})"
    fi
  done < <(git log $range --first-parent --pretty='%H|%s' -- "${pkg_dir}/")
}

for pkg_dir in packages/*/; do
  pkg_dir=${pkg_dir%/}
  publishable=$(jq -r '.private == false' "${pkg_dir}/package.json")
  [ "$publishable" = "true" ] || continue

  pkg_name=$(jq -r '.name' "${pkg_dir}/package.json")
  local_version=$(jq -r '.version' "${pkg_dir}/package.json")

  if [ -n "$LAST_RELEASE_TAG" ]; then
    prev_version=$(git show "${LAST_RELEASE_TAG}:${pkg_dir}/package.json" 2>/dev/null \
      | jq -r '.version // ""' 2>/dev/null \
      || echo "")
  else
    prev_version=""
  fi

  if [ "$local_version" = "$prev_version" ]; then
    echo "Skipping ${pkg_name} (still at ${local_version})"
    continue
  fi

  pkg_notes=$(build_pkg_notes "$pkg_dir")

  CHANGED+=("${pkg_name}@${local_version}")
  NOTES+="## ${pkg_name}@${local_version}${prev_version:+ (was ${prev_version})}
${pkg_notes}

"
done

if [ ${#CHANGED[@]} -eq 0 ]; then
  echo "No publishable packages have a new version since ${LAST_RELEASE_TAG:-(initial)}. Nothing to release."
  exit 0
fi

DATE=$(date -u +%Y%m%d)
N=1
NEW_TAG="${DATE}_${N}"
while git rev-parse -q --verify "refs/tags/${NEW_TAG}" >/dev/null; do
  N=$((N + 1))
  NEW_TAG="${DATE}_${N}"
done

echo "Packages to release: ${CHANGED[*]}"
echo "Tag: ${NEW_TAG}"
echo
echo "Notes:"
echo "$NOTES"
echo
read -rp "Create draft release ${NEW_TAG}? [y/N] " ok
[ "$ok" = "y" ] || exit 1

git tag "${NEW_TAG}"
git push origin "${NEW_TAG}"
gh release create "${NEW_TAG}" --title "${NEW_TAG}" --notes "$NOTES" --draft

echo
echo "Draft release created. Review at:"
gh release view "${NEW_TAG}" --json url --jq .url
echo
echo "When ready, click 'Publish release' on GitHub. That fires the workflow and publishes to npm."
