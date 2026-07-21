---
name: run-checks
description: Verify a change in this monorepo — typecheck, lint, and test, scoped to what you touched (with whole-repo and E2E fallbacks). Use after any non-trivial edit to web/, api/, packages/, or subgraph/, and whenever the user asks to "verify", "run the checks", "make sure it passes", or before opening a PR.
---

# Verify (VETRO monorepo)

Verify locally with a **scoped** run keyed to what you changed — typecheck +
test just that workspace and its dependents. You don't need to re-run the whole
suite locally: **every PR runs the full matrix in CI** (all workspaces via
[`js-checks.yml`](../../../.github/workflows/js-checks.yml), plus the e2e suite
in [`e2e-tests.yml`](../../../.github/workflows/e2e-tests.yml)). For a big or
cross-cutting change you can widen the scope to the whole repo (§2), but that's
the exception.

## 1. Scoped verification (default — run only what you touched)

Typecheck + test the changed workspace and its dependents. A **leading** `...` in
a filter (`...<pkg>`) adds dependents, so a change in a shared package still
re-tests `web`/`api`. (A _trailing_ `...` would instead pull in the package's
dependencies — the wrong direction here.)

- Changed a **package** (`packages/*`) — its typecheck _is_ its `build`
  (`tsc --noEmit`, no bundle):

  ```bash
  pnpm --filter @vetro-protocol/<pkg> run build          # typecheck the package
  pnpm --filter '...@vetro-protocol/<pkg>' run test      # its + dependents' tests
  ```

- Changed an **app** (`web`, `api`, `internal-dashboard`):

  ```bash
  pnpm --filter <app> run tsc
  pnpm --filter <app> run test
  ```

- Changed **`subgraph/`**:

  ```bash
  pnpm --filter vetro-app-subgraph run test    # matchstick: downloads a binary + runs codegen first (heavier)
  ```

- **Lint** is fast (`eslint --cache`) — just run `pnpm run lint`. **Formatting**
  is auto-applied by the `PostToolUse` prettier hook, so you rarely need to run
  it by hand.

Touched several areas or unsure of the blast radius? Widen to the whole repo
(§2).

## 2. Big change? Widen the scope to the whole repo

Most of the time you **don't** need this — **CI runs the full matrix on every
PR**, so a scoped §1 run plus CI is enough. But for a large or cross-cutting
change, a full local pass before pushing can be worth it: run the §1 steps
across every workspace instead of a scoped filter.

```bash
# typecheck everything — apps via tsc, packages via build (= tsc --noEmit)
pnpm -r --if-present run tsc && pnpm --filter='./packages/*' run build
# test every app + package (subgraph matchstick excluded — run it separately if you touched it)
pnpm --filter='!vetro-app-subgraph' -r --if-present run test
```

Lint, formatting, and knip are already whole-repo: `pnpm run lint`,
`pnpm run format:check`, `pnpm run deps:check`. Even this wide pass skips
`subgraph/` typecheck/lint (eslint ignores `subgraph/**`) and the e2e suite
(§3) — lean on CI for those.

## 3. E2E suite (web — heavy, opt-in)

```bash
pnpm --filter web test:e2e        # headless
pnpm --filter web test:e2e:ui     # headed
```

Playwright drives the real app against a local Anvil mainnet fork with a headless
auto-connecting mock wallet — on-chain reads/writes hit the fork, off-chain HTTP
is stubbed. Specs are [`web/e2e/*.spec.ts`](../../../web/e2e); config is
[`web/playwright.config.ts`](../../../web/playwright.config.ts); on-chain seeding
helpers live in [`web/scripts/`](../../../web/scripts). Kept out of required CI
checks while still stabilizing (see
[`.github/workflows/e2e-tests.yml`](../../../.github/workflows/e2e-tests.yml)).
Run it when a web change warrants a full assertive pass.

## Gotchas

- **One fork at a time.** e2e specs share Anvil port `8545` and dev-server port
  `5174`. Never run two specs concurrently, and never `pnpm --filter web dev`
  while a spec runs — they collide.
- **Typecheck is two passes:** apps via `tsc`, packages via `build` (= `tsc
--noEmit`). The `--if-present` on the `tsc` pass just skips workspaces without a
  `tsc` script — packages aren't missed, they're covered by the `build` pass.
- **knip is whole-repo** (can't be meaningfully scoped) — it analyzes every
  workspace and only ignores `web/scripts/*` as a path (see
  [`.knip.json`](../../../.knip.json)). Run it in a whole-repo pass or leave it to
  CI, not every tight loop.
