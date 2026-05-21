#!/usr/bin/env bash
# Usage: ./scripts/publish-package.sh <package-name>
# Reads packages/<pkg>/package.json for the version and publishes to npm.
# Idempotent: skips if the version is already on npm.
set -euo pipefail

command -v jq >/dev/null || { echo "Missing required tool: jq"; exit 1; }

PKG="${1:?Usage: $0 <package-name>}"
PKG_DIR="packages/${PKG}"

PKG_NAME=$(jq -r .name "${PKG_DIR}/package.json")
LOCAL_VERSION=$(jq -r .version "${PKG_DIR}/package.json")

existing=$(npm view "${PKG_NAME}@${LOCAL_VERSION}" version 2>/dev/null || echo "")
if [ "$existing" = "$LOCAL_VERSION" ]; then
  echo "Skipping ${PKG_NAME} (version ${LOCAL_VERSION} already on npm)"
  exit 0
fi

dist_tag=""
if [[ "$LOCAL_VERSION" == *-* ]]; then
  rest="${LOCAL_VERSION#*-}"
  dist_tag="${rest%%.*}"
fi
tag_args=()
[ -n "$dist_tag" ] && tag_args=(--tag "$dist_tag")

echo "Publishing ${PKG_NAME}@${LOCAL_VERSION}${dist_tag:+ (--tag ${dist_tag})}"
pnpm -F "$PKG_NAME" publish --access public --no-git-checks "${tag_args[@]}"
