# Domain

VETRO is a protocol for minting and managing pegged tokens and putting them to work for yield.
The `web/` app exposes the Swap, Earn, Borrow, Bridge, Liquidity, and Analytics pages. The glossary below is always available; when working on a specific feature, read `docs/DOMAIN.md` for the full per-page flows.

@docs/glossary.md

## Coding Conventions

### CSS

- Use tailwind v4 classes
- In `@apply`, use shorthand classes (`size-*` for equal width and height); lint doesn't check CSS files.
- **Minimum supported width**: 400px. Layouts must not overflow at 400px or above. Do not check smaller viewports.

### JavaScript/TypeScript

- **Alphabetical sorting**: Sort named import members alphabetically
- **Function declarations**: Use full function expressions, not arrow functions. Exception: single-expression arrow functions with implicit returns are allowed (e.g., `const foo = () => 0;` or `array.filter(element => element > 45)`)
- **Variable naming**: Use camelCase for variables
- **Function parameters**: Use an object for functions requiring 3+ parameters. Exception: facade/adapter functions may maintain their original signature
- **Comparing addresses**: When comparing `Address` values (the type from `viem`), prefer `isAddressEqual` imported from `viem` over direct equality checks
- **Actions over client extension**: Call actions in the standalone `actionFn(client, params)` form instead of decorating the client via `.extend()`. This applies to both viem's native actions (e.g. `readContract(client, params)`) and our `@vetro-protocol/*` package actions (import from the package's `/actions` subpath). Keep the client plain. This yields simpler types — the `Client` type stays lean instead of accumulating every extended action — and lets bundlers tree-shake the actions you don't call.
- **Comments**: Explain only the non-obvious "why", not what the code does. Update comments or docstrings that your change makes stale.
- **Fix sibling code**: When fixing a bug or extracting a shared helper/component, apply the same change to sibling code with the same pattern. If that's out of scope, list the remaining gaps in the PR description.
- **Export on demand**: Don't export types or helpers until a consumer needs them.

### Web app (`web/`)

- **Geo-blocking**: Every action that sends a transaction must be disabled when `isGeoRestricted()` (`web/src/utils/geoRestriction.ts`) returns true. This includes actions that only return funds to the user (claim, withdraw, cancel, repay). It also includes buttons inside drawers and modals (confirm, submit, Retry), even when they open only from a blocked button.
  - For a plain button, use `GeoRestrictedButton` (`web/src/components/geoRestrictedButton.tsx`). It disables the button, shows the `common.geo-restriction-title` tooltip, and checks again on click. If the button needs its own tooltip, pass it in the `tooltip` prop. Do not wrap it in another `Tooltip`.
  - The tooltip wraps the button in a `w-fit` element. If a parent sizes its children (`*:flex-1`, `*:w-full`), also add `[&_button]:w-full`.
  - For other controls (form submit buttons, icon buttons), check `isGeoRestricted()` in the component that renders the control.
- **Values the chain knows**: Don't hardcode gas limits, terms hashes, prices, ratios or decimals that the chain can provide. Estimate gas for the real call and read the rest on-chain. If a constant can't be avoided, comment where it comes from and verify it against that source. A value that rarely changes may be hardcoded as `placeholderData` for a `useQuery` hook that still reads it on-chain, so the UI renders fast and corrects itself if the value changes (e.g. `knownTokens`, `protocolGraph`). Exception: mock values used during development are fine behind a feature flag (`web/src/utils/featureFlags.ts`).
- **Keyboard and touch**: Every interactive element must work with the keyboard (Enter, Space, Escape) and on touch screens, so no content may be reachable only on hover. Collapsed or hidden content must not take focus (use `inert` or unmount it). UI that closes on a timer pauses while it has focus, as well as on hover.
- **Time-based status**: A status that depends on a timestamp (eligible, ready, expired, open) must update when that time passes, not only on the next fetch.

### TypeScript

- **Avoid `as any`**: Only use as a last resort when alternatives are significantly more complex
- **Expected errors**: Use `@ts-expect-error [explanation]` instead of `as any` for known type issues
- **Return types**: Omit explicit return types when the compiler can infer them. Keep type predicates, recursive function annotations, and annotations that check a served JSON shape against the type its clients use. Skip `subgraphs/vetro-app-subgraph` and `subgraphs/ve-vetro-subgraph`, where AssemblyScript requires annotations.
- **Running TypeScript files**: Use `node <path/to/file>.ts` directly — Node natively supports TypeScript execution
- **Component Props naming**: When creating a type for component props, use generic name `Props` if they're the only props defined in the file. Otherwise, use `<ComponentName>Props`

### Tests

- **Unit tests**: Prefer to unit test logic that is not UI, in `.ts` files (e.g. reducers, utils). A test that needs several levels of mocks often has little value; you can skip it.
- **No tests on configuration**: Do not add a test that only checks that a value matches its configuration (e.g. a constant, a hardcoded list, a config option). It repeats the configuration and cannot find a defect.
- **Component integration tests**: A component in `web/src/components/base` with interaction logic gets integration tests in `web/test/components/`. Many existing base components do not have tests yet. Important components outside `base` can also get them when their interaction logic is worth testing. Vitest reads tests only from `web/test`: a `.test.tsx` file runs in a real browser, and a `.test.ts` file runs in Node. Test behavior (values, roles, focus, callbacks), not class names or styles. Tailwind is not loaded.
- **Assert exact values**: Compare against an independently computed value (e.g. read the contract directly), not shape-only checks like `toMatch(/^\d+$/)`, which also pass on `0` or a decimals mixup.
- **Tests must be able to fail**: A test must fail if the behavior in its title breaks. Perform the action it names (focus, retry, submit) and assert the result. Use non-default inputs, such as a non-zero min-out, so a dropped parameter shows up.
- **Isolation**: Reset shared state between tests, such as the pointer position, timers and mocks, so a test doesn't depend on the one before it.

### Packages (`packages/`)

- **Contract address param**: Name the target contract's param `address` in new actions, as viem does. Some older actions use `vaultAddress`/`gatewayAddress`/`oftAddress`; don't copy those names.
- **Write actions**: Return `{ emitter, promise }` via `to-promise-event`, even for single transactions. Wrap third-party write actions that return a bare hash instead of re-exporting them.
- **Error paths**: Write-action tests cover every error event the action emits (validation, user rejection, failed transaction), as the sibling actions' tests do.
- **README sync**: The package README documents every `/actions` export and its params (including `encode*` helpers). Update it in the same change.
- **Match sibling packages**: A new package or action follows the closest existing one (`earn`, `gateway`, `bridge`) in validation, error events, the order of steps and test coverage. Note each intended difference in the PR.
- **Write action safety**:
  - Min-out params are required, with no `0n` default.
  - The signer is the wallet client's account, not a separate `account` param.
  - On-chain flags such as `enabled` are checked before sending.
  - A LayerZero fee is quoted again after any approval, right before the send. Check the native balance against the fee plus gas before the first transaction and again before the send.
- **OFT amounts**: Amounts that cross an OFT lose the dust below the shared decimals. Use the received amount for what the destination holds, and keep the sent or minted amount where accounting needs both.

### API project

Return every address in the checksummed format. External sources — subgraphs, third-party APIs — may return addresses in lowercase, so convert them with `checksumAddress` from `viem` before they go into a response.

Endpoints:

- **Requests**: Enforce body size limits while reading the body, not after buffering it, and don't trust `Content-Length`. Return 400 for malformed input before any check that returns 401 or 403. Expose the headers clients must read, such as `Retry-After`, through CORS.
- **Caching**: Don't cache a response, with `cache()` or `Cache-Control`, when the server checks its values against live config or env vars. Clients would read stale values after a deploy.
- **Upstream failures**: When an upstream fetch fails, keep the last good cached value. Never write partial data to the cache, and never return 200 with missing values replaced by zero. A response with a missing or non-finite value (`NaN`, a missing field, or `null` coerced to `0`) counts as a failure, unless the field is documented as nullable. A missing value may be `null` only when `api/README.md` documents the field as nullable and clients show it as unknown (e.g. `apr` and `volumeUsd24h` on `/liquidity/pools`).

When changing the API in `api/src/` in a way that affects external behavior — adding, removing, or modifying an endpoint's URL, params, response shape (field names, types, and nullability), sample data, or error semantics — review and update `api/README.md` in the same change. Code is the source of truth; the README must reflect it.

### Subgraphs and indexers (`subgraphs/`)

- **Requester**: Take the user from the event's account param, never from `tx.from`, which is the relayer or bundler for Safe and ERC-4337 wallets.
- **Reading lists**: Never rely on the default `first` (100). Page with `paginateSubgraphQuery` or `paginateHasuraQuery` (`api/src/`), with a cursor on the full sort order. When the set can change between pages, such as open tickets, read an aggregate entity instead of summing the pages.
- **Ordering**: Sort keys must give a total order. Break ties by block, log index and id.
