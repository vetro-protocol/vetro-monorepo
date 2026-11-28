#!/bin/sh

set -e

LAST_CHANGE_HASH=$(git log -1 --format=%H -- ./)
git show --name-only --pretty=fuller "$LAST_CHANGE_HASH" -- ./

MERGE_HASH=$(git rev-list --merges --ancestry-path --reverse "$LAST_CHANGE_HASH..master" | head -n 1)
if [ -z "$MERGE_HASH" ]; then
  echo "Cannot apply tag: Latest changes not merged to master yet."
  exit 1
fi
git show --no-patch --pretty=fuller "$MERGE_HASH"

SUBGRAPH_NAME=${npm_package_name:-$(jq -r '.name' <package.json)}
SUBGRAPH_VERSION=${npm_package_version:-$(jq -r '.version' <package.json)}
git tag -s -m "" "$SUBGRAPH_NAME@$SUBGRAPH_VERSION" "$MERGE_HASH"
