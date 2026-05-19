# @vetro-protocol/gateway

Vetro Protocol gateway actions for viem. Wraps the VUSD and vetBTC gateways with `deposit` / `redeem` / `requestRedeem` / `cancelRedeemRequest` flows, ERC20 approval included.

## Installation

```sh
pnpm add @vetro-protocol/gateway viem viem-erc20
```

## Gateway addresses

The package exports the canonical gateway addresses and their peg-base metadata:

```ts
import { gatewayAddresses, gateways } from "@vetro-protocol/gateway";

// gateways is an array of { address, pegBaseSymbol } entries:
//   { address: "0xDaD5…16F", pegBaseSymbol: "USD" }   // VUSD
//   { address: "0xCBA2…faB", pegBaseSymbol: "BTC" }   // vetBTC
```

Pass the address you want directly as `gatewayAddress` to any wallet action.

## Usage

```ts
import { deposit, getMintFee } from "@vetro-protocol/gateway/actions";
import { gateways } from "@vetro-protocol/gateway";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { mainnet } from "viem/chains";

const publicClient = createPublicClient({ chain: mainnet, transport: http() });
const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
});

const vusdGateway = gateways.find((g) => g.pegBaseSymbol === "USD")!.address;

// Quote the protocol fee for a given deposit
const fee = await getMintFee(publicClient, {
  address: vusdGateway,
  amountIn: 1_000_000n,
});

// Deposit collateral, mint the pegged token (approval handled automatically)
const { emitter, promise } = deposit(walletClient, {
  amountIn: 1_000_000n,
  gatewayAddress: vusdGateway,
  minPeggedTokenOut: 950_000n,
  receiver: "0x...",
  tokenIn: "0x...", // e.g. USDC
});

emitter.on("user-signed-deposit", (hash) => console.log("tx hash:", hash));
emitter.on("deposit-transaction-succeeded", (receipt) =>
  console.log("minted:", receipt),
);

await promise;
```

The same actions are available via `.extend()` factories (`gatewayPublicActions()`, `gatewayWalletActions()`) for callers who prefer viem's extension pattern.

## Redeem model

Redeeming the pegged token back to collateral has two modes:

- **Instant** — if the account is on the instant-redeem whitelist (or withdrawal delay is disabled), `redeem` settles in one transaction.
- **Delayed** — otherwise, call `requestRedeem` to open a request, wait for the configured `withdrawalDelay`, then `redeem` claims the collateral. `cancelRedeemRequest` cancels a pending request.

Use the public actions to inspect state: `getMintFee`, `getRedeemFee`, `previewDeposit`, `previewRedeem`, `getMaxWithdraw`, `getPeggedToken`, `getTreasury`, `getWithdrawalDelay`, `getWithdrawalDelayEnabled`, `isInstantRedeemWhitelisted`, `getRedeemRequest`.

## Events

Every wallet action returns `{ emitter, promise }` (via `to-promise-event`). The emitter fires a granular lifecycle:

- `pre-approve` → `user-signed-approval` → `approve-transaction-succeeded` / `approve-transaction-reverted` (only when an ERC20 approval is needed)
- `pre-<action>` → `user-signed-<action>` → `<action>-transaction-succeeded` / `<action>-transaction-reverted`
- `user-signing-<action>-error` if the user rejects in the wallet
- `<action>-failed-validation` if input validation fails (payload is a human-readable reason)
- `unexpected-error` for anything that escapes
- `<action>-settled` always emitted in the `finally` block

Event-map types are exported per action: `DepositEvents`, `RedeemEvents`, `RequestRedeemEvents`, `CancelRedeemRequestEvents`.

## API

Public actions (take a `Client`):

- `getMaxWithdraw`, `getMintFee`, `getPeggedToken`, `getRedeemFee`, `getRedeemRequest`, `getTreasury`, `getWithdrawalDelay`, `getWithdrawalDelayEnabled`, `isInstantRedeemWhitelisted`, `previewDeposit`, `previewRedeem`

Wallet actions (take a `WalletClient`, return `{ emitter, promise }`):

- `deposit`, `redeem`, `requestRedeem`, `cancelRedeemRequest`

Encoders (return ABI-encoded calldata):

- `encodeDeposit`, `encodeRedeem`, `encodeRequestRedeem`, `encodeCancelRedeemRequest`

Extension factories:

- `gatewayPublicActions()`, `gatewayWalletActions()`

Also exported: `gatewayAbi`, `gatewayAddresses`, `gateways`, and the `Gateway` type.
