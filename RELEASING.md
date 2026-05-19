# Releasing `@vetro-protocol/*` packages

The `bridge`, `earn`, `gateway`, and `treasury` packages are published to npm under the `@vetro-protocol` scope. Releases are aggregated: one umbrella git tag and one GitHub Release cover every package whose version was bumped since the last release.

## Per-PR rule

A PR that touches a publishable package's source must bump that package's `"version"` in the same PR. Pick the right level:

- `1.0.0-beta` → `1.0.0-beta.1`, `1.0.0-beta.2`, … while the package is in beta
- `1.0.0-beta` → `1.0.0` for the stable cut
- `1.0.0` → `1.0.1` / `1.1.0` / `2.0.0` after that, following SemVer

A PR that touches only non-publishable code (web, api, configs, tests, docs) does not need a version bump.

## Cutting a release

From a clean checkout of `master`:

```sh
./scripts/release.sh
```

The script:

1. Finds the previous `YYYYMMDD_N` tag (if any) and walks every `"private": false` package under `packages/`.
2. Skips packages whose `version` is unchanged.
3. Generates per-package release notes from PRs merged into `master` that touched the package path.
4. Picks a tag of the form `YYYYMMDD_N`, where `N` starts at `1` and increments if the date already has a release (e.g. `20260519_1`, then `20260519_2`).
5. Prompts for confirmation, then pushes the tag and creates a **draft** GitHub Release with the aggregated notes.

The release is intentionally a draft. Review the notes on GitHub, edit if needed, then click **Publish release**.

## What happens on publish

Publishing the GitHub Release fires `.github/workflows/publish.yml`, which runs `scripts/publish-changed.sh`. That script:

- Walks every `"private": false` package.
- Compares each `version` against npm via `npm view`.
- Publishes only versions that are not yet on npm.
- Adds a `--tag <prerelease>` dist-tag when the version has a prerelease suffix (e.g. `1.0.0-beta` → `--tag beta`). Stable versions go to `latest`.

The script is idempotent — re-publishing the same release (or re-running the workflow) is safe: anything already on npm is skipped.

## First-time setup

- The npm org `@vetro-protocol` must exist with publish rights for the publisher.
- Repo secret `NPM_TOKEN` must be set (used as `NODE_AUTH_TOKEN` in the workflow). Provenance requires a granular access token with the right scopes.
- Each script must be executable: `chmod +x scripts/*.sh`.

## Troubleshooting

- **The workflow ran but published nothing.** Expected when no `version` has changed since the previous npm publish. The log shows `Skipping <pkg> (version X already on npm)` for each one.
- **The draft release lists fewer packages than expected.** A package only appears if its `version` in `package.json` differs from the version at the previous release tag. Bump the version, commit, re-run `release.sh`.
- **Provenance fails.** The workflow needs `id-token: write` (already set) and an npm token with provenance scope.
