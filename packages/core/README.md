# @vetro-protocol/core

Shared building blocks and small utilities used across the Vetro Protocol packages and apps that would otherwise be copied into every package.

## Usage

This package is private to this monorepo — not published to npm. Depend on it with `workspace:*`:

```json
{ "dependencies": { "@vetro-protocol/core": "workspace:*" } }
```

## Usage

Example usage:

```ts
import { isAddressValid, knownTokens, type Token } from "@vetro-protocol/core";
import { mainnet } from "viem/chains";

const usdc: Token | undefined = knownTokens.find(
  (token) => token.chainId === mainnet.id && token.symbol === "USDC",
);

if (!isAddressValid(usdc?.address)) {
  throw new Error("USDC is missing from the token list");
}
```

## API Reference

### `Token`

ERC-20 metadata shared by the apps. `extensions` carries optional per-token hints:

| Field                           | Purpose                                         |
| ------------------------------- | ----------------------------------------------- |
| `allowanceSlot` / `balanceSlot` | Storage slots, used to seed balances on a fork  |
| `isVaultShare`                  | Price via the ERC-4626 vault's underlying asset |
| `priceSymbol`                   | Symbol to price this token under                |

### `knownTokens`

`Token[]`.

A hardcoded list of known ERC-20 metadata (symbol, decimals, logo) used to render token display data without a network round-trip.

Entries span every chain the app touches, so filter by `chainId` before using it against a single-chain client.

### `stakingVaultAddresses`

`sVusdAddress`, `sVetBtcAddress` and the `stakingVaultAddresses` array.

### `isAddressValid`

```ts
isAddressValid(address: Address | undefined): address is Address;
```

Narrows to `Address`, rejecting `undefined`, malformed values, failed checksums, and the zero address.
