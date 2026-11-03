# @vetro-protocol/hemi-earn

Vetro Protocol Hemi Earn actions for viem clients. Hemi Earn lets a user on Hemi stake in a Vetro staking vault on Ethereum. The Router on Hemi takes the request, and the Agent on Ethereum fulfills it. LayerZero carries the messages and the tokens between the two chains.

## Installation

```sh
pnpm add @vetro-protocol/hemi-earn viem
```

## Overview

- The Router is on Hemi, at `hemiEarnRouterAddress`. Router actions use this address by default. Each one accepts an optional `address` to use a different Router.
- The Agent is on Ethereum. Read its address from the Router with `getAgentAddress`, then pass it as `address` to the Agent actions.
- A deposit or a redeem is a request. `requestDeposit` and `requestRedeem` quote the LayerZero fee, approve the token if necessary, and send the request with the fee as `msg.value`. If an approval occurs, they quote the fee again before they send the request. `requestDeposit` and `requestRedeem` set `automatic` to `true`. Thus when the Agent fulfills or cancels the request, the Router sends the tokens to the receiver. If that transfer fails, the Router emits `AutoFinalizationFailed`. Then the user calls `claimDeposit` or `claimRedeem` for a fulfilled request, or `recoverDeposit` or `recoverRedeem` for a cancelled one. A request encoded with `automatic: false` always needs these calls.
- `hemiEarnVaults` and `hemiEarnLinks` hold the off-chain data that Hemi Earn frontends show for Vetro vaults.

## Usage

```ts
import { requestDeposit } from "@vetro-protocol/hemi-earn/actions";
import { createWalletClient, custom } from "viem";
import { hemi } from "viem/chains";

const walletClient = createWalletClient({
  account: "0x...",
  chain: hemi,
  transport: custom(window.ethereum),
});

const { emitter, promise } = requestDeposit(walletClient, {
  amount: 1_000_000_000_000_000_000n,
  asset: "0x...", // pegged token on Hemi
  callbackFee: 0n,
  operator: "0x...",
  receiver: "0x...",
  sharesOutMin: 0n,
});

emitter.on("user-signed-deposit", (hash) => console.log("tx hash:", hash));
emitter.on("deposit-transaction-succeeded", (receipt) =>
  console.log("requested:", receipt),
);

await promise;
```

## API

- Public actions (reads), exported from `/actions`:
  - `getAgentAddress(client, { address? })` — the Agent address on Ethereum. The Router stores it as its LayerZero peer.
  - `getAssetData(client, { address?, asset })` — Router data for `asset`: `enabled`, `remoteAsset`, `remoteShare` (the Ethereum staking vault) and `share`.
  - `getFailedRequest(client, { address, requestId })` — Agent data for a failed request: `amountIn`, `msg`, `nativeFee` and `tokenIn`.
  - `getRequest(client, { address?, requestId })` — a Router request: `amountOutMin`, `asset`, `assets`, `automatic`, `kind`, `operator`, `receiver`, `share`, `shares` and `status`.
  - `getUnstakeRequest(client, { address, requestId })` — an Agent unstake request in cooldown: `amountOutMin`, `asset`, `claimableAt`, `nativeFee`, `operator`, `share`, `shares` and `unstakingRequestId`.
  - `quoteDeposit(client, { address?, asset, assets, callbackFee })` — the native fee for `requestDeposit`.
  - `quoteDepositFulfillment(client, { address, remoteShare })` — the native fee that the Agent needs to send a deposit fulfillment back to Hemi. Pass `remoteShare` from `getAssetData`. Use the result as `callbackFee`.
  - `quoteRedeem(client, { address?, asset, callbackFee, isInstant, shares })` — the native fee for `requestRedeem`.
  - `quoteRedeemFulfillment(client, { address, remoteAsset })` — the native fee that the Agent needs to send a redeem fulfillment back to Hemi. Pass `remoteAsset` from `getAssetData`. Use the result as `callbackFee`.
  - `resolveIsInstant(client, { address, caller })` — whether a redeem from the staking vault at `address` skips the cooldown. It is `true` when the cooldown is disabled or `caller` is on the instant-withdraw whitelist. Read it on Ethereum and pass it as `isInstant`.
- Wallet actions (writes), exported from `/actions`. Each returns `{ emitter, promise }`. Each one sends the transaction from the account of the wallet client. If the wallet client has no account, the action fails validation:
  - `requestDeposit(walletClient, { address?, amount, approvalAmount?, asset, callbackFee, operator, receiver, sharesOutMin })` — Router `requestDeposit`. `sharesOutMin` is the minimum of pegged tokens that the gateway mints on Ethereum. Pass `0n` for no minimum. It fails validation when `getAssetData` returns `enabled: false`.
  - `requestRedeem(walletClient, { address?, approvalAmount?, asset, assetsOutMin, callbackFee, isInstant, operator, receiver, shares })` — Router `requestRedeem`. `assetsOutMin` is the minimum of whitelisted tokens that the gateway redeem gives on Ethereum. Pass `0n` for no minimum. It reads the share token from the Router with `getAssetData`, and fails validation when `enabled` is `false`.
  - `claimDeposit`, `claimRedeem`, `recoverDeposit`, `recoverRedeem`, `cancelRedeem` — `(walletClient, { address?, requestId })`. Router writes. `cancelRedeem` calls Router `cancel`. Only the request operator can call it.
  - `cancelRequest`, `retryRequest`, `claimUnstake` — `(walletClient, { address, nativeFee?, requestId })`. Agent writes on Ethereum: `cancel`, `retry` and `claimUnstake`.
- Calldata encoders, exported from `/actions`. Each returns the calldata of one write and sends nothing:
  - `encodeClaimDeposit({ requestId })`, `encodeClaimRedeem({ requestId })`, `encodeRecoverDeposit({ requestId })`, `encodeRecoverRedeem({ requestId })`.
  - `encodeRequestDeposit({ amount, asset, automatic?, callbackFee, operator, receiver, sharesOutMin })`. Unlike `requestDeposit`, it does not approve the token.
  - `encodeRequestRedeem({ asset, assetsOutMin, automatic?, callbackFee, isInstant, operator, receiver, shares })`. Unlike `requestRedeem`, it does not approve the share token.
- ABIs: `hemiEarnRouterAbi` and `hemiEarnAgentAbi`.
- Constants: `hemiEarnRouterAddress`, the Router on Hemi.
- Hemi Earn metadata:
  - `hemiEarnVaults` — ordered `HemiEarnVault[]`; frontends show only these vaults, in this order. Each entry has `address` (Ethereum staking vault), `apyIncludesFees` (whether the Vetro API APY is net of fees), `curators?` (brand names of the curators running the vault's live strategies; only if different from the operator), `operator` (full legal name) and `typicalTransferTime` (seconds; how long a cross-chain transfer usually takes, in either direction).
  - `hemiEarnLinks` — URLs of pages hosted by Vetro: `privacyPolicyUrl`, `supportUrl` and `termsOfUseUrl`.
- Types: `CancelRedeemEvents`, `CancelRequestEvents`, `ClaimDepositEvents`, `ClaimRedeemEvents`, `ClaimUnstakeEvents`, `HemiEarnVault`, `RecoverDepositEvents`, `RecoverRedeemEvents`, `RequestDepositEvents`, `RequestKind`, `RequestRedeemEvents`, `RequestStatus`, `RetryRequestEvents`.
