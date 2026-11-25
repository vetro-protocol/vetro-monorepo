# @vetro-protocol/gateway

Vetro Protocol gateway actions for viem clients. Mints pegged tokens (VUSD, vetBTC) from whitelisted underlying assets and handles redemptions back out.

## Installation

```sh
pnpm add @vetro-protocol/gateway @vetro-protocol/treasury viem viem-erc20
```

## Overview

- Two gateways ship by default — the VUSD gateway and the vetBTC gateway — exported as `gateways` (with `address` + `pegBaseSymbol`) and `gatewayAddresses` (just the addresses).
- `deposit` mints the pegged token: checks the Treasury's `depositActive` flag, runs an allowance + approval if needed, then calls `deposit(tokenIn, amountIn, minPeggedTokenOut, receiver)`.
- Redemptions follow the gateway's two-step flow: `requestRedeem` opens a request, `redeem` checks the Treasury's `withdrawActive` flag and finalises the request once the optional withdrawal delay has elapsed (or immediately if the caller is on the instant-redeem whitelist), and `cancelRedeemRequest` aborts an open request.
- Read actions cover everything a UI needs to drive these flows: previews, fee getters, request lookup, treasury / pegged-token addresses, and withdrawal-delay configuration.

## Usage

```ts
import { gateways } from "@vetro-protocol/gateway";
import { deposit, previewDeposit } from "@vetro-protocol/gateway/actions";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { hemi } from "viem/chains";

const publicClient = createPublicClient({ chain: hemi, transport: http() });
const walletClient = createWalletClient({
  chain: hemi,
  transport: custom(window.ethereum),
});

const vusdGateway = gateways[0]; // VUSD gateway

// 1. Quote how much VUSD a USDT deposit would mint.
const expectedOut = await previewDeposit(publicClient, {
  address: vusdGateway.address,
  amountIn: 1_000_000n, // 1 USDT (6 decimals)
  tokenIn: "0x...", // USDT address
});

// 2. Deposit (approval handled automatically).
const { emitter, promise } = deposit(walletClient, {
  amountIn: 1_000_000n,
  gatewayAddress: vusdGateway.address,
  minPeggedTokenOut: expectedOut,
  receiver: "0x...",
  tokenIn: "0x...",
});

emitter.on("user-signed-deposit", (hash) => console.log("tx hash:", hash));
emitter.on("deposit-transaction-succeeded", (receipt) =>
  console.log("minted:", receipt),
);

await promise;
```

The same actions are also available via `.extend()` factories (`gatewayPublicActions()`, `gatewayWalletActions()`) for callers who prefer viem's extension pattern.

## API

- Public actions (reads), exported from `/actions`. In every one, `address` is the gateway, except in `getGateway`:
  - `getGateway(client, { address })` — the gateway set on a pegged token. `address` is the pegged token.
  - `getMaxMint(client, { address })` — maximum amount of pegged token that can still be minted.
  - `getMaxWithdraw(client, { address, tokenOut })` — maximum amount of `tokenOut` that can be withdrawn.
  - `getMintFee(client, { address, token })` / `getRedeemFee(client, { address, token })` — current fee for `token`.
  - `getPeggedToken(client, { address })` — pegged-token address minted by the gateway.
  - `getRedeemRequest(client, { address, user })` — `user`'s open redeem request, as `amountLocked` and `claimableAt`.
  - `getTreasury(client, { address })` — treasury address backing the gateway.
  - `getWithdrawalDelay(client, { address })` / `getWithdrawalDelayEnabled(client, { address })` — delay configuration.
  - `isInstantRedeemWhitelisted(client, { account, address })` — whether `account` can bypass the delay.
  - `previewDeposit(client, { address, amountIn, tokenIn })` — expected pegged-token output for a deposit.
  - `previewRedeem(client, { address, peggedTokenIn, tokenOut })` — expected underlying output for a redeem.
  - `previewWithdraw(client, { address, amountOut, tokenOut })` — pegged-token input required to withdraw an exact `amountOut` of the underlying (inverse of `previewRedeem`, with `redeemFee` applied on-chain).
- Wallet actions (writes), exported from `/actions`. Each returns `{ emitter, promise }`. `approveAmount` is optional and defaults to the amount of pegged token or `tokenIn` being spent:
  - `deposit(walletClient, { amountIn, approveAmount?, gatewayAddress, minPeggedTokenOut, receiver, tokenIn })`.
  - `requestRedeem(walletClient, { approveAmount?, gatewayAddress, peggedTokenAmount })`.
  - `redeem(walletClient, { approveAmount?, gatewayAddress, minAmountOut, peggedTokenIn, receiver, tokenOut })`.
  - `cancelRedeemRequest(walletClient, { gatewayAddress })`.
- Calldata encoders, exported from `/actions`: each returns the calldata of one write without sending anything, so a caller can sign and broadcast it elsewhere, or batch it into a multicall. They do not approve anything.
  - `encodeCancelRedeemRequest()` — `cancelRedeemRequest()`.
  - `encodeDeposit({ amountIn, minPeggedTokenOut, receiver, tokenIn })` — `deposit(tokenIn, amountIn, minPeggedTokenOut, receiver)`.
  - `encodeRedeem({ minAmountOut, peggedTokenIn, receiver, tokenOut })` — `redeem(tokenOut, peggedTokenIn, minAmountOut, receiver)`.
  - `encodeRequestRedeem({ peggedTokenAmount })` — `requestRedeem(peggedTokenAmount)`.
- `gatewayPublicActions()` / `gatewayWalletActions()` — viem extension factories that wire the same actions onto a client via `.extend()`.
- `gatewayAbi` — the minimal ABI subset used by the package.
- Constants: `gateways`, `gatewayAddresses`.
- Types: `Gateway`, `CancelRedeemRequestEvents`, `DepositEvents`, `RedeemEvents`, `RequestRedeemEvents`.
