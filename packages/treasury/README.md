# @vetro-protocol/treasury

Vetro Protocol treasury read actions for viem clients. The treasury holds the underlying assets backing a gateway's pegged token (e.g. the USDT backing VUSD); this package exposes the read-only surface needed to inspect that backing.

## Installation

```sh
pnpm add @vetro-protocol/treasury viem
```

## Overview

- Read-only — no wallet actions, no events. The treasury is administered separately; consumers query it.
- `getWhitelistedTokens` lists every underlying asset the treasury accepts.
- `getTokenConfig` / `getPrice` return the per-token configuration and oracle price (denominated in the gateway's peg unit; convert to USD via the matching `Gateway.pegBaseSymbol`).
- `getWithdrawable` returns how much of a given token can be withdrawn given the current state.

## Usage

```ts
import { getPrice, getWhitelistedTokens } from "@vetro-protocol/treasury";
import { createPublicClient, http } from "viem";
import { hemi } from "viem/chains";

const publicClient = createPublicClient({ chain: hemi, transport: http() });

const treasuryAddress = "0x..."; // from getTreasury() on the matching gateway

const tokens = await getWhitelistedTokens(publicClient, {
  address: treasuryAddress,
});

const price = await getPrice(publicClient, {
  address: treasuryAddress,
  token: tokens[0],
});
```

The same actions are also available via the `.extend()` factory (`treasuryPublicActions()`) for callers who prefer viem's extension pattern.

## API

- Public actions (reads):
  - `getPrice(client, params)` — oracle price for a whitelisted token, in the treasury's peg unit.
  - `getTokenConfig(client, params)` — per-token configuration struct.
  - `getWhitelistedTokens(client, params)` — full list of accepted underlying tokens.
  - `getWithdrawable(client, params)` — current withdrawable amount for a token.
- `treasuryPublicActions()` — viem extension factory that wires the same actions onto a client via `.extend()`.
- `treasuryAbi` — the minimal ABI subset used by the package.
