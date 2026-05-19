# @vetro-protocol/treasury

Read-only viem actions for the Vetro Protocol treasury contract. Provides oracle prices, per-token configuration, the whitelist, and per-token withdrawable balances.

## Installation

```sh
pnpm add @vetro-protocol/treasury viem
```

## Usage

```ts
import {
  getPrice,
  getWhitelistedTokens,
} from "@vetro-protocol/treasury/actions";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const publicClient = createPublicClient({ chain: mainnet, transport: http() });

// Caller provides the treasury contract address
const treasuryAddress = "0x...";

const whitelisted = await getWhitelistedTokens(publicClient, {
  address: treasuryAddress,
});

const price = await getPrice(publicClient, {
  address: treasuryAddress,
  token: whitelisted[0],
});
```

The same actions are available via `.extend()` factory (`treasuryPublicActions()`) for callers who prefer viem's extension pattern:

```ts
import { treasuryPublicActions } from "@vetro-protocol/treasury";

const client = publicClient.extend(treasuryPublicActions());
const price = await client.getPrice({ address: treasuryAddress, token });
```

## API

Public actions (take a `Client`):

- `getPrice({ address, token })` — current oracle price for `token`.
- `getTokenConfig({ address, token })` — per-token configuration struct.
- `getWhitelistedTokens({ address })` — array of whitelisted token addresses.
- `getWithdrawable({ address, token })` — withdrawable balance for `token`.

Extension factory:

- `treasuryPublicActions()` — wires the read actions onto a viem client via `.extend()`.

Also exported: `treasuryAbi`.
