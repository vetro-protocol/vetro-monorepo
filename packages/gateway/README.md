# @vetro-protocol/gateway

Vetro Protocol gateway actions for viem clients. Mints pegged tokens (VUSD, vetBTC) from whitelisted underlying assets and handles redemptions back out.

## Installation

```sh
pnpm add @vetro-protocol/gateway viem viem-erc20
```

## Overview

- Two gateways ship by default — the VUSD gateway and the vetBTC gateway — exported as `gateways` (with `address` + `pegBaseSymbol`) and `gatewayAddresses` (just the addresses).
- `deposit` mints the pegged token: checks `previewDeposit` for the expected output, runs an allowance + approval if needed, then calls `deposit(tokenIn, amountIn, minPeggedTokenOut, receiver)`.
- Redemptions follow the gateway's two-step flow: `requestRedeem` opens a request, `redeem` finalises it once the optional withdrawal delay has elapsed (or immediately if the caller is on the instant-redeem whitelist), and `cancelRedeemRequest` aborts an open request.
- Read actions cover everything a UI needs to drive these flows: previews, fee getters, request lookup, treasury / pegged-token addresses, and withdrawal-delay configuration.

## Usage

```ts
import { deposit, gateways, previewDeposit } from "@vetro-protocol/gateway";
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

- Public actions (reads):
  - `previewDeposit(client, params)` — expected pegged-token output for a deposit.
  - `previewRedeem(client, params)` — expected underlying output for a redeem.
  - `previewWithdraw(client, params)` — pegged-token input required to withdraw an exact `amountOut` of the underlying (inverse of `previewRedeem`, with `redeemFee` applied on-chain).
  - `getMintFee(client, params)` / `getRedeemFee(client, params)` — current fees.
  - `getMaxWithdraw(client, params)` — maximum withdrawable amount.
  - `getPeggedToken(client, params)` — pegged-token address minted by the gateway.
  - `getTreasury(client, params)` — treasury address backing the gateway.
  - `getRedeemRequest(client, params)` — details for a specific redeem request.
  - `getWithdrawalDelay(client, params)` / `getWithdrawalDelayEnabled(client, params)` — delay configuration.
  - `isInstantRedeemWhitelisted(client, params)` — whether an account can bypass the delay.
- Wallet actions (writes): `deposit`, `requestRedeem`, `redeem`, `cancelRedeemRequest`. Each returns `{ emitter, promise }`.
- `gatewayPublicActions()` / `gatewayWalletActions()` — viem extension factories that wire the same actions onto a client via `.extend()`.
- `gatewayAbi` — the minimal ABI subset used by the package.
- Constants: `gateways`, `gatewayAddresses`.
- Types: `Gateway`, `CancelRedeemRequestEvents`, `DepositEvents`, `RedeemEvents`, `RequestRedeemEvents`.
