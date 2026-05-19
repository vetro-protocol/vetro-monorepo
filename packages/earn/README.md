# @vetro-protocol/earn

Vetro Protocol staking-vault actions for viem. Wraps the `sVUSD` and `svetBTC` staking vaults with `deposit` / `requestWithdraw` / `requestRedeem` / `claimWithdraw` / `cancelWithdraw` flows, ERC20 approval included.

## Installation

```sh
pnpm add @vetro-protocol/earn viem viem-erc20
```

## Vault addresses

The package exports the canonical staking-vault addresses:

```ts
import {
  sVetBtcAddress,
  sVusdAddress,
  stakingVaultAddresses,
} from "@vetro-protocol/earn";
```

## Usage

```ts
import { deposit, getCooldownDuration } from "@vetro-protocol/earn/actions";
import { sVusdAddress } from "@vetro-protocol/earn";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { mainnet } from "viem/chains";

const publicClient = createPublicClient({ chain: mainnet, transport: http() });
const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
});

// Read the cooldown duration
const cooldown = await getCooldownDuration(publicClient, {
  address: sVusdAddress,
});

// Deposit underlying assets into the vault (approval handled automatically)
const { emitter, promise } = deposit(walletClient, {
  assets: 1_000_000_000_000_000_000n,
  receiver: "0x...",
  token: "0x...", // underlying ERC20 (e.g. VUSD)
  vaultAddress: sVusdAddress,
});

emitter.on("user-signed-deposit", (hash) => console.log("tx hash:", hash));
emitter.on("deposit-transaction-succeeded", (receipt) =>
  console.log("deposited:", receipt),
);

await promise;
```

The same actions are available via `.extend()` factories (`earnPublicActions()`, `earnWalletActions()`) for callers who prefer viem's extension pattern.

## Withdrawal model

The staking vault uses a cooldown. The flow is:

1. `requestWithdraw({ assets, owner, vaultAddress })` or `requestRedeem({ shares, owner, vaultAddress })` — opens a request and starts the cooldown.
2. `claimWithdraw({ requestId, address })` (or `claimWithdrawBatch` for multiple) — claims the assets once the cooldown has elapsed.
3. `cancelWithdraw({ requestId, address })` — cancels a pending request before claiming.

Use the public actions to inspect state: `getCooldownDuration`, `getCooldownEnabled`, `getActiveRequestIds`, `getPendingRequests`, `getClaimableRequests`, `getRequestDetails`, `getTotalAssetsInCooldown`, `getInstantWithdrawWhitelist`, `getYieldDistributor`.

## Events

Every wallet action returns `{ emitter, promise }` (via `to-promise-event`). The emitter fires a granular lifecycle:

- `pre-approve` → `user-signed-approval` → `approve-transaction-succeeded` / `approve-transaction-reverted` (only when an ERC20 approval is needed)
- `pre-<action>` → `user-signed-<action>` → `<action>-transaction-succeeded` / `<action>-transaction-reverted`
- `user-signing-<action>-error` if the user rejects in the wallet
- `<action>-failed-validation` if input validation fails (payload is a human-readable reason)
- `unexpected-error` for anything that escapes
- `<action>-settled` always emitted in the `finally` block

Event-map types are exported per action: `DepositEvents`, `RequestRedeemEvents`, `RequestWithdrawEvents`, `ClaimWithdrawEvents`, `ClaimWithdrawBatchEvents`, `CancelWithdrawEvents`.

## API

Public actions (take a `Client`):

- `getActiveRequestIds`, `getClaimableRequests`, `getCooldownDuration`, `getCooldownEnabled`, `getInstantWithdrawWhitelist`, `getPendingRequests`, `getRequestDetails`, `getTotalAssetsInCooldown`, `getYieldDistributor`

Wallet actions (take a `WalletClient`, return `{ emitter, promise }`):

- `deposit`, `requestRedeem`, `requestWithdraw`, `claimWithdraw`, `claimWithdrawBatch`, `cancelWithdraw`

Encoders (return ABI-encoded calldata):

- `encodeDeposit`, `encodeRequestRedeem`, `encodeRequestWithdraw`, `encodeClaimWithdraw`, `encodeClaimWithdrawBatch`, `encodeCancelWithdraw`

Extension factories:

- `earnPublicActions()`, `earnWalletActions()`

Also exported: `stakingVaultAbi`, `sVusdAddress`, `sVetBtcAddress`, `stakingVaultAddresses`, and the `CooldownRequest` type.
