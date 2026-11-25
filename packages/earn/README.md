# @vetro-protocol/earn

Vetro Protocol staking-vault actions for viem clients. Wraps the `sVUSD` and `sVetBTC` ERC-4626 vaults with their deposit, cooldown, and withdraw flows.

## Installation

```sh
pnpm add @vetro-protocol/earn viem
```

## Overview

- Targets the two whitelisted staking vaults — `sVUSD` and `sVetBTC` — exported as `sVusdAddress`, `sVetBtcAddress`, and the combined `stakingVaultAddresses` list.
- `deposit` runs the full ERC-4626 deposit: on-chain allowance check, approval if needed, then `deposit(assets, receiver)`. Each step emits through an `EventEmitter`.
- Withdrawals follow the vault's cooldown protocol: `requestRedeem` / `requestWithdraw` opens a cooldown, `claimWithdraw` / `claimWithdrawBatch` finalises it once the cooldown elapses, and `cancelWithdraw` aborts an open request.
- Read actions (`getCooldownDuration`, `getCooldownEnabled`, `getInstantWithdrawWhitelist`, `getPendingRequests`, `getActiveRequestIds`, `getClaimableRequests`, `getRequestDetails`, `getTotalAssetsInCooldown`, `getYieldDistributor`, `getPeriodFinish`, `getRewardRate`) cover the data needed to drive a UI around the flows above.

## Usage

```ts
import { sVusdAddress } from "@vetro-protocol/earn";
import { deposit, getPendingRequests } from "@vetro-protocol/earn/actions";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { hemi } from "viem/chains";

const publicClient = createPublicClient({ chain: hemi, transport: http() });
const walletClient = createWalletClient({
  chain: hemi,
  transport: custom(window.ethereum),
});

// Stake VUSD into sVUSD (approval handled automatically).
const { emitter, promise } = deposit(walletClient, {
  assets: 1_000_000_000_000_000_000n,
  receiver: "0x...",
  token: "0x...", // underlying VUSD address
  vaultAddress: sVusdAddress,
});

emitter.on("user-signed-deposit", (hash) => console.log("tx hash:", hash));
emitter.on("deposit-transaction-succeeded", (receipt) =>
  console.log("deposited:", receipt),
);

await promise;

// Inspect any pending withdraw requests for the user.
const pending = await getPendingRequests(publicClient, {
  account: "0x...",
  address: sVusdAddress,
});
```

The same actions are also available via `.extend()` factories (`earnPublicActions()`, `earnWalletActions()`) for callers who prefer viem's extension pattern.

## API

- Public actions (reads), exported from `/actions`. `address` is the staking vault, except in `getPeriodFinish` and `getRewardRate`, where it is the vault's yield distributor:
  - `getActiveRequestIds(client, { account, address })` — open withdraw request IDs for `account`.
  - `getClaimableRequests(client, { account, address })` — request IDs of `account` whose cooldown has elapsed.
  - `getCooldownDuration(client, { address })` — cooldown length in seconds.
  - `getCooldownEnabled(client, { address })` — whether the cooldown is enforced.
  - `getInstantWithdrawWhitelist(client, { account, address })` — whether `account` is allowed to bypass the cooldown.
  - `getPendingRequests(client, { account, address })` — full pending-request structs for `account`.
  - `getPeriodFinish(client, { address })` — timestamp, in seconds, at which the current yield drip ends.
  - `getRequestDetails(client, { address, requestId })` — details for a specific request ID.
  - `getRewardRate(client, { address })` — WAD-scaled amount of yield dripped per second into the vault.
  - `getTotalAssetsInCooldown(client, { address })` — assets locked across all pending requests.
  - `getYieldDistributor(client, { address })` — address of the vault's yield distributor.
- Wallet actions (writes), exported from `/actions`. Each returns `{ emitter, promise }`:
  - `deposit(walletClient, { approveAmount?, assets, receiver, token, vaultAddress })` — `token` is the underlying token that gets approved. `approveAmount` is optional and defaults to `assets`.
  - `requestRedeem(walletClient, { owner, shares, vaultAddress })`.
  - `requestWithdraw(walletClient, { assets, owner, vaultAddress })`.
  - `claimWithdraw(walletClient, { receiver, requestId, vaultAddress })`.
  - `claimWithdrawBatch(walletClient, { receiver, requestIds, vaultAddress })`.
  - `cancelWithdraw(walletClient, { requestId, vaultAddress })`.
- Calldata encoders, exported from `/actions`: each returns the calldata of one write without sending anything, so a caller can sign and broadcast it elsewhere, or batch it into a multicall:
  - `encodeCancelWithdraw({ requestId })` — `cancelWithdraw(requestId)`.
  - `encodeClaimWithdraw({ receiver, requestId })` — `claimWithdraw(requestId, receiver)`.
  - `encodeClaimWithdrawBatch({ receiver, requestIds })` — `claimWithdrawBatch(requestIds, receiver)`.
  - `encodeDeposit({ assets, receiver })` — `deposit(assets, receiver)`. Unlike `deposit`, it does not approve the pegged token first. It throws when `assets` is not greater than 0 or `receiver` is not a valid address.
  - `encodeRedeem({ owner, receiver, shares })` — `redeem(shares, receiver, owner)`. The vault accepts it only when the cooldown is disabled or `owner` is on the instant-withdraw whitelist. It throws when `shares` is not greater than 0 or an address is not valid.
  - `encodeRequestRedeem({ owner, shares })` — `requestRedeem(shares, owner)`.
  - `encodeRequestWithdraw({ assets, owner })` — `requestWithdraw(assets, owner)`.
  - `encodeWithdraw({ assets, owner, receiver })` — `withdraw(assets, receiver, owner)`. The vault accepts it only when the cooldown is disabled or `owner` is on the instant-withdraw whitelist. It throws when `assets` is not greater than 0 or an address is not valid.
- `earnPublicActions()` / `earnWalletActions()` — viem extension factories that wire the same actions onto a client via `.extend()`.
- `stakingVaultAbi` — the minimal ABI subset used by the package.
- Constants: `sVusdAddress`, `sVetBtcAddress`, `stakingVaultAddresses`.
- Types: `CancelWithdrawEvents`, `ClaimWithdrawBatchEvents`, `ClaimWithdrawEvents`, `CooldownRequest`, `DepositEvents`, `RequestRedeemEvents`, `RequestWithdrawEvents`.
