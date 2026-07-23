# @vetro-protocol/cli

> [!NOTE]
> This CLI is still under development. Docs may not reflect the actual state, but the future one.

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

All output is JSON, so it's directly consumable by an agent.

- Addresses and other strings are emitted as JSON strings; booleans as JSON booleans.
- `uint256` on-chain values are serialized as decimal strings, since `bigint` can't be represented in JSON.

## Commands

This is the list of commands available

### `swap` — whitelisted ↔ pegged token

| Command                                        | Reads            | Returns                        |
| ---------------------------------------------- | ---------------- | ------------------------------ |
| `vetro-cli swap pegged-token --gateway <addr>` | `getPeggedToken` | Gateway's pegged-token address |
| `vetro-cli swap treasury --gateway <addr>`     | `getTreasury`    | Gateway's treasury address     |
