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
- `getReserve` returns the total value of every whitelisted token the treasury holds, as the treasury values it on-chain, so it always matches the protocol's own valuation.
- `getWithdrawable` returns how much of a given token can be withdrawn given the current state.

## Usage

```ts
import {
  getPrice,
  getWhitelistedTokens,
} from "@vetro-protocol/treasury/actions";
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

- Public actions (reads), exported from `/actions`. In every one, `address` is the treasury:
  - `getKeeperRole(client, { address })` — the `bytes32` hash of the treasury's keeper role.
  - `getPrice(client, { address, token })` — oracle price for a whitelisted token, as the tuple `[latestPrice, unitPrice]`, in the treasury's peg unit.
  - `getReserve(client, { address })` — the total value of all whitelisted tokens the treasury holds (its balance plus each token's vault position), in the pegged token (18 decimals).
  - `getTokenConfig(client, { address, token })` — per-token configuration, as the tuple `[vault, oracle, stalePeriod, depositActive, withdrawActive, decimals]`.
  - `getWhitelistedTokens(client, { address })` — full list of accepted underlying tokens.
  - `getWithdrawable(client, { address, token })` — current withdrawable amount for `token`.
- `treasuryPublicActions()` — viem extension factory that wires the same actions onto a client via `.extend()`.
- `treasuryAbi` — the minimal ABI subset used by the package.
