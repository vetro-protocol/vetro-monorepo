#!/usr/bin/env bash
set -euo pipefail

# Publish to npm every "private": false package under packages/ whose local
# version is ahead of what's on npm. Invoked by .github/workflows/publish.yml
# when a GitHub Release is published. Idempotent: packages already at the
# local version on npm are skipped, so re-runs are safe.

if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq is required but not installed. See https://jqlang.org/download/" >&2
  exit 1
fi

for pkg_dir in packages/*/; do
  pkg_dir=${pkg_dir%/}
  publishable=$(jq -r '.private == false' "${pkg_dir}/package.json")
  [ "$publishable" = "true" ] || continue

  pkg_name=$(jq -r '.name' "${pkg_dir}/package.json")
  local_version=$(jq -r '.version' "${pkg_dir}/package.json")

  existing=$(npm view "${pkg_name}@${local_version}" version 2>/dev/null || echo "")
  if [ "$existing" = "$local_version" ]; then
    echo "Skipping $pkg_name (version $local_version already on npm)"
    continue
  fi

  # Compute the dist-tag from a prerelease suffix: 1.0.0-beta.1 → beta, 1.0.0 → ""
  dist_tag=""
  if [[ "$local_version" == *-* ]]; then
    pre="${local_version#*-}"
    dist_tag="${pre%%.*}"
  fi
  tag_args=()
  [ -n "$dist_tag" ] && tag_args=(--tag "$dist_tag")

  echo "Publishing $pkg_name@$local_version${dist_tag:+ (--tag $dist_tag)}"
  pnpm -F "$pkg_name" publish --access public --provenance --no-git-checks "${tag_args[@]}"
done
