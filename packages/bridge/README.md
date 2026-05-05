# @vetro-protocol/bridge

LayerZero V2 OFT/OFTAdapter bridge actions for viem clients. Generic — works with any pair of tokens that have OFT contracts deployed on the supported chains.

## Installation

```sh
pnpm add @vetro-protocol/bridge viem viem-erc20
```

## Overview

- Works with both pure OFT contracts and OFTAdapter contracts.
- Approval is auto-detected via on-chain `approvalRequired()`. When required, the underlying ERC20 is read from `token()` and the standard allowance/approve flow runs before the send.
- Caller owns chain/contract addressing; the package only knows the `chainId → LayerZero EID` mapping (see `layerZeroEids`).
- Slippage defaults to zero (`minAmountLD === amount`); pass `minAmount` to opt in to a tolerance.

Supported chains (chainId → LayerZero EID):

| Chain            | chainId | EID   |
| ---------------- | ------- | ----- |
| Ethereum mainnet | 1       | 30101 |
| Optimism         | 10      | 30111 |
| BSC              | 56      | 30102 |
| Base             | 8453    | 30184 |
| Arbitrum         | 42161   | 30110 |
| Hemi             | 43111   | 30329 |

## Usage

```ts
import { quoteSend, send } from "@vetro-protocol/bridge/actions";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { hemi, mainnet } from "viem/chains";

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
});

// 1. Quote the LayerZero messaging fee
const fee = await quoteSend(publicClient, {
  amount: 1_000_000_000_000_000_000n,
  destinationChainId: hemi.id,
  oftAddress: "0x5fFD0EAdc186AF9512542d0d5e5eAFC65d5aFc5B",
  recipient: "0x...",
});

// 2. Send (approval handled automatically when the OFT requires it)
const { emitter, promise } = send(walletClient, {
  amount: 1_000_000_000_000_000_000n,
  destinationChainId: hemi.id,
  oftAddress: "0x5fFD0EAdc186AF9512542d0d5e5eAFC65d5aFc5B",
  recipient: "0x...",
});

emitter.on("user-signed-send", (hash) => console.log("tx hash:", hash));
emitter.on("send-transaction-succeeded", (receipt) =>
  console.log("delivered:", receipt),
);

await promise;
```

The same actions are also available via `.extend()` factories (`bridgePublicActions()`, `bridgeWalletActions()`) for callers who prefer viem's extension pattern.

## Events

The `send` wallet action emits the following events through the `EventEmitter`:

| Event                           | Payload                | When                                                                                                                  |
| ------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `pre-approve`                   | `[]`                   | Before the ERC20 approval transaction (only when `approvalRequired() === true` and current allowance is insufficient) |
| `user-signed-approval`          | `[Hash]`               | The user signed the approval transaction                                                                              |
| `user-signing-approval-error`   | `[Error]`              | The user rejected or otherwise failed to sign the approval                                                            |
| `approve-transaction-succeeded` | `[TransactionReceipt]` | Approval transaction confirmed successfully                                                                           |
| `approve-transaction-reverted`  | `[TransactionReceipt]` | Approval transaction reverted on-chain                                                                                |
| `pre-send`                      | `[]`                   | Before the OFT `send` transaction                                                                                     |
| `user-signed-send`              | `[Hash]`               | The user signed the send transaction                                                                                  |
| `user-signing-send-error`       | `[Error]`              | The user rejected or otherwise failed to sign the send                                                                |
| `send-transaction-succeeded`    | `[TransactionReceipt]` | Send transaction confirmed successfully                                                                               |
| `send-transaction-reverted`     | `[TransactionReceipt]` | Send transaction reverted on-chain                                                                                    |
| `send-failed`                   | `[Error]`              | A transaction-receipt fetch failed                                                                                    |
| `send-failed-validation`        | `[string]`             | Input validation failed; payload is a human-readable reason                                                           |
| `unexpected-error`              | `[Error]`              | An unhandled error escaped the action                                                                                 |
| `send-settled`                  | `[]`                   | Always emitted in the `finally` block                                                                                 |

## API

- `quoteSend(client, params)` — public action; reads the LayerZero messaging fee for a send.
- `approvalRequired(client, params)` — public action; reads `approvalRequired()` on the OFT/OFTAdapter.
- `token(client, params)` — public action; reads the underlying ERC20 wrapped by an OFTAdapter.
- `send(walletClient, params)` — wallet action; runs the full bridge flow (auto-approval + send) and returns `{ emitter, promise }`.
- `encodeSend(params)` — synchronous helper that returns the encoded `send` calldata. The caller must pre-quote the LayerZero fee (e.g. with `quoteSend`) and pass it in.
- `bridgePublicActions()` / `bridgeWalletActions()` — viem extension factories that wire the same actions onto a client via `.extend()`.
- `getLayerZeroEid(chainId)`, `layerZeroEids` — chainId → EID lookup helpers.
- `addressToBytes32(addr)` — pads an address to bytes32 for LayerZero `to` fields.
- `oftAbi` — the minimal ABI subset used by the package (`send`, `quoteSend`, `approvalRequired`, `token`).
- Types: `SendEvents`, `ApprovalEvents`, `CommonEvents`, `MessagingFee`, `SendParams`, `QuoteSendParams`.
