# @vetro-protocol/target-yield-earn

Vetro Protocol target-yield earning vault actions for viem clients. The vault is an epoch-based ERC-7540 async vault over a pegged token (`VUSDx` over `VUSD` being the first instance): each epoch is a fixed term carrying a target yield, not a guaranteed return.

## Installation

```sh
npm add @vetro-protocol/target-yield-earn viem
```

## Overview

- Deposits and redemptions are asynchronous following ERC-7540.
- The vault runs in epochs. Each epoch is a term with its own target APR, a max deposit cap, and an exit window at its end during which redeem requests are accepted. `getEpochId` returns the current epoch (`0n` when none has started yet).
- The APR is a target, not a promise. It's set per epoch before that epoch starts and applies only to that term — nothing commits the vault to it beyond the current epoch — and the owner can terminate the vault once an epoch ends, after which yield stops accruing for good.
- `minEpochDurationSeconds`, `minExitWindowSeconds` and `maxExitWindowSeconds` mirror the vault's hardcoded values. They're exported as seconds.

## Usage

```ts
import {
  getEpochId,
  pendingDepositRequest,
} from "@vetro-protocol/target-yield-earn/actions";
import { createPublicClient, http } from "viem";
import { hemi } from "viem/chains";

const publicClient = createPublicClient({ chain: hemi, transport: http() });

const vaultAddress = "0x...";

// Current epoch, or 0n if the vault hasn't started one yet.
const epochId = await getEpochId(publicClient, { address: vaultAddress });

// Assets requested for deposit that the keeper hasn't fulfilled yet.
const pendingAssets = await pendingDepositRequest(publicClient, {
  address: vaultAddress,
  controller: "0x...",
  requestId: 0n,
});
```

## API

- Public actions (reads):
  - `getEpochId(client, params)` — the current epoch id, `0n` when no epoch has started.
  - `pendingDepositRequest(client, params)` — assets in an unfulfilled deposit request, re-exported from `viem-erc7540`.
- `targetYieldEarnPublicActions()` — viem extension factory that wires the same actions onto a client via `.extend()`.
- `targetYieldEarnVaultAbi` — the minimal ABI subset used by the package.
- Constants: `maxExitWindowSeconds`, `minEpochDurationSeconds`, `minExitWindowSeconds`.
