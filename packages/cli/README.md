# @vetro-protocol/cli

`vetro-cli` — a command-line interface that sits on top of the `@vetro-protocol/*` packages so agents and users can read Vetro state and generate transaction calldata.

## Local development

Run it straight from the source, with no build step:

```sh
node packages/cli/src/cli.ts swap pegged-token --gateway 0x...
```

To run the bundled bin instead:

```sh
pnpm --filter @vetro-protocol/cli bundle   # produces _esm/cli.js (the vetro-cli bin)
node packages/cli/_esm/cli.js swap pegged-token --gateway 0x...
```

The `@vetro-protocol/*` packages are external to that bundle, and inside the monorepo they resolve to workspace source, so this exercises the bundled entrypoint rather than what an npm consumer gets. To check that, pack the tarball and install it in a scratch project.

## Configuration

`--rpc-url <url>` is a global option, accepted anywhere on the command line — before or after the subcommand:

```sh
vetro-cli --rpc-url https://my-node.example swap treasury --gateway 0x...
vetro-cli swap treasury --gateway 0x... --rpc-url https://my-node.example
```

It sets the endpoint every read goes to, and therefore the chain the emitted calldata is stamped with. It also accepts the endpoint via env var, so the resolution order is:

1. `--rpc-url`
2. `RPC_URL`
3. `https://eth.drpc.org`, a public Ethereum mainnet RPC

Only `http`/`https` endpoints are accepted; anything else is rejected as a usage error before any request is made.

### Supported chains

Vetro is deployed on Ethereum mainnet only, so every command that reads the chain starts by reading the endpoint's `eth_chainId` and fails if it is anything other than:

| Chain ID | Endpoint                           |
| -------- | ---------------------------------- |
| `1`      | Ethereum mainnet                   |
| `31337`  | local fork (anvil/Hardhat default) |

The check runs before any contract read, so pointing at another network fails fast rather than returning state read off the wrong chain. This restriction is temporary and lifts once Vetro is deployed on more chains.

## Output

Successful output is JSON on stdout, so it's directly consumable by an agent.

- Addresses and other strings are emitted as JSON strings; booleans as JSON booleans.
- `uint256` on-chain values are serialized as decimal strings, since `bigint` can't be represented in JSON.
- Amounts are in human units on input and in the token's decimals on output.

Failures always exit non-zero, but come in two shapes:

- **Runtime errors** (RPC failure, contract revert) are JSON on stderr: `{ "error": "..." }`.
- **Usage errors** (invalid or missing flags, unknown commands) are written by the CLI parser as plain text on stderr.

### Write operations

Write commands touch no keys — they emit a JSON-RPC transaction request and the consumer signs and broadcasts it:

```json
{ "chainId": "0x1", "data": "0x8b6099db…", "to": "0x…gateway", "value": "0x0" }
```

Every numeric field is a hex `QUANTITY`, so the object can be lifted straight into `eth_sendTransaction` or an [ERC-5792](https://eips.ethereum.org/EIPS/eip-5792) `wallet_sendCalls` batch. `value` is always `"0x0"`.

## Token arguments

`--token`, `--from` and `--to` accept either a **symbol** (case-insensitive, e.g. `USDT`) or an **address**. `--from` is the token the operation spends, so it is whitelisted-only on `mint` and pegged-only on `send-to-queue`. `--to` is the token the operation pays out, so it is pegged on `mint` and whitelisted-only on `preview-redeem` and `redeem`. `--token` takes either side on `swap`. On `variable-yield` it takes the pegged token, or its share token where the command allows it.

Because a token belongs to exactly one gateway, the gateway is inferred from the token and never passed explicitly. For the same reason `swap mint --to` is optional — the pegged token is whatever that gateway mints.

`--amount` is in human units of the token the operation spends. Its decimals come from `--from` or `--token` when the command takes one. On `preview-redeem` and `redeem` the spent token is the pegged token of the gateway inferred from `--to`, so the decimals come from that pegged token, not from `--to`. On `variable-yield unstake` the spent token is the pegged token for `--amount` and the share token for `--shares`, whichever of the two `--token` names. An amount with more decimals than that token has fails instead of being rounded.

To discover the symbols a gateway takes, run `swap whitelisted-tokens --gateway <addr>` — a gateway-level read, so it takes the gateway explicitly instead of inferring it from a token.

## Commands

This is the list of commands available

### `gateways` — the enabled gateways

| Command              | Reads | Returns                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vetro-cli gateways` | —     | Every enabled gateway. Each entry carries `address`, `peggedToken` (the pegged token the gateway mints) and `stakingVault` (the vault that stakes that pegged token, or `null` when the gateway has none). `address` is the `--gateway` of the gateway-level `swap` reads. The list is static and covers Ethereum mainnet only. The command makes no RPC call, so it ignores `--rpc-url` |

### `swap` — whitelisted ↔ pegged token

#### Write operations

| Command                                                                                               | Encodes                     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vetro-cli swap approve --token <tok> --amount <n>`                                                   | `encodeApproveData`         | Approves the inferred gateway to spend the token — a whitelisted token to `mint`, or a pegged token to `send-to-queue` or to redeem in one step. Prepend it when the allowance is short. `--amount 0` resets the allowance.                                                                                                                                                                                                                 |
| `vetro-cli swap cancel-redeem --account <addr> --gateway <addr>`                                      | `encodeCancelRedeemRequest` | Cancels the open redeem request of `<addr>`. The gateway sends the whole locked amount of the pegged token back to `<addr>`. Fails when `<addr>` has no open request.                                                                                                                                                                                                                                                                       |
| `vetro-cli swap mint --from <tok> [--to <tok>] --amount <n> --receiver <addr> [--slippage <percent>]` | `encodeDeposit`             | Swap-in. `--slippage` is a percent off `previewDeposit`, in `[0, 100]` with at most one decimal (e.g. `0.5`); **it defaults to `0`**, so `minPeggedTokenOut` is the full previewed amount unless a tolerance is given. Fails when the previewed output is above `maxMint`, the gateway's remaining mint capacity, or when the treasury has deposits paused for the token (`tokenConfig.depositActive` is false) — the deposit would revert. |
| `vetro-cli swap send-to-queue --from <tok> --amount <n>`                                              | `encodeRequestRedeem`       | Swap-out step 1: locks the pegged token in the gateway and starts the cooldown. The token to redeem into is chosen at step 2, so it is not given here. A second request **adds to the open one and restarts the cooldown on the whole locked amount**, so queue the full amount at once. Fails when the gateway has the redeem queue disabled — the request would revert, and the redeem is one-step instead.                               |
| `vetro-cli swap redeem --to <tok> --amount <n> --receiver <addr> [--slippage <percent>]`              | `encodeRedeem`              | Swap-out: step 2 of the Redeem Queue, or the whole redeem when it is one step. `--slippage` works as on `mint`. Fails when the payout is 0, above the treasury reserves, or when withdrawals are paused for the token.                                                                                                                                                                                                                      |

#### Read operations

| Command                                                              | Reads                                                                         | Returns                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vetro-cli swap allowance --token <tok> --account <addr>`            | `allowance`                                                                   | Gateway's spending allowance, in the token's decimals. `<tok>` may be a whitelisted token (swap-in) or a pegged token (swap-out; the gateway pulls the pegged token at `send-to-queue`, or at the redeem itself when it is one step)                                                                                                                          |
| `vetro-cli swap cooldown --gateway <addr>`                           | `getWithdrawalDelayEnabled`, `getWithdrawalDelay`                             | Redeem Queue cooldown of the gateway, in seconds. `0` when the delay is disabled — a redeem is then one-step, with no queue. This is the gateway-wide contract value, not a per-account one.                                                                                                                                                                  |
| `vetro-cli swap cooldown-enabled --gateway <addr>`                   | `getWithdrawalDelayEnabled`                                                   | Whether the gateway's Redeem Queue is on. `false` means a redeem is one-step for every account, and `swap send-to-queue` fails.                                                                                                                                                                                                                               |
| `vetro-cli swap is-instant-redeem --account <addr> --gateway <addr>` | `isInstantRedeemWhitelisted`                                                  | Whether `<addr>` is whitelisted to skip the gateway's Redeem Queue. `true` means its redeem is one-step: no `send-to-queue`, no cooldown.                                                                                                                                                                                                                     |
| `vetro-cli swap max-out --token <tok>`                               | `getMaxWithdraw`                                                              | Treasury reserves for the whitelisted `<tok>` — its balance plus what its yield vault converts to — in the token's decimals. A liquidity ceiling only.                                                                                                                                                                                                        |
| `vetro-cli swap mint-fee --token <tok>`                              | `getMintFee`                                                                  | Mint fee charged on a deposit of the whitelisted `<tok>`, in bps                                                                                                                                                                                                                                                                                              |
| `vetro-cli swap pegged-token --gateway <addr>`                       | `getPeggedToken`                                                              | Gateway's pegged-token address                                                                                                                                                                                                                                                                                                                                |
| `vetro-cli swap preview-mint --from <tok> --amount <n>`              | `previewDeposit`                                                              | Pegged token that a deposit of `<n>` of the whitelisted `<tok>` would mint, in the pegged token's decimals. A quote only: it does not check `maxMint` or `depositActive`, so `swap mint` can still fail for the same amount.                                                                                                                                  |
| `vetro-cli swap preview-redeem --to <tok> --amount <n>`              | `getPeggedToken`, `decimals`, `symbol`, `previewRedeem`                       | Whitelisted `<tok>` that a redeem of `<n>` of the gateway's pegged token would pay out, in `<tok>`'s decimals. A quote only: it does not check `withdrawActive` or the treasury's reserves (`swap max-out`), so the redeem can still fail for the same amount. Fails when the redeem would pay out 0, which happens when `<n>` is below one unit of `<tok>`.  |
| `vetro-cli swap price --token <tok>`                                 | `getTreasury`, `getPrice`                                                     | Oracle price of the whitelisted `<tok>`, read from the treasury of the inferred gateway. Emits `latestPrice`, the oracle answer for the token, and `unitPrice`, the price of the gateway's peg unit — `latestPrice / unitPrice` is the token's value in peg units.                                                                                            |
| `vetro-cli swap redeem-fee --token <tok>`                            | `getRedeemFee`                                                                | Redeem fee charged on a redeem into the whitelisted `<tok>`, in bps                                                                                                                                                                                                                                                                                           |
| `vetro-cli swap request --account <addr> --gateway <addr>`           | `getRedeemRequest`, `getBlock`                                                | Open redeem request of `<addr>` on the gateway: `amountLocked` (in the pegged token's decimals), `claimableAt` (unix seconds) and `status`. The contract does not store `status`. The CLI derives it from `claimableAt` and the latest block's timestamp: `none` (no open request, `claimableAt` is `0`), `cooldown`, or `ready` (the redeem can go through). |
| `vetro-cli swap token-config --token <tok>`                          | `getTreasury`, `getTokenConfig`                                               | Treasury config of the whitelisted `<tok>`, read from the treasury of the inferred gateway: `decimals`, `depositActive` (gates `swap mint`), `oracle`, `stalePeriod` (seconds — a deposit or a redeem reverts once the feed's answer is that old), `vault` (the yield vault the collateral is routed to) and `withdrawActive` (gates the redeem)              |
| `vetro-cli swap treasury --gateway <addr>`                           | `getTreasury`                                                                 | Gateway's treasury address                                                                                                                                                                                                                                                                                                                                    |
| `vetro-cli swap whitelisted-tokens --gateway <addr>`                 | `getTreasury`, `getWhitelistedTokens`, `getTokenConfig`, `symbol`, `decimals` | Every whitelisted token the gateway accepts. Each entry carries `address`, `decimals`, `depositActive`, `symbol` and `withdrawActive`                                                                                                                                                                                                                         |

### Swapping in

```sh
vetro-cli swap allowance --token USDT --account 0xAgent   # "0" → approval needed
vetro-cli swap approve --token USDT --amount 100          # sign + broadcast
vetro-cli swap mint --from USDT --amount 100 --receiver 0xAgent --slippage 0.5
```

### Swapping out, step 1

```sh
vetro-cli swap allowance --token VUSD --account 0xAgent   # "0" → approval needed
vetro-cli swap approve --token VUSD --amount 100          # sign + broadcast
vetro-cli swap send-to-queue --from VUSD --amount 100
```

`send-to-queue` fails on its own when the queue is off, so no preflight read is needed. To read the cooldown itself, `swap cooldown` takes `--gateway`, and the gateway address is the `to` of any write command's output. `swap cooldown` is gateway-wide, so it does not tell you whether _your_ address skips the queue: `swap is-instant-redeem --account <addr> --gateway <addr>` reads that per-account. When it returns `true`, skip `send-to-queue` — the redeem is one step.

To follow the cooldown, run `swap request --account <addr> --gateway <addr>`. Its `status` changes from `cooldown` to `ready` when the request can be redeemed.

### Swapping out, step 2

When `swap request` shows `ready`, redeem the locked amount:

```sh
vetro-cli swap redeem --to USDT --amount 100 --receiver 0xAgent --slippage 0.5
```

### Cancelling a redeem

To get the locked pegged token back before you redeem it, cancel the open request:

```sh
vetro-cli swap cancel-redeem --account 0xAgent --gateway 0x…gateway
```

`swap request` then shows `none`.

### Swapping out in one step

When the queue is off for your address, skip `send-to-queue`. Approve the pegged token, then redeem:

```sh
vetro-cli swap approve --token VUSD --amount 100
vetro-cli swap redeem --to USDT --amount 100 --receiver 0xAgent --slippage 0.5
```

### `variable-yield` — pegged ↔ share token

A pegged token has exactly one staking vault, so the vault is inferred from `--token` and never passed explicitly. `vetro-cli gateways` lists the `stakingVault` of each gateway. Commands that take `<pegged>` accept only the pegged token, by symbol or address. Commands that take `<tok>` accept the pegged token or its share token, by symbol or address.

#### Write operations

| Command                                                                               | Encodes                                            | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vetro-cli variable-yield approve --token <pegged> --amount <n>`                      | `encodeApproveData`                                | Approves the staking vault to spend the pegged token. Prepend it when the allowance is short. `--amount 0` resets the allowance.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `vetro-cli variable-yield unstake --token <tok> --amount <n> --account <addr>`        | `encodeRequestWithdraw`                            | Opens an exit ticket for `<n>` of the pegged token: the vault burns the shares `<n>` is worth, and locks `<n>` in cooldown, where it earns no yield. `<addr>` is the share token owner. It is the signer, unless the signer holds a share token allowance from `<addr>`. Fails when the vault's cooldown is disabled — the request would revert. The vault then takes a one-step withdraw, which the CLI does not encode yet. The broadcast reverts when `<n>` is worth more shares than `<addr>` holds.                                                                             |
| `vetro-cli variable-yield unstake --token <tok> --shares <n> --account <addr>`        | `encodeRequestRedeem`                              | Same as above, but `<n>` is in the share token. Use it to unstake the whole position with no dust: pass the `shares` of `position`, converted from the share token's decimals to human units. `--amount` and `--shares` are mutually exclusive, and one of them is required. The broadcast reverts when `<n>` is above the share token balance of `<addr>`.                                                                                                                                                                                                                          |
| `vetro-cli variable-yield claim --token <tok> --request-id <id> --receiver <addr>`    | `encodeClaimWithdraw`                              | Claims one exit ticket: the vault pays the pegged token locked in ticket `<id>` to `<addr>`. `<id>` is the `requestId` of `exit-tickets`. Fails when the ticket is still in cooldown, or when `<id>` is not an open ticket — it was never opened, or it was claimed or cancelled. The signer must be the ticket owner; the broadcast reverts otherwise. A ready ticket can be claimed even after the vault's cooldown is disabled.                                                                                                                                                   |
| `vetro-cli variable-yield claim-all --token <tok> --account <addr> --receiver <addr>` | `getClaimableRequests`, `encodeClaimWithdrawBatch` | Claims every ready exit ticket of `<account>` on the vault of `<tok>` in one transaction: the vault pays the pegged token locked in each of them to `<receiver>`. "Withdraw all" on the web sends this transaction once for each vault that has a ready ticket. Tickets in cooldown are left open. The ticket ids go in ascending order, the order of `exit-tickets`. Fails when `<account>` has no ready ticket. The signer must be `<account>`, the owner of every ticket; the broadcast reverts otherwise. The contract has no batch limit: gas grows with the number of tickets. |

#### Read operations

| Command                                                                       | Reads                                               | Returns                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vetro-cli variable-yield allowance --token <pegged> --account <addr>`        | `allowance`                                         | Staking vault's spending allowance on the pegged token, in the pegged token's decimals. `0` means an approval is needed before a stake.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `vetro-cli variable-yield cooldown --token <tok>`                             | `getCooldownEnabled`, `getCooldownDuration`         | Unstake cooldown of the vault, in seconds. `0` when the cooldown is disabled — the vault then takes a one-step withdraw, which the CLI does not encode yet.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `vetro-cli variable-yield exit-tickets --token <tok> --account <addr>`        | `getPendingRequests`, `getClaimableRequests`        | Open exit tickets of `<addr>`, as `[{ assets, claimableAt, requestId, status }]`, sorted by `requestId` ascending, which is the order the tickets were opened in. `assets` is the pegged token locked in the ticket, in the pegged token's decimals. `status` is `cooldown` while the cooldown runs, and `ready` once the ticket can be claimed. `claimableAt` is the unix timestamp the cooldown ends at; it is `null` on a `ready` ticket, because `getClaimableRequests` does not return it. Claimed and cancelled tickets are not listed. `[]` when `<addr>` has no open ticket. |
| `vetro-cli variable-yield is-instant-withdraw --token <tok> --account <addr>` | `getCooldownEnabled`, `getInstantWithdrawWhitelist` | Whether `<addr>` can unstake with no cooldown: `true` when the vault's cooldown is disabled, or when `<addr>` is on its instant-withdraw whitelist. `variable-yield cooldown` is vault-wide, so it does not tell you whether _your_ address skips the cooldown; this command reads that per-account.                                                                                                                                                                                                                                                                                 |
| `vetro-cli variable-yield position --token <tok> --account <addr>`            | `balanceOf`, `convertToAssets`                      | `{ assets, shares }` of `<addr>`: `shares` is its share token balance, in the share token's decimals, and `assets` is their value in the pegged token, in the pegged token's decimals. Both are `0` when `<addr>` has no stake. Exit tickets are not included: their shares are burned when the cooldown starts.                                                                                                                                                                                                                                                                     |
| `vetro-cli variable-yield preview-stake --token <pegged> --amount <n>`        | `previewDeposit`                                    | Share token that a stake of `<n>` of the pegged token would mint, in the share token's decimals. Fails when the stake would mint 0, which happens when `<n>` is worth less than one unit of the share token.                                                                                                                                                                                                                                                                                                                                                                         |
| `vetro-cli variable-yield total-assets --token <tok>`                         | `totalAssets`                                       | Pegged token staked in the vault, in the pegged token's decimals. It includes yield that accrued but was not pulled from the yield distributor yet. It excludes the pegged token locked in exit tickets: funds in cooldown earn no yield, so they do not back the share token.                                                                                                                                                                                                                                                                                                       |

### Approving the staking vault

The vault pulls the pegged token at the stake, so approve it first:

```sh
vetro-cli variable-yield allowance --token VUSD --account 0xAgent   # "0" → approval needed
vetro-cli variable-yield approve --token VUSD --amount 100          # sign + broadcast
```

### Unstaking

An unstake opens an exit ticket: the vault burns the shares at once, and locks the pegged token until the cooldown ends. Funds in cooldown earn no yield. When `<addr>` is on the instant-withdraw whitelist, the request still works, but it adds a cooldown that `<addr>` does not need.

```sh
vetro-cli variable-yield cooldown --token VUSD                                  # "86400" → the ticket is ready in a day
vetro-cli variable-yield position --token VUSD --account 0xAgent               # { assets, shares } that can be unstaked
vetro-cli variable-yield unstake --token VUSD --amount 100 --account 0xAgent   # sign + broadcast
vetro-cli variable-yield exit-tickets --token VUSD --account 0xAgent           # "cooldown" until claimableAt, then "ready"
```

When `exit-tickets` shows the ticket as `ready`, claim it by its `requestId`. The vault pays the locked pegged token to `--receiver`:

```sh
vetro-cli variable-yield claim --token VUSD --request-id 7 --receiver 0xAgent   # sign + broadcast
```

`claim` fails on its own while the ticket is in cooldown, so no preflight read is needed. To claim every ready ticket in one transaction, pass the owner instead of a ticket id; the tickets still in cooldown stay open:

```sh
vetro-cli variable-yield claim-all --token VUSD --account 0xAgent --receiver 0xAgent   # sign + broadcast
```

`claim-all` fails on its own when no ticket is ready, so no preflight read is needed either. `exit-tickets` lists what it would claim: every ticket with `status` `ready`.

To unstake the whole position with no dust, pass the `shares` of `position` instead of an amount. `position` prints them in the share token's decimals, and `--shares` takes human units, so convert them first. The share token has 18 decimals here:

```sh
vetro-cli variable-yield position --token VUSD --account 0xAgent               # "shares": "99500000000000000000"
vetro-cli variable-yield unstake --token VUSD --shares 99.5 --account 0xAgent
```
