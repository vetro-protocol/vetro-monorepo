#!/bin/sh

LAST_CHANGE_HASH=$(git log -1 --format=%H -- ./)
git show --name-only --pretty=fuller "$LAST_CHANGE_HASH" -- ./
wait

MERGE_HASH=$(git rev-list --merges --ancestry-path --reverse "$LAST_CHANGE_HASH..master" | head -n 1)
git show --no-patch --pretty=fuller "$MERGE_HASH"
wait

SUBGRAPH_NAME=${npm_package_name:-$(jq -r '.name' <subgraph/package.json)}
SUBGRAPH_VERSION=${npm_package_version:-$(jq -r '.version' <subgraph/package.json)}
git tag -s -m "" "$SUBGRAPH_NAME@$SUBGRAPH_VERSION" "$MERGE_HASH"
