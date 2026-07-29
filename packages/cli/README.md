# @vetro-protocol/cli

> [!NOTE]
> This CLI is still under development. Docs may not reflect the actual state yet.

`vetro-cli` — a command-line interface that sits on top of the `@vetro-protocol/*` packages so agents and users can read Vetro state and generate transaction calldata.

## Local development

To test it locally, bundle and then consume it from the terminal.

```sh
pnpm --filter @vetro-protocol/cli bundle   # produces _esm/cli.js (the vetro-cli bin)
node packages/cli/_esm/cli.js swap pegged-token --gateway 0x...
```

## Configuration

The following env variables can be set.

- `RPC_URL` — Ethereum mainnet RPC endpoint used for reads. Falls back to a public RPC when unset.

## Output

Successful output is JSON on stdout, so it's directly consumable by an agent.

- Addresses and other strings are emitted as JSON strings; booleans as JSON booleans.
- `uint256` on-chain values are serialized as decimal strings, since `bigint` can't be represented in JSON.

Failures always exit non-zero, but come in two shapes:

- **Runtime errors** (RPC failure, contract revert) are JSON on stderr: `{ "error": "..." }`.
- **Usage errors** (invalid or missing flags, unknown commands) are written by the CLI parser as plain text on stderr.

### Write operations

Write commands touch no keys — they emit a JSON-RPC transaction request and the consumer signs and broadcasts it:

```json
{ "chainId": "0x1", "data": "0x8b6099db…", "to": "0x…gateway", "value": "0x0" }
```

Every numeric field is a hex `QUANTITY`, so the object can be lifted straight into `eth_sendTransaction` or an [ERC-5792](https://eips.ethereum.org/EIPS/eip-5792) `wallet_sendCalls` batch. The chain is always Ethereum mainnet, so `chainId` is always `"0x1"` and `value` is always `"0x0"`.

## Token arguments

`--token`, `--from` and `--to` accept either a **symbol** (case-insensitive, e.g. `USDT`) or an **address**. `--from` is whitelisted-only, since only a whitelisted token can be swapped in; `--token` takes either side.

Because a token belongs to exactly one gateway, the gateway is inferred from the token and never passed explicitly. For the same reason `swap mint --to` is optional — the pegged token is whatever that gateway mints.

`--amount` is in human units; decimals are resolved from the token.

## Commands

This is the list of commands available

### `swap` — whitelisted ↔ pegged token

#### Write operations

| Command                                                                                               | Encodes             | Notes                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vetro-cli swap approve --token <tok> --amount <n>`                                                   | `encodeApproveData` | Approves the inferred gateway to spend the token — a whitelisted token to `mint`, or a pegged token for a one-step swap-out. Prepend it when the allowance is short.                                                   |
| `vetro-cli swap mint --from <tok> [--to <tok>] --amount <n> --receiver <addr> [--slippage <percent>]` | `encodeDeposit`     | Swap-in. `--slippage` is a percent off `previewDeposit`, in `[0, 100]` with at most one decimal (e.g. `0.5`); **it defaults to `0`**, so `minPeggedTokenOut` is the full previewed amount unless a tolerance is given. |

#### Read operations

| Command                                                   | Reads            | Returns                                                                                                                                                                 |
| --------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vetro-cli swap allowance --token <tok> --account <addr>` | `allowance`      | Gateway's spending allowance, in human units. `<tok>` may be a whitelisted token (swap-in) or a pegged token (one-step swap-out; the two-step queue needs no allowance) |
| `vetro-cli swap pegged-token --gateway <addr>`            | `getPeggedToken` | Gateway's pegged-token address                                                                                                                                          |
| `vetro-cli swap treasury --gateway <addr>`                | `getTreasury`    | Gateway's treasury address                                                                                                                                              |

### Swapping in

```sh
vetro-cli swap allowance --token USDT --account 0xAgent   # "0" → approval needed
vetro-cli swap approve --token USDT --amount 100          # sign + broadcast
vetro-cli swap mint --from USDT --amount 100 --receiver 0xAgent --slippage 0.5
```
